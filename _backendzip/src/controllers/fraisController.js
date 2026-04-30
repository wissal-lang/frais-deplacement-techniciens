const NoteFrais = require('../models/NoteFrais');

// GET /api/frais
exports.getAllFrais = async (req, res, next) => {
  try {
    const { statut } = req.query;
    const filter = {};

    if (req.user.role === 'technicien') {
      filter.technicien = req.user._id;
    }

    if (statut) filter.statut = statut;

    const frais = await NoteFrais.find(filter)
      .populate('technicien', 'nom email')
      .populate('intervention', 'titre date')
      .populate('valideParManager', 'nom')
      .populate('valideParCompta', 'nom')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: frais.length, frais });
  } catch (error) {
    next(error);
  }
};

// GET /api/frais/resume — Résumé financier pour le technicien
exports.getResume = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalAttente, totalRembourse] = await Promise.all([
      NoteFrais.aggregate([
        { $match: { technicien: userId, statut: { $in: ['saisie', 'valide_manager', 'valide_compta'] } } },
        { $group: { _id: null, total: { $sum: '$montant' } } }
      ]),
      NoteFrais.aggregate([
        {
          $match: {
            technicien: userId,
            statut: 'paye',
            datePaiement: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$montant' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      resume: {
        totalEnAttente: totalAttente[0]?.total || 0,
        totalRembourseeMois: totalRembourse[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/frais
exports.createFrais = async (req, res, next) => {
  try {
    const { rapport, intervention, montant, description } = req.body;
    const justificatifUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const frais = await NoteFrais.create({
      rapport, intervention,
      technicien: req.user._id,
      montant, description, justificatifUrl
    });

    res.status(201).json({ success: true, frais });
  } catch (error) {
    next(error);
  }
};

// PUT /api/frais/:id/valider-manager
exports.validerManager = async (req, res, next) => {
  try {
    const frais = await NoteFrais.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'valide_manager',
        valideParManager: req.user._id,
        dateValidationManager: new Date(),
        commentaire: req.body.commentaire
      },
      { new: true }
    );

    if (!frais) return res.status(404).json({ success: false, message: 'Note de frais introuvable.' });
    res.status(200).json({ success: true, frais });
  } catch (error) {
    next(error);
  }
};

// PUT /api/frais/:id/valider-compta
exports.validerCompta = async (req, res, next) => {
  try {
    const frais = await NoteFrais.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'valide_compta',
        valideParCompta: req.user._id,
        dateValidationCompta: new Date()
      },
      { new: true }
    );

    if (!frais) return res.status(404).json({ success: false, message: 'Note de frais introuvable.' });
    res.status(200).json({ success: true, frais });
  } catch (error) {
    next(error);
  }
};

// PUT /api/frais/virement — Marquer plusieurs frais comme payés
exports.lancerVirement = async (req, res, next) => {
  try {
    const { ids, referencePaiement } = req.body;

    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: 'Aucune note sélectionnée.' });
    }

    await NoteFrais.updateMany(
      { _id: { $in: ids }, statut: 'valide_compta' },
      {
        statut: 'paye',
        datePaiement: new Date(),
        referencePaiement: referencePaiement || `VIR-${Date.now()}`
      }
    );

    const montantTotal = await NoteFrais.aggregate([
      { $match: { _id: { $in: ids.map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) } } },
      { $group: { _id: null, total: { $sum: '$montant' } } }
    ]);

    res.status(200).json({
      success: true,
      message: `${ids.length} virement(s) lancé(s).`,
      montantTotal: montantTotal[0]?.total || 0
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/frais/stats-gestionnaire
exports.getStatsGestionnaire = async (req, res, next) => {
  try {
    const [aPayer, montantTotal] = await Promise.all([
      NoteFrais.countDocuments({ statut: 'valide_compta' }),
      NoteFrais.aggregate([
        { $match: { statut: 'valide_compta' } },
        { $group: { _id: null, total: { $sum: '$montant' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      stats: {
        aPayer,
        montantTotal: montantTotal[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
