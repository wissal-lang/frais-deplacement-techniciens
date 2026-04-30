const express = require('express');
const router = express.Router();
const {
  getAllInterventions, getIntervention,
  createIntervention, updateIntervention, deleteIntervention
} = require('../controllers/interventionController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAllInterventions)                                   // GET  /api/interventions
  .post(restrictTo('gestionnaire'), createIntervention);     // POST /api/interventions

router.route('/:id')
  .get(getIntervention)                                               // GET    /api/interventions/:id
  .put(restrictTo('gestionnaire'), updateIntervention)               // PUT    /api/interventions/:id
  .delete(restrictTo('gestionnaire'), deleteIntervention);           // DELETE /api/interventions/:id

module.exports = router;
