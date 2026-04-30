const express = require('express');
const router = express.Router();
const {
  getAllProjets, getProjet, createProjet, updateProjet, deleteProjet
} = require('../controllers/projetController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAllProjets)                              // GET  /api/projets  (tous les rôles)
  .post(restrictTo('gestionnaire'), createProjet); // POST /api/projets  (gestionnaire only)

router.route('/:id')
  .get(getProjet)                                          // GET    /api/projets/:id
  .put(restrictTo('gestionnaire'), updateProjet)           // PUT    /api/projets/:id
  .delete(restrictTo('gestionnaire'), deleteProjet);       // DELETE /api/projets/:id

module.exports = router;
