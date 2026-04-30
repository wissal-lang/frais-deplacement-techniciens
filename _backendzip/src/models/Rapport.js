const mongoose = require('mongoose');

const rapportSchema = new mongoose.Schema({
  intervention: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention',
    required: true
  },
  technicien: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Présence GPS
  presenceConfirmee: {
    type: Boolean,
    default: false
  },
  gpsLatitude: Number,
  gpsLongitude: Number,
  gpsAdresse: String,

  // Matériel
  materielUtilise: {
    type: String,
    trim: true
  },

  // Étapes
  etapes: {
    installationTerminee: { type: Boolean, default: false },
    clientPresent:        { type: Boolean, default: false },
    testsValides:         { type: Boolean, default: false }
  },

  // Temps & Notes
  tempsPasse: {
    type: String  // ex: "6h30"
  },
  notes: {
    type: String,
    trim: true
  },

  // Photo
  photoUrl: {
    type: String
  },

  // Validation
  statut: {
    type: String,
    enum: ['en_attente', 'valide', 'rejete'],
    default: 'en_attente'
  },
  validatePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateValidation: Date,
  commentaireValidation: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Rapport', rapportSchema);
