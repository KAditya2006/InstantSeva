const Notification = require('../models/Notification');
const { sendPushNotificationToUser } = require('../services/pushNotificationService');

const createNotification = async ({ user, type = 'system', title, message, entityType, entityId }) => {
  if (!user || !title || !message) return null;

  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    entityType,
    entityId
  });

  sendPushNotificationToUser({ user, notification }).catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Push notification dispatch failed:', error.message);
    }
  });

  return notification;
};

module.exports = createNotification;
