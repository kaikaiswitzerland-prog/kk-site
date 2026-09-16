import { useMemo, useState } from 'react';
import { useFirstOrderDate, useMonthlyAnalytics } from '../../hooks/useMonthlyAnalytics.js';
import { monthKey, monthLabel, monthsSince, parseMonthKey } from '../../lib/admin/analyticsHelpers.js';
import MonthColumn from './analyses/MonthColumn.jsx';

// ─── Onglet Analyses ────────────────────────────────────────
// Comparaison de deux mois côte à côte. Vue ISOLÉE : elle lit ses propres
// données via useMonthlyAnalytics et ne partage aucun state avec les autres
// pages admin, qu'elle ne touche pas.
//
// Elle ne consomme volontairement PAS la liste `orders` déjà en mémoire dans
// AdminApp : celle-ci charge tout l'historique en une fois pour le temps réel,
// alors qu'ici deux requêtes bornées au mois suffisent, et l'agrégation reste
// juste même si un mois ancien sort un jour de ce cache.
export default function AnalysesView() {
  // Le sélecteur remonte jusqu'à la première commande en base. Tant que cette
  // date n'est pas connue, `monthsSince(null)` ne rend que le mois courant :
  // la liste s'allonge d'un coup à l'arrivée de la borne, mais la vue reste
  // utilisable et les deux mois par défaut sont déjà chargés entre-temps.
  const firstOrder = useFirstOrderDate();
  const months = useMemo(() => monthsSince(firstOrder.date), [firstOrder.date]);

  // Défaut : mois courant à gauche, mois précédent à droite. Calculés depuis la
  // date du jour et NON depuis `months`, dont la longueur dépend d'une requête :
  // sur une base ne contenant que le mois courant, months[1] n'existe pas et le
  // défaut retomberait sur le même mois des deux côtés.
  const [leftKey, setLeftKey] = useState(() => monthKeyOffset(0));
  const [rightKey, setRightKey] = useState(() => monthKeyOffset(-1));

  // Un mois choisi peut sortir de la liste (rien ici ne le fait aujourd'hui,
  // mais un défaut antérieur à la première commande, oui). On l'y rajoute
  // plutôt que de laisser le <select> afficher une valeur qu'il ne propose pas.
  const options = useMemo(() => {
    const known = new Set(months.map((m) => m.key));
    const extra = [leftKey, rightKey]
      .filter((k) => !known.has(k))
      .map((k) => {
        const { year, monthIndex } = parseMonthKey(k);
        return { key: k, year, monthIndex, label: monthLabel(year, monthIndex) };
      });
    return [...extra, ...months].sort((a, b) => b.key.localeCompare(a.key));
  }, [months, leftKey, rightKey]);

  const left = useMonthlyAnalytics(leftKey);
  const right = useMonthlyAnalytics(rightKey);

  // Échelle de couleur COMMUNE aux deux calendriers : la meilleure journée des
  // deux mois. C'est ce qui rend les deux grilles comparables — une case aussi
  // verte à gauche qu'à droite vaut le même CA. Normalisé par colonne, un mois
  // à 3 000 CHF aurait affiché le même vert éclatant qu'un mois à 9 000.
  //
  // Tant qu'une colonne charge encore, le maximum ne repose que sur l'autre et
  // les teintes s'ajustent d'un cran à son arrivée. Inévitable avec une échelle
  // partagée, et sans effet sur les chiffres.
  const calendarScaleMax = Math.max(
    left.data?.days?.maxRevenue ?? 0,
    right.data?.days?.maxRevenue ?? 0,
  );

  return (
    <div>
      <p className="mb-6 max-w-[70ch] text-[13px] leading-relaxed text-ink-2">
        Commandes directes uniquement (site et saisies restaurant). Les statuts
        comptabilisés sont ceux de la Compta : une commande refusée, remboursée,
        en attente de paiement ou mise à la corbeille n'entre dans aucun chiffre
        de cette page.
      </p>

      {/* Deux colonnes sur desktop, empilées sous 1024 px. `min-w-0` sur la
          grille ET sur chaque colonne : sans lui, un libellé de produit long
          élargit la track et fait déborder tout l'admin horizontalement. */}
      <div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2">
        <MonthColumn
          label="Mois analysé"
          value={leftKey}
          options={options}
          onChange={setLeftKey}
          data={left.data}
          loading={left.loading}
          error={left.error}
          calendarScaleMax={calendarScaleMax}
        />
        <MonthColumn
          label="Comparé à"
          value={rightKey}
          options={options}
          onChange={setRightKey}
          data={right.data}
          loading={right.loading}
          error={right.error}
          calendarScaleMax={calendarScaleMax}
        />
      </div>
    </div>
  );
}

// Clé du mois décalé de `offset` mois par rapport à aujourd'hui.
// Date(y, m + offset, 1) normalise seul le passage d'année (janvier − 1 = déc.).
function monthKeyOffset(offset) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return monthKey(d.getFullYear(), d.getMonth());
}
