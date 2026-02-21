import React, { useState, useEffect } from 'react';
import { FlaskConical, Clock, Droplets, Save, Trash2, Box } from 'lucide-react';
import { VialData, Vial } from '../types';

interface VialManagerProps {
  data: VialData;
  onChange: (data: VialData) => void;
  requiredActivity: number; // MBq
  unit: 'MBq' | 'mCi';
  onVolumeCalculated: (volume: number) => void;
  isotopeId: string;
}

export const VialManager: React.FC<VialManagerProps> = ({ data, onChange, requiredActivity, unit, onVolumeCalculated, isotopeId }) => {
  const [vials, setVials] = useState<Vial[]>(() => {
    const saved = localStorage.getItem('radcalc_vials');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('radcalc_vials', JSON.stringify(vials));
  }, [vials]);

  const volumeToDraw = React.useMemo(() => {
    if (data.activity <= 0 || data.volume <= 0) return 0;
    const concentration = data.activity / data.volume;
    const vol = requiredActivity / concentration;
    onVolumeCalculated(vol);
    return vol;
  }, [data, requiredActivity, onVolumeCalculated]);

  const saveVial = () => {
    const newVial: Vial = {
      id: crypto.randomUUID(),
      isotopeId,
      initialActivity: data.activity,
      initialVolume: data.volume,
      referenceTime: data.referenceTime || new Date().toISOString(),
      lotNumber: `LOT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    };
    setVials([newVial, ...vials]);
  };

  const deleteVial = (id: string) => {
    setVials(vials.filter(v => v.id !== id));
  };

  const loadVial = (vial: Vial) => {
    onChange({
      activity: vial.initialActivity,
      volume: vial.initialVolume,
      referenceTime: vial.referenceTime
    });
  };

  const filteredVials = vials.filter(v => v.isotopeId === isotopeId);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-slate-100">Gestion du Flacon</h2>
        </div>
        <button 
          onClick={saveVial}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
          title="Enregistrer ce flacon en stock"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Activité du Flacon ({unit})</label>
          <input
            type="number"
            value={data.activity || ''}
            onChange={(e) => onChange({ ...data, activity: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            placeholder="3700"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Volume Total (mL)</label>
          <input
            type="number"
            value={data.volume || ''}
            onChange={(e) => onChange({ ...data, volume: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            placeholder="10"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Droplets className="w-6 h-6 text-purple-400" />
          <div>
            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold block">Volume à Prélever</span>
            <span className="text-2xl font-mono font-bold text-purple-400">
              {volumeToDraw > 0 ? volumeToDraw.toFixed(2) : '0.00'} <span className="text-sm font-normal">mL</span>
            </span>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-500 italic max-w-[150px]">
          Concentration: {(data.activity / (data.volume || 1)).toFixed(1)} {unit}/mL
        </div>
      </div>

      {filteredVials.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Box className="w-3 h-3" /> Stock de flacons ({isotopeId.toUpperCase()})
          </h3>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredVials.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-2 bg-slate-800/30 border border-slate-800 rounded-lg group">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => loadVial(v)}
                >
                  <p className="text-xs font-bold text-slate-300">{v.lotNumber}</p>
                  <p className="text-[10px] text-slate-500">{v.initialActivity}{unit} / {v.initialVolume}mL</p>
                </div>
                <button 
                  onClick={() => deleteVial(v.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
