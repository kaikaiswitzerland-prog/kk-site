// api/_lib/promoServer.js
//
// Validation SERVEUR d'un code promo pour un client donné : règles de
// src/lib/promoCodes.js + contrôle « une seule fois par client » en base.
//
// Fail-closed : si la base ne répond pas ou si la colonne promo_code n'existe
// pas encore (SQL pas lancé), le code est refusé — sinon il serait
// réutilisable à l'infini.

import { supabaseAdmin } from './supabaseServer.js';
import {
  checkPromo, isPromoAlreadyUsed, normalizePhone, normalizeEmail,
  PROMO_USED_MESSAGE, PROMO_NEED_CONTACT,
} from '../../src/lib/promoCodes.js';

export async function validatePromoForCustomer(rawCode, phone, email, { excludeOrderId = null } = {}) {
  const base = checkPromo(rawCode);
  if (!base.ok) return base;
  const { promo } = base;

  if (!promo.oncePerCustomer) return { ok: true, code: promo.code, promo };

  if (!normalizePhone(phone) && !normalizeEmail(email)) {
    return { ok: false, error: 'promo_need_contact', message: PROMO_NEED_CONTACT };
  }

  let query = supabaseAdmin
    .from('orders')
    .select('id, status, customer_phone, customer_email')
    .eq('promo_code', promo.code);
  if (excludeOrderId) query = query.neq('id', excludeOrderId);
  const { data, error } = await query;

  if (error) {
    console.warn('[KaïKaï promo] lecture usages impossible (fail-closed)', error.message);
    return { ok: false, error: 'promo_unavailable', message: 'Code indisponible pour le moment, réessayez plus tard.' };
  }
  if (isPromoAlreadyUsed(data, phone, email)) {
    return { ok: false, error: 'promo_used', message: PROMO_USED_MESSAGE };
  }
  return { ok: true, code: promo.code, promo };
}

// Lecture tolérante de promo_code / discount pour les emails : rend {} si les
// colonnes n'existent pas encore (SQL pas lancé) ou en cas d'erreur.
export async function loadPromoFields(orderId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('promo_code, discount')
      .eq('id', orderId)
      .maybeSingle();
    if (error || !data) return {};
    return { promo_code: data.promo_code || null, discount: Number(data.discount) || 0 };
  } catch {
    return {};
  }
}
