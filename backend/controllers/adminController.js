const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const createNotification = require('../utils/createNotification');
const { getPagination } = require('../utils/bookingRules');
const escapeRegex = require('../utils/escapeRegex');
const { syncDynamicWorkerProfile } = require('../utils/syncWorkerProfile');

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

exports.approveWorker = async (req, res, next) => {
  try {
    const { workerId, status, rejectionReason, type } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
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
       return res.status(404).json({ success: false, message: 'Identity record not found' });
    }

    if (type === 'worker') {
      await syncDynamicWorkerProfile(result);
    }

    // Create Notification for the user
    try {
      await createNotification({
        user: userId,
        type: 'system',
        title: status === 'approved' ? 'Identity Verified' : 'Verification Rejected',
        message: status === 'approved' 
          ? 'Your account has been successfully verified. You now have full access to platform features.' 
          : `Your verification request was declined. Reason: ${rejectionReason || 'Documents were unclear'}. Please re-upload your ID proof.`
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

    res.status(200).json({ success: true, message: `Identity ${status} successfully`, data: result });
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
