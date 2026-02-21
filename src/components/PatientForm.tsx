import React from 'react';
import { User, Ruler, Weight as WeightIcon, Calendar, Baby, Activity, Droplets } from 'lucide-react';
import { PatientData } from '../types';
import { calculateBSA, calculateCreatinineClearance } from '../constants';

interface PatientFormProps {
  data: PatientData;
  onChange: (data: PatientData) => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof PatientData, value: any) => {
    let newData = { ...data };
    
    if (field === 'gender' || field === 'isPediatric') {
      newData = { ...newData, [field]: value };
    } else {
      const numValue = parseFloat(value) || 0;
      newData = { ...newData, [field]: numValue };
    }
    
    // Recalculate BSA if weight or height changes
    if (field === 'weight' || field === 'height') {
      newData.bsa = calculateBSA(newData.weight, newData.height);
    }

    // Recalculate eGFR if relevant fields change
    if (newData.creatinine && newData.creatinine > 0) {
      newData.egfr = calculateCreatinineClearance(newData.age, newData.weight, newData.gender, newData.creatinine);
    } else {
      newData.egfr = undefined;
    }
    
    onChange(newData);
  };

  const isWeightInvalid = data.weight > 300 || (data.weight > 0 && data.weight < 2);
  const isHeightInvalid = data.height > 250 || (data.height > 0 && data.height < 40);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-semibold text-slate-100">Données Patient</h2>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={() => handleChange('gender', 'M')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${data.gender === 'M' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              H
            </button>
            <button 
              onClick={() => handleChange('gender', 'F')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${data.gender === 'F' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              F
            </button>
          </div>
          <button
            onClick={() => handleChange('isPediatric', !data.isPediatric)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              data.isPediatric 
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <Baby className={`w-3.5 h-3.5 ${data.isPediatric ? 'animate-pulse' : ''}`} />
            Pédiatrie
          </button>
        </div>
      </div>

      {data.gender === 'F' && (
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => handleChange('isPregnant', !data.isPregnant)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
              data.isPregnant 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-slate-800/50 text-slate-600 border-slate-800'
            }`}
          >
            Grossesse
          </button>
          <button
            onClick={() => handleChange('isBreastfeeding', !data.isBreastfeeding)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
              data.isBreastfeeding 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                : 'bg-slate-800/50 text-slate-600 border-slate-800'
            }`}
          >
            Allaitement
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <WeightIcon className={`w-4 h-4 ${isWeightInvalid ? 'text-red-400' : ''}`} /> Poids (kg)
          </label>
          <input
            type="number"
            value={data.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-slate-100 focus:ring-2 outline-none transition-all ${
              isWeightInvalid ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'
            }`}
            placeholder="70"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Ruler className={`w-4 h-4 ${isHeightInvalid ? 'text-red-400' : ''}`} /> Taille (cm)
          </label>
          <input
            type="number"
            value={data.height || ''}
            onChange={(e) => handleChange('height', e.target.value)}
            className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-slate-100 focus:ring-2 outline-none transition-all ${
              isHeightInvalid ? 'border-red-500/50 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'
            }`}
            placeholder="175"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Âge
          </label>
          <input
            type="number"
            value={data.age || ''}
            onChange={(e) => handleChange('age', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="45"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-amber-400" /> Créat. (µmol/L)
          </label>
          <input
            type="number"
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
          <span className="text-[9px] text-slate-600 italic mt-1">Mosteller: sqrt(H*W/3600)</span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Fonction Rénale (ClCr)</span>
          <span className={`text-xl font-mono font-bold ${data.egfr && data.egfr < 60 ? 'text-amber-400' : 'text-indigo-400'}`}>
            {data.egfr ? data.egfr.toFixed(1) : '--'} <span className="text-xs font-normal text-slate-500">ml/min</span>
          </span>
          <span className="text-[9px] text-slate-600 italic mt-1 block">Cockcroft-Gault (µmol/L)</span>
          {data.egfr && data.egfr < 30 && (
            <p className="text-[10px] text-red-400 font-bold uppercase mt-1">Insuffisance Sévère</p>
          )}
        </div>
      </div>
    </div>
  );
};
