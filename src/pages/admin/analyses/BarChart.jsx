import { useId, useMemo, useState } from 'react';
import { fmt } from '../../../lib/admin/orderHelpers.js';

// ─── Bar chart CA par tranche horaire ───────────────────────
// Barres en SVG plutôt qu'en <div> : le viewBox met tout le graphe à l'échelle
// d'un seul coup, donc les barres gardent leurs proportions et leur rayon de
// coin quelle que soit la largeur de la colonne — deux colonnes côte à côte sur
// desktop, pleine largeur empilée sur mobile.
const VB_W = 320;
const VB_H = 150;
const BAR_RADIUS = 5;

export default function BarChart({ title, subtitle, data, formatValue = fmt }) {
  const uid = useId().replace(/:/g, '');
  const [active, setActive] = useState(null);

  const max = useMemo(() => Math.max(...data.map((d) => d.value), 0), [data]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const peak = useMemo(
    () => (max > 0 ? data.find((d) => d.value === max) : null),
    [data, max],
  );

  // Comme pour les donuts, un mois vide garde son graphe : l'axe, les tranches
  // horaires et leurs libellés restent en place, toutes les barres à zéro. Seul
  // un tableau de données vide (jamais produit par aggregateByHourSlot, mais on
  // ne divise pas par sa longueur sans le vérifier) justifie de sortir.
  const empty = total <= 0;
  if (data.length === 0) {
    return (
      <section className="rounded-xl border border-line bg-bg-elev p-5">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{title}</h3>
        <p className="py-10 text-center font-mono text-[11px] text-ink-3">Aucune commande</p>
      </section>
    );
  }

  const slot = VB_W / data.length;
  const barW = Math.min(slot * 0.62, 34);

  return (
    <section className="rounded-xl border border-line bg-bg-elev p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{title}</h3>
        {peak && (
          <span className="shrink-0 font-mono text-[10px] text-ink-3">
            pic <span className="text-accent">{peak.label}</span>
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-[11px] leading-tight text-ink-3">{subtitle}</p>}

      {/* Valeur de la barre visée, ou du pic par défaut — une ligne réservée en
          permanence pour que le graphe ne saute pas au survol. */}
      <div className="mt-3 flex h-[30px] items-baseline gap-2">
        <span className="font-display text-[22px] italic leading-none tracking-[-0.03em] text-ink">
          {formatValue(active !== null ? data[active].value : peak?.value ?? 0)}
        </span>
        <span className="font-mono text-[10px] text-ink-3">
          {active !== null ? slotCaption(data[active]) : empty ? 'Aucune commande' : 'au pic'}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H + 22}`}
        className="mt-2 w-full"
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4ff6b" />
            <stop offset="100%" stopColor="#5be39b" />
          </linearGradient>
          <linearGradient id={`${uid}-bar-off`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,240,232,0.34)" />
            <stop offset="100%" stopColor="rgba(245,240,232,0.14)" />
          </linearGradient>
        </defs>

        <line
          x1="0" y1={VB_H} x2={VB_W} y2={VB_H}
          stroke="rgba(245,240,232,0.10)" strokeWidth="1"
        />

        {data.map((d, i) => {
          const x = i * slot + (slot - barW) / 2;
          // Plancher de 3 px : une tranche à 12 CHF sur un mois à 400 doit
          // rester visible, sinon le graphe laisse croire qu'elle est à zéro.
          const h = max > 0 ? Math.max((d.value / max) * (VB_H - 10), d.value > 0 ? 3 : 0) : 0;
          const dimmed = active !== null && active !== i;
          return (
            <g key={d.key}>
              {/* Zone de survol pleine hauteur : viser une barre basse au doigt
                  est sinon impossible. */}
              <rect
                x={i * slot} y="0" width={slot} height={VB_H}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
              {h > 0 && (
                <rect
                  x={x} y={VB_H - h} width={barW} height={h}
                  rx={Math.min(BAR_RADIUS, h / 2)}
                  fill={`url(#${uid}-bar${d.service === 'hors' ? '-off' : ''})`}
                  className="kk-bar"
                  style={{ opacity: dimmed ? 0.3 : 1 }}
                  pointerEvents="none"
                />
              )}
              <text
                x={i * slot + slot / 2} y={VB_H + 15}
                textAnchor="middle"
                className="kk-bar-label"
                fill={active === i ? 'var(--color-accent)' : 'var(--color-ink-3)'}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Libellés de service : chaque groupe prend une largeur proportionnelle
          à son nombre de barres, donc il tombe sous les siennes. Le midi ne
          fait que 3 tranches sur 8 — un simple justify-between mentirait. */}
      <div className="mt-2 flex font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">
        {serviceGroups(data).map((g) => (
          <span key={g.service} className="text-center" style={{ flex: g.count }}>
            {SERVICE_LABELS[g.service] || g.service}
          </span>
        ))}
      </div>
    </section>
  );
}

const SERVICE_LABELS = {
  midi: 'Service midi',
  soir: 'Service soir',
  hors: 'Hors service',
};

// Une barre étiquetée « 19h » couvre 19h00→20h00 ; on le dit plutôt que de
// laisser deviner si le total est celui de l'heure qui commence ou qui finit.
// La tranche « Autre » n'est bornée par rien : elle se nomme, elle ne s'encadre pas.
function slotCaption(slot) {
  if (slot.service === 'hors') return 'hors des deux services';
  const h = Number(slot.key);
  return Number.isFinite(h) ? `entre ${h}h et ${h + 1}h` : slot.label;
}

// Regroupe les tranches consécutives d'un même service, en conservant l'ordre.
function serviceGroups(data) {
  return data.reduce((groups, d) => {
    const last = groups[groups.length - 1];
    if (last && last.service === d.service) last.count += 1;
    else groups.push({ service: d.service, count: 1 });
    return groups;
  }, []);
}
