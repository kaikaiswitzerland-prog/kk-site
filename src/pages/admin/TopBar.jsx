import { useEffect, useState } from 'react';

const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const WEEKDAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function formatLong(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${hh}:${mm}`;
}
function formatShort(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} · ${hh}:${mm}`;
}

export default function TopBar({ title, soundEnabled, onToggleSound, rightExtras }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="mb-6 flex flex-row items-end justify-between gap-3 border-b border-line pb-4 md:mb-9 md:pb-6">
      <div className="min-w-0 flex-1">
        <h1 className="font-display italic leading-[0.95] tracking-[-0.04em] text-[28px] md:text-[56px]">
          {title}
        </h1>
        <div className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 md:mt-2 md:text-[11px] md:tracking-[0.14em]">
          <span className="md:hidden">{formatShort(now)}</span>
          <span className="hidden md:inline">{formatLong(now)}</span>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2.5">
        {/* Live indicator — mobile : pastille + LIVE compact ; desktop : pill complète */}
        <span className="md:hidden inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent-green">
          <span className="kk-pulse-dot block h-[7px] w-[7px] rounded-full bg-accent-green" />
          Live
        </span>
        <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-accent-green/20 bg-accent-green/10 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-accent-green">
          <span className="kk-pulse-dot block h-[7px] w-[7px] rounded-full bg-accent-green" />
          Temps réel
        </span>

        {/* Bouton son — mobile : icône seule, carré compact ; desktop : icône + label */}
        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
          className="
            inline-flex items-center justify-center rounded-lg border border-line-strong bg-bg-elev-2
            px-2.5 py-2 text-base text-ink transition-colors hover:bg-bg-elev-2
            md:gap-2 md:px-4 md:py-2.5 md:text-[13px] md:font-medium
          "
        >
          <span>{soundEnabled ? '🔔' : '🔕'}</span>
          <span className="hidden md:inline">{soundEnabled ? 'Son ON' : 'Son OFF'}</span>
        </button>

        {rightExtras}
      </div>
    </header>
  );
}
