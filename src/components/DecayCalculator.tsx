import React from 'react';
import { Clock, Zap, TrendingDown } from 'lucide-react';
import { calculateDecay, calculateRequiredInitialActivity, MBQ_TO_MCI } from '../constants';
import { DecayChart } from './DecayChart';
import { Unit } from '../types';

interface DecayCalculatorProps {
  halfLifeMinutes: number;
  onDecayChange: (results: { decayedActivity: number; initialNeeded: number }) => void;
  recommendedActivity: number;
  unit: Unit;
}

export const DecayCalculator: React.FC<DecayCalculatorProps> = ({ 
  halfLifeMinutes, 
  onDecayChange,
  recommendedActivity,
  unit
}) => {
  const [timeOffset, setTimeOffset] = React.useState(0); // minutes

  React.useEffect(() => {
    const decayed = calculateDecay(recommendedActivity, halfLifeMinutes, timeOffset);
    const needed = calculateRequiredInitialActivity(recommendedActivity, halfLifeMinutes, timeOffset);
    onDecayChange({ decayedActivity: decayed, initialNeeded: needed });
  }, [halfLifeMinutes, timeOffset, recommendedActivity, onDecayChange]);

  const formatActivity = (mbq: number) => {
    const val = unit === 'mCi' ? mbq * MBQ_TO_MCI : mbq;
    return val.toFixed(unit === 'mCi' ? 2 : 1);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-semibold text-slate-100">Calcul de Décroissance</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <TrendingDown className="w-3 h-3" /> Courbe de Vie
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
            Temps écoulé / Délai (minutes)
          </label>
          <input
            type="range"
            min="0"
            max="480"
            step="5"
            value={timeOffset}
            onChange={(e) => setTimeOffset(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs font-mono text-slate-500">
            <span>0 min</span>
            <span className="text-amber-400 font-bold">{timeOffset} min ({(timeOffset / 60).toFixed(1)}h)</span>
            <span>8 h</span>
          </div>
        </div>

        <DecayChart 
          initialActivity={unit === 'mCi' ? recommendedActivity * MBQ_TO_MCI : recommendedActivity} 
          halfLifeMinutes={halfLifeMinutes} 
          unit={unit} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs uppercase text-amber-400/80 font-bold">Activité à Prélever</span>
            </div>
            <p className="text-2xl font-mono font-bold text-amber-400">
              {formatActivity(calculateRequiredInitialActivity(recommendedActivity, halfLifeMinutes, timeOffset))}
              <span className="text-sm ml-1 font-normal opacity-70">{unit}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1 italic">
              Pour avoir {formatActivity(recommendedActivity)} {unit} à l'injection.
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <span className="text-xs uppercase text-slate-500 font-bold block mb-1">Activité Résiduelle</span>
            <p className="text-xl font-mono text-slate-300">
              {formatActivity(calculateDecay(recommendedActivity, halfLifeMinutes, timeOffset))}
              <span className="text-sm ml-1 font-normal opacity-70">{unit}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1 italic">
              Si injecté avec {timeOffset} min de retard.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-slate-500" />
            <span className="text-xs uppercase text-slate-500 font-bold">Gestion des Déchets (ALARA)</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Seuil de Libération (1 Bq/g approx)</p>
              <p className="text-sm text-slate-300 font-mono">
                {((halfLifeMinutes * 10) / 1440).toFixed(1)} jours <span className="text-[10px] text-slate-500 font-normal">(10 x T½)</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Activité à 24h</p>
              <p className="text-sm text-slate-300 font-mono">
                {formatActivity(calculateDecay(recommendedActivity, halfLifeMinutes, 1440))} {unit}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
