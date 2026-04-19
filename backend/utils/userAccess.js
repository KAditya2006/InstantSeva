const WorkerProfile = require('../models/WorkerProfile');

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const hasSubmittedKyc = (status) => ['pending', 'verified'].includes(status);

const getBaseProfileComplete = (user) => {
  const location = user.location || {};

  return Boolean(
    hasText(user.name) &&
    hasText(user.phone) &&
    hasText(location.address) &&
    (user.role !== 'user' || hasText(location.homeNumber))
  );
};

const serializeWorkerProfile = (profile) => {
  if (!profile) return null;

  return {
    id: profile._id,
    skills: profile.skills || [],
    experience: profile.experience,
    bio: profile.bio,
    pricing: profile.pricing,
    approvalStatus: profile.approvalStatus || 'pending',
    kyc: profile.kyc || { status: 'none' }
  };
};

const getUserAccessState = async (user) => {
  if (user.role === 'admin') {
    return {
      profileComplete: true,
      adminApproved: true,
      canAccessDashboard: true,
      dashboardPath: '/admin/dashboard',
      approvalStatus: 'approved',
      verificationStatus: 'verified',
      workerProfile: null
    };
  }

  const baseProfileComplete = getBaseProfileComplete(user);

  if (user.role === 'worker') {
    const workerProfile = await WorkerProfile.findOne({ user: user._id }).lean();
    const workerProfileComplete = Boolean(
      workerProfile &&
      Array.isArray(workerProfile.skills) &&
      workerProfile.skills.length > 0 &&
      hasText(workerProfile.bio) &&
      workerProfile.experience !== undefined
    );
    const verificationStatus = workerProfile?.kyc?.status || 'none';
    const approvalStatus = workerProfile?.approvalStatus || 'pending';
    const profileComplete = baseProfileComplete && workerProfileComplete && hasSubmittedKyc(verificationStatus);
    const adminApproved = approvalStatus === 'approved' && verificationStatus === 'verified';

    return {
      profileComplete,
      adminApproved,
      canAccessDashboard: profileComplete && adminApproved,
      dashboardPath: '/worker/dashboard',
      approvalStatus,
      verificationStatus,
      workerProfile: serializeWorkerProfile(workerProfile)
    };
  }

  const verificationStatus = user.kyc?.status || 'none';
  const approvalStatus = user.isAdminApproved ? 'approved' : verificationStatus === 'rejected' ? 'rejected' : 'pending';
  const profileComplete = baseProfileComplete && hasSubmittedKyc(verificationStatus);
  const adminApproved = Boolean(user.isAdminApproved && verificationStatus === 'verified');

  return {
    profileComplete,
    adminApproved,
    canAccessDashboard: profileComplete && adminApproved,
    dashboardPath: '/dashboard',
    approvalStatus,
    verificationStatus,
    workerProfile: null
  };
};

const toPublicUser = async (user) => {
  const access = await getUserAccessState(user);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    preferredLanguage: user.preferredLanguage || 'en',
    phone: user.phone,
    location: user.location,
    isVerified: user.isVerified,
    isAdminApproved: user.isAdminApproved,
    kyc: user.kyc || { status: 'none' },
    profileComplete: access.profileComplete,
    adminApproved: access.adminApproved,
    canAccessDashboard: access.canAccessDashboard,
    dashboardPath: access.dashboardPath,
    approvalStatus: access.approvalStatus,
    verificationStatus: access.verificationStatus,
    workerProfile: access.workerProfile
  };
};

module.exports = {
  getUserAccessState,
  toPublicUser
};
