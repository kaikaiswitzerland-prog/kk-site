-- supabase/schema.sql — Schéma base de données KaïKaï Mode Île
--
-- Comment exécuter ce schéma :
-- 1. Connectez-vous à votre projet Supabase
-- 2. Ouvrez l'éditeur SQL (SQL Editor dans le menu gauche)
-- 3. Collez et exécutez ce fichier entier
--
-- Ce schéma crée la table des profils utilisateurs avec
-- Row Level Security (RLS) : chaque utilisateur ne voit
-- et ne modifie que son propre profil.

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  points integer default 0,
  created_at timestamp with time zone default now()
);

-- Active la sécurité au niveau des lignes
alter table profiles enable row level security;

-- Politique : un utilisateur peut lire son propre profil
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

-- Politique : un utilisateur peut modifier son propre profil
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Politique : un utilisateur peut créer son propre profil (nécessaire pour l'inscription)
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);
