require('dotenv').config();
const { validateEnv } = require('./config/validateEnv');
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Booking = require('./models/Booking');

validateEnv();

const PORT = process.env.PORT || 5000;
const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const renderOrigin = process.env.RENDER_EXTERNAL_URL;
const allowedOrigins = renderOrigin ? [...configuredOrigins, renderOrigin] : configuredOrigins;
const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com');
const logDev = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

// Connect to Database
connectDB();

// Create Server
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST']
  }
});

const Chat = require('./models/Chat');
const Message = require('./models/Message');
const createNotification = require('./utils/createNotification');
const { markDeliveredForUser } = require('./controllers/chatController');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    socket.join(user._id.toString());
    return next();
  } catch {
    return next(new Error('Authentication failed'));
  }
});

// Socket logic
io.on('connection', (socket) => {
  logDev('A user connected:', socket.user._id.toString());
  markDeliveredForUser({ io, userId: socket.user._id }).catch((error) => {
    console.error('Message delivery receipt error:', error.message);
  });

  socket.on('join_chat', async (chatId) => {
    const chat = await Chat.findOne({ _id: chatId, participants: socket.user._id });
    if (!chat) return;

    socket.join(chatId);
    logDev(`User ${socket.user._id.toString()} joined chat room: ${chatId}`);
  });

  socket.on('send_message', async (data) => {
    const { chatId, content, messageType = 'text', imageUrl } = data;

    try {
      const chat = await Chat.findOne({ _id: chatId, participants: socket.user._id });
      if (!chat) return;

      if (!content && messageType !== 'image') return;

      // Create and save message
      const recipientIds = chat.participants
        .filter((participantId) => participantId.toString() !== socket.user._id.toString());
      const onlineRecipientIds = recipientIds
        .filter((participantId) => io.sockets.adapter.rooms.get(participantId.toString())?.size);

      const message = await Message.create({
        chatId,
        sender: socket.user._id,
        content,
        messageType,
        imageUrl,
        deliveredTo: onlineRecipientIds,
        readBy: [socket.user._id]
      });

      // Update chat last message
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: {
          text: messageType === 'image' ? 'Sent an image' : content,
          sender: socket.user._id,
          createdAt: new Date()
        }
      });

      // Populate sender details for the frontend
      const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar');
      const messagePayload = populatedMessage.toObject();
      messagePayload.chatId = chatId.toString();

      // Emit to the chat room
      io.to(chatId).emit('receive_message', messagePayload);
      chat.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit('receive_message', messagePayload);
      });

      // Also emit a notification to the recipient's personal room
      chat.participants
        .filter((participantId) => participantId.toString() !== socket.user._id.toString())
        .forEach(async (participantId) => {
          await createNotification({
            user: participantId,
            type: 'message',
            title: 'New message',
            message: `${populatedMessage.sender.name}: ${messageType === 'image' ? 'Sent an image' : content}`,
            entityType: 'Chat',
            entityId: chatId
          });
          io.to(participantId.toString()).emit('new_notification', {
            type: 'message',
            chatId,
            senderName: populatedMessage.sender.name,
            text: messageType === 'image' ? 'Sent an image' : content
          });
        });

    } catch (error) {
      console.error('Socket Message Error:', error);
    }
  });

  socket.on('join_booking', async (bookingId) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    // Only user or worker assigned can join
    if (booking.user.toString() !== socket.user._id.toString() && 
        booking.worker.toString() !== socket.user._id.toString()) return;

    socket.join(`booking_${bookingId}`);
    logDev(`User ${socket.user._id.toString()} joined booking room: ${bookingId}`);
  });

  socket.on('update_worker_location', async (data) => {
    const { bookingId, coordinates } = data;
    if (!bookingId || !coordinates) return;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.worker.toString() !== socket.user._id.toString()) return;
    if (booking.status !== 'accepted' && booking.status !== 'in_progress') return;

    // Emit live update to user
    io.to(`booking_${bookingId}`).emit('worker_location_live', {
      bookingId,
      coordinates,
      timestamp: new Date()
    });

    // Periodic persistence (every 60s approx)
    const lastSnapshot = booking.workerLocationSnapshots[booking.workerLocationSnapshots.length - 1];
    const now = new Date();
    
    if (!lastSnapshot || (now - lastSnapshot.timestamp) > 60000) {
      booking.workerLocationSnapshots.push({
        coordinates,
        timestamp: now
      });
      await booking.save();
    }
  });

  socket.on('disconnect', () => {
    logDev('User disconnected');
  });
});

// Attach io to app for use in controllers
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
