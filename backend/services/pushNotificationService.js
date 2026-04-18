const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

let configured = false;

const getVapidPublicKey = () => process.env.VAPID_PUBLIC_KEY;

const getNotificationUrl = ({ type, entityType, entityId }) => {
  if (type === 'message' || entityType === 'Chat') {
    return entityId ? `/messages?chatId=${entityId}` : '/messages';
  }

  if (entityType === 'Booking' || type === 'booking' || type === 'payment' || type === 'review') {
    return '/dashboard';
  }

  return '/';
};

const configureWebPush = () => {
  if (configured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  const contactEmail = process.env.VAPID_CONTACT_EMAIL || process.env.FROM_EMAIL || 'noreply@instantseva.local';
  webpush.setVapidDetails(`mailto:${contactEmail}`, publicKey, privateKey);
  configured = true;
  return true;
};

const isPushConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

const normalizeSubscription = (subscription) => ({
  endpoint: subscription.endpoint,
  expirationTime: subscription.expirationTime,
  keys: {
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth
  }
});

const removeExpiredSubscription = async (subscription, error) => {
  if (error.statusCode === 404 || error.statusCode === 410) {
    await PushSubscription.deleteOne({ _id: subscription._id });
  }
};

const sendPushNotificationToUser = async ({ user, notification }) => {
  if (!user || !notification || !configureWebPush()) return;

  const subscriptions = await PushSubscription.find({ user });
  if (!subscriptions.length) return;

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    type: notification.type,
    notificationId: notification._id?.toString(),
    url: getNotificationUrl(notification)
  });

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(normalizeSubscription(subscription), payload);
    } catch (error) {
      await removeExpiredSubscription(subscription, error);
      if (process.env.NODE_ENV !== 'production') {
        console.error('Push notification failed:', error.message);
      }
    }
  }));
};

module.exports = {
  getVapidPublicKey,
  isPushConfigured,
  sendPushNotificationToUser
};
