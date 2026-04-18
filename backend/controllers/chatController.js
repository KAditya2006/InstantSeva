const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { getPagination } = require('../utils/bookingRules');
const createNotification = require('../utils/createNotification');

const findUserChat = (chatId, userId) => {
  return Chat.findOne({ _id: chatId, participants: userId });
};

const getId = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};

const getRecipientIds = (chat, senderId) => {
  return chat.participants
    .map(getId)
    .filter((participantId) => participantId && participantId !== senderId.toString());
};

const isUserOnline = (io, userId) => {
  return Boolean(io?.sockets?.adapter?.rooms?.get(userId.toString())?.size);
};

const getMessagePayload = (message, chatId) => {
  const payload = message.toObject ? message.toObject() : { ...message };
  payload.chatId = chatId.toString();
  return payload;
};

const emitReceiptUpdates = ({ io, messages, userId, status }) => {
  if (!io || !messages.length) return;

  const bySenderAndChat = new Map();
  messages.forEach((message) => {
    const senderId = getId(message.sender);
    const chatId = getId(message.chatId);
    if (!senderId || !chatId) return;

    const key = `${senderId}:${chatId}`;
    const existing = bySenderAndChat.get(key) || { senderId, chatId, messageIds: [] };
    existing.messageIds.push(getId(message));
    bySenderAndChat.set(key, existing);
  });

  bySenderAndChat.forEach(({ senderId, chatId, messageIds }) => {
    io.to(senderId).emit('message_status_updated', {
      chatId,
      messageIds,
      deliveredTo: userId.toString(),
      readBy: status === 'read' ? userId.toString() : undefined,
      status
    });
  });
};

const markMessagesDeliveredForUser = async ({ io, chatIds, userId }) => {
  const messages = await Message.find({
    chatId: { $in: chatIds },
    sender: { $ne: userId },
    deliveredTo: { $ne: userId }
  }).select('_id chatId sender').lean();

  if (!messages.length) return;

  await Message.updateMany(
    { _id: { $in: messages.map((message) => message._id) } },
    { $addToSet: { deliveredTo: userId } }
  );

  emitReceiptUpdates({ io, messages, userId, status: 'delivered' });
};

const markMessagesReadForChat = async ({ req, chat }) => {
  const io = req.app.get('io');
  const userId = req.user.id;
  const messages = await Message.find({
    chatId: chat._id,
    sender: { $ne: userId },
    readBy: { $ne: userId }
  }).select('_id chatId sender').lean();

  if (!messages.length) return [];

  await Message.updateMany(
    { _id: { $in: messages.map((message) => message._id) } },
    {
      $addToSet: {
        deliveredTo: userId,
        readBy: userId
      }
    }
  );

  emitReceiptUpdates({ io, messages, userId, status: 'read' });
  return messages;
};

const emitMessageAndNotifyRecipients = async ({ req, chat, message, notificationText }) => {
  const io = req.app.get('io');
  if (!io) return;

  const chatId = chat._id.toString();
  const payload = getMessagePayload(message, chatId);

  io.to(chatId).emit('receive_message', payload);
  chat.participants.forEach((participantId) => {
    io.to(participantId.toString()).emit('receive_message', payload);
  });

  await Promise.all(chat.participants
    .filter((participantId) => participantId.toString() !== req.user.id.toString())
    .map(async (participantId) => {
      await createNotification({
        user: participantId,
        type: 'message',
        title: 'New message',
        message: notificationText,
        entityType: 'Chat',
        entityId: chat._id
      });
      io.to(participantId.toString()).emit('new_notification', {
        type: 'message',
        chatId,
        senderName: req.user.name,
        text: message.messageType === 'image' ? 'Sent an image' : message.content
      });
    }));
};

exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'name email avatar role')
      .sort({ updatedAt: -1 });
    
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page, limit, skip } = getPagination(req.query);
    const chat = await findUserChat(chatId, req.user.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    await markMessagesReadForChat({ req, chat });

    const total = await Message.countDocuments({ chatId });
    const messages = await Message.find({ chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    next(error);
  }
};

exports.initiateChat = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId || recipientId === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'A valid recipient is required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }
    
    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, recipientId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.id, recipientId]
      });
    }

    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

exports.sendTextMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const content = String(req.body.content || '').trim();

    if (!content) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const chat = await findUserChat(chatId, req.user.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const io = req.app.get('io');
    const recipientIds = getRecipientIds(chat, req.user.id);
    const onlineRecipientIds = recipientIds.filter((recipientId) => isUserOnline(io, recipientId));

    const message = await Message.create({
      chatId,
      sender: req.user.id,
      content,
      messageType: 'text',
      deliveredTo: onlineRecipientIds,
      readBy: [req.user.id]
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: content,
        sender: req.user.id,
        createdAt: new Date()
      }
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar');

    await emitMessageAndNotifyRecipients({
      req,
      chat,
      message: populatedMessage,
      notificationText: `${req.user.name}: ${content}`
    });

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// Handle Image Message Upload via REST (Socket handles text)
exports.uploadImageMessage = async (req, res, next) => {
  try {
    const { chatId } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const chat = await findUserChat(chatId, req.user.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const io = req.app.get('io');
    const recipientIds = getRecipientIds(chat, req.user.id);
    const onlineRecipientIds = recipientIds.filter((recipientId) => isUserOnline(io, recipientId));

    const message = await Message.create({
      chatId,
      sender: req.user.id,
      content: 'Image',
      messageType: 'image',
      imageUrl: req.file.path,
      deliveredTo: onlineRecipientIds,
      readBy: [req.user.id]
    });

    // Update last message in chat
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: 'Sent an image',
        sender: req.user.id,
        createdAt: new Date()
      }
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar');
    await emitMessageAndNotifyRecipients({
      req,
      chat,
      message: populatedMessage,
      notificationText: `${req.user.name} sent an image`
    });

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

exports.markChatRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const chat = await findUserChat(chatId, req.user.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const messages = await markMessagesReadForChat({ req, chat });
    res.status(200).json({
      success: true,
      data: {
        messageIds: messages.map((message) => message._id),
        readBy: req.user.id
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.markDeliveredForUser = async ({ io, userId }) => {
  const chats = await Chat.find({ participants: userId }).select('_id').lean();
  if (!chats.length) return;

  await markMessagesDeliveredForUser({
    io,
    chatIds: chats.map((chat) => chat._id),
    userId
  });
};
