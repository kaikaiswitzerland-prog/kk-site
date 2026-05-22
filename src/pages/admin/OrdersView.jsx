import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, X } from 'lucide-react';
import OrderCard from './OrderCard.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import { TAB_FILTERS, isAdminVisible, orderNumber, sortByPriority } from '../../lib/admin/orderHelpers.js';

const SCOPE_STORAGE_KEY = 'admin_orders_tab';
const SEARCH_DEBOUNCE_MS = 200;

const PRIMARY_SCOPES = [
  { id: 'active',    label: 'En cours' },
  { id: 'completed', label: 'Terminées' },
];

function readInitialScope() {
  try {
    const stored = localStorage.getItem(SCOPE_STORAGE_KEY);
    if (stored === 'active' || stored === 'completed') return stored;
  } catch {
    /* localStorage indisponible — fallback default */
  }
  return 'active';
}

// Normalisation pour la recherche : casse + accents (NFD strip diacritics).
const DIACRITICS_RE = /[̀-ͯ]/g;
function normalize(s) {
  return String(s ?? '').normalize('NFD').replace(DIACRITICS_RE, '').toLowerCase();
}

// Chiffres seuls — pour matcher un n° de téléphone quelle que soit la mise en
// forme ("0791234567" doit matcher "079 123 45 67" / "+41 79 123 45 67").
function digitsOnly(s) {
  return String(s ?? '').replace(/\D/g, '');
}

function orderMatches(order, needle, digitsNeedle) {
  const fields = [
    order.customer_name,
    order.customer_email,
    order.customer_phone,
    order.customer_address,
    orderNumber(order.id), // n° affiché (8 premiers car. de l'UUID)
    order.id,              // UUID complet (collage d'un ID exact)
    order.note_kitchen,
    order.note_delivery,
  ];
  if (fields.some((f) => f && normalize(f).includes(needle))) return true;
  // Repli téléphone : comparaison chiffres-à-chiffres si la requête est numérique.
  if (digitsNeedle && order.customer_phone) {
    return digitsOnly(order.customer_phone).includes(digitsNeedle);
  }
  return false;
}

export default function OrdersView({
  orders,
  activeTab,
  setActiveTab,
  recentlyAddedIds,
  onSelect,
  onUpdateStatus,
  onPrint,
  onRequestRefund,
  onRequestRefuse,
  onRequestTrash,
  onTrashOrders,
}) {
  // Onglet primaire (En cours / Terminées) persistant en localStorage.
  const [primaryScope, setPrimaryScope] = useState(readInitialScope);

  // ─── Mode sélection multiple (corbeille en masse) ───────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  useEffect(() => {
    try { localStorage.setItem(SCOPE_STORAGE_KEY, primaryScope); } catch { /* */ }
  }, [primaryScope]);

  // Barre de recherche : `query` reflète l'input en temps réel, mais le filtre
  // utilise `debouncedQuery` (200ms) pour éviter le re-render à chaque frappe.
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);
  // On retire un éventuel « # » de tête : le n° de commande est affiché
  // « #A1B2C3D4 » mais stocké sans dièse → taper le numéro tel qu'affiché doit
  // matcher. Le filtre s'active dès le 1er caractère (champ vide → tout).
  const trimmed = debouncedQuery.trim().replace(/^#/, '');
  const needle = normalize(trimmed);
  const digitsNeedle = digitsOnly(trimmed);
  const searchActive = needle.length > 0;

  // Toujours masquer pending_payment du tableau de bord
  const visible = useMemo(() => orders.filter(isAdminVisible), [orders]);

  // Sous-onglets affichés = ceux du scope primaire courant.
  const scopedTabs = useMemo(
    () => TAB_FILTERS.filter((t) => t.scope === primaryScope),
    [primaryScope]
  );

  const counts = useMemo(() => {
    const c = {};
    for (const tab of TAB_FILTERS) {
      c[tab.id] = visible.filter((o) => tab.statuses.includes(o.status)).length;
    }
    return c;
  }, [visible]);

  // Total par scope primaire (badge sur l'onglet niveau 1).
  const scopeCounts = useMemo(() => {
    const c = { active: 0, completed: 0 };
    for (const tab of TAB_FILTERS) {
      c[tab.scope] += counts[tab.id] || 0;
    }
    return c;
  }, [counts]);

  // Si on bascule de scope et que l'activeTab courant n'appartient plus au
  // nouveau scope, on jump vers le premier sous-onglet du scope.
  useEffect(() => {
    const stillValid = scopedTabs.some((t) => t.id === activeTab);
    if (!stillValid && scopedTabs.length > 0) {
      setActiveTab(scopedTabs[0].id);
    }
  }, [scopedTabs, activeTab, setActiveTab]);

  const filtered = useMemo(() => {
    // Mode recherche : on bypass les onglets et on fouille toutes les
    // commandes visibles. Tri par created_at desc (plus récentes en haut).
    if (searchActive) {
      const matched = visible.filter((o) => orderMatches(o, needle, digitsNeedle));
      return [...matched].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    const tab = scopedTabs.find((t) => t.id === activeTab) || scopedTabs[0];
    if (!tab) return [];
    const inTab = visible.filter((o) => tab.statuses.includes(o.status));
    return sortByPriority(inTab, tab.id);
  }, [visible, activeTab, scopedTabs, searchActive, needle, digitsNeedle]);

  const selectedCount = selectedIds.size;

  // "Tout sélectionner" : ajoute toutes les commandes actuellement affichées
  // (respecte recherche + onglet actif) à la sélection, sans perdre celles
  // déjà cochées dans un autre onglet. "Tout désélectionner" : vide tout.
  const selectAllVisible = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((o) => next.add(o.id));
      return next;
    });
  const deselectAll = () => setSelectedIds(new Set());

  return (
    <div>
      {/* Barre de recherche + bouton "Sélectionner". Si la query contient du
          texte (debounce 200ms), on bypass les onglets et on affiche les
          résultats sur toutes les commandes (active + archives). */}
      <div className="mb-3 flex gap-2 md:mb-4">
        <div className="relative flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          >
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, email, tél, n° commande, adresse, note…)"
            className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-9 text-[13px] outline-none transition-colors focus:border-line-strong"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 font-mono text-[14px] text-ink-3 transition-colors hover:bg-bg-elev-2 hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          className={[
            'flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors',
            selectMode
              ? 'border-line-strong bg-bg-elev-2 text-ink'
              : 'border-line bg-bg text-ink-2 hover:border-line-strong hover:text-ink',
          ].join(' ')}
        >
          {selectMode ? <X size={15} /> : <CheckSquare size={15} />}
          <span className="hidden sm:inline">{selectMode ? 'Annuler' : 'Sélectionner'}</span>
        </button>
      </div>

      {/* Mode recherche : header résultats à la place des onglets. */}
      {searchActive ? (
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''} pour
            <span className="ml-1 text-ink">« {debouncedQuery.trim()} »</span>
          </div>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          >
            Effacer
          </button>
        </div>
      ) : (
      <>
      {/* Niveau 1 : onglets primaires En cours / Terminées (segmented control).
          Persistant en localStorage. */}
      <div className="mb-3 inline-flex rounded-xl border border-line bg-bg p-1 md:mb-4">
        {PRIMARY_SCOPES.map((scope) => {
          const active = scope.id === primaryScope;
          const count = scopeCounts[scope.id] || 0;
          return (
            <button
              key={scope.id}
              onClick={() => setPrimaryScope(scope.id)}
              className={[
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-bg-elev-2 text-ink shadow-sm'
                  : 'text-ink-3 hover:text-ink-2',
              ].join(' ')}
            >
              {scope.label}
              {count > 0 && (
                <span
                  className={[
                    'rounded-full px-2 py-0.5 font-mono text-[10px]',
                    active ? 'bg-accent font-bold text-black' : 'bg-bg-elev-2 text-ink-2',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Niveau 2 : sous-onglets filtrés par scope (scroll horizontal sur mobile). */}
      <div
        className="kk-scroll mb-5 flex gap-0.5 overflow-x-auto border-b border-line md:mb-7 md:gap-1"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {scopedTabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ scrollSnapAlign: 'start' }}
              className={[
                '-mb-px inline-flex items-center gap-1 whitespace-nowrap border-b-2 px-2.5 py-2 text-[12px] font-medium transition-colors',
                'md:gap-2 md:px-4 md:py-3 md:text-[13px]',
                active
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-3 hover:text-ink-2',
              ].join(' ')}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span
                  className={[
                    'rounded-full px-1.5 py-0.5 font-mono text-[10px] md:px-2 md:text-[11px]',
                    active ? 'bg-accent font-bold text-black' : 'bg-bg-elev-2 text-ink-2',
                  ].join(' ')}
                >
                  {counts[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-bg-elev/40 p-12 text-center">
          <div className="mb-2 text-3xl">🍃</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            {searchActive ? 'Aucun résultat' : 'Aucune commande'}
          </div>
        </div>
      ) : (
        <div
          className="kk-orders-grid grid gap-3 md:gap-3.5"
        >
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isNew={recentlyAddedIds.has(order.id)}
              onSelect={onSelect}
              onUpdateStatus={onUpdateStatus}
              onPrint={onPrint}
              onRequestRefund={onRequestRefund}
              onRequestRefuse={onRequestRefuse}
              onRequestTrash={onRequestTrash}
              selectMode={selectMode}
              selected={selectedIds.has(order.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Espace pour que les dernières cartes ne soient pas masquées par la
          barre flottante. */}
      {selectMode && selectedCount > 0 && <div aria-hidden className="h-24" />}

      {/* Barre d'actions flottante — apparaît dès 1 commande sélectionnée.
          Positionnée au-dessus de la bottom-nav mobile (+ safe-area). */}
      {selectMode && selectedCount > 0 && (
        <div
          className="fixed left-1/2 z-[60] flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-bg-elev/95 px-3 py-2.5 shadow-2xl backdrop-blur-[20px] md:px-4"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.75rem)' }}
        >
          <span className="font-mono text-[12px] font-bold text-ink">
            {selectedCount} commande{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              Tout désélectionner
            </button>
            <button
              type="button"
              onClick={() => setConfirmBulkOpen(true)}
              className="rounded-lg border border-accent-red/30 bg-accent-red/15 px-3 py-1.5 text-[12px] font-bold text-accent-red transition-colors hover:bg-accent-red/25"
            >
              🗑️ Mettre à la corbeille
            </button>
          </div>
        </div>
      )}

      {confirmBulkOpen && (
        <ConfirmModal
          title="Mettre à la corbeille ?"
          message={`Mettre ${selectedCount} commande${selectedCount > 1 ? 's' : ''} à la corbeille ? Elle${selectedCount > 1 ? 's seront exclues' : ' sera exclue'} de l'écran d'accueil et de la compta.`}
          confirmLabel="Confirmer"
          onConfirm={async () => {
            await onTrashOrders([...selectedIds]);
            exitSelectMode();
          }}
          onClose={() => setConfirmBulkOpen(false)}
        />
      )}
    </div>
  );
}
