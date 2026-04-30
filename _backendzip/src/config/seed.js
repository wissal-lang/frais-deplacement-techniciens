require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Projet = require('../models/Projet');
const Intervention = require('../models/Intervention');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté');
};

const seed = async () => {
  await connectDB();

  // Nettoyage
  await User.deleteMany({});
  await Projet.deleteMany({});
  await Intervention.deleteMany({});
  console.log('🧹 Collections nettoyées');

  // ── Utilisateurs ──────────────────────────────────────────────
  const users = await User.create([
    {
      nom: 'Admin Gestionnaire',
      email: 'admin@entreprise.fr',
      password: 'admin123',
      role: 'gestionnaire',
      telephone: '01 00 00 00 00'
    },
    {
      nom: 'Jean Dupont',
      email: 'jean.dupont@entreprise.fr',
      password: 'tech123',
      role: 'technicien',
      telephone: '06 12 34 56 78'
    },
    {
      nom: 'Marie Martin',
      email: 'marie.martin@entreprise.fr',
      password: 'tech123',
      role: 'technicien',
      telephone: '06 23 45 67 89'
    },
    {
      nom: 'Pierre Durand',
      email: 'pierre.durand@entreprise.fr',
      password: 'tech123',
      role: 'technicien',
      telephone: '06 34 56 78 90'
    },
    {
      nom: 'Sophie Bernard',
      email: 'sophie.bernard@entreprise.fr',
      password: 'tech123',
      role: 'technicien',
      telephone: '06 45 67 89 01'
    }
  ]);

  const [admin, jean, marie, pierre, sophie] = users;
  console.log('👤 Utilisateurs créés');

  // ── Projets ───────────────────────────────────────────────────
  const projets = await Projet.create([
    {
      nom: 'Installation Datacenter A',
      client: 'Entreprise Alpha',
      localisation: 'Paris 15ème',
      statut: 'en_cours',
      creePar: admin._id
    },
    {
      nom: 'Maintenance Serveur B',
      client: 'Entreprise Beta',
      localisation: 'Issy-les-Moulineaux',
      statut: 'en_cours',
      creePar: admin._id
    },
    {
      nom: 'Réparation urgente Système C',
      client: 'Entreprise Gamma',
      localisation: 'Boulogne-Billancourt',
      statut: 'urgent',
      creePar: admin._id
    },
    {
      nom: 'Installation Réseau D',
      client: 'Entreprise Delta',
      localisation: 'Neuilly-sur-Seine',
      statut: 'termine',
      creePar: admin._id
    }
  ]);

  const [projA, projB, projC, projD] = projets;
  console.log('📁 Projets créés');

  // ── Interventions (semaine courante) ──────────────────────────
  const lundi = new Date();
  lundi.setDate(lundi.getDate() - lundi.getDay() + 1);
  lundi.setHours(0, 0, 0, 0);

  const jour = (offset) => {
    const d = new Date(lundi);
    d.setDate(d.getDate() + offset);
    return d;
  };

  await Intervention.create([
    {
      projet: projA._id,
      technicien: jean._id,
      titre: 'Installation Datacenter A',
      type: 'installation',
      date: jour(0),
      heureDebut: '08:00',
      localisation: 'Paris 15ème',
      statut: 'terminee',
      creePar: admin._id
    },
    {
      projet: projB._id,
      technicien: marie._id,
      titre: 'Maintenance Serveur B',
      type: 'maintenance',
      date: jour(1),
      heureDebut: '09:00',
      localisation: 'Issy-les-Moulineaux',
      statut: 'en_cours',
      creePar: admin._id
    },
    {
      projet: projC._id,
      technicien: pierre._id,
      titre: 'Réparation urgente Système C',
      type: 'urgent',
      date: jour(3),
      heureDebut: '10:00',
      localisation: 'Boulogne-Billancourt',
      statut: 'planifiee',
      creePar: admin._id
    },
    {
      projet: projD._id,
      technicien: sophie._id,
      titre: 'Installation Réseau D',
      type: 'installation',
      date: jour(4),
      heureDebut: '08:30',
      localisation: 'Neuilly-sur-Seine',
      statut: 'terminee',
      creePar: admin._id
    }
  ]);

  console.log('📅 Interventions créées');

  console.log('\n✅ Seed terminé avec succès !\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Comptes de connexion :');
  console.log('   Gestionnaire : admin@entreprise.fr  / admin123');
  console.log('   Technicien   : jean.dupont@entreprise.fr / tech123');
  console.log('   Technicien   : marie.martin@entreprise.fr / tech123');
  console.log('   Technicien   : pierre.durand@entreprise.fr / tech123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  mongoose.disconnect();
};

seed().catch((err) => {
  console.error('❌ Erreur seed :', err);
  mongoose.disconnect();
});
