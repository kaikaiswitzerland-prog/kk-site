import { useId, useMemo, useState } from 'react';
import { fmt } from '../../../lib/admin/orderHelpers.js';
import { colorAt } from './palette.js';

// ─── Donut « Harvey ball » ──────────────────────────────────
// Anneau SVG à trou large, valeur clé au centre, légende dessous.
// Aucune dépendance : un <circle> + stroke-dasharray suffit, et c'est ce qui
// rend les dégradés par segment et le libellé central triviaux à contrôler.
//
// Géométrie : rayon 58, trait 22 → anneau de 47 à 69 sur un viewBox de 160.
// Le trou fait 68 % du diamètre extérieur, assez pour loger deux lignes de
// texte sans que le chiffre touche l'anneau.
const R = 58;
const STROKE = 22;
const CIRC = 2 * Math.PI * R;
// Respiration entre deux segments, en unités de circonférence.
const GAP = 5;

export default function DonutChart({ title, subtitle, data, formatValue = fmt, centerCaption }) {
  const uid = useId().replace(/:/g, '');
  const [active, setActive] = useState(null);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  // Position de chaque arc, calculée une fois. `offset` est l'abscisse
  // curviligne du début du segment ; `dash` la longueur à dessiner.
  //
  // Avec stroke-linecap="round", le trait déborde de STROKE/2 à CHAQUE bout :
  // on retire donc STROKE à la longueur et on décale le départ d'autant, et le
  // segment retombe exactement sur sa part.
  //
  // Ça devient impossible en dessous de STROKE + GAP : la longueur à dessiner
  // passerait sous zéro et le segment déborderait sur ses voisins — le dernier
  // allant jusqu'à repeindre le début du premier, puisqu'il est tracé après
  // lui. Une catégorie à 3 % mangeait ainsi le haut de l'anneau. Ces petits
  // segments passent donc en cap droit : un carré au lieu d'une pastille,
  // mais chacun reste chez lui et l'anneau ne ment plus sur les proportions.
  const arcs = useMemo(() => {
    if (total <= 0) return [];
    let cursor = 0;
    return data.map((d, i) => {
      const arcLen = (d.value / total) * CIRC;
      const start = cursor;
      cursor += arcLen;
      const rounded = arcLen >= STROKE + GAP;
      return {
        ...d,
        color: colorAt(i, d.key),
        percent: (d.value / total) * 100,
        rounded,
        dash: rounded ? arcLen - GAP - STROKE : Math.max(arcLen - GAP, 0.5),
        offset: rounded ? start + GAP / 2 + STROKE / 2 : start + GAP / 2,
      };
    });
  }, [data, total]);

  const single = arcs.length === 1;
  const shown = active !== null ? arcs[active] : null;

  if (total <= 0) {
    return (
      <section className="rounded-xl border border-line bg-bg-elev p-5">
        <Header title={title} subtitle={subtitle} />
        <p className="py-10 text-center font-mono text-[11px] text-ink-3">Aucune donnée sur ce mois</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-bg-elev p-5">
      <Header title={title} subtitle={subtitle} />

      <div className="relative mx-auto mt-4 w-[180px] max-w-full">
        <svg viewBox="0 0 160 160" className="w-full overflow-visible" role="img" aria-label={title}>
          <defs>
            {arcs.map((a, i) => (
              <linearGradient key={a.key} id={`${uid}-g${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={a.color.from} />
                <stop offset="100%" stopColor={a.color.to} />
              </linearGradient>
            ))}
          </defs>

          {/* Rail : garde l'anneau lisible même quand un seul segment porte tout */}
          <circle
            cx="80" cy="80" r={R}
            fill="none" stroke="rgba(245,240,232,0.06)" strokeWidth={STROKE}
          />

          <g transform="rotate(-90 80 80)">
            {arcs.map((a, i) => {
              const isActive = active === i;
              const dimmed = active !== null && !isActive;
              return (
                <circle
                  key={a.key}
                  cx="80" cy="80" r={R}
                  fill="none"
                  stroke={`url(#${uid}-g${i})`}
                  strokeWidth={isActive ? STROKE + 4 : STROKE}
                  strokeLinecap={single || !a.rounded ? 'butt' : 'round'}
                  strokeDasharray={single ? undefined : `${a.dash} ${CIRC - a.dash}`}
                  strokeDashoffset={single ? undefined : -a.offset}
                  className="kk-donut-arc"
                  style={{ opacity: dimmed ? 0.28 : 1 }}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Centre — la valeur clé, en gros. Survol d'un segment : son % prend
            la place du total, ce qui évite d'avoir à viser une infobulle. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {shown ? (
            <>
              <span className="font-display text-[30px] italic leading-none tracking-[-0.03em] text-ink">
                {Math.round(shown.percent)}%
              </span>
              <span className="mt-1.5 line-clamp-2 text-[10px] leading-tight text-ink-2">{shown.label}</span>
              <span className="mt-0.5 font-mono text-[10px] text-ink-3">{formatValue(shown.value)}</span>
            </>
          ) : (
            <>
              <span className="font-display text-[24px] italic leading-none tracking-[-0.03em] text-ink">
                {formatValue(total)}
              </span>
              {centerCaption && (
                <span className="mt-1.5 font-mono text-[9px] uppercase leading-tight tracking-[0.12em] text-ink-3">
                  {centerCaption}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Légende — libellé, montant CHF, part. Chaque ligne est un bouton :
          au doigt sur l'iPad de cuisine, viser un arc de 22 px n'est pas une
          option, viser une ligne de liste en est une. */}
      <ul className="mt-5 flex flex-col gap-0.5">
        {arcs.map((a, i) => (
          <li key={a.key}>
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((prev) => (prev === i ? null : i))}
              className={[
                'flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors',
                active === i ? 'bg-bg-elev-2' : 'hover:bg-bg-elev-2/60',
              ].join(' ')}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: `linear-gradient(135deg, ${a.color.from}, ${a.color.to})` }}
              />
              <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{a.label}</span>
              <span className="shrink-0 font-mono text-[11px] text-ink">{formatValue(a.value)}</span>
              <span className="w-[38px] shrink-0 text-right font-mono text-[11px] text-ink-3">
                {a.percent < 1 ? '<1' : Math.round(a.percent)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Header({ title, subtitle }) {
  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{title}</h3>
      {subtitle && <p className="mt-1 text-[11px] leading-tight text-ink-3">{subtitle}</p>}
    </div>
  );
}
