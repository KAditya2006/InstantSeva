const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');

exports.getDashboardStats = async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingWorkers = async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveWorker = async (req, res) => {
  try {
    const { workerId, status, rejectionReason, type } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    let result;
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
    }

    if (!result) {
       return res.status(404).json({ success: false, message: 'Identity record not found' });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
