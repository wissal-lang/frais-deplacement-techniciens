-- Migration: corrige la FK rapports.technicien_id qui pointait par erreur sur users(id)
-- au lieu de techniciens(id). Sans ce correctif, les techniciens dont users.id != techniciens.id
-- ne peuvent pas soumettre de rapport (violation de contrainte 23503).
-- psql -U postgres -d gestion_frais -f db/fix_rapports_technicien_fk.sql

ALTER TABLE rapports DROP CONSTRAINT IF EXISTS rapports_technicien_id_fkey;
ALTER TABLE rapports
  ADD CONSTRAINT rapports_technicien_id_fkey
  FOREIGN KEY (technicien_id) REFERENCES techniciens(id) ON DELETE CASCADE;
