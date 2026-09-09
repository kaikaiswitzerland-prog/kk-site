import { useMemo, useState } from 'react';
import { useMonthlyAnalytics } from '../../hooks/useMonthlyAnalytics.js';
import { monthKey, recentMonths } from '../../lib/admin/analyticsHelpers.js';
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
const MONTHS_SELECTABLE = 24;

export default function AnalysesView() {
  const months = useMemo(() => recentMonths(MONTHS_SELECTABLE), []);

  // Défaut : mois courant à gauche, mois précédent à droite — recentMonths
  // rend la liste du plus récent au plus ancien, donc [0] et [1].
  const [leftKey, setLeftKey] = useState(() => months[0]?.key ?? currentKey());
  const [rightKey, setRightKey] = useState(() => months[1]?.key ?? currentKey());

  const left = useMonthlyAnalytics(leftKey);
  const right = useMonthlyAnalytics(rightKey);

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
          options={months}
          onChange={setLeftKey}
          data={left.data}
          loading={left.loading}
          error={left.error}
        />
        <MonthColumn
          label="Comparé à"
          value={rightKey}
          options={months}
          onChange={setRightKey}
          data={right.data}
          loading={right.loading}
          error={right.error}
        />
      </div>
    </div>
  );
}

function currentKey() {
  const now = new Date();
  return monthKey(now.getFullYear(), now.getMonth());
}
