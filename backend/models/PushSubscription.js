const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  expirationTime: Number,
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  userAgent: String,
  lastSeenAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

pushSubscriptionSchema.index({ user: 1, updatedAt: -1 });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

module.exports = PushSubscription;
