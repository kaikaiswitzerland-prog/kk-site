// Sidebar : navigation entre pages (Commandes / Compta / Paramètres).
// Desktop : colonne 240px sticky, full-height, avec footer utilisateur.
// Mobile (< 768px) : barre fixe en bas, trois onglets équirépartis.

const NAV_ITEMS = [
  { id: 'orders', label: 'Commandes', icon: '📋' },
  { id: 'compta', label: 'Compta', icon: '📊' },
  { id: 'settings', label: 'Paramètres', icon: '⚙️' },
];

function userInitials(user) {
  const e = user?.email || '';
  return e ? e.slice(0, 2).toUpperCase() : 'KK';
}

export default function Sidebar({ page, setPage, pendingCount, user, onSignOut }) {
  return (
    <>
      {/* ── Desktop ───────────────────────────────────── */}
      <aside
        className="
          sticky top-0 hidden h-screen flex-col gap-9 border-r border-line bg-bg
          px-[18px] py-7 md:flex
        "
        style={{ width: 240 }}
      >
        <div className="flex items-baseline gap-1.5 px-2">
          <span className="font-display text-[32px] italic leading-[0.9] tracking-[-0.03em] text-ink">
            Kaï<em className="text-accent">Kaï</em>
          </span>
          <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
            Admin
          </span>
        </div>

        <nav className="flex flex-col gap-0.5">
          <div className="px-3 pb-2 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            Opérations
          </div>
          {NAV_ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={[
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'kk-nav-item-active bg-bg-elev-2 text-ink'
                    : 'text-ink-2 hover:bg-white/[0.03] hover:text-ink',
                ].join(' ')}
              >
                <span className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.id === 'orders' && pendingCount > 0 && (
                  <span className="rounded-full bg-accent-warm px-2 py-0.5 font-mono text-[10px] font-bold text-black">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line p-3">
          <div className="flex items-center gap-2.5 text-[13px]">
            <div
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-xs font-bold text-black"
              style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-warm))' }}
            >
              {userInitials(user)}
            </div>
            <div className="flex flex-1 flex-col leading-tight">
              <span className="truncate font-semibold">{user?.email?.split('@')[0] || 'Admin'}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                En ligne
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="rounded-md border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
              title="Déconnexion"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────────── */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around
          border-t border-line bg-bg/95 px-4 py-2 backdrop-blur-xl md:hidden
        "
      >
        {NAV_ITEMS.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={[
                'flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[11px] transition-colors',
                active ? 'text-accent' : 'text-ink-3',
              ].join(' ')}
            >
              <span className="relative text-base leading-none">
                {item.icon}
                {item.id === 'orders' && pendingCount > 0 && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-accent-warm px-1.5 py-px font-mono text-[9px] font-bold text-black">
                    {pendingCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
