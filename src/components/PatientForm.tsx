import React from 'react';
import { User, Ruler, Weight as WeightIcon, Calendar, Baby, Droplets } from 'lucide-react';
import { PatientData } from '../types';
import { calculateBSA, calculateCreatinineClearance } from '../lib/dosimetry';
import { Card, focusRing } from './ui';
import { cn } from '../lib/cn';

/** Single source of truth for the default/reset patient. */
export const DEFAULT_PATIENT: PatientData = {
  weight: 70,
  height: 175,
  age: 45,
  gender: 'M',
  bsa: calculateBSA(70, 175),
  isPediatric: false,
};

interface PatientFormProps {
  data: PatientData;
  onChange: (data: PatientData) => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof PatientData, value: unknown) => {
    let newData = { ...data };

    if (field === 'gender' || field === 'isPediatric' || field === 'isPregnant' || field === 'isBreastfeeding') {
      newData = { ...newData, [field]: value };
    } else {
      const numValue = parseFloat(value as string) || 0;
      newData = { ...newData, [field]: numValue };
    }

    if (field === 'weight' || field === 'height') {
      newData.bsa = calculateBSA(newData.weight, newData.height);
    }

    // Cockcroft-Gault is not valid in young children → suppress for paediatric patients.
    if (newData.isPediatric || !newData.creatinine || newData.creatinine <= 0) {
      newData.clcr = undefined;
    } else {
      newData.clcr = calculateCreatinineClearance(newData.age, newData.weight, newData.gender, newData.creatinine);
    }

    onChange(newData);
  };

  const isWeightInvalid = data.weight > 300 || (data.weight > 0 && data.weight < 2);
  const isHeightInvalid = data.height > 250 || (data.height > 0 && data.height < 40);

  const toggleBase =
    'flex items-center justify-center gap-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all';

  return (
    <Card>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-semibold text-slate-100">Données Patient</h2>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => onChange(DEFAULT_PATIENT)}
            className={cn('px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-all', focusRing)}
            title="Réinitialiser"
          >
            Reset
          </button>
          <div role="radiogroup" aria-label="Sexe" className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              role="radio"
              aria-checked={data.gender === 'M'}
              aria-label="Homme"
              onClick={() => handleChange('gender', 'M')}
              className={cn('px-3 py-1 text-[10px] font-bold rounded-md transition-all', focusRing, data.gender === 'M' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
            >
              H
            </button>
            <button
              role="radio"
              aria-checked={data.gender === 'F'}
              aria-label="Femme"
              onClick={() => handleChange('gender', 'F')}
              className={cn('px-3 py-1 text-[10px] font-bold rounded-md transition-all', focusRing, data.gender === 'F' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
            >
              F
            </button>
          </div>
          <button
            aria-pressed={data.isPediatric}
            onClick={() => handleChange('isPediatric', !data.isPediatric)}
            className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border', focusRing, data.isPediatric ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-800 text-slate-400 border-slate-700')}
          >
            <Baby className={`w-3.5 h-3.5 ${data.isPediatric ? 'animate-pulse motion-reduce:animate-none' : ''}`} />
            Pédiatrie
          </button>
        </div>
      </div>

      {data.gender === 'F' && (
        <div className="mb-6 flex gap-4">
          <button
            aria-pressed={!!data.isPregnant}
            onClick={() => handleChange('isPregnant', !data.isPregnant)}
            className={cn(toggleBase, focusRing, 'flex-1 py-2', data.isPregnant ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-800')}
          >
            Grossesse
          </button>
          <button
            aria-pressed={!!data.isBreastfeeding}
            onClick={() => handleChange('isBreastfeeding', !data.isBreastfeeding)}
            className={cn(toggleBase, focusRing, 'flex-1 py-2', data.isBreastfeeding ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-800')}
          >
            Allaitement
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label htmlFor="pf-weight" className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <WeightIcon className={`w-4 h-4 ${isWeightInvalid ? 'text-red-400' : ''}`} /> Poids (kg)
          </label>
          <input
            id="pf-weight"
            type="number"
            min="0"
            max="400"
            value={data.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            aria-invalid={isWeightInvalid}
            aria-describedby={isWeightInvalid ? 'pf-weight-err' : undefined}
            className={cn('w-full bg-slate-800 border rounded-xl px-4 py-3 text-slate-100 focus:ring-2 outline-none transition-all', isWeightInvalid ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500')}
            placeholder="70"
          />
          {isWeightInvalid && <p id="pf-weight-err" className="text-[10px] text-red-400">Poids hors plage plausible (2–300 kg).</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="pf-height" className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Ruler className={`w-4 h-4 ${isHeightInvalid ? 'text-red-400' : ''}`} /> Taille (cm)
          </label>
          <input
            id="pf-height"
            type="number"
            min="0"
            max="260"
            value={data.height || ''}
            onChange={(e) => handleChange('height', e.target.value)}
            aria-invalid={isHeightInvalid}
            aria-describedby={isHeightInvalid ? 'pf-height-err' : undefined}
            className={cn('w-full bg-slate-800 border rounded-xl px-4 py-3 text-slate-100 focus:ring-2 outline-none transition-all', isHeightInvalid ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500')}
            placeholder="175"
          />
          {isHeightInvalid && <p id="pf-height-err" className="text-[10px] text-red-400">Taille hors plage plausible (40–250 cm).</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="pf-age" className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Âge
          </label>
          <input
            id="pf-age"
            type="number"
            min="0"
            max="130"
            value={data.age || ''}
            onChange={(e) => handleChange('age', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="45"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="pf-creat" className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-amber-400" /> Créat. (µmol/L)
          </label>
          <input
            id="pf-creat"
            type="number"
            min="0"
            value={data.creatinine || ''}
            onChange={(e) => handleChange('creatinine', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            placeholder="80"
          />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Surface Corporelle (BSA)</span>
          <span className="text-xl font-mono font-bold text-emerald-400">
            {data.bsa.toFixed(2)} <span className="text-xs font-normal text-slate-500">m²</span>
          </span>
          <span className="text-[10px] text-slate-500 italic mt-1">Mosteller : √(T×P/3600)</span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Clairance Créatinine (ClCr)</span>
          <span className={`text-xl font-mono font-bold ${data.clcr && data.clcr < 60 ? 'text-amber-400' : 'text-indigo-400'}`}>
            {data.clcr ? data.clcr.toFixed(1) : '--'} <span className="text-xs font-normal text-slate-500">ml/min</span>
          </span>
          <span className="text-[10px] text-slate-500 italic mt-1 block">
            {data.isPediatric ? 'Non applicable (pédiatrie)' : 'Cockcroft-Gault (µmol/L)'}
          </span>
          {data.clcr && data.clcr < 30 && <p className="text-[10px] text-red-400 font-bold uppercase mt-1">Insuffisance Sévère</p>}
        </div>
      </div>
    </Card>
  );
};
