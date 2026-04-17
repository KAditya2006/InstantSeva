const { getWorkerModel } = require('../models/WorkerModels');

const getWorkerCollectionName = (skills = []) => {
  if (!Array.isArray(skills) || skills.length === 0) return 'general';
  return skills.length === 1 ? skills[0] : 'multi_professional';
};

const syncDynamicWorkerProfile = async (profile) => {
  if (!profile) return;

  const DynamicWorkerModel = getWorkerModel(getWorkerCollectionName(profile.skills));

  await DynamicWorkerModel.findOneAndUpdate(
    { user: profile.user },
    {
      user: profile.user,
      professions: profile.skills,
      experience: profile.experience,
      bio: profile.bio,
      pricing: profile.pricing,
      availability: profile.availabilityStatus !== 'Offline',
      availabilityStatus: profile.availabilityStatus,
      approvalStatus: profile.approvalStatus
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = {
  syncDynamicWorkerProfile
};
