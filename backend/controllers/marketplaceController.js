const WorkerProfile = require('../models/WorkerProfile');
const { getWorkerModel } = require('../models/WorkerModels');
const Review = require('../models/Review');
const { getPagination } = require('../utils/bookingRules');
const escapeRegex = require('../utils/escapeRegex');

exports.searchWorkers = async (req, res) => {
  try {
    const { service, q, minRating, maxPrice } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const filter = {
      approvalStatus: 'approved',
      availability: true
    };

    const searchTerm = service || q;
    let CurrentModel = WorkerProfile;

    // If searching for a specific service, try the dynamic collection first
    if (service) {
      CurrentModel = getWorkerModel(service);
    }

    if (searchTerm) {
      const safeTerm = escapeRegex(searchTerm);
      filter.$or = [
        { professions: { $regex: safeTerm, $options: 'i' } },
        { bio: { $regex: safeTerm, $options: 'i' } },
        { skills: { $regex: safeTerm, $options: 'i' } }
      ];
    }

    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    if (maxPrice) {
      filter['pricing.amount'] = { $lte: Number(maxPrice) };
    }

    const total = await CurrentModel.countDocuments(filter);
    const workers = await CurrentModel.find(filter)
      .populate('user', 'name email avatar phone location')
      .sort({ averageRating: -1, totalReviews: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: workers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWorkerDetails = async (req, res) => {
  try {
    const worker = await WorkerProfile.findOne({
      user: req.params.workerId,
      approvalStatus: 'approved'
    }).populate('user', 'name email avatar phone location');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const reviews = await Review.find({ worker: req.params.workerId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: { worker, reviews } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
