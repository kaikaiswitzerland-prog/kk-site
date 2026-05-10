// api/_lib/supabaseServer.js — Client Supabase côté serveur (Vercel Functions)
//
// IMPORTANT — sécurité :
//   Cette lib utilise SUPABASE_SERVICE_ROLE_KEY qui BYPASSE Row Level Security.
//   Elle ne doit JAMAIS être importée depuis src/ (code client). Le préfixe
//   "_" du dossier garantit que Vercel n'expose pas ce fichier comme Function.
//
// Vars d'env requises côté Vercel (Settings → Environment Variables) :
//   - NEXT_PUBLIC_SUPABASE_URL   (déjà présent, partagé avec le client)
//   - SUPABASE_SERVICE_ROLE_KEY  (service_role, à AJOUTER ; jamais préfixée VITE_/NEXT_PUBLIC_)

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    '[KaïKaï server] Variables Supabase manquantes : ' +
    'NEXT_PUBLIC_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY non définies.'
  );
}

// Pas de session auto, pas de refresh : c'est du server-to-server.
export const supabaseAdmin = createClient(
  url || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
