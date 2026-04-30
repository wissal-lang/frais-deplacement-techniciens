const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  projet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Projet',
    required: true
  },
  technicien: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  type: {
    type: String,
    enum: ['installation', 'maintenance', 'reparation', 'urgent'],
    required: true
  },
  date: {
    type: Date,
    required: [true, 'La date est requise']
  },
  heureDebut: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:MM)']
  },
  localisation: {
    type: String,
    trim: true
  },
  statut: {
    type: String,
    enum: ['planifiee', 'en_cours', 'terminee', 'annulee'],
    default: 'planifiee'
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Intervention', interventionSchema);
