// ─── ePOS-Print client (Epson TM-m30II) ────────────────────────────────
// Envoie un ticket de commande directement à l'imprimante thermique via le
// serveur ePOS-Print embarqué (http(s)://<ip>/cgi-bin/epos/service.cgi).
//
// L'appel doit partir du navigateur (l'admin tourne sur l'iPad, sur le même
// Wi-Fi local que l'imprimante). On construit le XML SOAP "à la main" pour
// éviter toute dépendance NPM Epson, et on parse la réponse pour remonter
// proprement les erreurs d'imprimante (papier vide, capot ouvert, etc.).
//
// Doc Epson de référence : ePOS-Print API Reference, schéma
// http://www.epson-pos.com/schemas/2011/03/epos-print.

import {
  fmt,
  fmtAmount,
  fmtDate,
  fmtTime,
  orderNumber,
  PAYMENT_LABELS,
  renderVariantLines,
} from './admin/orderHelpers.js';

// 48 colonnes : largeur "Font A" standard sur TM-m30II en 80 mm.
const LINE_WIDTH = 48;

const DEFAULT_PRINTER_URL =
  'https://192.168.1.103/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000';

// L'URL imprimante vit dans une env Vite (VITE_PRINTER_URL). Si non définie,
// on retombe sur l'IP par défaut de la TM-m30II du restaurant.
function resolvePrinterUrl() {
  try {
    return import.meta.env?.VITE_PRINTER_URL || DEFAULT_PRINTER_URL;
  } catch {
    return DEFAULT_PRINTER_URL;
  }
}

// ─── Helpers texte ─────────────────────────────────────────────────────
const COMBINING_MARKS = /[̀-ͯ]/g;

// Imprimante thermique : codepage limité → on retire les diacritiques et on
// passe en MAJ pour rester lisible. Identique à printText() côté PrintTicket.
function toAscii(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toUpperCase();
}

// Échappement XML strict (5 caractères réservés).
function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Ligne "Gauche .......... Droite" calibrée sur LINE_WIDTH. Si la concat
// dépasse, on tronque la partie gauche pour préserver le prix à droite.
function dottedLine(left, right) {
  const l = String(left ?? '');
  const r = String(right ?? '');
  const remaining = LINE_WIDTH - r.length - 1; // -1 = espace mini avant le prix
  if (remaining <= 0) return `${l} ${r}`;
  if (l.length >= remaining) {
    return `${l.slice(0, remaining)} ${r}`;
  }
  const dots = '.'.repeat(remaining - l.length);
  return `${l} ${dots} ${r}`;
}

function separator(ch = '-') {
  return ch.repeat(LINE_WIDTH);
}

// ─── Construction du XML ePOS-Print ────────────────────────────────────
// Une commande ePOS = succession de <text>, <feed>, <cut>. Chaque
// <text> ouvre/ferme ses attributs : alignement, double largeur/hauteur,
// emphasis. On envoie un LF (\n) à la fin de chaque ligne, ou via
// <feed line="N"/> pour aérer.
function textTag(content, { align, em, dw, dh } = {}) {
  const attrs = [];
  if (align) attrs.push(`align="${align}"`);
  if (em)    attrs.push('em="true"');
  if (dw)    attrs.push('dw="true"');
  if (dh)    attrs.push('dh="true"');
  const attrStr = attrs.length ? ` ${attrs.join(' ')}` : '';
  return `<text${attrStr}>${xmlEscape(content)}&#10;</text>`;
}

// Bloc d'un article : nom + prix sur 1 ligne, variantes en sous-lignes
// préfixées "> " (indent 2 espaces, pas d'aligement à droite — on garde
// l'info pertinente lisible même si la variante dépasse la marge).
function buildItemBlock(item) {
  const safeIt = item || {};
  const qty = safeIt.qty ?? 1;
  const subtotal = safeIt.subtotal ?? (Number(safeIt.price) || 0) * qty;
  const name = toAscii(safeIt.name);
  const lines = [];

  lines.push(textTag(dottedLine(`${qty}x ${name}`, fmtAmount(subtotal))));

  const variants = renderVariantLines(safeIt.variants);
  variants.forEach((v) => {
    lines.push(textTag(`  > ${toAscii(v)}`));
  });

  return lines.join('');
}

function buildHeader(order) {
  const lines = [];

  // En-tête centré, double largeur/hauteur + emphasis.
  lines.push(textTag('KaïKaï', { align: 'center', dw: true, dh: true, em: true }));
  lines.push(textTag('Bd de la Tour 1 - 1205 Geneve', { align: 'center' }));
  lines.push(textTag(separator('=')));

  // N° de commande + heure (gros) ; date juste en dessous.
  lines.push(textTag(`#${orderNumber(order.id)}    ${fmtTime(order.created_at)}`, { em: true }));
  lines.push(textTag(fmtDate(order.created_at)));

  // Mode : à emporter / livraison + adresse éventuelle.
  if (order.delivery_mode === 'pickup') {
    lines.push(textTag('>>> A EMPORTER <<<', { align: 'center', em: true }));
  } else {
    lines.push(textTag('>>> LIVRAISON <<<', { align: 'center', em: true }));
    if (order.customer_address) {
      lines.push(textTag(toAscii(order.customer_address), { em: true }));
    }
  }

  lines.push(textTag(separator('-')));
  return lines.join('');
}

function buildCustomerBlock(order) {
  const lines = [];
  lines.push(textTag(`CLIENT  : ${toAscii(order.customer_name)}`));
  if (order.customer_phone) {
    lines.push(textTag(`TEL     : ${order.customer_phone}`));
  }

  const payLabel = toAscii(PAYMENT_LABELS[order.payment_method] || order.payment_method || '');
  const paySuffix = order.status === 'paid' ? ' (ENCAISSEE)' : '';
  lines.push(textTag(`PAIEMENT: ${payLabel}${paySuffix}`));

  if (order.note_kitchen) {
    lines.push(textTag(`CUISINE : ${toAscii(order.note_kitchen)}`));
  }
  if (order.delivery_mode === 'delivery' && order.note_delivery) {
    lines.push(textTag(`LIVREUR : ${toAscii(order.note_delivery)}`));
  }
  // Fallback legacy : commandes pré-migration "notes" séparées.
  if (!order.note_kitchen && !order.note_delivery && order.notes) {
    lines.push(textTag(`NOTES   : ${toAscii(order.notes)}`));
  }

  lines.push(textTag(separator('-')));
  return lines.join('');
}

function buildItemsBlock(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = [];
  lines.push(textTag('ARTICLES', { em: true }));
  items.forEach((it) => {
    lines.push(buildItemBlock(it));
  });
  lines.push(textTag(separator('=')));
  return lines.join('');
}

function buildTotalBlock(order) {
  const totalLine = dottedLine('TOTAL', fmt(order.total ?? 0));
  return [
    textTag(totalLine, { em: true, dh: true }),
    textTag(separator('=')),
  ].join('');
}

function buildFooter() {
  return [
    textTag('Merci de votre commande !', { align: 'center' }),
    textTag('A bientot chez KaiKai', { align: 'center' }),
  ].join('');
}

function buildEposXml(order) {
  // Note ordering : header → client → articles → total → footer → feed → cut.
  const body =
    buildHeader(order) +
    buildCustomerBlock(order) +
    buildItemsBlock(order) +
    buildTotalBlock(order) +
    buildFooter() +
    '<feed line="3"/>' +
    '<cut type="feed"/>';

  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
      '<s:Body>' +
        '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">' +
          body +
        '</epos-print>' +
      '</s:Body>' +
    '</s:Envelope>'
  );
}

// ─── Parsing de la réponse ─────────────────────────────────────────────
// Format réponse Epson :
//   <response xmlns="..." success="true" code="" status="..."/>
// ou en cas d'erreur :
//   <response success="false" code="DeviceNotFound|EPTR_COVER_OPEN|..."/>
// On extrait les attributs success / code / status via regex (pas de DOMParser
// SOAP standardisé côté navigateur fiable cross-browser).
function parseEposResponse(xmlText) {
  const text = String(xmlText ?? '');
  const successMatch = text.match(/<response\b[^>]*\bsuccess="([^"]*)"/i);
  const codeMatch    = text.match(/<response\b[^>]*\bcode="([^"]*)"/i);
  const statusMatch  = text.match(/<response\b[^>]*\bstatus="([^"]*)"/i);

  if (!successMatch) {
    return { success: false, code: 'PARSE_ERROR', status: null, raw: text };
  }
  return {
    success: successMatch[1] === 'true',
    code: codeMatch ? codeMatch[1] : '',
    status: statusMatch ? statusMatch[1] : null,
    raw: text,
  };
}

// ─── Entrée publique ───────────────────────────────────────────────────
// Construit le XML pour `order`, l'envoie à l'imprimante, throw si l'API
// renvoie success != true.
export async function printOrderTicket(order, printerUrl) {
  if (!order) throw new Error('Commande manquante');

  const url = printerUrl || resolvePrinterUrl();
  const xml = buildEposXml(order);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '""',
      },
      body: xml,
    });
  } catch (err) {
    // Réseau / mixed-content / cert non approuvé → le fetch jette avant
    // même d'atteindre l'imprimante. On normalise en message lisible.
    throw new Error(`Imprimante injoignable (${err?.message || 'erreur réseau'})`);
  }

  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(`Imprimante HTTP ${res.status} ${res.statusText || ''}`.trim());
  }

  const parsed = parseEposResponse(responseText);
  if (!parsed.success) {
    const detail = parsed.code || parsed.status || 'erreur inconnue';
    throw new Error(`Echec impression (${detail})`);
  }

  return parsed;
}
