const LOCATION_CACHE_TTL_MS = 10 * 60 * 1000;
const locationCache = new Map();

const getCacheKey = ({ query, limit }) => `${query.toLowerCase()}::${limit}`;

const normalizeLimit = (limit) => {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(Math.max(Math.floor(parsed), 1), 8);
};

const mapPlace = (place) => ({
  display_name: place.display_name,
  lat: place.lat,
  lon: place.lon,
  type: place.type,
  importance: place.importance,
  address: place.address
});

exports.searchLocations = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    const limit = normalizeLimit(req.query.limit);

    if (query.length < 3) {
      return res.status(200).json({ success: true, data: [] });
    }

    if (typeof fetch !== 'function') {
      return res.status(503).json({ success: false, message: req.t('locationSearchUnavailable') });
    }

    const cacheKey = getCacheKey({ query, limit });
    const cached = locationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json({ success: true, data: cached.data });
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: String(limit)
    });

    if (process.env.GEOCODER_COUNTRY_CODES) {
      params.set('countrycodes', process.env.GEOCODER_COUNTRY_CODES);
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': process.env.NOMINATIM_USER_AGENT || 'InstantSeva/1.0 (location-search)'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: req.t('locationProviderUnavailable') });
    }

    const places = await response.json();
    const data = Array.isArray(places) ? places.map(mapPlace) : [];
    locationCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + LOCATION_CACHE_TTL_MS
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
