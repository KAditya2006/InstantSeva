const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const OTP = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');
const PushSubscription = require('../models/PushSubscription');
const Review = require('../models/Review');
const createNotification = require('../utils/createNotification');
const { getPagination } = require('../utils/bookingRules');
const escapeRegex = require('../utils/escapeRegex');
const { syncDynamicWorkerProfile } = require('../utils/syncWorkerProfile');

const ACTIVE_BOOKING_STATUSES = ['pending', 'accepted', 'in_progress'];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }

  return String(skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
};

const getLocationPayload = ({ address, city, pincode }) => ({
  type: 'Point',
  coordinates: [0, 0],
  address: String(address || '').trim(),
  city: String(city || '').trim(),
  pincode: String(pincode || '').trim()
});

const hasActiveBookings = (userId) => {
  return Booking.exists({
    status: { $in: ACTIVE_BOOKING_STATUSES },
    $or: [
      { user: userId },
      { worker: userId }
    ]
  });
};

const deleteAccountData = async (userId) => {
  const chats = await Chat.find({ participants: userId }).select('_id').lean();
  const chatIds = chats.map((chat) => chat._id);

  await Promise.all([
    Message.deleteMany({
      $or: [
        { sender: userId },
        { chatId: { $in: chatIds } }
      ]
    }),
    Chat.deleteMany({ _id: { $in: chatIds } }),
    Notification.deleteMany({ user: userId }),
    OTP.deleteMany({ user: userId }),
    PasswordReset.deleteMany({ user: userId }),
    PushSubscription.deleteMany({ user: userId }),
    Review.deleteMany({
      $or: [
        { user: userId },
        { worker: userId }
      ]
    }),
    WorkerProfile.deleteOne({ user: userId })
  ]);

  await User.deleteOne({ _id: userId });
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    
    // Total pending from both WorkerProfile and User KYC
    const workerPending = await WorkerProfile.countDocuments({ approvalStatus: 'pending' });
    const userPending = await User.countDocuments({ 'kyc.status': 'pending', role: 'user' });
    const pendingApprovals = workerPending + userPending;

    const totalBookings = await Booking.countDocuments();
    const paidBookings = await Booking.countDocuments({ paymentStatus: 'paid' });

    res.status(200).json({
      success: true,
      data: { totalUsers, totalWorkers, pendingApprovals, totalBookings, paidBookings }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingWorkers = async (req, res, next) => {
  try {
    // 1. Get Pending Workers
    const workers = await WorkerProfile.find({ approvalStatus: 'pending' })
      .populate('user', 'name email phone avatar location')
      .lean();
    
    const formattedWorkers = workers.map(w => ({
      ...w,
      type: 'worker',
      kyc: w.kyc || {},
      createdAt: w.createdAt
    }));

    // 2. Get Pending User KYC
    const users = await User.find({ 'kyc.status': 'pending', role: 'user' }).lean();
    const formattedUsers = users.map(u => ({
      _id: u._id,
      user: u,
      kyc: u.kyc,
      type: 'user',
      createdAt: u.createdAt
    }));

    // 3. Combine and Sort by Date
    const combined = [...formattedWorkers, ...formattedUsers].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({ success: true, data: combined });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const search = String(req.query.search || '').trim();
    const filter = { role: 'user' };

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const filter = {};

    if (['pending', 'approved', 'rejected'].includes(status)) {
      filter.approvalStatus = status;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      const matchingUsers = await User.find({
        role: 'worker',
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
          { phone: { $regex: safeSearch, $options: 'i' } }
        ]
      }).select('_id').lean();

      filter.$or = [
        { user: { $in: matchingUsers.map((user) => user._id) } },
        { skills: { $regex: safeSearch, $options: 'i' } },
        { bio: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const total = await WorkerProfile.countDocuments(filter);
    const workers = await WorkerProfile.find(filter)
      .populate('user', 'name email phone avatar location isVerified isAdminApproved createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: workers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
          { phone: { $regex: safeSearch, $options: 'i' } }
        ]
      }).select('_id').lean();
      const matchingUserIds = matchingUsers.map((user) => user._id);

      filter.$or = [
        { service: { $regex: safeSearch, $options: 'i' } },
        { address: { $regex: safeSearch, $options: 'i' } },
        { user: { $in: matchingUserIds } },
        { worker: { $in: matchingUserIds } }
      ];
    }

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone avatar')
      .populate('worker', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, city, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: req.t('adminNameEmailPasswordRequired') });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id').lean();
    if (existingUser) {
      return res.status(409).json({ success: false, message: req.t('adminUserExists') });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: 'user',
      phone: String(phone || '').trim(),
      isVerified: true,
      isAdminApproved: true,
      kyc: { status: 'verified' },
      location: getLocationPayload({ address, city, pincode })
    });

    await AuditLog.create({
      actor: req.user.id,
      action: 'user.created',
      entityType: 'User',
      entityId: user._id,
      details: { createdByAdmin: true }
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({ success: true, message: req.t('adminUserCreated'), data: safeUser });
  } catch (error) {
    next(error);
  }
};

exports.createWorker = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      city,
      pincode,
      skills,
      experience,
      bio,
      amount,
      unit = 'hour'
    } = req.body;
    const workerSkills = normalizeSkills(skills);

    if (!name || !email || !password || workerSkills.length === 0 || !bio) {
      return res.status(400).json({
        success: false,
        message: req.t('adminWorkerRequired')
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id').lean();
    if (existingUser) {
      return res.status(409).json({ success: false, message: req.t('adminUserExists') });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: 'worker',
      phone: String(phone || '').trim(),
      isVerified: true,
      isAdminApproved: true,
      kyc: { status: 'verified' },
      location: getLocationPayload({ address, city, pincode })
    });

    const worker = await WorkerProfile.create({
      user: user._id,
      skills: workerSkills,
      experience: Number(experience) || 0,
      bio: String(bio).trim(),
      pricing: {
        amount: Number(amount) || 0,
        unit: ['hour', 'day', 'job'].includes(unit) ? unit : 'hour'
      },
      availabilityStatus: 'Available',
      approvalStatus: 'approved',
      kyc: { status: 'verified' }
    });

    await AuditLog.create({
      actor: req.user.id,
      action: 'worker.created',
      entityType: 'WorkerProfile',
      entityId: worker._id,
      details: { user: user._id, createdByAdmin: true }
    });

    const populatedWorker = await WorkerProfile.findById(worker._id)
      .populate('user', 'name email phone avatar location isVerified isAdminApproved createdAt')
      .lean();

    res.status(201).json({ success: true, message: req.t('adminWorkerCreated'), data: populatedWorker });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: req.t('adminCannotDeleteSelf') });
    }

    const user = await User.findOne({ _id: userId, role: 'user' }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: req.t('adminUserNotFound') });
    }

    if (await hasActiveBookings(user._id)) {
      return res.status(409).json({
        success: false,
        message: req.t('adminUserActiveBooking')
      });
    }

    await deleteAccountData(user._id);

    await AuditLog.create({
      actor: req.user.id,
      action: 'user.deleted',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email }
    });

    res.status(200).json({ success: true, message: req.t('adminUserDeleted') });
  } catch (error) {
    next(error);
  }
};

exports.deleteWorker = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    let workerProfile = await WorkerProfile.findById(workerId).lean();
    if (!workerProfile) {
      workerProfile = await WorkerProfile.findOne({ user: workerId }).lean();
    }

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: req.t('adminWorkerNotFound') });
    }

    const workerUser = await User.findOne({ _id: workerProfile.user, role: 'worker' }).lean();
    if (!workerUser) {
      return res.status(404).json({ success: false, message: req.t('adminWorkerAccountNotFound') });
    }

    if (await hasActiveBookings(workerUser._id)) {
      return res.status(409).json({
        success: false,
        message: req.t('adminWorkerActiveBooking')
      });
    }

    await deleteAccountData(workerUser._id);

    await AuditLog.create({
      actor: req.user.id,
      action: 'worker.deleted',
      entityType: 'WorkerProfile',
      entityId: workerProfile._id,
      details: { user: workerUser._id, email: workerUser.email }
    });

    res.status(200).json({ success: true, message: req.t('adminWorkerDeleted') });
  } catch (error) {
    next(error);
  }
};

exports.approveWorker = async (req, res, next) => {
  try {
    const { workerId, status, rejectionReason, type } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: req.t('invalidStatus') });
    }

    let result;
    let userId;

    if (type === 'worker') {
      result = await WorkerProfile.findByIdAndUpdate(
        workerId,
        {
          approvalStatus: status,
          'kyc.status': status === 'approved' ? 'verified' : 'rejected',
          'kyc.rejectionReason': rejectionReason || ''
        },
        { new: true }
      );
      userId = result?.user;

      if (userId) {
        await User.findByIdAndUpdate(userId, { isAdminApproved: status === 'approved' });
      }
    } else {
      // Re-use logic for User model
      result = await User.findByIdAndUpdate(
        workerId,
        {
          'kyc.status': status === 'approved' ? 'verified' : 'rejected',
          'kyc.rejectionReason': rejectionReason || '',
          isAdminApproved: status === 'approved'
        },
        { new: true }
      );
      userId = workerId;
    }

    if (!result) {
       return res.status(404).json({ success: false, message: req.t('identityNotFound') });
    }

    if (type === 'worker') {
      await syncDynamicWorkerProfile(result);
    }

    // Create Notification for the user
    try {
      await createNotification({
        user: userId,
        type: 'system',
        titleKey: status === 'approved' ? 'identityVerifiedTitle' : 'verificationRejectedTitle',
        messageKey: status === 'approved' ? 'identityVerifiedMessage' : 'verificationRejectedMessage',
        messageParams: { reason: rejectionReason || req.t('documentsUnclear') }
      });
    } catch (notificationError) {
      console.error('Failed to send verification notification:', notificationError);
    }

    await AuditLog.create({
      actor: req.user.id,
      action: `${type}.${status}`,
      entityType: type === 'worker' ? 'WorkerProfile' : 'User',
      entityId: result._id,
      details: { rejectionReason: rejectionReason || '' }
    });

    res.status(200).json({ success: true, message: req.t('identityStatusUpdated', { status }), data: result });
  } catch (error) {
    next(error);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
