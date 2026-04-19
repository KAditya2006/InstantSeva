const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const { getPagination } = require('../utils/bookingRules');
const { getVapidPublicKey, isPushConfigured } = require('../services/pushNotificationService');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { user: req.user.id };

    const total = await Notification.countDocuments(filter);
    const unread = await Notification.countDocuments({ ...filter, read: false });
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: notifications,
      unread,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.status(200).json({ success: true, message: req.t('notificationsRead') });
  } catch (error) {
    next(error);
  }
};

exports.getPushPublicKey = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      enabled: isPushConfigured(),
      publicKey: getVapidPublicKey() || null
    });
  } catch (error) {
    next(error);
  }
};

exports.savePushSubscription = async (req, res, next) => {
  try {
    if (!isPushConfigured()) {
      return res.status(503).json({
        success: false,
        message: req.t('pushNotConfigured')
      });
    }

    const { endpoint, expirationTime, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        message: req.t('invalidPushSubscription')
      });
    }

    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user.id,
        endpoint,
        expirationTime,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth
        },
        userAgent: req.get('user-agent'),
        lastSeenAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

exports.deletePushSubscription = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: req.t('subscriptionEndpointRequired') });
    }

    await PushSubscription.deleteOne({ user: req.user.id, endpoint });
    res.status(200).json({ success: true, message: req.t('pushSubscriptionRemoved') });
  } catch (error) {
    next(error);
  }
};
