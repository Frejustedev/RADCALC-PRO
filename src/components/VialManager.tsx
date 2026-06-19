import React, { useState, useEffect } from 'react';
import { FlaskConical, Droplets, Save, Trash2, Box, Syringe, AlertTriangle } from 'lucide-react';
import { VialData, Vial, Unit } from '../types';
import { calculateDrawVolume } from '../lib/dosimetry';
import { toMBq, fromMBq, formatActivity } from '../lib/units';
import { subscribeVials, createVial, deleteVial as deleteVialDoc } from '../lib/db';
import { useAuth } from '../lib/AuthContext';
import { Card, SectionHeading, IconButton } from './ui';

interface VialManagerProps {
  data: VialData;
  onChange: (data: VialData) => void;
  requiredActivityMBq: number;
  unit: Unit;
  isotopeId: string;
}

export const VialManager: React.FC<VialManagerProps> = ({ data, onChange, requiredActivityMBq, unit, isotopeId }) => {
  const { profile, hasPermission } = useAuth();
  const canManage = hasPermission('vials:write');
  const [vials, setVials] = useState<Vial[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Shared center-wide vial inventory (live from Firestore).
  useEffect(() => subscribeVials(setVials, () => setError('Stock indisponible (droits ou connexion).')), []);

  // All volume maths happen in MBq: convert the user's display-unit activity first.
  const vialActivityMBq = toMBq(data.activity || 0, unit);
  const { baseVolumeMl, totalVolumeMl, concentrationMBqPerMl } = calculateDrawVolume(
    vialActivityMBq,
    data.volume || 0,
    requiredActivityMBq,
    data.deadVolume || 0,
  );
  const deadVol = data.deadVolume || 0;
  const concentrationDisplay = fromMBq(concentrationMBqPerMl, unit);

  const saveVial = () => {
    if (!profile || !canManage || vialActivityMBq <= 0 || data.volume <= 0) return;
    createVial(
      {
        isotopeId,
        initialActivity: vialActivityMBq, // stored canonically in MBq
        initialVolume: data.volume,
        referenceTime: data.referenceTime || new Date().toISOString(),
        lotNumber: `LOT-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
      },
      { uid: profile.uid, name: profile.displayName },
    ).catch(() => setError("Enregistrement du flacon impossible."));
  };

  const removeVial = (id: string) => {
    if (canManage) deleteVialDoc(id).catch(() => setError('Suppression du flacon impossible.'));
  };

  const loadVial = (vial: Vial) => {
    onChange({
      ...data,
      activity: Number(fromMBq(vial.initialActivity, unit).toFixed(unit === 'mCi' ? 2 : 1)),
      volume: vial.initialVolume,
      referenceTime: vial.referenceTime,
    });
  };

  const filteredVials = vials.filter((v) => v.isotopeId === isotopeId);

  return (
    <Card>
      <SectionHeading
        icon={<FlaskConical className="w-5 h-5" />}
        accent="text-purple-400"
        title="Gestion du Flacon"
        right={
          canManage ? (
            <IconButton onClick={saveVial} title="Enregistrer ce flacon dans le stock du centre" aria-label="Enregistrer ce flacon">
              <Save className="w-4 h-4" />
            </IconButton>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[11px]">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold hover:text-rose-300">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="vial-activity" className="text-sm font-medium text-slate-400">Activité du Flacon ({unit})</label>
          <input
            id="vial-activity"
            type="number"
            min="0"
            value={data.activity || ''}
            onChange={(e) => onChange({ ...data, activity: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            placeholder={unit === 'mCi' ? '100' : '3700'}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="vial-volume" className="text-sm font-medium text-slate-400">Volume Total (mL)</label>
          <input
            id="vial-volume"
            type="number"
            min="0"
            value={data.volume || ''}
            onChange={(e) => onChange({ ...data, volume: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            placeholder="10"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <div className="space-y-2 max-w-sm">
          <label htmlFor="vial-deadvol" className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Syringe className="w-4 h-4 text-rose-400" />
            Volume Mort Seringue / Cathéter (mL)
          </label>
          <input
            id="vial-deadvol"
            type="number"
            step="0.05"
            min="0"
            value={data.deadVolume ?? 0.1}
            onChange={(e) => onChange({ ...data, deadVolume: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
            placeholder="0.1"
          />
          <p className="text-[10px] text-slate-500 italic">Compense l'activité résiduelle non injectée au patient.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Droplets className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold block">Volume Total à Prélever</span>
              <span className="text-2xl font-mono font-bold text-purple-400">
                {totalVolumeMl > 0 ? totalVolumeMl.toFixed(2) : '0.00'} <span className="text-sm font-normal">mL</span>
              </span>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 italic max-w-[150px]">
            Concentration: {concentrationDisplay > 0 ? concentrationDisplay.toFixed(unit === 'mCi' ? 3 : 1) : '0'} {unit}/mL
          </div>
        </div>

        {deadVol > 0 && totalVolumeMl > 0 && (
          <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs text-rose-400">
                <span className="font-bold uppercase block tracking-wider mb-0.5">Compensation Incluse</span>
                <span>
                  Prélevez <b>{totalVolumeMl.toFixed(2)} mL</b> pour injecter précisément <b>{baseVolumeMl.toFixed(2)} mL</b> au patient.
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-rose-300 font-mono font-bold shrink-0">+{deadVol.toFixed(2)} mL</div>
          </div>
        )}
      </div>

      {filteredVials.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Box className="w-3 h-3" /> Stock de flacons ({isotopeId.toUpperCase()})
          </h3>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredVials.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-2 bg-slate-800/30 border border-slate-800 rounded-lg group">
                <button className="flex-1 text-left cursor-pointer" onClick={() => loadVial(v)} title="Charger ce flacon">
                  <p className="text-xs font-bold text-slate-300">{v.lotNumber}</p>
                  <p className="text-[10px] text-slate-500">
                    {formatActivity(v.initialActivity, unit)} {unit} / {v.initialVolume} mL
                  </p>
                </button>
                {canManage && (
                  <button
                    onClick={() => removeVial(v.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
                    aria-label="Supprimer ce flacon"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
