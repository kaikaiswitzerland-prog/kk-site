// Page Paramètres : connecté/déconnecté, son notifications, permission notifs.
// Volontairement minimaliste — la sidebar a une entrée "Paramètres" qui doit pointer
// quelque part. Les autres réglages viendront avec le temps.

import { useEffect, useState } from 'react';

export default function SettingsView({ user, soundEnabled, onToggleSound, onSignOut }) {
  const [notifPerm, setNotifPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    const id = setInterval(() => {
      if (typeof Notification !== 'undefined') setNotifPerm(Notification.permission);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const requestPerm = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card title="Compte">
        <Row label="Connecté en tant que" value={user?.email || '—'} />
        <button
          onClick={onSignOut}
          className="mt-3 rounded-lg border border-line-strong bg-bg-elev-2 px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-white/10"
        >
          Se déconnecter
        </button>
      </Card>

      <Card title="Notifications">
        <Row
          label="Son d'alerte"
          value={
            <button
              onClick={onToggleSound}
              className="rounded-md border border-line-strong bg-bg-elev-2 px-3 py-1.5 font-mono text-[12px] tracking-wider transition-colors hover:bg-white/10"
            >
              {soundEnabled ? '🔔 Activé' : '🔕 Désactivé'}
            </button>
          }
        />
        <Row
          label="Notifications navigateur"
          value={
            notifPerm === 'granted' ? (
              <span className="font-mono text-[12px] uppercase tracking-wider text-accent-green">
                Autorisées
              </span>
            ) : notifPerm === 'denied' ? (
              <span className="font-mono text-[12px] uppercase tracking-wider text-accent-red">
                Bloquées (réglages navigateur)
              </span>
            ) : (
              <button
                onClick={requestPerm}
                className="rounded-md border border-line-strong bg-bg-elev-2 px-3 py-1.5 font-mono text-[12px] tracking-wider transition-colors hover:bg-white/10"
              >
                Autoriser
              </button>
            )
          }
        />
      </Card>

      <Card title="Impression">
        <p className="text-[13px] text-ink-2">
          Les tickets cuisine sont optimisés pour imprimante thermique{' '}
          <strong className="text-ink">58 mm / 80 mm</strong>. Configure ton imprimante par défaut
          dans le navigateur (ou via AirPrint sur iPad) pour une impression silencieuse.
        </p>
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev p-5">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="text-[13px]">{value}</span>
    </div>
  );
}
