const mongoose = require('mongoose');

const noteFraisSchema = new mongoose.Schema({
  rapport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rapport',
    required: true
  },
  technicien: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  intervention: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention'
  },
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  justificatifUrl: String,

  // Workflow de validation : saisie → manager → compta → virement
  statut: {
    type: String,
    enum: ['saisie', 'valide_manager', 'valide_compta', 'paye', 'rejete'],
    default: 'saisie'
  },

  // Traçabilité
  valideParManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateValidationManager: Date,

  valideParCompta: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateValidationCompta: Date,

  datePaiement: Date,
  referencePaiement: String,

  commentaire: String
}, {
  timestamps: true
});

module.exports = mongoose.model('NoteFrais', noteFraisSchema);
