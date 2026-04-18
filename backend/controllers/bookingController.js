const Booking = require('../models/Booking');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const AuditLog = require('../models/AuditLog');
const Review = require('../models/Review');
const { calculateBookingPrice, canTransitionBooking, canUpdatePaymentStatus, getPagination } = require('../utils/bookingRules');
const createNotification = require('../utils/createNotification');
const { generateOTP, sendOTPEmail } = require('../services/otpService');
const asyncHandler = require('../utils/asyncHandler');
const { syncDynamicWorkerProfile } = require('../utils/syncWorkerProfile');

const populateBooking = (query) => {
  return query
    .populate('user', 'name email avatar phone')
    .populate('worker', 'name email avatar phone');
};

const getId = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};

const getViewerId = (viewer) => {
  if (!viewer) return null;
  return viewer.id ? viewer.id.toString() : getId(viewer);
};

const isBookingCustomer = (booking, viewer) => getId(booking?.user) === getViewerId(viewer);
const isBookingWorker = (booking, viewer) => getId(booking?.worker) === getViewerId(viewer);

const parseFutureScheduledDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() <= Date.now()) return null;
  return date;
};

const sanitizeBookingForViewer = (booking, viewer) => {
  const plainBooking = booking?.toObject ? booking.toObject() : { ...booking };
  const startOTP = plainBooking.startOTP;
  const completionOTP = plainBooking.completionOTP;
  const canSeeStartOTP = isBookingWorker(plainBooking, viewer) && plainBooking.status === 'accepted' && !plainBooking.startOTPVerified;
  const canSeeCompletionOTP = isBookingCustomer(plainBooking, viewer) && plainBooking.status === 'in_progress' && !plainBooking.completionOTPVerified;

  delete plainBooking.startOTP;
  delete plainBooking.completionOTP;

  if (canSeeStartOTP) plainBooking.startOTP = startOTP;
  if (canSeeCompletionOTP) plainBooking.completionOTP = completionOTP;

  return plainBooking;
};

const sanitizeBookingsForViewer = (bookings, viewer) => {
  return bookings.map((booking) => sanitizeBookingForViewer(booking, viewer));
};

const attachContactDetails = async (bookings) => {
  const plainBookings = bookings.map((booking) => booking.toObject ? booking.toObject() : booking);
  const bookingIds = plainBookings.map((booking) => booking._id).filter(Boolean);
  const reviews = bookingIds.length
    ? await Review.find({ booking: { $in: bookingIds } }).select('booking rating comment createdAt')
    : [];
  const reviewsByBooking = new Map(reviews.map((review) => [review.booking.toString(), review]));

  const contactIds = new Set();
  plainBookings.forEach((booking) => {
    if (['accepted', 'in_progress'].includes(booking.status)) {
      const userId = getId(booking.user);
      const workerId = getId(booking.worker);
      if (userId) contactIds.add(userId);
      if (workerId) contactIds.add(workerId);
    }
  });

  const contacts = contactIds.size
    ? await User.find({ _id: { $in: [...contactIds] } }).select('phone').lean()
    : [];
  const phoneByUserId = new Map(contacts.map((contact) => [contact._id.toString(), contact.phone]));

  plainBookings.forEach((booking) => {
    booking.review = reviewsByBooking.get(booking._id.toString()) || null;

    if (['accepted', 'in_progress'].includes(booking.status)) {
      const userPhone = phoneByUserId.get(getId(booking.user));
      const workerPhone = phoneByUserId.get(getId(booking.worker));
      if (booking.user && typeof booking.user === 'object') booking.user.phone = userPhone;
      if (booking.worker && typeof booking.worker === 'object') booking.worker.phone = workerPhone;
    }
  });

  return plainBookings;
};

exports.createBooking = asyncHandler(async (req, res) => {
  const { workerId, service, scheduledDate, address, additionalNotes } = req.body;

  if (!workerId || !service || !scheduledDate || !address) {
    return res.status(400).json({ success: false, message: 'Worker, service, date, and address are required' });
  }

  const parsedScheduledDate = parseFutureScheduledDate(scheduledDate);
  if (!parsedScheduledDate) {
    return res.status(400).json({ success: false, message: 'Please choose a valid future date and time' });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({ success: false, message: 'Only customers can create bookings' });
  }

  const worker = await User.findOne({ _id: workerId, role: 'worker' });
  if (!worker) {
    return res.status(404).json({ success: false, message: 'Worker not found' });
  }

  const profile = await WorkerProfile.findOne({
    user: workerId,
    approvalStatus: 'approved',
    $or: [
      { availabilityStatus: 'Available' },
      { availabilityStatus: { $exists: false } }
    ]
  });

  if (!profile) {
    return res.status(400).json({ success: false, message: 'Worker is not available for bookings' });
  }

  const booking = await Booking.create({
    user: req.user.id,
    worker: workerId,
    service,
    scheduledDate: parsedScheduledDate,
    address,
    additionalNotes,
    totalPrice: calculateBookingPrice(profile)
  });

  await AuditLog.create({
    actor: req.user.id,
    action: 'booking.created',
    entityType: 'Booking',
    entityId: booking._id,
    details: { worker: workerId, status: booking.status }
  });

  await createNotification({
    user: workerId,
    type: 'booking',
    title: 'New booking request',
    message: `${req.user.name} requested ${service}`,
    entityType: 'Booking',
    entityId: booking._id
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(201).json({ success: true, data: sanitizeBookingForViewer(finalData[0], req.user) });
});

exports.getBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.user.role === 'worker'
    ? { worker: req.user.id }
    : req.user.role === 'admin'
      ? {}
      : { user: req.user.id };

  const total = await Booking.countDocuments(filter);
  const bookings = await populateBooking(
    Booking.find(filter).sort({ scheduledDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
  );

  const bookingsWithDetails = await attachContactDetails(bookings);

  res.status(200).json({
    success: true,
    data: sanitizeBookingsForViewer(bookingsWithDetails, req.user),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
  });
});

exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid booking status' });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const isCustomer = booking.user.toString() === req.user.id.toString();
  const isWorker = booking.worker.toString() === req.user.id.toString();

  if (status === 'cancelled' && !isCustomer && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only the customer can cancel this booking' });
  }

  if (['accepted', 'rejected', 'completed'].includes(status) && !isWorker && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only the assigned worker can update this booking' });
  }

  if (!canTransitionBooking(booking.status, status)) {
    return res.status(400).json({ success: false, message: `Cannot change booking from ${booking.status} to ${status}` });
  }

  const previousStatus = booking.status;
  booking.status = status;
  await booking.save();

  await AuditLog.create({
    actor: req.user.id,
    action: 'booking.status_updated',
    entityType: 'Booking',
    entityId: booking._id,
    details: { from: previousStatus, to: status }
  });

  await createNotification({
    user: isWorker ? booking.user : booking.worker,
    type: 'booking',
    title: 'Booking status updated',
    message: `Your booking is now ${status}`,
    entityType: 'Booking',
    entityId: booking._id
  });

  if (status === 'accepted') {
    const otp = generateOTP();
    booking.startOTP = otp;
    await booking.save();

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: booking.worker },
      { availabilityStatus: 'Busy' },
      { new: true }
    );
    await syncDynamicWorkerProfile(profile);

    const workerPopulated = await User.findById(booking.worker);
    await sendOTPEmail(workerPopulated.email, otp, 'Start');

    await createNotification({
      user: booking.worker,
      type: 'otp',
      title: 'Start OTP Sent',
      message: 'Your job start OTP has been sent to your email.',
      entityType: 'Booking',
      entityId: booking._id
    });
  }

  if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
    const profile = await WorkerProfile.findOneAndUpdate(
      { user: booking.worker },
      { availabilityStatus: 'Available' },
      { new: true }
    );
    await syncDynamicWorkerProfile(profile);
  }

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(200).json({ success: true, data: sanitizeBookingForViewer(finalData[0], req.user) });
});

exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus, paymentMethod, paymentReference } = req.body;
  if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid payment status' });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const isCustomer = booking.user.toString() === req.user.id.toString();
  if (!isCustomer && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only the customer or admin can update payment status' });
  }

  if (!canUpdatePaymentStatus(booking, paymentStatus)) {
    return res.status(400).json({ success: false, message: `Cannot mark payment ${paymentStatus} for a ${booking.status} booking` });
  }

  booking.paymentStatus = paymentStatus;
  booking.paymentMethod = paymentMethod || booking.paymentMethod;
  booking.paymentReference = paymentReference || booking.paymentReference;
  await booking.save();

  await AuditLog.create({
    actor: req.user.id,
    action: 'booking.payment_updated',
    entityType: 'Booking',
    entityId: booking._id,
    details: { paymentStatus, paymentMethod, paymentReference }
  });

  await createNotification({
    user: booking.worker,
    type: 'payment',
    title: 'Payment updated',
    message: `Payment status changed to ${paymentStatus}`,
    entityType: 'Booking',
    entityId: booking._id
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(200).json({ success: true, data: sanitizeBookingForViewer(finalData[0], req.user) });
});

exports.createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const numericRating = Number(rating);

  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (booking.user.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the customer can review this booking' });
  }

  if (booking.status !== 'completed') {
    return res.status(400).json({ success: false, message: 'Only completed bookings can be reviewed' });
  }

  try {
    const review = await Review.create({
      booking: booking._id,
      user: booking.user,
      worker: booking.worker,
      rating: numericRating,
      comment
    });

    const stats = await Review.aggregate([
      { $match: { worker: booking.worker } },
      { $group: { _id: '$worker', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: booking.worker },
      {
        averageRating: stats[0]?.averageRating || 0,
        totalReviews: stats[0]?.totalReviews || 0
      },
      { new: true }
    );
    await syncDynamicWorkerProfile(profile);

    await AuditLog.create({
      actor: req.user.id,
      action: 'review.created',
      entityType: 'Review',
      entityId: review._id,
      details: { booking: booking._id, worker: booking.worker, rating: numericRating }
    });

    await createNotification({
      user: booking.worker,
      type: 'review',
      title: 'New review received',
      message: `${req.user.name} rated your work ${numericRating} stars`,
      entityType: 'Review',
      entityId: review._id
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This booking has already been reviewed' });
    }
    throw error;
  }
});

exports.verifyStartOTP = asyncHandler(async (req, res) => {
  const submittedOtp = String(req.body.otp || '').trim();
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (!isBookingCustomer(booking, req.user)) {
    return res.status(403).json({ success: false, message: 'Only the customer can verify the worker OTP' });
  }

  if (booking.status !== 'accepted') {
    return res.status(400).json({ success: false, message: 'Booking not in valid state for verification' });
  }

  if (booking.startOTP !== submittedOtp) {
    return res.status(400).json({ success: false, message: 'Invalid start OTP' });
  }

  booking.status = 'in_progress';
  booking.startOTPVerified = true;
  await booking.save();

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: booking.worker },
    { availabilityStatus: 'Busy' },
    { new: true }
  );
  await syncDynamicWorkerProfile(profile);

  await createNotification({
    user: booking.worker,
    type: 'booking',
    title: 'Job Started',
    message: 'User verified your OTP. Job is now in progress.',
    entityType: 'Booking',
    entityId: booking._id
  });

  const completionOTP = generateOTP();
  booking.completionOTP = completionOTP;
  await booking.save();

  const userPopulated = await User.findById(booking.user);
  await sendOTPEmail(userPopulated.email, completionOTP, 'Completion');

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(200).json({ success: true, message: 'Job verified and started', data: sanitizeBookingForViewer(finalData[0], req.user) });
});

exports.verifyCompletionOTP = asyncHandler(async (req, res) => {
  const submittedOtp = String(req.body.otp || '').trim();
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (!isBookingWorker(booking, req.user)) {
    return res.status(403).json({ success: false, message: 'Only the assigned worker can verify the completion OTP' });
  }

  if (booking.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: 'Booking is not in progress' });
  }

  if (booking.completionOTP !== submittedOtp) {
    return res.status(400).json({ success: false, message: 'Invalid completion OTP' });
  }

  booking.status = 'completed';
  booking.completionOTPVerified = true;
  await booking.save();

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: booking.worker },
    { availabilityStatus: 'Available' },
    { new: true }
  );
  await syncDynamicWorkerProfile(profile);

  await createNotification({
    user: booking.user,
    type: 'booking',
    title: 'Job Completed',
    message: 'Your job has been successfully verified and completed.',
    entityType: 'Booking',
    entityId: booking._id
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  const finalData = await attachContactDetails([populatedBooking]);
  res.status(200).json({ success: true, message: 'Job verified and completed', data: sanitizeBookingForViewer(finalData[0], req.user) });
});
