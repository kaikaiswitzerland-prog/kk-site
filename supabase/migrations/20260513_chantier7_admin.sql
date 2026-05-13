-- =============================================================
-- Chantier 7 — Admin avancé : statuts étendus + motifs de refus
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Idempotent (IF EXISTS / IF NOT EXISTS).
-- =============================================================

-- 1. Supprimer l'ancien CHECK obsolète sur orders.status.
--    Le CHECK initial ne tolérait que (pending, accepted, refused, delivered)
--    et est déjà cassé en pratique depuis le chantier 1 paiement (paid,
--    pending_payment, refunded, failed, expired). Ce DROP nettoie le reste.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Ajouter les colonnes pour les motifs de refus structurés.
--    `refusal_reason`  = code court (stock_out / out_of_zone / product_error / closed / other)
--    `refusal_comment` = texte libre (obligatoire si reason='other')
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS refusal_reason  TEXT,
  ADD COLUMN IF NOT EXISTS refusal_comment TEXT;

-- 3. Ajouter les timestamps de transitions manquants.
--    `out_for_delivery_at` = horodatage du passage en livraison (mode delivery)
--    `picked_up_at`        = horodatage du retrait client (mode pickup)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS picked_up_at        TIMESTAMPTZ;
