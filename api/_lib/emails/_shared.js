// api/_lib/emails/_shared.js — Helpers communs aux templates email.

// Palette ENDO&CO — repris du brief design.
export const COLORS = {
  bg: '#0A2618',         // Forêt Profonde
  bgPanel: '#0F3221',    // Forêt légèrement plus claire pour panneaux
  text: '#F5F0E8',       // Sable Blanc
  textMuted: '#A8B5AE',  // Sable désaturé
  accent: '#D4FF6B',     // Citron Tahiti
  border: '#1A4030',     // Bordure discrète
  borderStrong: '#2A5A40',
};

export const RESTAURANT = {
  name: 'KaïKaï',
  address: '1 Boulevard de la Tour, 1205 Genève',
  phoneDisplay: '+41 76 519 76 70',
  site: 'kaikaifood.com',
};

// Échappe le HTML pour éviter toute injection depuis customer_name, address, notes…
export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fmtCHF(n) {
  const num = Number(n);
  if (!isFinite(num)) return '';
  return num.toLocaleString('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  });
}

export function orderShortId(id) {
  return id ? String(id).slice(0, 8).toUpperCase() : '????????';
}

// Rend les sous-lignes d'un item.variants (formules + variants simples).
// Version simplifiée — duplique la logique de src/lib/admin/orderHelpers.js
// renderVariantLines, sans dépendance cross-projet (api/ ne doit pas importer src/).
export function renderVariantLines(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return [];
  const lines = [];
  for (const v of variants) {
    try {
      if (typeof v === 'string') {
        lines.push(v);
        continue;
      }
      if (v?.type === 'decouverte') {
        if (v.plat) {
          const p = v.proteins?.[v.plat];
          lines.push(`Plat : ${v.plat}${p ? ` (${p})` : ''}`);
        }
        if (v.boisson === 'Soft') lines.push('Boisson : Soft');
        else if (v.boisson === 'Jus exotique' && v.jus) lines.push(`Boisson : Jus ${v.jus}`);
        else if (v.boisson === 'Eau' && v.eau) lines.push(`Boisson : ${v.eau}`);
        if (v.dessert) {
          lines.push(`Dessert : ${v.dessert}${v.coulisDessert ? ` (${v.coulisDessert})` : ''}`);
        }
        continue;
      }
      if (v?.type === 'voyage') {
        const plats = Array.isArray(v.plats) ? v.plats : [];
        plats.forEach((plat, idx) => {
          const p = Array.isArray(v.proteins) ? v.proteins[idx] : v.proteins?.[plat];
          lines.push(`Plat ${idx + 1} : ${plat}${p ? ` (${p})` : ''}`);
        });
        const boissons = Array.isArray(v.boissons) ? v.boissons : [];
        const jusList = Array.isArray(v.jus) ? v.jus : [];
        const eauList = Array.isArray(v.eau) ? v.eau : [];
        let ji = 0, ei = 0;
        for (const b of boissons) {
          if (b === 'Soft') lines.push('Boisson : Soft');
          else if (b === 'Jus exotique') { const n = jusList[ji++]; if (n) lines.push(`Boisson : Jus ${n}`); }
          else if (b === 'Eau') { const n = eauList[ei++]; if (n) lines.push(`Boisson : ${n}`); }
        }
        if (v.dessert) {
          lines.push(`Dessert : ${v.dessert}${v.coulisDessert ? ` (${v.coulisDessert})` : ''}`);
        }
        continue;
      }
      if (v?.name) lines.push(v.name);
    } catch (err) {
      console.warn('[KaïKaï mail] variant invalide', v, err);
    }
  }
  return lines;
}

// Enveloppe HTML mobile-friendly. Le body est passé en string déjà escapé.
export function htmlShell({ subject, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};color:${COLORS.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.bg};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:${COLORS.bgPanel};border:1px solid ${COLORS.border};border-radius:12px;">
        <tr>
          <td style="padding:32px 28px 24px 28px;border-bottom:1px solid ${COLORS.border};">
            <div style="font-family:'Bebas Neue',Impact,'Arial Black',sans-serif;font-size:32px;letter-spacing:0.15em;color:${COLORS.accent};line-height:1;">KAÏKAÏ</div>
            <div style="margin-top:6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.textMuted};">By ENDO&amp;CO</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;font-size:15px;line-height:1.55;color:${COLORS.text};">
${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;border-top:1px solid ${COLORS.border};font-size:12px;color:${COLORS.textMuted};text-align:center;">
            Une question ? ${esc(RESTAURANT.phoneDisplay)} &middot; ${esc(RESTAURANT.site)}
          </td>
        </tr>
      </table>
      <div style="margin-top:12px;font-size:11px;color:${COLORS.textMuted};">
        ${esc(RESTAURANT.address)}
      </div>
    </td>
  </tr>
</table>
</body>
</html>`;
}
