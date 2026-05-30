// api/_lib/requireAdmin.js — Garde auth admin partagée pour les endpoints API.
//
// Vérifie deux choses :
//   1. Le Bearer token Supabase est valide (sinon 401).
//   2. L'email de l'utilisateur authentifié est dans l'allowlist admin
//      (sinon 403). L'allowlist doit rester cohérente avec la RLS Postgres
//      (voir supabase/migrations/20260530_rls_admin_lock.sql).
//
// Allowlist :
//   - Lue depuis ADMIN_EMAILS (CSV, ex: "a@x.com,b@y.com"), trim + lowercase.
//   - Fallback hardcodé sur kaikaiswitzerland@gmail.com pour qu'un déploiement
//     sans la var d'env ne lock pas le seul admin existant.
//
// Usage dans un endpoint :
//   const user = await requireAdmin(req, res);
//   if (!user) return;          // 401/403 déjà envoyée
//   // ... suite de la logique métier avec user.email
//
// IMPORTANT : ne JAMAIS importer ce fichier depuis src/ (code client).

import { supabaseAdmin } from './supabaseServer.js';

const FALLBACK_ADMINS = ['kaikaiswitzerland@gmail.com'];

function loadAdminEmails() {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw || !raw.trim()) return FALLBACK_ADMINS;
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Authentification requise' });
    return null;
  }

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    console.warn('[KaïKaï requireAdmin] token invalide', authError);
    res.status(401).json({ error: 'Token invalide' });
    return null;
  }

  const email = (userData.user.email || '').toLowerCase();
  const allowed = loadAdminEmails();
  if (!email || !allowed.includes(email)) {
    console.warn(`[KaïKaï requireAdmin] non-admin bloqué : ${email || '(no email)'}`);
    res.status(403).json({ error: 'Accès admin requis' });
    return null;
  }

  return userData.user;
}
