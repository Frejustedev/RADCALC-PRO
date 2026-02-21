import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OrganDose {
  organ: string;
  dose: number;
  x: number;
  y: number;
}

interface HumanBodyProps {
  organDoses: OrganDose[];
}

export const HumanBody: React.FC<HumanBodyProps> = ({ organDoses }) => {
  const [hoveredOrgan, setHoveredOrgan] = React.useState<OrganDose | null>(null);

  return (
    <div className="relative w-full max-w-[200px] mx-auto aspect-[1/2.5] bg-slate-800/20 rounded-3xl border border-slate-700/50 p-4 overflow-visible">
      <svg viewBox="0 0 100 250" className="w-full h-full fill-slate-700/30 stroke-slate-600/50 stroke-[0.5]">
        {/* Simple Human Silhouette */}
        <path d="M50,10 C55,10 60,15 60,22 C60,30 55,35 50,35 C45,35 40,30 40,22 C40,15 45,10 50,10 Z" /> {/* Head */}
        <path d="M40,35 L60,35 L75,50 L75,100 L65,100 L65,180 L55,180 L55,240 L45,240 L45,180 L35,180 L35,100 L25,100 L25,50 Z" /> {/* Body */}
        
        {/* Organ Hotspots */}
        {organDoses.map((od) => (
          <g 
            key={od.organ}
            onMouseEnter={() => setHoveredOrgan(od)}
            onMouseLeave={() => setHoveredOrgan(null)}
            className="cursor-help"
          >
            <motion.circle
              cx={od.x}
              cy={od.y}
              r={hoveredOrgan?.organ === od.organ ? 6 : 4}
              className="fill-emerald-500/60 stroke-emerald-400 stroke-1"
              animate={{ 
                scale: hoveredOrgan?.organ === od.organ ? 1.5 : [1, 1.2, 1],
                opacity: hoveredOrgan?.organ === od.organ ? 1 : 0.6
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                scale: { duration: 0.2 } 
              }}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredOrgan && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 bg-slate-900 border border-emerald-500/30 p-2 rounded-lg shadow-2xl pointer-events-none whitespace-nowrap"
            style={{ 
              left: `${hoveredOrgan.x}%`, 
              top: `${hoveredOrgan.y}%`,
              transform: 'translate(-50%, -120%)'
            }}
          >
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{hoveredOrgan.organ}</p>
            <p className="text-sm font-mono text-slate-100">{hoveredOrgan.dose.toFixed(2)} mSv</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 text-center">
        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Vue Antérieure</p>
      </div>
    </div>
  );
};
