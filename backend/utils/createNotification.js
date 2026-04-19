const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotificationToUser } = require('../services/pushNotificationService');
const { normalizeLanguage } = require('./languages');
const logger = require('./logger');
const { tServer } = require('./serverI18n');

const pickLocalizedText = (value, language) => {
  if (!value || typeof value === 'string') return value;
  return value[language] || value.en || Object.values(value)[0];
};

const createNotification = async ({
  user,
  type = 'system',
  title,
  titleKey,
  titleParams,
  message,
  messageKey,
  messageParams,
  entityType,
  entityId
}) => {
  if (!user || (!title && !titleKey) || (!message && !messageKey)) return null;
  const notificationUser = await User.findById(user).select('preferredLanguage').lean();
  const language = normalizeLanguage(notificationUser?.preferredLanguage);
  const resolvedTitle = titleKey ? tServer(titleKey, language, titleParams) : pickLocalizedText(title, language);
  const resolvedMessage = messageKey ? tServer(messageKey, language, messageParams) : pickLocalizedText(message, language);

  const notification = await Notification.create({
    user,
    type,
    title: resolvedTitle,
    message: resolvedMessage,
    language,
    entityType,
    entityId
  });

  sendPushNotificationToUser({ user, notification }).catch((error) => {
    logger.dev('Push notification dispatch failed', { error: error.message, user });
  });

  return notification;
};

module.exports = createNotification;
