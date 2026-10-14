-- Couverts oui / non (14.10.2026). À lancer une fois dans le SQL Editor Supabase.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cutlery boolean NOT NULL DEFAULT false;
