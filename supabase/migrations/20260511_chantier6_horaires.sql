-- =============================================================
-- Chantier 6 — Horaires + lundi fermé + stop commandes admin
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Ce fichier track la modification de schéma ; aucune exécution automatique.
-- =============================================================

-- app_settings : table clé/valeur (JSONB) pour les flags applicatifs.
-- Démarre avec kitchen_open = true. L'écriture est réservée au service_role
-- (via api/admin/toggle-kitchen.js) ; la lecture est publique (RLS SELECT true)
-- pour permettre au front anon de connaître l'état en temps réel.
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique : tout client anon peut voir l'état d'ouverture.
DROP POLICY IF EXISTS "Public read app_settings" ON app_settings;
CREATE POLICY "Public read app_settings"
  ON app_settings FOR SELECT
  USING (true);

-- Pas de policy INSERT/UPDATE/DELETE pour anon : seul le service_role
-- (qui bypass RLS) peut écrire, via l'endpoint admin authentifié.

-- Seed : la cuisine est ouverte par défaut. ON CONFLICT DO NOTHING garantit
-- l'idempotence si la migration est rejouée.
INSERT INTO app_settings (key, value) VALUES
  ('kitchen_open', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
