-- Database schema for gestion_frais
-- Run this on a fresh database: psql -U postgres -d gestion_frais -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  prenom      VARCHAR(100),
  email       VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe TEXT NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'TECHNICIEN',
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS techniciens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  matricule   VARCHAR(50),
  telephone   VARCHAR(30),
  service     VARCHAR(100),
  ville       VARCHAR(100),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gestionnaires (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  departement VARCHAR(100),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projets (
  id          SERIAL PRIMARY KEY,
  nom         VARCHAR(255) NOT NULL,
  client      VARCHAR(255) NOT NULL,
  localisation VARCHAR(255),
  description TEXT,
  statut      VARCHAR(50) NOT NULL DEFAULT 'planifie',
  cree_par    INTEGER REFERENCES users(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interventions (
  id           SERIAL PRIMARY KEY,
  technicien_id INTEGER NOT NULL REFERENCES techniciens(id),
  titre        VARCHAR(255) NOT NULL,
  description  TEXT,
  lieu_depart  VARCHAR(255),
  lieu_arrivee VARCHAR(255),
  date_depart  TIMESTAMP WITH TIME ZONE,
  date_retour  TIMESTAMP WITH TIME ZONE,
  distance_km  NUMERIC(10, 2),
  statut       VARCHAR(50),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rapports (
  id                    SERIAL PRIMARY KEY,
  intervention_id       INTEGER NOT NULL REFERENCES interventions(id),
  technicien_id         INTEGER NOT NULL REFERENCES techniciens(id),
  date                  DATE NOT NULL,
  presence_confirmee    BOOLEAN NOT NULL DEFAULT FALSE,
  gps_latitude          NUMERIC(10, 7),
  gps_longitude         NUMERIC(10, 7),
  gps_adresse           TEXT,
  materiel_utilise      JSONB DEFAULT '[]',
  etapes                JSONB DEFAULT '{}',
  temps_passe           VARCHAR(50),
  notes                 TEXT,
  photo_url             TEXT,
  statut                VARCHAR(50) NOT NULL DEFAULT 'EN_ATTENTE',
  validate_par          INTEGER REFERENCES users(id),
  date_validation       TIMESTAMP WITH TIME ZONE,
  commentaire_validation TEXT,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS frais_deplacement (
  id                SERIAL PRIMARY KEY,
  intervention_id   INTEGER NOT NULL REFERENCES interventions(id),
  type_frais        VARCHAR(100) NOT NULL,
  montant           NUMERIC(10, 2) NOT NULL,
  devise            VARCHAR(10) NOT NULL DEFAULT 'MAD',
  date_frais        DATE NOT NULL,
  description       TEXT,
  justificatif_url  TEXT,
  justificatif_nom  TEXT,
  statut_validation VARCHAR(50) NOT NULL DEFAULT 'EN_ATTENTE',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catalogue de matériaux géré par le gestionnaire (CRUD).
CREATE TABLE IF NOT EXISTS materiaux (
  id             SERIAL PRIMARY KEY,
  reference      VARCHAR(100) UNIQUE,
  nom            VARCHAR(255) NOT NULL,
  description    TEXT,
  categorie      VARCHAR(100),
  quantite_stock INTEGER NOT NULL DEFAULT 0,
  unite          VARCHAR(50) DEFAULT 'unité',
  prix_unitaire  NUMERIC(10, 2),
  actif          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail for expense validations and payments
CREATE TABLE IF NOT EXISTS validations (
  id              SERIAL PRIMARY KEY,
  frais_id        INTEGER NOT NULL REFERENCES frais_deplacement(id) ON DELETE CASCADE,
  gestionnaire_id INTEGER REFERENCES gestionnaires(id),
  decision        VARCHAR(50) NOT NULL,
  commentaire     TEXT,
  date_decision   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_techniciens_user_id    ON techniciens(user_id);
CREATE INDEX IF NOT EXISTS idx_gestionnaires_user_id  ON gestionnaires(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_tech_id  ON interventions(technicien_id);
CREATE INDEX IF NOT EXISTS idx_rapports_intervention  ON rapports(intervention_id);
CREATE INDEX IF NOT EXISTS idx_rapports_technicien    ON rapports(technicien_id);
CREATE INDEX IF NOT EXISTS idx_frais_intervention     ON frais_deplacement(intervention_id);
CREATE INDEX IF NOT EXISTS idx_frais_statut           ON frais_deplacement(statut_validation);
CREATE INDEX IF NOT EXISTS idx_validations_frais_id   ON validations(frais_id);
CREATE INDEX IF NOT EXISTS idx_materiaux_nom          ON materiaux(nom);
CREATE INDEX IF NOT EXISTS idx_materiaux_categorie    ON materiaux(categorie);
