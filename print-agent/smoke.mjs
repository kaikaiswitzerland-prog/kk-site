// ─── Smoke test print-agent ───────────────────────────────────────────
// Lancement : `node print-agent/smoke.mjs`
//
// Aucune dépendance imprimante, aucune dépendance Supabase. On stubbe :
//  - globalThis.fetch     → intercepte le POST ePOS-Print
//  - un faux client Supabase (select/in/is/not/gte/order/update/eq)
//
// Couvre les règles courantes :
//  · statut initial non payé ('pending') / négatif ('refused') → PAS imprimée
//  · statut confirmé ('accepted', etc.)                        → imprimée
//    UNE seule fois (anti-doublon printedIds sur 2 tours)
//  · reprint_at non null → imprimée + reprint_at remis à null +
//    pas de réimpression au tour suivant

/* global process */

import { runTick } from './agent.mjs';

const PRINTER_URL = 'http://192.168.1.103/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000';

// ─── Mock fetch (réponse Epson "success") ─────────────────────────────
const fetchCalls = [];
globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, body: opts?.body });
  const okXml = '<?xml version="1.0" encoding="utf-8"?>' +
    '<response xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print" ' +
    'success="true" code="" status="252"/>';
  return { ok: true, status: 200, statusText: 'OK', text: async () => okXml };
};

// ─── Mock Supabase ────────────────────────────────────────────────────
// Builder thenable qui accepte select/in/is/not/gte/eq/order ; update mute
// les rows en place et trace les appels (updateCalls).
const updateCalls = [];
function makeFakeSupabase(rows) {
  return {
    from(/* table */) {
      const filters = [];
      let mode = 'select';
      let patch = null;

      const exec = () => {
        if (mode === 'select') {
          const data = rows.filter((r) => filters.every((fn) => fn(r)));
          return { data, error: null };
        }
        if (mode === 'update') {
          const matched = rows.filter((r) => filters.every((fn) => fn(r)));
          updateCalls.push({ patch: { ...patch }, matchedIds: matched.map((r) => r.id) });
          matched.forEach((r) => Object.assign(r, patch));
          return { data: null, error: null };
        }
        return { data: null, error: null };
      };

      const builder = {
        select() { mode = 'select'; return builder; },
        update(p) { mode = 'update'; patch = p; return builder; },
        gte(c, v) { filters.push((r) => r[c] >= v); return builder; },
        gt(c, v)  { filters.push((r) => r[c] > v);  return builder; },
        in(c, vs) { filters.push((r) => vs.includes(r[c])); return builder; },
        is(c, v)  { filters.push((r) => r[c] === v); return builder; },
        not(c, op, v) {
          if (op === 'is') filters.push((r) => r[c] !== v);
          return builder;
        },
        eq(c, v)  { filters.push((r) => r[c] === v); return builder; },
        order() { return builder; },
        then(resolve) { resolve(exec()); },
      };
      return builder;
    },
  };
}

function makeOrder(over = {}) {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    created_at: new Date().toISOString(), // dans la fenêtre par défaut
    customer_name: 'Marie Test',
    customer_phone: '+41 79 000 00 00',
    customer_address: 'Bd de la Tour 1, 1205 Geneve',
    delivery_mode: 'pickup',
    payment_method: 'card',
    status: 'paid',
    reprint_at: null,
    items: [{ id: '5', name: 'Chao Men', qty: 2, price: 18, subtotal: 36 }],
    total: 36,
    ...over,
  };
}

// ─── Helpers asserts ──────────────────────────────────────────────────
let failures = 0;
function check(label, cond, extra) {
  if (cond) {
    console.log(`✓ ${label}`);
  } else {
    console.error(`✗ ${label}${extra ? ' — ' + extra : ''}`);
    failures += 1;
  }
}

async function runScenario(name, rows, options = {}) {
  console.log(`\n── Scénario : ${name} ──`);
  const state = { printedIds: new Set() };
  const supabase = makeFakeSupabase(rows);
  const fetchBefore = fetchCalls.length;
  const updateBefore = updateCalls.length;

  const r1 = await runTick({
    supabase, state, printerUrl: PRINTER_URL, logger: console, ...options,
  });
  const r2 = await runTick({
    supabase, state, printerUrl: PRINTER_URL, logger: console, ...options,
  });

  return {
    state,
    r1,
    r2,
    fetchOnRow: fetchCalls.slice(fetchBefore),
    updatesOnRow: updateCalls.slice(updateBefore),
    rows,
  };
}

// ─── Scénario 1 : statut initial non payé (pending) ──────────────────
{
  const res = await runScenario('pending → JAMAIS imprimée', [
    makeOrder({ id: 'p1111111-aaaa-bbbb-cccc-dddddddddddd', status: 'pending' }),
  ]);
  check('pending : 0 fetch', res.fetchOnRow.length === 0,
    `fetch = ${res.fetchOnRow.length}`);
  check('pending : printed=0 sur les 2 tours',
    res.r1.printed === 0 && res.r2.printed === 0);
}

// ─── Scénario 2 : statut accepted → 1 seule impression ────────────────
{
  const res = await runScenario('accepted → imprimée UNE seule fois sur 2 tours', [
    makeOrder({ id: 'a2222222-aaaa-bbbb-cccc-dddddddddddd', status: 'accepted' }),
  ]);
  check('accepted : 1 fetch après 2 tours',
    res.fetchOnRow.length === 1, `fetch = ${res.fetchOnRow.length}`);
  check('accepted : fetch reçoit PRINTER_URL http',
    res.fetchOnRow[0]?.url === PRINTER_URL);
  check('accepted : tour 1 imprime 1, tour 2 imprime 0',
    res.r1.printed === 1 && res.r2.printed === 0);
  check('accepted : printedIds contient l\'id',
    res.state.printedIds.has('a2222222-aaaa-bbbb-cccc-dddddddddddd'));
}

// ─── Scénario 3 : statut négatif (refused) → JAMAIS imprimée ─────────
{
  const res = await runScenario('refused → JAMAIS imprimée', [
    makeOrder({ id: 'r3333333-aaaa-bbbb-cccc-dddddddddddd', status: 'refused' }),
  ]);
  check('refused : 0 fetch', res.fetchOnRow.length === 0);
  check('refused : printed=0', res.r1.printed === 0 && res.r2.printed === 0);
}

// ─── Scénario 4 : reprint_at non null → impression + clear flag ───────
{
  const id = '44444444-aaaa-bbbb-cccc-dddddddddddd';
  const res = await runScenario(
    'reprint_at non null → imprimée + reprint_at remis à null',
    [
      // statut 'delivered' : déjà passé, l'utilisateur veut une copie
      makeOrder({
        id,
        status: 'delivered',
        reprint_at: new Date().toISOString(),
      }),
    ],
  );

  check('reprint : 1 fetch après 2 tours',
    res.fetchOnRow.length === 1, `fetch = ${res.fetchOnRow.length}`);
  check('reprint : update {reprint_at: null} appelé sur cet id',
    res.updatesOnRow.some(
      (u) => u.patch.reprint_at === null && u.matchedIds.includes(id),
    ));
  check('reprint : la row a reprint_at = null après le tour',
    res.rows[0].reprint_at === null,
    `reprint_at = ${res.rows[0].reprint_at}`);
  check('reprint : pas de double impression (tour 2 = 0)',
    res.r2.printed === 0);
}

// ─── Scénario 5 : pending_payment + paid (initiaux) → JAMAIS ─────────
{
  const res = await runScenario('pending_payment et paid → JAMAIS imprimés en auto', [
    makeOrder({ id: 'pp555555-aaaa-bbbb-cccc-dddddddddddd', status: 'pending_payment' }),
    makeOrder({ id: 'pd666666-aaaa-bbbb-cccc-dddddddddddd', status: 'paid' }),
  ]);
  check('pending_payment + paid : 0 fetch', res.fetchOnRow.length === 0);
}

// ══════════════════════════════════════════════════════════════════════
// RENDU DU TICKET — génération du XML SANS imprimer
// ══════════════════════════════════════════════════════════════════════
// Deux commandes de test passées à buildEposXml(), puis :
//   · audit automatique (débordement de colonnes, caractères hors ASCII,
//     échelles hors bornes 1..8, balises non fermées)
//   · aperçu texte pour juger la hiérarchie visuelle à l'œil

const { buildEposXml } = await import('../src/lib/eposPrint.js');

const COLS = { font_a: 48, font_b: 64, font_c: 72 };

// Attributs de style que CHAQUE <text> doit déclarer explicitement. Les
// attributs ePOS-Print sont des états persistants : un attribut omis ne vaut
// pas "valeur par défaut", il vaut "ce que la balise précédente a laissé".
// Un ticket qui en oublie un se contamine tout seul — c'est le bug que ce
// contrôle empêche de revenir.
const REQUIRED_ATTRS = ['font', 'smooth', 'width', 'height', 'reverse', 'ul', 'em', 'align'];

// Reconstitue les LIGNES PHYSIQUES : une balise dont le contenu ne se termine
// pas par &#10; continue la ligne en cours (nom d'article gras + montant non
// gras sont deux <text> sur une seule ligne imprimée).
function auditTicket(xml) {
  const lines = [];
  const violations = [];
  const re = /<text ([^>]*)>([\s\S]*?)<\/text>/g;
  let current = null;
  let m;

  const flush = () => {
    if (!current) return;
    // La largeur retenue est la plus contraignante des segments de la ligne.
    if (current.text.length > current.cols) {
      violations.push(
        `debordement (${current.text.length}>${current.cols} col, ${current.font} x${current.width}) : "${current.text}"`,
      );
    }
    lines.push(current);
    current = null;
  };

  while ((m = re.exec(xml)) !== null) {
    const raw = m[2];
    const attrs = Object.fromEntries(
      [...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]),
    );

    const missing = REQUIRED_ATTRS.filter((a) => !(a in attrs));
    if (missing.length) {
      violations.push(`attribut(s) de style non declare(s) [${missing.join(',')}] : "${raw.slice(0, 40)}"`);
    }
    if (attrs.reverse === 'true') {
      violations.push(`reverse="true" residuel (design sobre attendu) : "${raw.slice(0, 40)}"`);
    }

    const text = raw
      .replace(/&#10;$/, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    const font = attrs.font || 'font_b';
    const width = Number(attrs.width || 1);
    const height = Number(attrs.height || 1);
    const cols = Math.floor((COLS[font] || 64) / width);

    if (width < 1 || width > 8 || height < 1 || height > 8) {
      violations.push(`echelle hors bornes 1..8 : width=${width} height=${height}`);
    }
    if (/[^\x20-\x7E]/.test(text)) {
      violations.push(`caractere non-ASCII non replie : "${text}"`);
    }

    if (!current) {
      current = { text, font, width, height, cols, align: attrs.align, em: attrs.em === 'true' };
    } else {
      current.text += text;
      current.cols = Math.min(current.cols, cols);
    }
    if (raw.endsWith('&#10;')) flush();
  }
  flush();
  return { lines, violations };
}

function preview(xml) {
  return auditTicket(xml).lines.map((l) => {
    const scale = `${l.width > 1 ? `w${l.width}` : '  '}${l.height > 1 ? `h${l.height}` : '  '}`;
    const tag = `${l.font === 'font_a' ? 'A' : 'B'}${scale}${l.align === 'center' ? ' C' : '  '}${l.em ? ' B' : '  '}`;
    return `  ${tag} │ ${l.text}`;
  }).join('\n');
}

function checkTicket(label, order) {
  console.log(`\n── Ticket : ${label} ──`);
  const xml = buildEposXml(order);
  const { violations } = auditTicket(xml);

  check(`${label} : XML bien forme (balises text equilibrees)`,
    (xml.match(/<text /g) || []).length === (xml.match(/<\/text>/g) || []).length);
  check(`${label} : enveloppe SOAP + namespace epos-print`,
    xml.startsWith('<?xml version="1.0" encoding="utf-8"?>') &&
    xml.includes('http://www.epson-pos.com/schemas/2011/03/epos-print') &&
    xml.endsWith('</s:Envelope>'));
  check(`${label} : aucun reverse (design sobre)`,
    !xml.includes('reverse="true"'));
  check(`${label} : chaque <text> declare les ${REQUIRED_ATTRS.length} attributs de style`,
    (xml.match(/<text /g) || []).length ===
      (xml.match(/<text [^>]*font="[^"]*"[^>]*smooth="[^"]*"[^>]*width="[^"]*"[^>]*height="[^"]*"[^>]*reverse="[^"]*"[^>]*ul="[^"]*"[^>]*em="[^"]*"[^>]*align="[^"]*"/g) || []).length);
  check(`${label} : se termine par feed + cut`,
    xml.includes('<feed line="3"/><cut type="feed"/>'));
  check(`${label} : aucun debordement / non-ASCII / echelle invalide`,
    violations.length === 0, violations.join(' | '));

  console.log(preview(xml));
  return xml;
}

// Commande 1 — à emporter, 2 articles dont un avec choix de protéine.
checkTicket('a emporter', makeOrder({
  id: '7f3a9c21-1111-2222-3333-444444444444',
  delivery_mode: 'pickup',
  payment_method: 'card',
  status: 'paid',
  customer_name: 'Élodie Küng',
  customer_phone: '+41 79 123 45 67',
  note_kitchen: 'Sans coriandre s’il vous plaît',
  items: [
    {
      id: '5', name: 'Chao Men', qty: 2, price: 18.9, subtotal: 37.8,
      variants: [
        { id: 'porc', name: 'Porc', desc: 'Viande de porc mijotée façon KaïKaï' },
        { id: 'veggie', name: 'Veggie', desc: '100% végétarien' },
      ],
    },
    { id: '15', name: 'Coulant au chocolat', qty: 1, price: 9.9, subtotal: 9.9, variants: [] },
  ],
  total: 47.7,
}));

// Commande 2 — livraison avec formule Voyage (sous-lignes longues), adresse
// longue, notes cuisine ET livreur, paiement cash non encaissé.
checkTicket('livraison + formule', makeOrder({
  id: 'b2c4e6a8-5555-6666-7777-888888888888',
  delivery_mode: 'delivery',
  payment_method: 'cash',
  status: 'accepted',
  customer_name: 'Jean-Christophe de la Tour-Bergerac',
  customer_phone: '+41 78 987 65 43',
  customer_address: 'Avenue de Champel 123bis, appartement 4B, 3e étage, 1206 Genève',
  note_kitchen: 'Allergie arachides — attention au guacamole',
  note_delivery: 'Sonner chez « Bergerac », code portail 4512A',
  items: [
    {
      id: '14', name: 'Formule Voyage', qty: 1, price: 49.9, subtotal: 49.9,
      variants: [{
        type: 'voyage',
        plats: ['Chao Men', 'Kai Fan'],
        proteins: ['Porc + Poulet', 'Veggie'],
        boissons: ['Jus exotique', 'Eau'],
        jus: ['Ananas / Citron / Gingembre'],
        eau: ['Eau Gazeuse'],
        dessert: 'Crème Tropicale',
        coulisDessert: 'Coulis Fruits Rouges',
      }],
    },
    {
      id: '4', name: 'Tartare de thon rouge', qty: 3, price: 12.9, subtotal: 38.7,
      variants: [
        { id: 'tahiti', name: 'Tartare Tahiti', desc: 'Sauce coco' },
        { id: 'hawaii', name: 'Tartare Hawaï', desc: 'Sauce sésame, mangue et ananas' },
        { id: 'samoa', name: 'Tartare Samoa', desc: 'Sauce piment maison' },
      ],
    },
  ],
  total: 93.5,
}));

// Composeur de woks — la cuisine doit lire la garniture ET les legumes, y
// compris quand les 3 sont choisis (ligne la plus longue que le composeur
// puisse produire).
const wok = checkTicket('composeur wok + legumes', makeOrder({
  id: 'd4e6f8a0-3333-4444-5555-666666666666',
  delivery_mode: 'delivery',
  customer_address: 'Rue de Carouge 42, 1205 Genève',
  payment_method: 'twint',
  status: 'paid',
  customer_name: 'Composeur Test',
  items: [
    {
      id: '24', name: 'Riz blanc jasmin', qty: 1, price: 18.9, subtotal: 29.9,
      variants: [{
        id: 'boeuf', name: 'Bœuf', desc: 'Bœuf sauté au wok, sauce sésame',
        legumes: [
          { id: 'choux', name: 'Choux-carottes fondants' },
          { id: 'patate', name: 'Patate-patate douce au wok' },
          { id: 'poivrons', name: 'Poivrons sautés' },
        ],
      }],
    },
    {
      id: '21', name: 'Nouilles sautées', qty: 1, price: 18.9, subtotal: 17.9,
      variants: [{
        id: 'veggie', name: 'Veggie (omelette)', desc: '100% végétarien',
        legumes: [{ id: 'choux', name: 'Choux-carottes fondants' }],
      }],
    },
  ],
  total: 47.8,
}));
const wokPlain = wok.replace(/<[^>]*>/g, '');
check('wok : la garniture Boeuf est imprimee', wokPlain.includes('BOEUF'));
check('wok : la garniture Veggie est imprimee', wokPlain.includes('VEGGIE'));
check('wok : la ligature OE est repliee en ASCII (aucun caractere parasite)',
  !wok.includes('Œ') && !wok.includes('œ'));
// La ligne legumes depasse les 48 colonnes du ticket et est donc repliee par
// wrapText : on decode les sauts de ligne XML (&#10;) puis on normalise les
// espaces avant de comparer, sinon on testerait la largeur du papier plutot
// que le contenu.
const wokFlat = wokPlain.replace(/&#10;/g, ' ').replace(/\s+/g, ' ');
check('wok : les 3 legumes sont listes sur une ligne dediee et prefixee',
  wokFlat.includes('LEGUMES : CHOUX-CAROTTES FONDANTS, PATATE-PATATE DOUCE AU WOK, POIVRONS SAUTES'));
check('wok : la ligne legumes du 2e wok ne liste que le choux',
  (wokPlain.match(/LEGUMES :/g) || []).length === 2);
check('wok : total du composeur correct (29.90 + 17.90)',
  wokPlain.includes('47.80 CHF'));

// Recalcul serveur : le miroir client/serveur est ce qui empeche le tampering.
const { getServerUnitPrice } = await import('../api/_lib/menuPrices.js');
const su = (id, g, legs) => getServerUnitPrice(id, { id: g, legumes: (legs || []).map(l => ({ id: l })) });

// C'est la GARNITURE qui fait le prix, sur les 4 bases indifferemment.
for (const base of ['21', '22', '23', '24']) {
  check(`serveur : base ${base} + veggie = 17.90`, su(base, 'veggie') === 17.90);
  check(`serveur : base ${base} + poulet = 18.90`, su(base, 'poulet') === 18.90);
  check(`serveur : base ${base} + porc = 18.90`, su(base, 'porc') === 18.90);
  check(`serveur : base ${base} + mix = 18.90`, su(base, 'porc-poulet') === 18.90);
  check(`serveur : base ${base} + boeuf = 26.90`, su(base, 'boeuf') === 26.90);
}
check('serveur : 1 legume est offert', su('21', 'poulet', ['choux']) === 18.90);
check('serveur : le 2e legume est facture 1.50', su('21', 'poulet', ['choux', 'patate']) === 20.40);
check('serveur : veggie + 3 legumes = 20.90', su('21', 'veggie', ['choux', 'patate', 'poivrons']) === 20.90);
check('serveur : boeuf + 3 legumes = 29.90', su('24', 'boeuf', ['choux', 'patate', 'poivrons']) === 29.90);

// Anti-tampering.
check('serveur : garniture inconnue -> prix de repli de la base',
  su('21', 'jambon') === 18.90);
check('serveur : sans garniture -> prix de repli de la base',
  getServerUnitPrice('21', undefined) === 18.90);
check('serveur : un legume inconnu est ignore', su('21', 'poulet', ['fake']) === 18.90);
check('serveur : un legume inconnu ne consomme pas le legume offert',
  su('21', 'poulet', ['fake', 'choux', 'patate']) === 20.40);
check('serveur : les doublons sont ecartes', su('21', 'poulet', ['choux', 'choux']) === 18.90);
check('serveur : un legume n abaisse jamais le total',
  su('21', 'veggie', ['choux']) >= su('21', 'veggie'));

// La carte existante ne bouge pas d un centime.
check('serveur : Chao Men reste a 18.90', getServerUnitPrice('5', { id: 'poulet' }) === 18.90);
check('serveur : Omelette Fu Young reste a 17.90', getServerUnitPrice('7', { id: 'veggie' }) === 17.90);
check('serveur : Wok de Boeuf reste a 26.90', getServerUnitPrice('8', undefined) === 26.90);
check('serveur : aucun autre plat ne change de prix',
  getServerUnitPrice('9') === 22.90 && getServerUnitPrice('13') === 19.90 && getServerUnitPrice('20') === 3.00);

// ─── Bilan ────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────');
if (failures === 0) {
  console.log(`✓ Tous les scénarios passent (${fetchCalls.length} fetch impression intercepté(s) au total).`);
  process.exit(0);
} else {
  console.error(`✗ ${failures} assertion(s) en échec.`);
  process.exit(1);
}
