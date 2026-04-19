const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotificationToUser } = require('../services/pushNotificationService');
const { normalizeLanguage } = require('./languages');

const pickLocalizedText = (value, language) => {
  if (!value || typeof value === 'string') return value;
  return value[language] || value.en || Object.values(value)[0];
};

const createNotification = async ({ user, type = 'system', title, message, entityType, entityId }) => {
  if (!user || !title || !message) return null;
  const notificationUser = await User.findById(user).select('preferredLanguage').lean();
  const language = normalizeLanguage(notificationUser?.preferredLanguage);

  const notification = await Notification.create({
    user,
    type,
    title: pickLocalizedText(title, language),
    message: pickLocalizedText(message, language),
    language,
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
