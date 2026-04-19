const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  startOTP: String,
  startOTPExpiresAt: Date,
  startOTPAttempts: {
    type: Number,
    default: 0
  },
  startOTPVerified: {
    type: Boolean,
    default: false
  },
  completionOTP: String,
  completionOTPExpiresAt: Date,
  completionOTPAttempts: {
    type: Number,
    default: 0
  },
  completionOTPVerified: {
    type: Boolean,
    default: false
  },
  workerLocationSnapshots: [{
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    timestamp: { type: Date, default: Date.now }
  }],
  address: {
    type: String,
    required: true
  },
  serviceLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    address: String
  },
  additionalNotes: String,
  totalPrice: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  paymentReference: String
}, {
  timestamps: true
});

bookingSchema.index({ user: 1, scheduledDate: -1 });
bookingSchema.index({ worker: 1, scheduledDate: -1 });
bookingSchema.index({ status: 1, scheduledDate: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
