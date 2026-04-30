require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Connexion MongoDB ─────────────────────────────────────────
connectDB();

const app = express();

// ── Middlewares globaux ───────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploadés (photos, justificatifs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Route de santé ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ API Gestion des Interventions opérationnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── Routes API ────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/projets',       require('./routes/projets'));
app.use('/api/interventions', require('./routes/interventions'));
app.use('/api/rapports',      require('./routes/rapports'));
app.use('/api/frais',         require('./routes/frais'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// ── Route 404 ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`
  });
});

// ── Gestionnaire d'erreurs global ────────────────────────────
app.use(errorHandler);

// ── Démarrage du serveur ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀  Serveur démarré');
  console.log(`📡  http://localhost:${PORT}`);
  console.log(`🔍  Health : http://localhost:${PORT}/api/health`);
  console.log(`🌍  Environnement : ${process.env.NODE_ENV}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

module.exports = app;
