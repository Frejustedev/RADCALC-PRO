import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Loader2, Check } from 'lucide-react';
import { ISOTOPES } from '../constants';
import { useConfig } from '../lib/ConfigContext';
import { saveConfig } from '../lib/db';
import { useAuth } from '../lib/AuthContext';
import { DIAGNOSTIC_DOSE_ALERT_MSV, isTherapeuticProtocol } from '../lib/dosimetry';
import { Card } from './ui';
import { cn } from '../lib/cn';
import { focusRing } from './ui';

/** Diagnostic protocols eligible for a local DRL. */
const DIAGNOSTIC_PROTOCOLS = ISOTOPES.flatMap((iso) =>
  iso.protocols.filter((p) => !isTherapeuticProtocol(iso, p)).map((p) => ({ iso: iso.name.split(' ')[0], id: p.id, name: p.name })),
);

export const CenterConfigEditor: React.FC = () => {
  const config = useConfig();
  const { profile } = useAuth();
  const [threshold, setThreshold] = useState('');
  const [drls, setDrls] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Seed local form from the loaded config.
  useEffect(() => {
    setThreshold(config.diagnosticDoseAlertMSv != null ? String(config.diagnosticDoseAlertMSv) : '');
    setDrls(Object.fromEntries(Object.entries(config.drls ?? {}).map(([k, v]) => [k, String(v)])));
  }, [config.diagnosticDoseAlertMSv, config.drls]);

  const save = async () => {
    if (!profile) return;
    setState('saving');
    const drlNums: Record<string, number> = {};
    for (const [k, v] of Object.entries(drls)) {
      const n = parseFloat(v);
      if (v !== '' && !Number.isNaN(n) && n > 0) drlNums[k] = n;
    }
    const t = parseFloat(threshold);
    try {
      await saveConfig(
        { diagnosticDoseAlertMSv: threshold !== '' && t > 0 ? t : undefined, drls: drlNums },
        { uid: profile.uid, name: profile.displayName },
      );
      setState('saved');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3500);
    }
  };

  const field = 'w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-100 text-right focus:ring-2 focus:ring-emerald-500 outline-none';

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-bold text-slate-100">Paramétrage du centre (DRL & seuils)</h2>
      </div>

      <div className="flex items-center justify-between gap-3 p-3 bg-slate-800/40 rounded-xl mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-200">Seuil d'alerte dose efficace (diagnostic)</p>
          <p className="text-[10px] text-slate-500">Défaut : {DIAGNOSTIC_DOSE_ALERT_MSV} mSv</p>
        </div>
        <div className="flex items-center gap-1">
          <input type="number" min="0" step="0.5" className={field} value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder={String(DIAGNOSTIC_DOSE_ALERT_MSV)} aria-label="Seuil d'alerte mSv" />
          <span className="text-xs text-slate-500">mSv</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mb-2">Niveaux de Référence Diagnostiques (NRD/DRL) locaux — laissez vide pour désactiver.</p>
      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
        {DIAGNOSTIC_PROTOCOLS.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 py-1">
            <span className="text-xs text-slate-300 truncate">
              <span className="text-slate-500">{p.iso}</span> · {p.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <input type="number" min="0" className={field} value={drls[p.id] ?? ''} onChange={(e) => setDrls({ ...drls, [p.id]: e.target.value })} aria-label={`DRL ${p.name}`} />
              <span className="text-xs text-slate-500">MBq</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={state === 'saving'} className={cn('mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-60', focusRing)}>
        {state === 'saving' && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />}
        {state === 'saved' && <Check className="w-4 h-4" />}
        {state === 'saved' ? 'Enregistré' : 'Enregistrer le paramétrage'}
      </button>
      {config.updatedByName && <p className="text-[10px] text-slate-600 mt-2 text-center">Dernière modification : {config.updatedByName}</p>}
    </Card>
  );
};
