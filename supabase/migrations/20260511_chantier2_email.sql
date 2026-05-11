-- =============================================================
-- Chantier 2 — Email de confirmation via Resend
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Ce fichier track la modification de schéma ; aucune exécution automatique.
-- =============================================================

-- customer_email          : adresse saisie par le client au checkout
-- confirmation_email_sent_at : timestamp d'envoi (idempotence : si non NULL,
--                              le webhook/endpoint cash-twint ne renvoie pas)
-- refund_email_sent_at    : idem pour l'email de remboursement
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_email             TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_email_sent_at       TIMESTAMPTZ;

-- Index partiel : on cherche parfois "toutes les commandes d'un email" pour
-- support / réclamation. NULL exclus → index compact.
CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON orders(customer_email)
  WHERE customer_email IS NOT NULL;
