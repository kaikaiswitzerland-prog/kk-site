// src/lib/supabase.js — Client Supabase pour KaïKaï
//
// Variables d'environnement à configurer dans Vercel (Settings → Environment Variables) :
//
//   NEXT_PUBLIC_SUPABASE_URL      → URL de votre projet Supabase
//                                   Exemple : https://abcdefghijkl.supabase.co
//
//   NEXT_PUBLIC_SUPABASE_ANON_KEY → Clé anon/public de votre projet Supabase
//                                   Accessible dans Supabase → Settings → API
//
// Ces variables sont exposées côté client grâce à l'envPrefix configuré dans vite.config.js.
// Elles ne contiennent aucune donnée sensible (la clé anon est publique par design Supabase).

import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[KaïKaï] Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). ' +
    'Le Mode Île sera désactivé. Configurez ces variables dans Vercel pour l\'activer.'
  );
}

// Le client fonctionne même sans variables (retourne des erreurs gracieuses).
// Le site reste 100% opérationnel sans Supabase configuré.
export const supabase = createClient(
  supabaseUrl     || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
