// api/_lib/resend.js — Client Resend partagé (Vercel Functions)
//
// Singleton instancié au cold start. Toutes les opérations sont best-effort :
// jamais d'exception remontée à l'appelant, juste { success, id?, error? }.
// L'objectif est qu'un échec d'email ne casse JAMAIS la logique métier
// (webhook qui bascule paid, refund, etc.).
//
// Var d'env requise côté Vercel :
//   RESEND_API_KEY (sensible)
//
// Adresse expéditrice hardcodée — domaine kaikaifood.com déjà vérifié
// (DKIM + SPF en place côté DNS).

import { Resend } from 'resend';

const FROM = 'KaïKaï <contact@kaikaifood.com>';

let client = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[KaïKaï mail] RESEND_API_KEY manquante — emails désactivés');
    return null;
  }
  client = new Resend(apiKey);
  return client;
}

/**
 * Envoie un email via Resend. Best-effort, ne throw jamais.
 *
 * @param {Object}   params
 * @param {string|string[]} params.to        — destinataire(s)
 * @param {string}   params.subject
 * @param {string}   params.html
 * @param {string}   params.text             — fallback texte (recommandé)
 * @param {string}   [params.replyTo]
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const resend = getClient();
  if (!resend) {
    return { success: false, error: 'resend_not_initialized' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if (error) {
      // error = { message, name } selon la doc SDK
      console.error('[KaïKaï mail] Resend erreur', { to, subject, error });
      return { success: false, error: error.message || error.name || 'unknown' };
    }

    console.log('[KaïKaï mail] envoyé', { to, subject, id: data?.id });
    return { success: true, id: data?.id };
  } catch (err) {
    // Filet de sécurité : rien ne doit remonter à l'appelant.
    console.error('[KaïKaï mail] exception', { to, subject, err });
    return { success: false, error: err?.message || 'exception' };
  }
}
