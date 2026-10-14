-- Code promo PREMIER (14.10.2026). À lancer une fois dans le SQL Editor Supabase.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_promo_code
  ON orders(promo_code)
  WHERE promo_code IS NOT NULL;
