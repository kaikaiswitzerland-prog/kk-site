-- =============================================================
-- Corbeille commandes — exclure les commandes test du dashboard + compta
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Idempotent (IF EXISTS / IF NOT EXISTS).
-- =============================================================

-- 1. Colonnes corbeille.
--    is_trashed : commande mise à la corbeille (exclue de l'écran d'accueil
--                 ET de toute la compta : CA, stats, transactions, export CSV).
--    trashed_at : horodatage de la mise à la corbeille (tri de la vue corbeille).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_trashed BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMPTZ;

-- 2. Index partiel pour la vue corbeille (tri par trashed_at DESC).
CREATE INDEX IF NOT EXISTS orders_trashed_idx
  ON orders (trashed_at DESC)
  WHERE is_trashed = true;

-- 3. Policy DELETE — requise pour "Supprimer définitivement".
--    Les policies initiales ne couvraient que INSERT / SELECT / UPDATE ;
--    sans policy DELETE, RLS bloque toute suppression côté admin.
DROP POLICY IF EXISTS "Authenticated can delete orders" ON orders;
CREATE POLICY "Authenticated can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);
