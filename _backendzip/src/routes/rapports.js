const express = require('express');
const router = express.Router();
const {
  getAllRapports, getRapport, createRapport, validerRapport, getStats
} = require('../controllers/rapportController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

// Stats globales (gestionnaire)
router.get('/stats', restrictTo('gestionnaire'), getStats);

router.route('/')
  .get(getAllRapports)                              // GET  /api/rapports
  .post(upload.single('photo'), createRapport);    // POST /api/rapports (avec photo)

router.route('/:id')
  .get(getRapport);                                // GET /api/rapports/:id

// Validation par le gestionnaire
router.put('/:id/valider', restrictTo('gestionnaire'), validerRapport);

module.exports = router;
