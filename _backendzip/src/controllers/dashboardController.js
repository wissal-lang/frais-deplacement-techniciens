const User = require('../models/User');
const Projet = require('../models/Projet');
const Intervention = require('../models/Intervention');
const Rapport = require('../models/Rapport');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const debutSemaine = new Date();
    debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay() + 1);
    debutSemaine.setHours(0, 0, 0, 0);
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(finSemaine.getDate() + 6);

    const [
      techActifs, projetsEnCours, interventionsSemaine,
      enAttenteValidation, activiteRecente, interventionsAvenir
    ] = await Promise.all([
      User.countDocuments({ role: 'technicien', statut: 'actif' }),
      Projet.countDocuments({ statut: 'en_cours' }),
      Intervention.countDocuments({ date: { $gte: debutSemaine, $lte: finSemaine } }),
      Rapport.countDocuments({ statut: 'en_attente' }),

      // Activité récente : derniers rapports
      Rapport.find()
        .populate('technicien', 'nom')
        .populate('intervention', 'titre')
        .sort({ updatedAt: -1 })
        .limit(5),

      // Prochaines interventions
      Intervention.find({ date: { $gte: new Date() }, statut: { $ne: 'annulee' } })
        .populate('technicien', 'nom')
        .populate('projet', 'nom')
        .sort({ date: 1, heureDebut: 1 })
        .limit(5)
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        stats: {
          techActifs,
          projetsEnCours,
          interventionsSemaine,
          enAttenteValidation
        },
        activiteRecente,
        interventionsAvenir
      }
    });
  } catch (error) {
    next(error);
  }
};
