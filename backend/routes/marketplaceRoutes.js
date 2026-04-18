const express = require('express');
const router = express.Router();
const { getWorkerDetails, searchWorkers } = require('../controllers/marketplaceController');
const { searchLocations } = require('../controllers/locationController');

router.get('/locations/search', searchLocations);
router.get('/workers', searchWorkers);
router.get('/workers/:workerId', getWorkerDetails);

module.exports = router;
