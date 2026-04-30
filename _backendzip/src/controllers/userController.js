const User = require('../models/User');

// GET /api/users — Liste tous les techniciens
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, statut } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (statut) filter.statut = statut;

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// POST /api/users — Créer un technicien
exports.createUser = async (req, res, next) => {
  try {
    const { nom, email, password, telephone, role } = req.body;

    const user = await User.create({ nom, email, password, telephone, role: role || 'technicien' });
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id — Modifier un utilisateur
exports.updateUser = async (req, res, next) => {
  try {
    const { nom, email, telephone, statut } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nom, email, telephone, statut },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id — Désactiver (soft delete)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { statut: 'inactif' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    res.status(200).json({ success: true, message: 'Technicien désactivé.' });
  } catch (error) {
    next(error);
  }
};
