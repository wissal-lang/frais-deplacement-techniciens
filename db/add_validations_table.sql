-- Migration: add validations table
-- Run on an existing database that already has all other tables.
-- psql -U postgres -d gestion_frais -f db/add_validations_table.sql

CREATE TABLE IF NOT EXISTS validations (
  id              SERIAL PRIMARY KEY,
  frais_id        INTEGER NOT NULL REFERENCES frais_deplacement(id) ON DELETE CASCADE,
  gestionnaire_id INTEGER REFERENCES gestionnaires(id),
  decision        VARCHAR(50) NOT NULL,
  commentaire     TEXT,
  date_decision   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validations_frais_id ON validations(frais_id);
