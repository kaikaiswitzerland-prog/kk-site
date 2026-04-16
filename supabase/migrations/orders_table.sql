-- =============================================================
-- KaïKaï — Table des commandes + Realtime
-- À exécuter dans Supabase → SQL Editor
-- =============================================================

-- 1. Créer la table orders
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  customer_name    text        NOT NULL,
  customer_phone   text        NOT NULL,
  customer_address text        NOT NULL DEFAULT '',
  items            jsonb       NOT NULL DEFAULT '[]'::jsonb,
  total            numeric(10,2) NOT NULL DEFAULT 0,
  payment_method   text        NOT NULL DEFAULT 'cash'
                               CHECK (payment_method IN ('cash', 'twint')),
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'accepted', 'refused', 'delivered')),
  notes            text        DEFAULT '',
  delivery_mode    text        NOT NULL DEFAULT 'delivery'
                               CHECK (delivery_mode IN ('delivery', 'pickup'))
);

-- 2. Activer Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Policy : n'importe qui (client non connecté) peut créer une commande
CREATE POLICY "Clients can insert orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Policy : seuls les utilisateurs connectés (admin) peuvent lire les commandes
CREATE POLICY "Authenticated can read orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Policy : seuls les utilisateurs connectés peuvent mettre à jour le statut
CREATE POLICY "Authenticated can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Activer Realtime sur la table orders
-- (Dans Supabase Dashboard → Table Editor → orders → Enable Realtime)
-- OU via SQL :
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 7. Index sur created_at pour accélérer les requêtes par date (compta)
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

-- 8. Index sur status pour filtrer les commandes en attente
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
