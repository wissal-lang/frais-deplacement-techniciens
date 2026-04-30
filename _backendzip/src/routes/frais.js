const express = require('express');
const router = express.Router();
const {
  getAllFrais, getResume, createFrais,
  validerManager, validerCompta, lancerVirement, getStatsGestionnaire
} = require('../controllers/fraisController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

// Stats pour le gestionnaire (espace paiement)
router.get('/stats', restrictTo('gestionnaire'), getStatsGestionnaire);

// Résumé financier du technicien connecté
router.get('/resume', restrictTo('technicien'), getResume);

// Lancer des virements (gestionnaire/compta)
router.put('/virement', restrictTo('gestionnaire'), lancerVirement);

router.route('/')
  .get(getAllFrais)                                          // GET  /api/frais
  .post(upload.single('justificatif'), createFrais);        // POST /api/frais

// Workflow de validation
router.put('/:id/valider-manager', restrictTo('gestionnaire'), validerManager);
router.put('/:id/valider-compta',  restrictTo('gestionnaire'), validerCompta);

module.exports = router;
