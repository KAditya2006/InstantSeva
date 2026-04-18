const express = require('express');
const router = express.Router();
const {
  deletePushSubscription,
  getNotifications,
  getPushPublicKey,
  markNotificationsRead,
  savePushSubscription
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.patch('/read', markNotificationsRead);
router.get('/push/public-key', getPushPublicKey);
router.post('/push/subscribe', savePushSubscription);
router.delete('/push/unsubscribe', deletePushSubscription);

module.exports = router;
