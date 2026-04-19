const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');
const { syncDynamicWorkerProfile } = require('../utils/syncWorkerProfile');
const { getUploadedFilePayload } = require('../utils/uploadedFile');

const VALID_AVAILABILITY_STATUSES = ['Available', 'Busy', 'Offline', 'Pending Verification'];

const getAvailabilityStatus = ({ availability, availabilityStatus }) => {
  if (VALID_AVAILABILITY_STATUSES.includes(availabilityStatus)) return availabilityStatus;
  if (typeof availability === 'boolean') return availability ? 'Available' : 'Offline';
  return undefined;
};

exports.getWorkerProfile = async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ user: req.user.id }).populate('user', 'name email avatar phone');
    if (!profile) {
      return res.status(404).json({ success: false, message: req.t('profileNotFound') });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { skills, experience, bio, pricing, availability, availabilityStatus, address, coordinates } = req.body;
    const profileUpdates = {};
    const nextAvailabilityStatus = getAvailabilityStatus({ availability, availabilityStatus });

    if (skills !== undefined) profileUpdates.skills = skills;
    if (experience !== undefined) profileUpdates.experience = experience;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (pricing !== undefined) profileUpdates.pricing = pricing;
    if (nextAvailabilityStatus !== undefined) profileUpdates.availabilityStatus = nextAvailabilityStatus;

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: req.user.id },
      profileUpdates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: req.t('profileNotFound') });
    }

    if (address || coordinates) {
      await User.findByIdAndUpdate(req.user.id, {
        location: {
          type: 'Point',
          coordinates: coordinates || req.user.location?.coordinates || [0, 0],
          address: address || req.user.location?.address
        }
      });
    }

    await syncDynamicWorkerProfile(profile);

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

exports.uploadKYC = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: req.t('uploadIdProof') });
    }

    const idProof = getUploadedFilePayload(req.file);
    if (!idProof.url) {
      return res.status(400).json({ success: false, message: req.t('uploadIdProof') });
    }

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        kyc: {
          idProof,
          status: 'pending'
        }
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: req.t('profileNotFound') });
    }

    res.status(200).json({ success: true, message: req.t('workerKycSubmitted'), data: profile });
  } catch (error) {
    next(error);
  }
};
