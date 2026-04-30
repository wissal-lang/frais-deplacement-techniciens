const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/dashboard — gestionnaire uniquement
router.get('/', protect, restrictTo('gestionnaire'), getDashboard);

module.exports = router;
