import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { calculateDecay } from '../lib/dosimetry';
import { fromMBq } from '../lib/units';
import { Unit } from '../types';

interface DecayChartProps {
  initialActivity: number; // MBq
  halfLifeMinutes: number;
  unit: Unit;
}

export const DecayChart: React.FC<DecayChartProps> = ({ initialActivity, halfLifeMinutes, unit }) => {
  const data = React.useMemo(() => {
    const points = [];
    // Show decay over 4 half-lives or 24 hours, whichever is smaller.
    const maxTime = Math.min(halfLifeMinutes * 4, 1440);
    const step = maxTime / 20 || 1;

    for (let t = 0; t <= maxTime; t += step) {
      const mbq = calculateDecay(initialActivity, halfLifeMinutes, t);
      points.push({
        time: Math.round(t),
        activity: parseFloat(fromMBq(mbq, unit).toFixed(2)),
      });
    }
    return points;
  }, [initialActivity, halfLifeMinutes, unit]);

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}m`} />
          <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#10b981', fontSize: '12px' }}
            labelStyle={{ color: '#64748b', fontSize: '10px' }}
            formatter={(value) => [`${value} ${unit}`, 'Activité']}
            labelFormatter={(label) => `Temps: ${label} min`}
          />
          <Area type="monotone" dataKey="activity" stroke="#10b981" fillOpacity={1} fill="url(#colorActivity)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
