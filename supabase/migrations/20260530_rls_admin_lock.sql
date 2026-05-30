-- =============================================================
-- KaïKaï — Verrouillage RLS orders : admin seul, INSERT public préservé
-- À exécuter MANUELLEMENT dans Supabase → SQL Editor.
-- Idempotent : DROP POLICY IF EXISTS avant chaque CREATE.
-- =============================================================
--
-- Avant : tout utilisateur authentifié (n'importe quel compte Supabase)
--         pouvait SELECT / UPDATE / DELETE TOUTES les commandes.
--         Faille critique avant lancement public.
--
-- Après : seul l'admin (identifié par email dans le JWT) peut
--         SELECT / UPDATE / DELETE. anon conserve l'INSERT pour le
--         parcours commande. La page /payment-success ne lit plus
--         la table en direct — elle passe par api/get-order-status.js
--         qui utilise le service_role (bypass RLS) et n'expose qu'un
--         sous-ensemble strict des champs.
--
-- Pour ajouter un 2e admin (ex. Dorian) :
--   ajouter l'email à la liste IN (...) dans chacune des 3 policies
--   ci-dessous, puis ré-exécuter ce script (idempotent).
-- =============================================================

-- 1. SELECT — admin seulement.
DROP POLICY IF EXISTS "Authenticated can read orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can read orders"         ON public.orders;
CREATE POLICY "Admin can read orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('kaikaiswitzerland@gmail.com')
    -- Ajouter ici : , 'dorian@exemple.com'
  );

-- 2. UPDATE — admin seulement.
DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders"         ON public.orders;
CREATE POLICY "Admin can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('kaikaiswitzerland@gmail.com')
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IN ('kaikaiswitzerland@gmail.com')
  );

-- 3. DELETE — admin seulement.
DROP POLICY IF EXISTS "Authenticated can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can delete orders"         ON public.orders;
CREATE POLICY "Admin can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('kaikaiswitzerland@gmail.com')
  );

-- 4. INSERT — INCHANGÉ.
--    La policy "Clients can insert orders" (TO anon, authenticated
--    WITH CHECK true) reste en place. NE PAS LA DROP.
--    Côté code, src/App.jsx pré-génère désormais l'UUID via
--    crypto.randomUUID() côté client : pas de .select() après
--    l'INSERT, donc aucune SELECT policy nécessaire pour anon.
