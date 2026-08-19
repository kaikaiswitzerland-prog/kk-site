// ─── ePOS-Print client (Epson TM-m30II) ────────────────────────────────
// Envoie un ticket de commande directement à l'imprimante thermique via le
// serveur ePOS-Print embarqué (http(s)://<ip>/cgi-bin/epos/service.cgi).
//
// Appelé soit depuis le navigateur admin (même Wi-Fi que l'imprimante), soit
// depuis print-agent/agent.mjs (démon local). On construit le XML SOAP "à la
// main" pour éviter toute dépendance NPM Epson, et on parse la réponse pour
// remonter proprement les erreurs d'imprimante (papier vide, capot ouvert…).
//
// Doc de référence : ePOS-Print XML User's Manual (Rev. S), schéma
// http://www.epson-pos.com/schemas/2011/03/epos-print
//
// ⚠ LES ATTRIBUTS DE <text> SONT DES ÉTATS PERSISTANTS, PAS DE LA DÉCORATION.
//
// Le manuel Epson le montre dans son propre exemple (p.74) : chaque style est
// posé sur une balise <text/> vide, puis le texte est imprimé par une balise
// SANS attribut. Un réglage reste actif jusqu'à ce qu'on le change — c'est
// confirmé p.75 : « The "align" setting specified in this element is also
// applied to <image>, <logo>, <barcode>, and <symbol> ».
//
// Conséquence : n'émettre un attribut que lorsqu'il est "vrai" contamine tout
// le reste du ticket (un reverse="true" jamais éteint imprime la suite en
// blocs noirs ; un font_a jamais rendu fait déborder les séparateurs). C'est
// exactement ce qui sortait avant ce correctif.
//
// RÈGLE : toute balise <text> émise déclare l'INTÉGRALITÉ des attributs de
// style avec une valeur explicite. C'est le rôle de line() / seg() ci-dessous,
// seules fonctions autorisées à produire un <text>.

import {
  fmt,
  fmtAmount,
  fmtDate,
  fmtTime,
  orderNumber,
  PAYMENT_LABELS,
  renderVariantLines,
} from './admin/orderHelpers.js';

// ─── Style ─────────────────────────────────────────────────────────────
// Valeurs par défaut = valeurs d'usine listées p.65 du manuel, sauf smooth
// que l'on force à true (lissage des caractères agrandis).
const DEFAULT_STYLE = {
  font: 'font_b',
  width: 1,
  height: 1,
  reverse: false,
  ul: false,
  em: false,
  align: 'left',
  smooth: true,
};

const clampScale = (n) => Math.min(8, Math.max(1, Math.round(Number(n) || 1)));

// Largeur en colonnes — table unique, utilisée par TOUT le fichier.
// TM-m30II en 80 mm = 576 points : Font A 12 pts/car → 48 colonnes,
// Font B 9 pts/car → 64. Une échelle width=N divise d'autant.
const COLS = {
  font_a: { 1: 48, 2: 24, 3: 16, 4: 12 },
  font_b: { 1: 64, 2: 32, 3: 21, 4: 16 },
  font_c: { 1: 72, 2: 36, 3: 24, 4: 18 },
};

function colsFor(style = {}) {
  const s = { ...DEFAULT_STYLE, ...style };
  const w = clampScale(s.width);
  const table = COLS[s.font] || COLS.font_b;
  return table[w] ?? Math.max(1, Math.floor(table[1] / w));
}

// Styles nommés. Chacun porte sa police ET son échelle : la largeur de ligne
// s'en déduit toujours par colsFor(), jamais par une constante globale.
const S = {
  brand:     { font: 'font_a', width: 2, height: 2, em: true, align: 'center' },
  brandAddr: { font: 'font_b', align: 'center' },
  orderNo:   { font: 'font_a', width: 2, height: 2, em: true, align: 'center' },
  orderWhen: { font: 'font_b', height: 2, em: true, align: 'center' },
  mode:      { font: 'font_a', height: 2, em: true, align: 'center' },
  address:   { font: 'font_a', em: true },
  body:      { font: 'font_b' },
  rule:      { font: 'font_a' },                       // 48 col, référence unique
  itemName:  { font: 'font_a', em: true },             // 48 col
  itemPrice: { font: 'font_a' },                       // 48 col, non gras
  total:     { font: 'font_a', height: 2, em: true },  // width=1 → 48 col
  thanks:    { font: 'font_a', em: true, align: 'center' },
  footer:    { font: 'font_b', align: 'center' },
};

// Largeur de référence des séparateurs et des lignes d'articles.
const RULE_COLS = colsFor(S.rule);

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
  // Ligatures. normalize('NFD') ne les decompose PAS (ce ne sont pas des
  // caracteres accentues), donc sans cette ligne « Boeuf » sort en caractere
  // parasite sur le ticket. Ajoute pour la garniture « Bœuf » du composeur ;
  // corrige au passage le plat « Wok de Bœuf », qui avait le meme defaut.
  [/Œ/g, 'OE'], [/œ/g, 'oe'],
  [/Æ/g, 'AE'], [/æ/g, 'ae'],
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

// "Gauche          Droite" : alignement par espaces, sans pointillés. La
// longueur rendue vaut exactement `cols` ; si ça ne tient pas, la gauche est
// tronquée car le montant prime.
function padLine(left, right, cols) {
  const l = String(left ?? '');
  const r = String(right ?? '');
  const gap = cols - l.length - r.length;
  if (gap >= 1) return l + ' '.repeat(gap) + r;
  const maxLeft = Math.max(0, cols - r.length - 1);
  return `${l.slice(0, maxLeft).padEnd(maxLeft)} ${r}`.slice(0, cols);
}

// Séparateurs en ASCII pur : les filets Unicode (─ ═) ne sont pas garantis
// dans le codepage de l'imprimante et sortiraient en caractères parasites.
const separator = (ch, cols) => ch.repeat(cols);

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
  return wrapText(value, avail).map((line_, i) =>
    (i === 0 ? label.padEnd(LABEL_W) : ' '.repeat(LABEL_W)) + line_,
  );
}

// ─── Émission des <text> ───────────────────────────────────────────────
// Seul endroit du fichier qui produit une balise <text>. Fusionne le style
// demandé avec DEFAULT_STYLE et émet TOUS les attributs, toujours.
function textTag(content, style, terminate) {
  const s = { ...DEFAULT_STYLE, ...style };
  const attrs = [
    `font="${s.font}"`,
    `smooth="${s.smooth ? 'true' : 'false'}"`,
    `width="${clampScale(s.width)}"`,
    `height="${clampScale(s.height)}"`,
    `reverse="${s.reverse ? 'true' : 'false'}"`,
    `ul="${s.ul ? 'true' : 'false'}"`,
    `em="${s.em ? 'true' : 'false'}"`,
    `align="${s.align}"`,
  ].join(' ');
  return `<text ${attrs}>${xmlEscape(content)}${terminate ? '&#10;' : ''}</text>`;
}

// Ligne complète (termine la ligne physique).
const line = (content, style = {}) => textTag(content, style, true);
// Segment : continue la ligne physique en cours, pour changer de style en
// cours de ligne (nom d'article gras + montant non gras).
const seg = (content, style = {}) => textTag(content, style, false);

const linesOf = (arr, style) => arr.map((l) => line(l, style)).join('');
const blankLine = () => '<feed line="1"/>';

// 1. EN-TÊTE
function buildHeader() {
  return [
    line('KAIKAI', S.brand),
    line('BD DE LA TOUR 1 - 1205 GENEVE', S.brandAddr),
    blankLine(),
  ].join('');
}

// 2. BLOC COMMANDE
function buildOrderBlock(order) {
  const when = `${fmtTime(order.created_at)}  -  ${toAscii(fmtDate(order.created_at))}`;
  return [
    line(`#${orderNumber(order.id)}`, S.orderNo),
    line(when, S.orderWhen),
    blankLine(),
  ].join('');
}

// 3. MODE
function buildModeBlock(order) {
  const isPickup = order.delivery_mode === 'pickup';
  const out = [line(isPickup ? 'A EMPORTER' : 'LIVRAISON', S.mode)];
  if (!isPickup && order.customer_address) {
    out.push(linesOf(wrapText(toAscii(order.customer_address), colsFor(S.address)), S.address));
  }
  out.push(blankLine());
  return out.join('');
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

  return linesOf(rows, S.body);
}

// 5. ARTICLES — nom gras à gauche, montant non gras à droite, aligné par
// espaces. Les deux moitiés sont deux <text> sur la MÊME ligne physique :
// seul le premier segment est en em, le second ferme la ligne.
function buildItemBlock(item) {
  const safeIt = item || {};
  const qty = safeIt.qty ?? 1;
  const subtotal = safeIt.subtotal ?? (Number(safeIt.price) || 0) * qty;

  const price = toAscii(fmtAmount(subtotal));
  const name = `${qty}x ${toAscii(safeIt.name)}`;
  const maxName = Math.max(0, RULE_COLS - price.length - 1);
  const shown = name.length > maxName ? name.slice(0, maxName) : name;
  const gap = RULE_COLS - shown.length - price.length;

  const out = [
    seg(shown, S.itemName),
    line(' '.repeat(Math.max(1, gap)) + price, S.itemPrice),
  ];

  const subCols = colsFor(S.body) - 5; // 3 d'indentation + "> "
  renderVariantLines(safeIt.variants).forEach((v) => {
    wrapText(toAscii(v), subCols).forEach((l, i) => {
      out.push(line(`   ${i === 0 ? '> ' : '  '}${l}`, S.body));
    });
  });

  return out.join('');
}

function buildItemsBlock(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  return [
    line(separator('-', RULE_COLS), S.rule),
    items.map(buildItemBlock).join(blankLine()),
    line(separator('-', RULE_COLS), S.rule),
  ].join('');
}

// 6. TOTAL — height=2 mais width=1 : la ligne garde donc 48 colonnes.
function buildTotalBlock(order) {
  return line(padLine('TOTAL', toAscii(fmt(order.total ?? 0)), colsFor(S.total)), S.total);
}

// 7. PIED
function buildFooter() {
  return [
    blankLine(),
    line(toAsciiMixed('Mauruuru !'), S.thanks),
    line(toAsciiMixed('A bientot chez KaiKai'), S.footer),
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
