-- =============================================================
-- Chantier 1 — Paiement carte saine (webhook SumUp + refund)
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Ce fichier est un track de la modification de schéma — l'app n'exécute
-- rien automatiquement.
-- =============================================================

-- Colonnes pour la liaison SumUp et le suivi des remboursements.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS sumup_checkout_id    TEXT,
  ADD COLUMN IF NOT EXISTS sumup_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_id            TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at          TIMESTAMPTZ;

-- Index partiel sur sumup_checkout_id : le webhook lookup une commande à
-- partir de cet ID, c'est le hot path. Partial WHERE NOT NULL pour ne pas
-- indexer les commandes cash/twint qui n'auront jamais cette colonne.
CREATE INDEX IF NOT EXISTS idx_orders_sumup_checkout_id
  ON orders(sumup_checkout_id)
  WHERE sumup_checkout_id IS NOT NULL;

-- Élargir le CHECK sur status pour autoriser 'refunded', 'failed', 'expired'.
-- (Note : si le CHECK initial a déjà été désactivé en prod via Dashboard,
-- ces ALTER peuvent échouer silencieusement — c'est OK. Ils sont là pour la
-- traçabilité et pour qu'une éventuelle reconstruction depuis le repo soit
-- correcte.)
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
      'pending',          -- cash/twint à confirmer
      'pending_payment',  -- carte : attente webhook SumUp
      'paid',             -- carte encaissée, à traiter cuisine
      'accepted',         -- en préparation
      'ready',            -- prête, en attente livreur
      'delivered',        -- terminé
      'refused',          -- refusée par l'admin
      'refunded',         -- carte remboursée via SumUp
      'failed',           -- paiement carte échoué
      'expired'           -- checkout SumUp expiré sans paiement
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CHECK status non modifié (probablement déjà absent ou différent) : %', SQLERRM;
END $$;

-- Élargir le CHECK sur payment_method pour autoriser 'card'.
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
  ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('cash', 'twint', 'card'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CHECK payment_method non modifié : %', SQLERRM;
END $$;
