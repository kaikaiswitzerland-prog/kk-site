import { useEffect, useState } from 'react';

const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function fmtNow(d) {
  const day = WEEKDAYS[d.getDay()];
  const dayN = d.getDate();
  const month = MONTHS[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${dayN} ${month} · ${hh}:${mm}`;
}

export default function TopBar({ title, soundEnabled, onToggleSound, rightExtras }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="mb-9 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-[44px] italic leading-[0.95] tracking-[-0.04em] md:text-[56px]">
          {title}
        </h1>
        <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          {fmtNow(now)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent-green/20 bg-accent-green/10 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-green">
          <span className="kk-pulse-dot block h-[7px] w-[7px] rounded-full bg-accent-green" />
          Temps réel
        </span>

        <button
          onClick={onToggleSound}
          className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-bg-elev-2 px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-white/10"
        >
          {soundEnabled ? '🔔 Son ON' : '🔕 Son OFF'}
        </button>

        {rightExtras}
      </div>
    </header>
  );
}
