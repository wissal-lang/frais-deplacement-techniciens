# 🔧 Gestion des Interventions — Backend API

API REST Node.js / Express / MongoDB pour l'application de gestion des interventions techniciens.

---

## 📁 Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js           ← Connexion MongoDB
│   │   └── seed.js         ← Données de démonstration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── projetController.js
│   │   ├── interventionController.js
│   │   ├── rapportController.js
│   │   ├── fraisController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js         ← JWT protect + restrictTo
│   │   ├── errorHandler.js ← Erreurs globales
│   │   └── upload.js       ← Multer (photos/PDF)
│   ├── models/
│   │   ├── User.js
│   │   ├── Projet.js
│   │   ├── Intervention.js
│   │   ├── Rapport.js
│   │   └── NoteFrais.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── projets.js
│   │   ├── interventions.js
│   │   ├── rapports.js
│   │   ├── frais.js
│   │   └── dashboard.js
│   └── server.js           ← Point d'entrée
├── uploads/                ← Fichiers uploadés
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚙️ Installation & Démarrage

### 1. Prérequis
- **Node.js** ≥ 18.x → https://nodejs.org
- **MongoDB** (local) → https://www.mongodb.com/try/download/community
  - Lancer MongoDB : `mongod` (ou via MongoDB Compass)

### 2. Installation
```bash
cd backend
npm install
```

### 3. Configuration
```bash
cp .env.example .env
# Vérifier que MONGODB_URI pointe sur votre instance locale
```

Contenu du `.env` :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gestion_interventions
JWT_SECRET=votre_secret_jwt_super_securise_changez_moi
JWT_EXPIRES_IN=7d
NODE_ENV=development
UPLOAD_PATH=./uploads
```

### 4. Données de démonstration
```bash
npm run seed
```
Cela crée automatiquement les utilisateurs, projets et interventions de demo.

### 5. Démarrage
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur : **http://localhost:5000**

---

## 🔐 Comptes de connexion (après seed)

| Rôle         | Email                          | Mot de passe |
|--------------|--------------------------------|--------------|
| Gestionnaire | admin@entreprise.fr            | admin123     |
| Technicien   | jean.dupont@entreprise.fr      | tech123      |
| Technicien   | marie.martin@entreprise.fr     | tech123      |
| Technicien   | pierre.durand@entreprise.fr    | tech123      |
| Technicien   | sophie.bernard@entreprise.fr   | tech123      |

---

## 📡 Documentation des routes API

### 🔑 Authentification

| Méthode | Route                      | Accès  | Description                  |
|---------|----------------------------|--------|------------------------------|
| POST    | /api/auth/login            | Public | Connexion (retourne JWT)     |
| GET     | /api/auth/me               | Auth   | Profil de l'utilisateur      |
| PUT     | /api/auth/change-password  | Auth   | Changer le mot de passe      |

**Exemple de login :**
```json
POST /api/auth/login
{
  "email": "admin@entreprise.fr",
  "password": "admin123",
  "role": "gestionnaire"
}
```

**Réponse :**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "_id": "...", "nom": "Admin", "role": "gestionnaire" }
}
```

> Toutes les routes protégées nécessitent le header :
> `Authorization: Bearer <token>`

---

### 👥 Utilisateurs (Gestionnaire uniquement)

| Méthode | Route           | Description                    |
|---------|-----------------|--------------------------------|
| GET     | /api/users      | Liste tous les techniciens     |
| GET     | /api/users/:id  | Détail d'un technicien         |
| POST    | /api/users      | Créer un technicien            |
| PUT     | /api/users/:id  | Modifier un technicien         |
| DELETE  | /api/users/:id  | Désactiver (soft delete)       |

**Filtres GET /api/users :**
- `?role=technicien`
- `?statut=actif`

---

### 📁 Projets

| Méthode | Route             | Accès        | Description         |
|---------|-------------------|--------------|---------------------|
| GET     | /api/projets      | Auth         | Liste des projets   |
| GET     | /api/projets/:id  | Auth         | Détail projet       |
| POST    | /api/projets      | Gestionnaire | Créer un projet     |
| PUT     | /api/projets/:id  | Gestionnaire | Modifier            |
| DELETE  | /api/projets/:id  | Gestionnaire | Supprimer           |

**Body POST /api/projets :**
```json
{
  "nom": "Installation Datacenter A",
  "client": "Entreprise Alpha",
  "localisation": "Paris 15ème",
  "statut": "en_cours"
}
```

---

### 📅 Interventions (Planning)

| Méthode | Route                    | Accès        | Description                        |
|---------|--------------------------|--------------|------------------------------------|
| GET     | /api/interventions       | Auth         | Liste (filtrée par rôle auto)      |
| GET     | /api/interventions/:id   | Auth         | Détail                             |
| POST    | /api/interventions       | Gestionnaire | Créer (planifier)                  |
| PUT     | /api/interventions/:id   | Gestionnaire | Modifier / réaffecter (drag&drop)  |
| DELETE  | /api/interventions/:id   | Gestionnaire | Supprimer                          |

**Filtres GET /api/interventions :**
- `?technicien=<id>`
- `?statut=planifiee|en_cours|terminee|annulee`
- `?semaine=2026-03-15` (retourne toute la semaine)
- `?dateDebut=2026-03-01&dateFin=2026-03-31`

**Réaffectation (drag & drop) :**
```json
PUT /api/interventions/:id
{
  "technicien": "<newTechnicienId>",
  "date": "2026-03-17",
  "heureDebut": "14:00"
}
```

---

### 📝 Rapports (Saisie Journalière)

| Méthode | Route                      | Accès        | Description                |
|---------|----------------------------|--------------|----------------------------|
| GET     | /api/rapports              | Auth         | Liste des rapports         |
| GET     | /api/rapports/:id          | Auth         | Détail                     |
| GET     | /api/rapports/stats        | Gestionnaire | Stats validation           |
| POST    | /api/rapports              | Technicien   | Soumettre une saisie       |
| PUT     | /api/rapports/:id/valider  | Gestionnaire | Valider ou rejeter         |

**POST /api/rapports** (multipart/form-data) :
```
intervention : <id>
presenceConfirmee : true
gpsAdresse : "Paris 15ème, Rue de Vaugirard"
materielUtilise : "Rack 42U"
etapes : {"installationTerminee":true,"clientPresent":true,"testsValides":true}
tempsPasse : "6h30"
notes : "Installation réussie"
photo : <fichier image>
```

**Validation :**
```json
PUT /api/rapports/:id/valider
{ "decision": "valide", "commentaire": "Rapport conforme" }
```

---

### 💶 Notes de Frais

| Méthode | Route                          | Accès        | Description                     |
|---------|--------------------------------|--------------|---------------------------------|
| GET     | /api/frais                     | Auth         | Liste (filtrée par rôle)        |
| GET     | /api/frais/resume              | Technicien   | Résumé financier personnel      |
| GET     | /api/frais/stats               | Gestionnaire | Stats paiements                 |
| POST    | /api/frais                     | Technicien   | Créer une note de frais         |
| PUT     | /api/frais/:id/valider-manager | Gestionnaire | Validation Manager              |
| PUT     | /api/frais/:id/valider-compta  | Gestionnaire | Validation Comptabilité         |
| PUT     | /api/frais/virement            | Gestionnaire | Lancer virements                |

**Workflow statuts :**
```
saisie → valide_manager → valide_compta → paye
                                        ↘ rejete
```

**Lancer un virement :**
```json
PUT /api/frais/virement
{
  "ids": ["<fraisId1>", "<fraisId2>"],
  "referencePaiement": "VIR-MARS-2026"
}
```

---

### 📊 Dashboard Gestionnaire

| Méthode | Route          | Description                            |
|---------|----------------|----------------------------------------|
| GET     | /api/dashboard | Stats + activité récente + à venir     |

**Réponse :**
```json
{
  "dashboard": {
    "stats": {
      "techActifs": 12,
      "projetsEnCours": 28,
      "interventionsSemaine": 47,
      "enAttenteValidation": 8
    },
    "activiteRecente": [...],
    "interventionsAvenir": [...]
  }
}
```

---

## 🌐 Connexion Frontend → Backend

Dans votre fichier `gestion-interventions.html`, ajoutez cette configuration :

```javascript
const API_BASE = 'http://localhost:5000/api';
let authToken = localStorage.getItem('token');

async function apiCall(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` })
    }
  };
  if (data) options.body = JSON.stringify(data);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return response.json();
}

// Exemple : Login technicien
async function loginTech() {
  const result = await apiCall('POST', '/auth/login', {
    email: document.getElementById('tech-email').value,
    password: document.getElementById('tech-pass').value,
    role: 'technicien'
  });

  if (result.success) {
    authToken = result.token;
    localStorage.setItem('token', authToken);
    goTo('screen-tech-planning');
  } else {
    showToastMsg('❌ ' + result.message);
  }
}
```

---

## 🔒 Sécurité

- Mots de passe hashés avec **bcrypt** (12 rounds)
- Authentification via **JWT** (7 jours)
- Routes protégées par rôle (`technicien` / `gestionnaire`)
- Upload limité à **5 MB**, formats : JPEG, PNG, PDF
- Gestion d'erreurs centralisée

---

## 🩺 Test rapide (Health check)

```bash
curl http://localhost:5000/api/health
```

```json
{
  "success": true,
  "message": "✅ API Gestion des Interventions opérationnelle",
  "version": "1.0.0"
}
```
