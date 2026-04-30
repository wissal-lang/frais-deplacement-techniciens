const Projet = require('../models/Projet');

// GET /api/projets
exports.getAllProjets = async (req, res, next) => {
  try {
    const { statut } = req.query;
    const filter = {};
    if (statut) filter.statut = statut;

    const projets = await Projet.find(filter)
      .populate('creePar', 'nom email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projets.length, projets });
  } catch (error) {
    next(error);
  }
};

// GET /api/projets/:id
exports.getProjet = async (req, res, next) => {
  try {
    const projet = await Projet.findById(req.params.id).populate('creePar', 'nom email');
    if (!projet) return res.status(404).json({ success: false, message: 'Projet introuvable.' });
    res.status(200).json({ success: true, projet });
  } catch (error) {
    next(error);
  }
};

// POST /api/projets
exports.createProjet = async (req, res, next) => {
  try {
    const { nom, client, localisation, description, statut } = req.body;

    const projet = await Projet.create({
      nom, client, localisation, description, statut,
      creePar: req.user._id
    });

    res.status(201).json({ success: true, projet });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projets/:id
exports.updateProjet = async (req, res, next) => {
  try {
    const { nom, client, localisation, description, statut } = req.body;

    const projet = await Projet.findByIdAndUpdate(
      req.params.id,
      { nom, client, localisation, description, statut },
      { new: true, runValidators: true }
    );

    if (!projet) return res.status(404).json({ success: false, message: 'Projet introuvable.' });
    res.status(200).json({ success: true, projet });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projets/:id
exports.deleteProjet = async (req, res, next) => {
  try {
    const projet = await Projet.findByIdAndDelete(req.params.id);
    if (!projet) return res.status(404).json({ success: false, message: 'Projet introuvable.' });
    res.status(200).json({ success: true, message: 'Projet supprimé.' });
  } catch (error) {
    next(error);
  }
};
