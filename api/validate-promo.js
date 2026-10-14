// api/validate-promo.js
//
// POST { code, phone, email } → { ok: true, code, rate, label } ou
// { ok: false, error, message }.
//
// Sert au bouton « Appliquer » du Checkout et à la commande Cash/Twint, qui ne
// passe pas par create-checkout. Pour la carte, create-checkout re-valide
// lui-même : c'est lui qui fixe le montant envoyé à SumUp.

import { validatePromoForCustomer } from './_lib/promoServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  try {
    const { code, phone, email } = req.body || {};
    const result = await validatePromoForCustomer(code, phone, email);
    if (!result.ok) {
      return res.status(200).json({ ok: false, error: result.error, message: result.message });
    }
    return res.status(200).json({
      ok: true,
      code: result.code,
      rate: result.promo.rate,
      label: result.promo.label,
    });
  } catch (err) {
    console.error('[KaïKaï validate-promo] erreur', err);
    return res.status(500).json({ ok: false, error: 'server_error', message: 'Code indisponible pour le moment, réessayez plus tard.' });
  }
}
