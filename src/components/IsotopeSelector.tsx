import React from 'react';
import { Activity, ClipboardList } from 'lucide-react';
import { Isotope, Protocol } from '../types';
import { ISOTOPES } from '../constants';

interface IsotopeSelectorProps {
  selectedIsotopeId: string;
  selectedProtocolId: string;
  onIsotopeSelect: (isotope: Isotope) => void;
  onProtocolSelect: (protocol: Protocol) => void;
}

export const IsotopeSelector: React.FC<IsotopeSelectorProps> = ({ 
  selectedIsotopeId, 
  selectedProtocolId,
  onIsotopeSelect,
  onProtocolSelect
}) => {
  const selectedIsotope = ISOTOPES.find(i => i.id === selectedIsotopeId);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold text-slate-100">Sélecteur d'Isotope & Protocole</h2>
      </div>

      <div className="space-y-6">
        {/* Isotope Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Isotope</label>
          <select
            value={selectedIsotopeId}
            onChange={(e) => {
              const isotope = ISOTOPES.find(i => i.id === e.target.value);
              if (isotope) onIsotopeSelect(isotope);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
          >
            <optgroup label="PET Imaging" className="bg-slate-900 text-indigo-400">
              {ISOTOPES.filter(i => i.type === 'PET').map((iso) => (
                <option key={iso.id} value={iso.id} className="text-slate-100">
                  {iso.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="SPECT Scintigraphy" className="bg-slate-900 text-emerald-400">
              {ISOTOPES.filter(i => i.type === 'SPECT').map((iso) => (
                <option key={iso.id} value={iso.id} className="text-slate-100">
                  {iso.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Therapy / Theranostics" className="bg-slate-900 text-amber-400">
              {ISOTOPES.filter(i => i.type === 'Therapy').map((iso) => (
                <option key={iso.id} value={iso.id} className="text-slate-100">
                  {iso.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Protocol Selection */}
        {selectedIsotope && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ClipboardList className="w-3 h-3" /> Protocole d'Examen
            </label>
            <select
              value={selectedProtocolId}
              onChange={(e) => {
                const protocol = selectedIsotope.protocols.find(p => p.id === e.target.value);
                if (protocol) onProtocolSelect(protocol);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              {selectedIsotope.protocols.map((proto) => (
                <option key={proto.id} value={proto.id}>
                  {proto.name}
                </option>
              ))}
            </select>
            {selectedProtocolId && (
              <p className="text-[10px] text-slate-500 italic px-1">
                {selectedIsotope.protocols.find(p => p.id === selectedProtocolId)?.description}
              </p>
            )}
          </div>
        )}

        {selectedIsotopeId && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span className="text-xs uppercase text-slate-500 font-bold block mb-1">Période (T½)</span>
              <span className="text-slate-200 font-mono">
                {formatHalfLife(selectedIsotope?.halfLifeMinutes || 0)}
              </span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span className="text-xs uppercase text-slate-500 font-bold block mb-1">Activité Réf.</span>
              <span className="text-slate-200 text-sm font-mono">
                {selectedIsotope?.protocols.find(p => p.id === selectedProtocolId)?.activityMBqPerKg} MBq/kg
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatHalfLife = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(2)} h`;
  return `${(minutes / 1440).toFixed(2)} j`;
};
