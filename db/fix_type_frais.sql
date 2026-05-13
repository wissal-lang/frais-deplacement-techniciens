-- Suppression des contraintes CHECK obsolètes sur frais_deplacement.
-- Elles avaient été ajoutées directement en base et ne correspondent plus aux
-- valeurs utilisées par l'application :
--   - type_frais : l'app envoie transport/repas/materiel/hebergement/autre
--     (normalisé en MAJUSCULES par le serveur)
--   - statut_validation : l'app utilise EN_ATTENTE, VALIDEE, PAYEE, REJETE
--     alors que la contrainte n'autorisait que EN_ATTENTE, VALIDE, REFUSE.

ALTER TABLE frais_deplacement
  DROP CONSTRAINT IF EXISTS frais_deplacement_type_frais_check;

ALTER TABLE frais_deplacement
  DROP CONSTRAINT IF EXISTS frais_deplacement_statut_validation_check;

-- Même problème sur la table validations : la contrainte n'autorisait que
-- VALIDE/REFUSE alors que l'application enregistre VALIDEE/REJETE.
ALTER TABLE validations
  DROP CONSTRAINT IF EXISTS validations_decision_check;
