import { fmt } from '../../../lib/admin/orderHelpers.js';
import DonutChart from './DonutChart.jsx';
import BarChart from './BarChart.jsx';
import SalesCalendar from './SalesCalendar.jsx';

// Une colonne = un mois. Sélecteur en tête, quatre graphes, puis les stats.
//
// Le sélecteur vit DANS la colonne plutôt que dans une barre d'outils commune :
// une fois les colonnes empilées sur mobile, un sélecteur resté en haut de page
// serait à deux écrans de scroll du graphe qu'il pilote.
export default function MonthColumn({ label, value, options, onChange, data, loading, error, calendarScaleMax }) {
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <header className="flex items-end justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <label
            htmlFor={`kk-month-${label}`}
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3"
          >
            {label}
          </label>
          <div className="relative mt-1 flex items-center gap-1.5">
            <select
              id={`kk-month-${label}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="
                max-w-full cursor-pointer appearance-none truncate rounded-md border border-transparent
                bg-transparent py-0.5 pr-1 font-display text-[26px] italic leading-none
                tracking-[-0.03em] text-ink outline-none transition-colors
                hover:border-line-strong focus-visible:border-accent
              "
            >
              {options.map((m) => (
                <option key={m.key} value={m.key} className="bg-bg-elev font-body text-[14px] not-italic">
                  {m.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none text-[10px] text-ink-3">▾</span>
          </div>
        </div>
        {loading && <span className="shrink-0 pb-1 font-mono text-[10px] text-ink-3">chargement…</span>}
      </header>

      {error && (
        <div className="rounded-xl border border-line bg-bg-elev p-5">
          <p className="text-[13px] text-accent-red">⚠ {error}</p>
          <p className="mt-1 font-mono text-[11px] text-ink-3">
            Aucun chiffre affiché plutôt qu'un chiffre faux.
          </p>
        </div>
      )}

      {!error && loading && !data && <SkeletonColumn />}

      {/* Mois sans aucune commande : on le dit une fois, en tête de colonne,
          plutôt que de laisser déduire d'une pile de zéros s'il s'agit d'un
          mois creux ou d'un chargement raté. Les graphes restent affichés
          en dessous, à zéro. */}
      {!error && data && data.stats.count === 0 && (
        <div className="rounded-xl border border-line bg-bg-elev px-5 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
            Aucune commande
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-ink-3">
            Aucune commande comptabilisée sur ce mois. Les graphes ci-dessous
            sont à zéro.
          </p>
        </div>
      )}

      {!error && data && (
        <>
          <DonutChart
            title="CA par catégorie"
            subtitle="Articles seuls — hors frais de livraison"
            data={data.categories}
            centerCaption="CA produits"
          />

          <DonutChart
            title="CA top 10 produits"
            subtitle="Articles seuls — hors frais de livraison"
            data={data.products}
            centerCaption="CA produits"
          />

          <DonutChart
            title="CA par jour de la semaine"
            subtitle="Commandes entières — frais de livraison compris"
            data={data.weekdays}
            centerCaption="CA encaissé"
          />

          <BarChart
            title="CA par tranche horaire"
            subtitle="Commandes entières — frais de livraison compris"
            data={data.hours}
          />

          {/* Calendrier des ventes. Même base que le donut par jour de semaine
              et que les stats — order.total — donc la somme des cases égale le
              CA encaissé du mois. L'échelle de couleur vient de la vue et
              couvre LES DEUX mois : sans ça, chaque calendrier se normaliserait
              sur lui-même et un mois creux paraîtrait aussi vert qu'un mois
              plein, ce qui ruinerait la lecture en vis-à-vis. */}
          <SalesCalendar
            subtitle="Commandes entières — frais de livraison compris"
            days={data.days}
            scaleMax={calendarScaleMax}
          />

          {/* Stats du mois, sous les graphiques. Base = order.total, la même
              que l'onglet Compta : les deux écrans doivent donner le même
              chiffre pour le même mois, sinon aucun des deux n'est croyable. */}
          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="CA total" value={fmt(data.stats.revenue)} />
            <Stat label="Commandes" value={String(data.stats.count)} />
            <Stat label="Panier moyen" value={fmt(data.stats.avg)} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="kk-kpi rounded-xl border border-line bg-bg-elev p-3.5 md:p-4">
      <div className="mb-1.5 font-mono text-[9px] uppercase leading-tight tracking-[0.14em] text-ink-3">
        {label}
      </div>
      <div className="font-display text-[19px] italic leading-none tracking-[-0.03em] md:text-[22px]">
        {value}
      </div>
    </div>
  );
}

function SkeletonColumn() {
  return (
    <div className="flex flex-col gap-3.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="kk-skeleton h-[300px] rounded-xl border border-line bg-bg-elev" />
      ))}
    </div>
  );
}
