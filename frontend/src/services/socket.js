import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket;

export const initiateSocket = () => {
  const token = localStorage.getItem('token');
  socket = io(SOCKET_URL, {
    auth: { token }
  });
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const joinChatRoom = (chatId) => {
  if (socket) socket.emit('join_chat', chatId);
};

export const sendMessage = (data) => {
  if (socket) socket.emit('send_message', data);
};

export const subscribeToMessages = (callback) => {
  if (!socket) return;
  const handler = (msg) => {
    callback(null, msg);
  };
  socket.on('receive_message', handler);
  return () => socket?.off('receive_message', handler);
};

export const subscribeToNotifications = (callback) => {
  if (!socket) return;
  const handler = (notif) => {
    callback(null, notif);
  };
  socket.on('new_notification', handler);
  return () => socket?.off('new_notification', handler);
};

export const getSocket = () => socket;
