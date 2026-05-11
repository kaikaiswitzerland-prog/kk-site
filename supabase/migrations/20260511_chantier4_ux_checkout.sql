-- =============================================================
-- Chantier 4 — UX checkout : instructions séparées cuisine / livreur
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Ce fichier track la modification de schéma ; aucune exécution automatique.
-- =============================================================
--
-- note_kitchen  : allergies, cuissons, modifs recette (toujours pertinent)
-- note_delivery : digicode, étage, instructions d'accès (livraison uniquement)
--
-- La colonne `notes` historique reste en place pour compat ascendante (les
-- anciennes commandes gardent leurs notes, et le flow refund ajoute toujours
-- le motif dans cette colonne legacy — voir api/sumup-refund.js).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS note_kitchen  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS note_delivery TEXT DEFAULT '';
