-- =============================================================
-- Chantier 5 — Ruptures de stock par plat (réutilisation app_settings)
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Aucune nouvelle table : on stocke la liste des IDs en rupture
-- dans app_settings.out_of_stock_items (JSONB array de strings).
-- Polling 30s côté client (cohérent avec kitchen_open du chantier 6).
-- Écriture réservée au service_role via /api/admin/toggle-item-stock.
-- =============================================================

INSERT INTO app_settings (key, value) VALUES
  ('out_of_stock_items', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;
