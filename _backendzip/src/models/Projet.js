const mongoose = require('mongoose');

const projetSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du projet est requis'],
    trim: true
  },
  client: {
    type: String,
    required: [true, 'Le client est requis'],
    trim: true
  },
  localisation: {
    type: String,
    required: [true, 'La localisation est requise'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  statut: {
    type: String,
    enum: ['en_cours', 'termine', 'urgent', 'planifie'],
    default: 'planifie'
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Projet', projetSchema);
