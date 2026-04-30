const Intervention = require('../models/Intervention');

// GET /api/interventions
exports.getAllInterventions = async (req, res, next) => {
  try {
    const { technicien, statut, dateDebut, dateFin, semaine } = req.query;
    const filter = {};

    // Filtrage par technicien (les techniciens ne voient que les leurs)
    if (req.user.role === 'technicien') {
      filter.technicien = req.user._id;
    } else if (technicien) {
      filter.technicien = technicien;
    }

    if (statut) filter.statut = statut;

    // Filtrage par semaine (ex: ?semaine=2026-03-15)
    if (semaine) {
      const debut = new Date(semaine);
      const fin = new Date(semaine);
      fin.setDate(fin.getDate() + 6);
      filter.date = { $gte: debut, $lte: fin };
    } else if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) filter.date.$gte = new Date(dateDebut);
      if (dateFin) filter.date.$lte = new Date(dateFin);
    }

    const interventions = await Intervention.find(filter)
      .populate('technicien', 'nom email')
      .populate('projet', 'nom client localisation')
      .sort({ date: 1, heureDebut: 1 });

    res.status(200).json({ success: true, count: interventions.length, interventions });
  } catch (error) {
    next(error);
  }
};

// GET /api/interventions/:id
exports.getIntervention = async (req, res, next) => {
  try {
    const intervention = await Intervention.findById(req.params.id)
      .populate('technicien', 'nom email telephone')
      .populate('projet', 'nom client localisation');

    if (!intervention) return res.status(404).json({ success: false, message: 'Intervention introuvable.' });
    res.status(200).json({ success: true, intervention });
  } catch (error) {
    next(error);
  }
};

// POST /api/interventions
exports.createIntervention = async (req, res, next) => {
  try {
    const { projet, technicien, titre, type, date, heureDebut, localisation } = req.body;

    const intervention = await Intervention.create({
      projet, technicien, titre, type, date, heureDebut, localisation,
      creePar: req.user._id
    });

    await intervention.populate('technicien', 'nom email');
    await intervention.populate('projet', 'nom client');

    res.status(201).json({ success: true, intervention });
  } catch (error) {
    next(error);
  }
};

// PUT /api/interventions/:id — Modifier / réaffecter (drag & drop)
exports.updateIntervention = async (req, res, next) => {
  try {
    const { technicien, date, heureDebut, statut, localisation, titre, type } = req.body;

    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      { technicien, date, heureDebut, statut, localisation, titre, type },
      { new: true, runValidators: true }
    )
      .populate('technicien', 'nom email')
      .populate('projet', 'nom client');

    if (!intervention) return res.status(404).json({ success: false, message: 'Intervention introuvable.' });
    res.status(200).json({ success: true, intervention });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/interventions/:id
exports.deleteIntervention = async (req, res, next) => {
  try {
    const intervention = await Intervention.findByIdAndDelete(req.params.id);
    if (!intervention) return res.status(404).json({ success: false, message: 'Intervention introuvable.' });
    res.status(200).json({ success: true, message: 'Intervention supprimée.' });
  } catch (error) {
    next(error);
  }
};
