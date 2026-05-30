-- =============================================================
-- KaïKaï — CHECK orders.status complet (inclut out_for_delivery, picked_up)
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Idempotent : DROP IF EXISTS avant CREATE.
-- =============================================================
--
-- Bug observé en prod : cliquer "🚴 Partir en livraison" (status='ready' →
-- 'out_for_delivery') ne déplace pas la commande dans l'onglet "En route".
--
-- Cause : la migration 20260510_chantier1_paiement.sql a posé une CHECK
-- `orders_status_check` qui ne listait PAS 'out_for_delivery' ni 'picked_up'.
-- La migration 20260513_chantier7_admin.sql ne fait que DROP cette CHECK
-- sans la recréer — donc si la CHECK est restée en place (migration partielle,
-- ré-attachée via Dashboard, etc.), Postgres rejette silencieusement l'UPDATE.
--
-- Fix : on garantit l'état final correct en (re)créant une CHECK qui couvre
-- TOUS les statuts utilisés par l'app (filet de sécurité).
-- =============================================================

DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN (
      'pending',           -- cash/twint à confirmer
      'pending_payment',   -- carte : attente webhook SumUp
      'paid',              -- carte encaissée, à traiter cuisine
      'accepted',          -- en préparation
      'ready',             -- prête, en attente livreur / client
      'out_for_delivery',  -- livreur parti (mode delivery) → onglet "En route"
      'delivered',         -- livrée au client (mode delivery)
      'picked_up',         -- récupérée par le client (mode pickup)
      'refused',           -- refusée par l'admin
      'refunded',          -- carte remboursée via SumUp
      'failed',            -- paiement carte échoué
      'expired'            -- checkout SumUp expiré sans paiement
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CHECK orders_status_check non posé : %', SQLERRM;
END $$;
