// src/pages/admin/PilotageBlock.jsx
//
// Pilotage (conseil du 14.10.2026). Deux pièces :
//  - <ObjectiveBanner> : une ligne en haut de chaque écran admin, « où en est-on
//    de l'objectif 9 commandes/jour avant le 29 déc. ».
//  - <PilotageCards>   : 4 chiffres de la semaine (lundi → aujourd'hui) en tête
//    de Compta, + la saisie manuelle Uber Eats / Just Eat.
// Tout est calculé dans src/lib/admin/pilotage.js.

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computePilotage, genevaDay } from '../../lib/admin/pilotage.js';
import { fmt } from '../../lib/admin/orderHelpers.js';

export function ObjectiveBanner({ orders, platformDaily }) {
  const p = useMemo(() => computePilotage(orders, platformDaily), [orders, platformDaily]);
  const o = p.objective;
  const ratio = Math.min(1, o.perDay / o.target);
  const tone = o.perDay >= o.target ? 'text-accent-green' : o.perDay >= o.target * 0.6 ? 'text-ink' : 'text-accent-red';
  return (
    <div className="mb-6 rounded-xl border border-line bg-bg-elev px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="text-[15px]">
          <span className={`font-semibold ${tone}`}>{o.perDay.toLocaleString('fr-CH')} commandes/jour</span>
          <span className="text-ink-3"> (moyenne 7 jours) → objectif {o.target}</span>
        </div>
        <div className="font-mono text-[12px] text-ink-3">
          {o.daysLeft >= 0 ? `J-${o.daysLeft} avant le 29 déc.` : 'Point de contrôle passé'}
          {o.sitePct !== null && ` · site ${o.sitePct} %`}
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-elev-2">
        <div className="h-full rounded-full bg-accent-green" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
      {o.platformDays === 0 && (
        <div className="mt-1.5 text-[11px] text-ink-3">
          Site seulement ({o.sitePerDay.toLocaleString('fr-CH')}/jour). Saisis Uber Eats et Just Eat dans Compta pour avoir le vrai total.
        </div>
      )}
    </div>
  );
}

function Card({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-line bg-bg-elev p-4">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{label}</div>
      <div className="text-[22px] font-semibold leading-tight">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-ink-3">{sub}</div>}
    </div>
  );
}

function PlatformInput({ platformDaily, onSaved }) {
  const [day, setDay] = useState(genevaDay(new Date()));
  const cur = platformDaily[day] || {};
  const [uber, setUber] = useState('');
  const [justeat, setJusteat] = useState('');
  const [state, setState] = useState(null);
  useEffect(() => {
    setUber(cur.uber != null ? String(cur.uber) : '');
    setJusteat(cur.justeat != null ? String(cur.justeat) : '');
  }, [day, cur.uber, cur.justeat]);

  const save = async () => {
    setState('…');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/platform-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ day, uber, justeat }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      onSaved(body.value || {});
      setState('Enregistré');
    } catch (e) {
      setState(`Erreur : ${e.message}`);
    }
  };

  const input = 'w-16 rounded-lg border border-line-strong bg-bg-elev-2 px-2 py-1.5 text-center font-mono text-[14px]';
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg-elev px-4 py-3 text-[13px]">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">Commandes plateformes</span>
      <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="rounded-lg border border-line-strong bg-bg-elev-2 px-2 py-1.5 font-mono text-[13px]" />
      <label className="flex items-center gap-1.5">Uber Eats <input type="number" min="0" inputMode="numeric" value={uber} onChange={(e) => setUber(e.target.value)} className={input} /></label>
      <label className="flex items-center gap-1.5">Just Eat <input type="number" min="0" inputMode="numeric" value={justeat} onChange={(e) => setJusteat(e.target.value)} className={input} /></label>
      <button type="button" onClick={save} className="rounded-lg border border-line-strong bg-bg-elev-2 px-3 py-1.5 font-medium hover:bg-bg-elev">Enregistrer</button>
      {state && <span className="text-ink-3">{state}</span>}
    </div>
  );
}

export function PilotageCards({ orders, platformDaily, setPlatformDaily }) {
  const p = useMemo(() => computePilotage(orders, platformDaily), [orders, platformDaily]);
  const lw = p.lunch.lastWeek;
  const tw = p.lunch.thisWeek;
  const pct = (x) => (x === null ? '—' : `${x} %`);
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
        Pilotage · semaine du lundi {p.weekStart.split('-').reverse().slice(0, 2).join('.')}
      </div>
      <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Card
          label="Clients"
          value={`${p.customers.newCount} nouveaux · ${p.customers.returningCount} reviennent`}
          sub="Attirer ou garder ? (par téléphone / email)"
        />
        <Card
          label="Code PREMIER"
          value={`${p.promo.used} utilisé${p.promo.used > 1 ? 's' : ''}`}
          sub={`Remise totale ${fmt(p.promo.discountTotal)} · ${p.promo.cameBack} ont recommandé`}
        />
        <Card
          label="Midi (11h30–16h)"
          value={`${pct(tw.offerPct)} à 14.90`}
          sub={`Cette sem. ${tw.offer} offre / ${tw.full} à 18.90 · sem. passée ${pct(lw.offerPct)} (${lw.offer}/${lw.full})`}
        />
        <Card
          label="Commandes Bureau"
          value={`${p.bureau.count} / ${p.bureau.target}`}
          sub="Cette semaine (5 plats chauds ou plus)"
        />
      </div>
      <PlatformInput platformDaily={platformDaily} onSaved={setPlatformDaily} />
    </div>
  );
}
