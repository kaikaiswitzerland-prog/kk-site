// api/get-order-status.js — Lecture publique du statut d'une commande
//
// Endpoint appelé par /payment-success (client anon, sans session) pour
// connaître l'état de SA commande. Utilise le service_role qui bypass
// la RLS, et n'expose QUE les champs nécessaires à l'affichage de la
// page succès — pas les données perso complètes (nom, téléphone,
// adresse, items, notes restent côté DB uniquement).
//
// Auth : aucune. Le seul "secret" pour lire une commande est de
// connaître son UUID (122 bits d'entropie, brute force infaisable).

import { supabaseAdmin } from './_lib/supabaseServer.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const orderId = req.query?.order_id;
  if (!orderId || typeof orderId !== 'string' || !UUID_RE.test(orderId)) {
    return res.status(400).json({ error: 'invalid_order_id' });
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, total, customer_email, delivery_mode')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error('[KaïKaï get-order-status] db error', orderId, error);
    return res.status(500).json({ error: 'db_error' });
  }

  if (!data) {
    return res.status(404).json({ error: 'order_not_found' });
  }

  // Pas de cache : le statut évolue (webhook SumUp pending_payment → paid).
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(data);
}
