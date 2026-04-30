const Rapport = require('../models/Rapport');
const Intervention = require('../models/Intervention');
const path = require('path');

// GET /api/rapports
exports.getAllRapports = async (req, res, next) => {
  try {
    const { statut, technicien } = req.query;
    const filter = {};

    if (req.user.role === 'technicien') {
      filter.technicien = req.user._id;
    } else if (technicien) {
      filter.technicien = technicien;
    }

    if (statut) filter.statut = statut;

    const rapports = await Rapport.find(filter)
      .populate('technicien', 'nom email')
      .populate('intervention', 'titre type date heureDebut localisation')
      .populate('validatePar', 'nom')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: rapports.length, rapports });
  } catch (error) {
    next(error);
  }
};

// GET /api/rapports/:id
exports.getRapport = async (req, res, next) => {
  try {
    const rapport = await Rapport.findById(req.params.id)
      .populate('technicien', 'nom email')
      .populate('intervention', 'titre type date heureDebut localisation projet')
      .populate('validatePar', 'nom');

    if (!rapport) return res.status(404).json({ success: false, message: 'Rapport introuvable.' });
    res.status(200).json({ success: true, rapport });
  } catch (error) {
    next(error);
  }
};

// POST /api/rapports — Saisie journalière du technicien
exports.createRapport = async (req, res, next) => {
  try {
    const {
      intervention, date, presenceConfirmee,
      gpsLatitude, gpsLongitude, gpsAdresse,
      materielUtilise, etapes, tempsPasse, notes
    } = req.body;

    // Photo uploadée via multer
    const photoUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const rapport = await Rapport.create({
      intervention,
      technicien: req.user._id,
      date: date || new Date(),
      presenceConfirmee,
      gpsLatitude, gpsLongitude, gpsAdresse,
      materielUtilise,
      etapes: etapes ? JSON.parse(etapes) : {},
      tempsPasse,
      notes,
      photoUrl
    });

    // Met à jour le statut de l'intervention
    await Intervention.findByIdAndUpdate(intervention, { statut: 'terminee' });

    await rapport.populate('intervention', 'titre type');
    res.status(201).json({ success: true, rapport });
  } catch (error) {
    next(error);
  }
};

// PUT /api/rapports/:id/valider — Gestionnaire valide un rapport
exports.validerRapport = async (req, res, next) => {
  try {
    const { decision, commentaire } = req.body; // decision: 'valide' | 'rejete'

    if (!['valide', 'rejete'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Décision invalide.' });
    }

    const rapport = await Rapport.findByIdAndUpdate(
      req.params.id,
      {
        statut: decision,
        validatePar: req.user._id,
        dateValidation: new Date(),
        commentaireValidation: commentaire
      },
      { new: true }
    ).populate('technicien', 'nom email');

    if (!rapport) return res.status(404).json({ success: false, message: 'Rapport introuvable.' });
    res.status(200).json({ success: true, rapport });
  } catch (error) {
    next(error);
  }
};

// GET /api/rapports/stats — Stats pour le tableau de bord gestionnaire
exports.getStats = async (req, res, next) => {
  try {
    const [enAttente, valides, rejetes] = await Promise.all([
      Rapport.countDocuments({ statut: 'en_attente' }),
      Rapport.countDocuments({ statut: 'valide' }),
      Rapport.countDocuments({ statut: 'rejete' })
    ]);

    res.status(200).json({ success: true, stats: { enAttente, valides, rejetes } });
  } catch (error) {
    next(error);
  }
};
