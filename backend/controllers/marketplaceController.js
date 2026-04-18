const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');
const { getPagination } = require('../utils/bookingRules');
const escapeRegex = require('../utils/escapeRegex');

const SERVICE_ALIASES = {
  pharmacist: ['pharmacist', 'pharamascist'],
  pharamascist: ['pharmacist', 'pharamascist'],
  'laptop/mobile repair': ['laptop/mobile repair', 'laptop/mobile reapir'],
  'laptop/mobile reapir': ['laptop/mobile repair', 'laptop/mobile reapir']
};

const parseCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getSearchOrigin = (query = {}) => {
  const lat = parseCoordinate(query.lat);
  const lng = parseCoordinate(query.lng);

  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

const getDistanceKm = (origin, coordinates = []) => {
  if (!origin || !Array.isArray(coordinates) || coordinates.length < 2) return null;

  const [lng, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(lat - origin.lat);
  const lngDelta = toRadians(lng - origin.lng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(lat)) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getWorkerLocation = (worker) => {
  const plainWorker = typeof worker.toObject === 'function' ? worker.toObject() : worker;
  return plainWorker.user?.location?.coordinates || [];
};

const sortWorkersByDistance = (workers, origin) => {
  if (!origin) return workers;

  return workers
    .map((worker) => {
      const plainWorker = typeof worker.toObject === 'function' ? worker.toObject() : worker;
      return {
        ...plainWorker,
        distanceKm: getDistanceKm(origin, getWorkerLocation(plainWorker))
      };
    })
    .sort((a, b) => {
      const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (aDistance !== bDistance) return aDistance - bDistance;
      return (b.averageRating || 0) - (a.averageRating || 0);
    });
};

const getSearchTerms = (searchTerm) => {
  const normalized = String(searchTerm || '').trim().toLowerCase();
  if (!normalized) return [];
  return [...new Set([normalized, ...(SERVICE_ALIASES[normalized] || [])])];
};

exports.searchWorkers = async (req, res, next) => {
  try {
    const { service, q, minRating, maxPrice } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const origin = getSearchOrigin(req.query);
    const filter = {
      approvalStatus: 'approved',
      availabilityStatus: { $ne: 'Offline' }
    };

    const searchTerm = service || q;

    if (searchTerm) {
      const searchTerms = getSearchTerms(searchTerm);
      filter.$or = searchTerms.flatMap((term) => {
        const safeTerm = escapeRegex(term);
        return [
          { skills: { $regex: safeTerm, $options: 'i' } },
          { bio: { $regex: safeTerm, $options: 'i' } }
        ];
      });
    }

    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    if (maxPrice) {
      filter['pricing.amount'] = { $lte: Number(maxPrice) };
    }

    const query = WorkerProfile.find(filter)
      .populate('user', 'name email avatar phone location')
      .sort({ averageRating: -1, totalReviews: -1, updatedAt: -1 });

    if (!origin) {
      query.skip(skip).limit(limit);
    }

    const total = await WorkerProfile.countDocuments(filter);
    const matchedWorkers = await query;
    const workers = origin ? sortWorkersByDistance(matchedWorkers, origin).slice(skip, skip + limit) : matchedWorkers;

    res.status(200).json({
      success: true,
      data: workers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkerDetails = async (req, res, next) => {
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
    next(error);
  }
};
