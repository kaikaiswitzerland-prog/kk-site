import { useMemo, useState } from 'react';
import { fmt } from '../../../lib/admin/orderHelpers.js';

// ─── Calendrier mensuel des ventes ──────────────────────────
// Grille lun → dim, une ligne par semaine, une case par jour. L'intensité de
// la case dit le CA ; le chiffre dans la case le confirme, parce qu'une teinte
// seule ne se lit pas au centime.
//
// Rien d'autre que des <div> et du CSS : une grille de 42 cases ne justifie ni
// SVG ni dépendance.
const WEEKDAY_HEADS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Citron Tahiti (--color-accent) décomposé : les cases ont besoin de l'alpha,
// pas d'un hex.
const ACCENT_RGB = '212, 255, 107';

// Au-delà de ce seuil d'intensité, le fond lime est assez clair pour que
// l'encre Sable Blanc y perde son contraste. On bascule alors sur l'encre
// sombre — même geste que les pastilles bg-accent-warm/text-black de la
// barre latérale.
const DARK_INK_FROM = 0.55;

// Rampe d'opacité. Le plancher garde une journée faible visible, et le gamma
// < 1 relève le milieu de gamme : sans lui, toutes les journées moyennes
// s'écrasent dans le même vert terne et la grille ne raconte plus rien.
const alphaFor = (t) => 0.06 + 0.54 * t ** 0.65;

export default function SalesCalendar({ title = 'Calendrier des ventes', subtitle, days, scaleMax }) {
  const [active, setActive] = useState(null);

  // Cases de la grille : les vides avant le 1er et après le dernier jour
  // complètent les semaines, sinon la dernière ligne flotte.
  const grid = useMemo(() => {
    if (!days) return [];
    const out = new Array(days.startWeekday).fill(null);
    days.cells.forEach((c) => out.push(c));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [days]);

  // Meilleure journée du mois — affichée dans la ligne de détail tant qu'aucun
  // jour n'est visé, pour que la ligne dise toujours quelque chose d'utile.
  const best = useMemo(() => {
    if (!days) return null;
    return days.cells.reduce((b, c) => (c.revenue > (b?.revenue ?? 0) ? c : b), null);
  }, [days]);

  if (!days) return null;

  const shown = active != null ? days.cells[active - 1] : best;
  const weekdayOf = (day) => WEEKDAY_SHORT[(days.startWeekday + day - 1) % 7];
  // `scaleMax` est le maximum des DEUX mois comparés : une case aussi verte à
  // gauche qu'à droite représente le même CA. Repli sur le mois seul si la
  // vue ne fournit rien, pour que le composant reste utilisable isolément.
  const max = Number.isFinite(scaleMax) && scaleMax > 0 ? scaleMax : days.maxRevenue;

  return (
    <section className="rounded-xl border border-line bg-bg-elev p-5">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{title}</h3>
      {subtitle && <p className="mt-1 text-[11px] leading-tight text-ink-3">{subtitle}</p>}

      {/* Ligne de détail, de hauteur réservée : la grille ne doit pas sauter
          quand on la survole. */}
      <div className="mt-3 flex min-h-[34px] flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
        {shown && shown.count > 0 ? (
          <>
            <span className="font-display text-[20px] italic leading-none tracking-[-0.03em] text-ink">
              {fmt(shown.revenue)}
            </span>
            <span className="font-mono text-[10px] text-ink-2">
              {weekdayOf(shown.day)} {shown.day}
            </span>
            <span className="font-mono text-[10px] text-ink-3">
              {shown.count} commande{shown.count > 1 ? 's' : ''} · panier {fmt(shown.avg)}
            </span>
            {active == null && <span className="font-mono text-[10px] text-accent">meilleure journée</span>}
          </>
        ) : (
          <span className="font-mono text-[11px] text-ink-3">
            {shown ? `${weekdayOf(shown.day)} ${shown.day} — aucune vente` : 'Aucune vente ce mois'}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEKDAY_HEADS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="pb-1 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3"
          >
            {d}
          </div>
        ))}

        {grid.map((cell, i) => {
          if (!cell) return <div key={`vide-${i}`} aria-hidden="true" />;

          // Jour à venir : la case existe pour garder la grille juste, mais
          // elle ne prétend pas à zéro vente — elle n'a simplement pas eu lieu.
          if (cell.isFuture) {
            return (
              <div
                key={cell.day}
                className="flex aspect-square items-start justify-start rounded-md border border-dashed border-line p-1"
              >
                <span className="font-mono text-[9px] text-ink-3 opacity-40">{cell.day}</span>
              </div>
            );
          }

          const sold = cell.revenue > 0;
          const t = max > 0 ? Math.min(cell.revenue / max, 1) : 0;
          const darkInk = sold && t >= DARK_INK_FROM;
          const isActive = active === cell.day;

          return (
            <button
              key={cell.day}
              type="button"
              onMouseEnter={() => setActive(cell.day)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(cell.day)}
              onBlur={() => setActive(null)}
              onClick={() => setActive((prev) => (prev === cell.day ? null : cell.day))}
              aria-label={
                sold
                  ? `${weekdayOf(cell.day)} ${cell.day} : ${fmt(cell.revenue)}, ${cell.count} commande${cell.count > 1 ? 's' : ''}`
                  : `${weekdayOf(cell.day)} ${cell.day} : aucune vente`
              }
              className={[
                'kk-cal-cell flex aspect-square flex-col items-stretch rounded-md border p-1 text-left',
                isActive ? 'border-accent' : 'border-transparent',
              ].join(' ')}
              style={{
                background: sold
                  ? `rgba(${ACCENT_RGB}, ${alphaFor(t).toFixed(3)})`
                  : 'rgba(245, 240, 232, 0.045)',
                color: darkInk ? 'var(--color-bg)' : undefined,
              }}
            >
              <span
                className={['font-mono text-[9px] leading-none', darkInk ? 'opacity-70' : 'text-ink-3'].join(' ')}
              >
                {cell.day}
              </span>

              {sold && (
                <span className="mt-auto flex flex-col items-end leading-none">
                  <span
                    className={['font-mono text-[11px] font-semibold', darkInk ? '' : 'text-ink'].join(' ')}
                  >
                    {Math.round(cell.revenue)}
                  </span>
                  <span
                    className={['mt-0.5 font-mono text-[8px]', darkInk ? 'opacity-70' : 'text-ink-3'].join(' ')}
                  >
                    {cell.count} cmd
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Échelle : sans elle, la teinte n'est qu'une impression. */}
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">0</span>
        <div
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, rgba(${ACCENT_RGB}, ${alphaFor(0).toFixed(3)}), rgba(${ACCENT_RGB}, ${alphaFor(1).toFixed(3)}))`,
          }}
        />
        <span className="font-mono text-[9px] text-ink-3">{max > 0 ? fmt(max) : '—'}</span>
      </div>
    </section>
  );
}
