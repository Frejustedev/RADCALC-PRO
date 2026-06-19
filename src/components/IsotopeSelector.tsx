import React from 'react';
import { Activity, ClipboardList } from 'lucide-react';
import { Isotope, Protocol } from '../types';
import { ISOTOPES } from '../constants';
import { effectiveDoseCoefficient } from '../lib/dosimetry';
import { Card, SectionHeading, Pill } from './ui';

interface IsotopeSelectorProps {
  selectedIsotopeId: string;
  selectedProtocolId: string;
  onIsotopeSelect: (isotope: Isotope) => void;
  onProtocolSelect: (protocol: Protocol) => void;
}

const formatHalfLife = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(2)} h`;
  return `${(minutes / 1440).toFixed(2)} j`;
};

export const IsotopeSelector: React.FC<IsotopeSelectorProps> = ({
  selectedIsotopeId,
  selectedProtocolId,
  onIsotopeSelect,
  onProtocolSelect,
}) => {
  const selectedIsotope = ISOTOPES.find((i) => i.id === selectedIsotopeId);
  const selectedProtocol = selectedIsotope?.protocols.find((p) => p.id === selectedProtocolId);
  const selectClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer';

  return (
    <Card>
      <SectionHeading icon={<Activity className="w-5 h-5" />} accent="text-indigo-400" title="Isotope & Protocole" />

      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="isotope-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Isotope
          </label>
          <select
            id="isotope-select"
            value={selectedIsotopeId}
            onChange={(e) => {
              const isotope = ISOTOPES.find((i) => i.id === e.target.value);
              if (isotope) onIsotopeSelect(isotope);
            }}
            className={selectClass}
          >
            <optgroup label="PET Imaging">
              {ISOTOPES.filter((i) => i.type === 'PET').map((iso) => (
                <option key={iso.id} value={iso.id}>{iso.name}</option>
              ))}
            </optgroup>
            <optgroup label="SPECT Scintigraphy">
              {ISOTOPES.filter((i) => i.type === 'SPECT').map((iso) => (
                <option key={iso.id} value={iso.id}>{iso.name}</option>
              ))}
            </optgroup>
            <optgroup label="Therapy / Theranostics">
              {ISOTOPES.filter((i) => i.type === 'Therapy').map((iso) => (
                <option key={iso.id} value={iso.id}>{iso.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {selectedIsotope && (
          <div className="space-y-2">
            <label htmlFor="protocol-select" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ClipboardList className="w-3 h-3" /> Protocole d'Examen
            </label>
            <select
              id="protocol-select"
              value={selectedProtocolId}
              onChange={(e) => {
                const protocol = selectedIsotope.protocols.find((p) => p.id === e.target.value);
                if (protocol) onProtocolSelect(protocol);
              }}
              className={selectClass}
            >
              {selectedIsotope.protocols.map((proto) => (
                <option key={proto.id} value={proto.id}>{proto.name}</option>
              ))}
            </select>
            {selectedProtocol?.description && (
              <p className="text-[10px] text-slate-500 italic px-1">{selectedProtocol.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedProtocol?.pediatric && <Pill tone="indigo">EANM classe {selectedProtocol.pediatric.eanmClass}</Pill>}
              {selectedProtocol?.fixedActivityMBq !== undefined && <Pill tone="amber">Activité fixe</Pill>}
            </div>
          </div>
        )}

        {selectedIsotope && selectedProtocol && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Période (T½)</span>
              <span className="text-slate-200 font-mono text-sm">{formatHalfLife(selectedIsotope.halfLifeMinutes)}</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Activité Réf.</span>
              <span className="text-slate-200 text-sm font-mono">
                {selectedProtocol.fixedActivityMBq !== undefined
                  ? `${selectedProtocol.fixedActivityMBq} MBq`
                  : `${selectedProtocol.activityMBqPerKg} MBq/kg`}
              </span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Coeff. dose</span>
              <span className="text-slate-200 text-sm font-mono">
                {effectiveDoseCoefficient(selectedIsotope, selectedProtocol)} <span className="text-[9px] text-slate-500">mSv/MBq</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
