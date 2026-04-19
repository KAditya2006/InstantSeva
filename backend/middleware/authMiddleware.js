const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserAccessState } = require('../utils/userAccess');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: req.t('notAuthorizedRoute') });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user || req.user.isDeleted) {
      return res.status(401).json({ success: false, message: req.t('userNoLongerExists') });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: req.t('notAuthorized') });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: req.t('roleNotAuthorized', { role: req.user.role })
      });
    }
    next();
  };
};

exports.verifiedOnly = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: req.t('verifyEmailAccess')
    });
  }
  next();
};

exports.dashboardApprovedOnly = async (req, res, next) => {
  try {
    const access = await getUserAccessState(req.user);

    if (!access.canAccessDashboard) {
      return res.status(403).json({
        success: false,
        message: access.profileComplete
          ? req.t('adminVerificationPending')
          : req.t('completeProfileFirst'),
        onboarding: {
          profileComplete: access.profileComplete,
          approvalStatus: access.approvalStatus,
          verificationStatus: access.verificationStatus,
          dashboardPath: access.dashboardPath
        }
      });
    }

    req.access = access;
    next();
  } catch (error) {
    next(error);
  }
};
