const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUser, createUser, updateUser, deleteUser
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// Toutes les routes nécessitent d'être connecté en tant que gestionnaire
router.use(protect, restrictTo('gestionnaire'));

router.route('/')
  .get(getAllUsers)       // GET  /api/users
  .post(createUser);     // POST /api/users

router.route('/:id')
  .get(getUser)          // GET    /api/users/:id
  .put(updateUser)       // PUT    /api/users/:id
  .delete(deleteUser);   // DELETE /api/users/:id

module.exports = router;
