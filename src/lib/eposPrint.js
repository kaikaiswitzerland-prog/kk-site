// ─── ePOS-Print client (Epson TM-m30II) ────────────────────────────────
// Envoie un ticket de commande directement à l'imprimante thermique via le
// serveur ePOS-Print embarqué (http(s)://<ip>/cgi-bin/epos/service.cgi).
//
// Appelé soit depuis le navigateur admin (même Wi-Fi que l'imprimante), soit
// depuis print-agent/agent.mjs (démon local). On construit le XML SOAP "à la
// main" pour éviter toute dépendance NPM Epson, et on parse la réponse pour
// remonter proprement les erreurs d'imprimante (papier vide, capot ouvert…).
//
// Doc de référence : ePOS-Print XML User's Manual, schéma
// http://www.epson-pos.com/schemas/2011/03/epos-print
//
// Attributs <text> utilisés (vérifiés dans la spec) :
//   font    font_a | font_b | font_c
//   width   entier 1..8   (échelle horizontale ; prime sur dw quand les deux
//                          sont présents — on n'utilise donc plus dw/dh)
//   height  entier 1..8   (échelle verticale ; prime sur dh)
//   em      true|false    (gras)
//   reverse true|false    (vidéo inverse, blanc sur noir)
//   align   left|center|right
// <feed unit="0..255"/> avance en POINTS, <feed line="0..255"/> en lignes.

import {
  fmt,
  fmtAmount,
  fmtDate,
  fmtTime,
  orderNumber,
  PAYMENT_LABELS,
  renderVariantLines,
} from './admin/orderHelpers.js';

// ─── Géométrie ─────────────────────────────────────────────────────────
// TM-m30II en 80 mm = 576 points de large.
//   Font A : 12 pts/car → 48 colonnes
//   Font B :  9 pts/car → 64 colonnes
// Une ligne agrandie (width=N) divise d'autant le nombre de colonnes : une
// ligne Font A ×2 ne fait plus que 24 colonnes. C'est pourquoi dottedLine()
// et separator() reçoivent TOUJOURS la largeur du style de la ligne — il n'y
// a plus de LINE_WIDTH global (l'ancienne constante 64 débordait dès qu'on
// sortait de Font B).
const COLS_FONT_A = 48;
const COLS_FONT_B = 64;

const clampScale = (n) => Math.min(8, Math.max(1, Math.round(Number(n) || 1)));

function colsFor(style = {}) {
  const base = style.font === 'font_a' ? COLS_FONT_A : COLS_FONT_B;
  return Math.max(1, Math.floor(base / clampScale(style.width)));
}

// Styles nommés — une seule source pour la police ET la largeur associée.
const S = {
  banner:    { font: 'font_a', width: 2, height: 2, em: true, reverse: true },
  orderNo:   { font: 'font_a', width: 3, height: 3, em: true },
  orderTime: { font: 'font_a', width: 2, height: 2, em: true },
  mode:      { font: 'font_a', width: 2, height: 2, em: true, reverse: true },
  address:   { font: 'font_a', em: true },
  item:      { font: 'font_a', em: true },
  total:     { font: 'font_a', width: 2, height: 2, em: true },
  thanks:    { font: 'font_a', em: true },
  body:      { font: 'font_b' },
  small:     { font: 'font_b' },
};

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

// Ponctuation typographique absente du codepage imprimante. Les notes client
// arrivent d'iOS avec des apostrophes courbes et des tirets longs : sans ce
// repli elles sortent en caractère parasite. Les espaces insécables, eux,
// viennent de toLocaleString('fr-CH') sur les montants.
const TYPO_FOLD = [
  [/[‘’‛]/g, "'"],
  [/[“”„]/g, '"'],
  [/[–—−]/g, '-'],
  [/[‹›]/g, '>'],
  [/[«»]/g, '"'],
  [/…/g, '...'],
  // Espaces insecables / fines, ecrits en echappements : en litteral ils sont
  // invisibles a la relecture et declenchent no-irregular-whitespace.
  [/[\u00A0\u202F\u2007\u2009\u200A]/g, ' '],
];

const foldTypo = (s) => {
  let out = String(s ?? '');
  for (const [re, rep] of TYPO_FOLD) out = out.replace(re, rep);
  return out;
};

// Imprimante thermique : codepage limité → on replie la typographie, on retire
// les diacritiques et on passe en MAJ pour rester lisible.
const toAscii = (s) => foldTypo(s).normalize('NFD').replace(COMBINING_MARKS, '').toUpperCase();

// Même repli, sans les majuscules (pied de ticket).
const toAsciiMixed = (s) => foldTypo(s).normalize('NFD').replace(COMBINING_MARKS, '');

// Échappement XML strict (5 caractères réservés).
function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Ligne "Gauche .......... Droite" calibrée sur `cols`, montant collé à droite.
//
// La longueur finale est exactement `cols` : gauche + espace + points + espace
// + droite. L'ancienne version oubliait l'un des deux espaces dans son calcul
// et rendait des lignes de cols+1, qui débordaient d'un caractère.
function dottedLine(left, right, cols) {
  const l = String(left ?? '');
  const r = String(right ?? '');
  const dots = cols - l.length - r.length - 2;
  if (dots >= 1) return `${l} ${'.'.repeat(dots)} ${r}`;
  // Plus la place pour des points : on tronque la gauche, le montant prime.
  const maxLeft = Math.max(0, cols - r.length - 1);
  return `${l.slice(0, maxLeft).padEnd(maxLeft)} ${r}`.slice(0, cols);
}

// Séparateurs en ASCII pur : les filets Unicode (─ ═) ne sont pas garantis
// dans le codepage de l'imprimante et sortiraient en caractères parasites.
const separator = (ch, cols) => ch.repeat(cols);

// Remplit la ligne sur toute la largeur pour qu'un bloc reverse="true" donne
// un vrai bandeau plein, et pas seulement les caractères surlignés.
function centerPad(s, cols) {
  const t = s.length > cols ? s.slice(0, cols) : s;
  const left = Math.floor((cols - t.length) / 2);
  return ' '.repeat(left) + t + ' '.repeat(cols - t.length - left);
}

// Coupe sur les espaces, et coupe brutalement un mot plus long que la ligne
// (adresse sans espace, note collée) plutôt que de le laisser déborder.
function wrapText(s, cols) {
  const words = String(s ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  const flushLongWord = () => {
    while (cur.length > cols) {
      lines.push(cur.slice(0, cols));
      cur = cur.slice(cols);
    }
  };
  for (const w of words) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= cols) cur += ` ${w}`;
    else { lines.push(cur); cur = w; }
    flushLongWord();
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

// "CLIENT    Marie Dupont" avec retrait suspendu sur les lignes suivantes.
const LABEL_W = 9;
function labelLines(label, value, cols) {
  const avail = Math.max(1, cols - LABEL_W);
  return wrapText(value, avail).map((line, i) =>
    (i === 0 ? label.padEnd(LABEL_W) : ' '.repeat(LABEL_W)) + line,
  );
}

// ─── Construction du XML ePOS-Print ────────────────────────────────────
function textTag(content, style = {}) {
  const { font = 'font_b', align, em, ul, reverse, width, height } = style;
  const attrs = [`font="${font}"`];
  if (align) attrs.push(`align="${align}"`);
  if (em) attrs.push('em="true"');
  if (ul) attrs.push('ul="true"');
  if (reverse) attrs.push('reverse="true"');
  if (width && clampScale(width) > 1) attrs.push(`width="${clampScale(width)}"`);
  if (height && clampScale(height) > 1) attrs.push(`height="${clampScale(height)}"`);
  return `<text ${attrs.join(' ')}>${xmlEscape(content)}&#10;</text>`;
}

const textLines = (lines, style) => lines.map((l) => textTag(l, style)).join('');

const blankLine = () => '<feed line="1"/>';
// Demi-interligne : une ligne Font A fait 24 points, donc 12 points d'air.
const halfLine = () => '<feed unit="12"/>';

// 1. EN-TÊTE
function buildHeader() {
  return [
    textTag(centerPad('KAIKAI', colsFor(S.banner)), S.banner),
    textTag('BD DE LA TOUR 1 - 1205 GENEVE', { ...S.small, align: 'center' }),
    blankLine(),
  ].join('');
}

// 2. BLOC COMMANDE — numéro et heure sont les infos les plus consultées.
function buildOrderBlock(order) {
  return [
    textTag(`#${orderNumber(order.id)}`, S.orderNo),
    textTag(fmtTime(order.created_at), S.orderTime),
    textTag(toAscii(fmtDate(order.created_at)), S.body),
    blankLine(),
  ].join('');
}

// 3. MODE — bandeau inversé pleine largeur.
function buildModeBlock(order) {
  const isPickup = order.delivery_mode === 'pickup';
  const lines = [
    textTag(centerPad(isPickup ? 'A EMPORTER' : 'LIVRAISON', colsFor(S.mode)), S.mode),
  ];
  if (!isPickup && order.customer_address) {
    lines.push(...textLines(
      wrapText(toAscii(order.customer_address), colsFor(S.address)),
      S.address,
    ));
  }
  lines.push(blankLine());
  return lines.join('');
}

// 4. CLIENT — colonnes alignées.
function buildCustomerBlock(order) {
  const cols = colsFor(S.body);
  const rows = [];

  rows.push(...labelLines('CLIENT', toAscii(order.customer_name), cols));
  if (order.customer_phone) {
    rows.push(...labelLines('TEL', toAscii(order.customer_phone), cols));
  }

  const payLabel = toAscii(PAYMENT_LABELS[order.payment_method] || order.payment_method || '');
  const paySuffix = order.status === 'paid' ? ' (ENCAISSEE)' : '';
  rows.push(...labelLines('PAIEMENT', `${payLabel}${paySuffix}`, cols));

  if (order.note_kitchen) {
    rows.push(...labelLines('NOTE', toAscii(order.note_kitchen), cols));
  }
  if (order.delivery_mode === 'delivery' && order.note_delivery) {
    rows.push(...labelLines('LIVREUR', toAscii(order.note_delivery), cols));
  }
  // Fallback legacy : commandes pré-migration "notes" séparées.
  if (!order.note_kitchen && !order.note_delivery && order.notes) {
    rows.push(...labelLines('NOTE', toAscii(order.notes), cols));
  }

  return textLines(rows, S.body);
}

// 5. ARTICLES — nom en Font A gras, variantes en Font B indentées.
function buildItemBlock(item) {
  const safeIt = item || {};
  const qty = safeIt.qty ?? 1;
  const subtotal = safeIt.subtotal ?? (Number(safeIt.price) || 0) * qty;

  const out = [
    textTag(
      dottedLine(`${qty}x ${toAscii(safeIt.name)}`, toAscii(fmtAmount(subtotal)), colsFor(S.item)),
      S.item,
    ),
  ];

  // Préfixe ">" et non "›" : U+203A n'est pas garanti dans le codepage de
  // l'imprimante (TYPO_FOLD le replierait de toute façon sur ">").
  const subCols = colsFor(S.body) - 5; // 3 d'indentation + "> "
  renderVariantLines(safeIt.variants).forEach((v) => {
    wrapText(toAscii(v), subCols).forEach((line, i) => {
      out.push(textTag(`   ${i === 0 ? '> ' : '  '}${line}`, S.body));
    });
  });

  return out.join('');
}

function buildItemsBlock(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const cols = colsFor(S.body);
  return [
    textTag(separator('-', cols), S.body),
    items.map(buildItemBlock).join(halfLine()),
    textTag(separator('-', cols), S.body),
  ].join('');
}

// 6. TOTAL
function buildTotalBlock(order) {
  return [
    textTag(separator('=', colsFor(S.body)), S.body),
    textTag(dottedLine('TOTAL', toAscii(fmt(order.total ?? 0)), colsFor(S.total)), S.total),
  ].join('');
}

// 7. PIED
function buildFooter() {
  return [
    blankLine(),
    textTag(toAsciiMixed('Mauruuru !'), { ...S.thanks, align: 'center' }),
    textTag(toAsciiMixed('A bientot chez KaiKai'), { ...S.small, align: 'center' }),
  ].join('');
}

export function buildEposXml(order) {
  const body =
    buildHeader(order) +
    buildOrderBlock(order) +
    buildModeBlock(order) +
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
