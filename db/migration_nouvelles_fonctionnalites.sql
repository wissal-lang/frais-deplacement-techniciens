-- ============================================================================
--  Migration : 4 nouvelles fonctionnalités
--  À exécuter sur une base existante :
--    psql -U postgres -d gestion_frais -f db/migration_nouvelles_fonctionnalites.sql
--
--  Toutes les instructions sont IDEMPOTENTES (IF NOT EXISTS / IF EXISTS),
--  on peut donc relancer ce script sans danger.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2) GESTION DES MATÉRIAUX
--    Nouveau catalogue de matériaux géré uniquement par le gestionnaire.
--    (À ne pas confondre avec rapports.materiel_utilise qui est juste du
--     texte libre saisi par le technicien lors d'un rapport.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materiaux (
  id             SERIAL PRIMARY KEY,
  reference      VARCHAR(100) UNIQUE,              -- code interne (ex: MAT-0001)
  nom            VARCHAR(255) NOT NULL,
  description    TEXT,
  categorie      VARCHAR(100),                     -- ex: Outillage, Câblage...
  quantite_stock INTEGER NOT NULL DEFAULT 0,
  unite          VARCHAR(50) DEFAULT 'unité',      -- ex: unité, mètre, kg...
  prix_unitaire  NUMERIC(10, 2),
  actif          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materiaux_nom       ON materiaux(nom);
CREATE INDEX IF NOT EXISTS idx_materiaux_categorie ON materiaux(categorie);

-- ----------------------------------------------------------------------------
-- 3) FLEXIBILITÉ DU PLANNING (interventions sur plusieurs jours)
--    La table interventions possède DÉJÀ date_depart (= début) et
--    date_retour (= fin). On s'assure juste que la colonne de fin existe
--    (anciennes bases) puis on initialise date_retour = date_depart pour les
--    interventions existantes qui n'avaient pas de date de fin.
-- ----------------------------------------------------------------------------
ALTER TABLE interventions
  ADD COLUMN IF NOT EXISTS date_retour TIMESTAMP WITH TIME ZONE;

UPDATE interventions
  SET date_retour = date_depart
  WHERE date_retour IS NULL
    AND date_depart IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 4) LIEN MISSION <-> DEMANDE DE FRAIS + JUSTIFICATIF
--    Le lien mission<->frais existe déjà via frais_deplacement.intervention_id
--    (une "mission" = une intervention dans ce projet).
--    On ajoute la colonne pour stocker le justificatif (chemin du fichier).
-- ----------------------------------------------------------------------------
ALTER TABLE frais_deplacement
  ADD COLUMN IF NOT EXISTS justificatif_url TEXT;

-- (Facultatif) nom d'origine du fichier téléversé, pratique pour l'affichage.
ALTER TABLE frais_deplacement
  ADD COLUMN IF NOT EXISTS justificatif_nom TEXT;

-- ----------------------------------------------------------------------------
-- 1) GESTION DES MOTS DE PASSE
--    Aucune modification de schéma nécessaire : la règle "le gestionnaire ne
--    peut pas changer le mot de passe d'un technicien" et "le technicien change
--    son propre mot de passe" sont gérées côté backend (server.js).
--    La réinitialisation génère un mot de passe temporaire renvoyé une seule
--    fois au gestionnaire.
-- ----------------------------------------------------------------------------

-- Fin de migration.
