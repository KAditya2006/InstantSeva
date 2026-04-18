import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChats, getMessages, markChatRead, sendTextMessage, uploadImageMessage } from '../services/api';
import { disconnectSocket, initiateSocket, joinChatRoom, subscribeToMessageStatus, subscribeToMessages, subscribeToNotifications } from '../services/socket';
import Navbar from '../components/Navbar';
import { MessageSquare, Send, Image as ImageIcon, Search, Phone, MoreVertical, Check, CheckCheck, User as UserIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fallbackAvatar, withImageFallback } from '../utils/images';

const getReferenceId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
};

const getMessageSenderId = (message) => getReferenceId(message?.sender);

const hasReference = (values = [], targetId) => {
  const normalizedTarget = String(targetId);
  return values.some((value) => getReferenceId(value) === normalizedTarget);
};

const mergeReference = (values = [], nextValue) => {
  if (!nextValue) return values || [];
  const nextId = getReferenceId(nextValue);
  if (!nextId || hasReference(values, nextId)) return values || [];
  return [...(values || []), nextId];
};

const getOtherParticipantIds = (chat, userId) => {
  return (chat?.participants || [])
    .map(getReferenceId)
    .filter((participantId) => participantId && participantId !== String(userId));
};

const getMessageReceipt = (message, chat, userId) => {
  const recipientIds = getOtherParticipantIds(chat, userId);
  const wasRead = recipientIds.some((recipientId) => hasReference(message.readBy || [], recipientId));
  if (wasRead) return 'read';

  const wasDelivered = recipientIds.some((recipientId) => hasReference(message.deliveredTo || [], recipientId));
  if (wasDelivered) return 'delivered';

  return 'sent';
};

const ChatPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [messagePagination, setMessagePagination] = useState({ page: 1, pages: 1 });
  const scrollRef = useRef();
  const activeChatRef = useRef(null);
  const chatsRef = useRef([]);
  const initialChatLoadedRef = useRef(false);
  const initialChatId = location.state?.chatId || new URLSearchParams(location.search).get('chatId');

  const appendMessage = useCallback((message) => {
    setMessages((previousMessages) => {
      if (previousMessages.some((currentMessage) => currentMessage._id === message._id)) {
        return previousMessages;
      }
      return [...previousMessages, message];
    });
  }, []);

  const updateMessageReceipts = useCallback((statusUpdate) => {
    const messageIds = (statusUpdate.messageIds || []).map(String);
    if (!messageIds.length) return;

    setMessages((previousMessages) => previousMessages.map((message) => {
      if (!messageIds.includes(String(message._id))) return message;

      return {
        ...message,
        deliveredTo: mergeReference(message.deliveredTo || [], statusUpdate.deliveredTo),
        readBy: mergeReference(message.readBy || [], statusUpdate.readBy)
      };
    }));
  }, []);

  const markActiveChatRead = useCallback(async (chatId) => {
    try {
      await markChatRead(chatId);
    } catch {
      // Reading receipts should never interrupt the chat experience.
    }
  }, []);

  const handleChatSelect = useCallback(async (chat) => {
    setActiveChat(chat);
    setMsgLoading(true);
    joinChatRoom(chat._id);
    try {
      const { data } = await getMessages(chat._id);
      setMessages(data.data);
      setMessagePagination(data.pagination);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const { data } = await getChats();
      const chatList = data.data;
      setChats(chatList);

      if (!initialChatLoadedRef.current && initialChatId) {
        const initialChat = chatList.find((chat) => chat._id === initialChatId);
        if (initialChat) {
          initialChatLoadedRef.current = true;
          await handleChatSelect(initialChat);
        }
      }
    } catch {
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [handleChatSelect, initialChatId]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    initiateSocket();
    fetchChats();

    const unsubscribeMessages = subscribeToMessages((err, msg) => {
      if (activeChatRef.current && String(msg.chatId) === String(activeChatRef.current._id)) {
        appendMessage(msg);
        if (getMessageSenderId(msg) !== String(user.id)) {
          markActiveChatRead(activeChatRef.current._id);
        }
      }
      fetchChats(); // Update last message in sidebar
    });

    const unsubscribeMessageStatus = subscribeToMessageStatus((err, statusUpdate) => {
      if (activeChatRef.current && String(statusUpdate.chatId) === String(activeChatRef.current._id)) {
        updateMessageReceipts(statusUpdate);
      }
    });

    const unsubscribeNotifications = subscribeToNotifications((err, notif) => {
      if (!activeChatRef.current || String(notif.chatId) !== String(activeChatRef.current._id)) {
        toast((t) => (
          <div onClick={() => { const chat = chatsRef.current.find(c => String(c._id) === String(notif.chatId)); if (chat) handleChatSelect(chat); toast.dismiss(t.id); }} className="cursor-pointer">
            <p className="font-bold flex items-center gap-2"><MessageSquare size={16}/> {notif.senderName}</p>
            <p className="text-sm opacity-80">{notif.text}</p>
          </div>
        ), { duration: 4000 });
      }
    });

    return () => {
      unsubscribeMessages?.();
      unsubscribeMessageStatus?.();
      unsubscribeNotifications?.();
      disconnectSocket();
    };
  }, [appendMessage, fetchChats, handleChatSelect, markActiveChatRead, updateMessageReceipts, user.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadOlderMessages = async () => {
    if (!activeChat || messagePagination.page >= messagePagination.pages) return;

    try {
      const nextPage = messagePagination.page + 1;
      const { data } = await getMessages(activeChat._id, { page: nextPage });
      setMessages((current) => [...data.data, ...current]);
      setMessagePagination(data.pagination);
    } catch {
      toast.error('Failed to load older messages');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const content = text.trim();
    setText('');

    try {
      const { data } = await sendTextMessage(activeChat._id, { content });
      appendMessage(data.data);
      fetchChats();
    } catch (error) {
      setText(content);
      toast.error(error.response?.data?.message || 'Message was not saved. Please try again.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Sending image...');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('chatId', activeChat._id);

    try {
      const { data } = await uploadImageMessage(formData);
      appendMessage(data.data);
      fetchChats();
      toast.success('Image sent', { id: toastId });
    } catch {
      toast.error('Failed to send image', { id: toastId });
    }
  };

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.participants.find(p => p._id !== user.id);
    return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderReceipt = (message) => {
    const receipt = getMessageReceipt(message, activeChat, user.id);

    if (receipt === 'read') {
      return <CheckCheck size={14} className="text-emerald-500" title="Read" />;
    }

    if (receipt === 'delivered') {
      return <CheckCheck size={14} className="text-slate-400" title="Delivered" />;
    }

    return <Check size={14} className="text-slate-400" title="Sent" />;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading your conversations...</div>;

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-slate-50 md:overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden p-3 sm:p-6 gap-4 sm:gap-6 min-h-0">
        {/* Chat List */}
        <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 flex-col overflow-hidden min-h-[60vh] md:min-h-0`}>
          <div className="p-4 sm:p-8 border-b border-slate-50">
            <h1 className="text-2xl font-bold font-heading text-slate-900 mb-6">Messages</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search conversations..." className="w-full bg-slate-50 border border-slate-100 pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all text-sm font-medium" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredChats.length > 0 ? filteredChats.map((chat) => (
              <div 
                key={chat._id} 
                onClick={() => handleChatSelect(chat)}
                className={`p-6 flex items-center gap-4 cursor-pointer transition-all border-l-4 ${activeChat?._id === chat._id ? 'bg-primary-50/50 border-primary-600 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
              >
                <div className="relative">
                  <img 
                    src={chat.participants.find(p => p._id !== user.id)?.avatar || fallbackAvatar} 
                    onError={withImageFallback()}
                    alt="User" 
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white premium-shadow"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-slate-900 truncate">
                      {chat.participants.find(p => p._id !== user.id)?.name}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {chat.updatedAt ? format(new Date(chat.updatedAt), 'h:mm a') : ''}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 truncate italic">
                    {chat.lastMessage?.text || 'Start a conversation'}
                  </p>
                </div>
              </div>
            )) : (
            <div className="p-8 sm:p-12 text-center text-slate-400 font-bold italic">No messages yet</div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 bg-white rounded-3xl md:rounded-[40px] premium-shadow border border-slate-100 flex-col overflow-hidden relative min-h-[75vh] md:min-h-0`}>
          {activeChat ? (
            <>
              {/* Window Header */}
              <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-50 flex justify-between items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveChat(null)} className="md:hidden text-slate-400 font-bold text-xl">Back</button>
                  <img 
                    src={activeChat.participants.find(p => p._id !== user.id)?.avatar || fallbackAvatar} 
                    onError={withImageFallback()}
                    className="w-12 h-12 rounded-2xl object-cover" 
                    alt="Active" 
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate max-w-[150px] sm:max-w-none">{activeChat.participants.find(p => p._id !== user.id)?.name}</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Now</span>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                   <button className="p-3 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-2xl transition-all"><Phone size={20} /></button>
                   <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"><MoreVertical size={20} /></button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-8 custom-scrollbar bg-slate-50/20">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
                ) : (
                  <>
                    <div className="text-center mb-12">
                       <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] premium-shadow">Today</span>
                    </div>
                    {messagePagination.page < messagePagination.pages && (
                      <div className="text-center">
                        <button onClick={loadOlderMessages} className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-500">
                          Load older messages
                        </button>
                      </div>
                    )}
                    {messages.map((msg, i) => {
                      const isOwnMessage = getMessageSenderId(msg) === String(user.id);
                      return (
                      <div key={msg._id || i} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[86%] sm:max-w-[70%] space-y-2 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-[28px] premium-shadow font-medium tracking-tight break-words ${isOwnMessage ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                             {msg.messageType === 'image' ? (
                               <img src={msg.imageUrl} className="max-w-full rounded-2xl cursor-pointer" alt="Sent" onClick={() => window.open(msg.imageUrl, '_blank')} />
                             ) : msg.content}
                          </div>
                          <div className={`flex items-center gap-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest`}>
                             {format(new Date(msg.createdAt), 'h:mm a')}
                             {isOwnMessage && renderReceipt(msg)}
                          </div>
                        </div>
                      </div>
                    );})}
                    <div ref={scrollRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 sm:p-8 bg-white border-t border-slate-50">
                 <form onSubmit={handleSend} className="bg-slate-50 p-2 rounded-2xl sm:rounded-[32px] border border-slate-100 flex items-center gap-2 premium-shadow focus-within:border-primary-400 focus-within:bg-white transition-all">
                    <label className="p-3 text-slate-400 hover:text-primary-600 cursor-pointer transition-colors">
                       <ImageIcon size={22} />
                       <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    <input 
                      type="text" 
                      placeholder="Write your message..." 
                      className="flex-1 bg-transparent outline-none px-4 py-2 font-medium text-slate-900"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                    <button type="submit" className="bg-primary-600 text-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-200">
                       <Send size={22} />
                    </button>
                 </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center">
               <div className="w-24 h-24 bg-primary-50 rounded-[40px] flex items-center justify-center mb-8 text-primary-600 shadow-xl shadow-primary-100/50">
                  <MessageSquare size={48} />
               </div>
               <h3 className="text-3xl font-bold font-heading text-slate-900 mb-2">Select a Conversation</h3>
               <p className="text-slate-500 font-medium max-w-xs">Connect with experts and residents from your marketplace in real-time.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
