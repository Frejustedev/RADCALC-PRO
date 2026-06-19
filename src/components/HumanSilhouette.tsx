import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Isotope } from '../types';

interface HumanSilhouetteProps {
  isotope: Isotope;
  activity: number; // MBq
}

export const HumanSilhouette: React.FC<HumanSilhouetteProps> = ({ isotope, activity }) => {
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);

  // Simple organ positions (relative to 200x500 silhouette)
  const organMap: Record<string, { x: number, y: number, r: number, color: string }> = {
    "Cerveau": { x: 100, y: 38, r: 15, color: "fill-purple-400" },
    "Thyroïde": { x: 100, y: 85, r: 8, color: "fill-red-400" },
    "Poumons": { x: 100, y: 150, r: 20, color: "fill-cyan-400" },
    "Cœur": { x: 110, y: 160, r: 12, color: "fill-rose-500" },
    "Foie": { x: 80, y: 200, r: 18, color: "fill-emerald-600" },
    "Rate": { x: 125, y: 205, r: 10, color: "fill-violet-600" },
    "Estomac": { x: 110, y: 215, r: 15, color: "fill-orange-400" },
    "Reins": { x: 100, y: 240, r: 10, color: "fill-blue-400" },
    "Côlon": { x: 100, y: 290, r: 18, color: "fill-amber-600" },
    "Vessie": { x: 100, y: 350, r: 10, color: "fill-yellow-400" },
    "Moelle": { x: 100, y: 230, r: 5, color: "fill-slate-400" },
  };

  // Special case for bilateral organs
  const bilateralOrgans = ["Reins", "Poumons"];

  const activeOrgans = isotope.organDoses || [];

  return (
    <div className="relative bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Cartographie de Dose</h3>
      
      <div className="relative w-48 h-[400px]">
        <svg viewBox="0 0 200 500" className="w-full h-full">
          {/* Human Silhouette Path - More detailed */}
          <path
            d="M100,10 C115,10 128,22 128,38 C128,54 115,68 100,68 C85,68 72,54 72,38 C72,22 85,10 100,10 M75,75 L125,75 C130,75 135,80 135,85 L135,100 C155,100 175,115 175,140 L175,220 C175,235 165,245 150,245 L140,245 L140,480 C140,490 130,495 120,495 L110,495 L110,320 L90,320 L90,495 L80,495 C70,495 60,490 60,480 L60,245 L50,245 C35,245 25,235 25,220 L25,140 C25,115 45,100 65,100 L65,85 C65,80 70,75 75,75 Z"
            className="fill-slate-800/50 stroke-slate-700"
            strokeWidth="2"
          />

          {/* Organs */}
          {activeOrgans.map((od) => {
            const config = organMap[od.organ];
            if (!config) return null;

            const isHovered = hoveredOrgan === od.organ;

            if (bilateralOrgans.includes(od.organ)) {
              return (
                <React.Fragment key={od.organ}>
                  <motion.circle
                    cx={config.x - 20}
                    cy={config.y}
                    r={config.r}
                    className={`${config.color} cursor-pointer`}
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: isHovered ? 1 : 0.6,
                      scale: isHovered ? 1.2 : 1,
                      filter: isHovered ? 'blur(0px)' : 'blur(1px)'
                    }}
                    onMouseEnter={() => setHoveredOrgan(od.organ)}
                    onMouseLeave={() => setHoveredOrgan(null)}
                  />
                  <motion.circle
                    cx={config.x + 20}
                    cy={config.y}
                    r={config.r}
                    className={`${config.color} cursor-pointer`}
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: isHovered ? 1 : 0.6,
                      scale: isHovered ? 1.2 : 1,
                      filter: isHovered ? 'blur(0px)' : 'blur(1px)'
                    }}
                    onMouseEnter={() => setHoveredOrgan(od.organ)}
                    onMouseLeave={() => setHoveredOrgan(null)}
                  />
                </React.Fragment>
              );
            }

            return (
              <motion.circle
                key={od.organ}
                cx={config.x}
                cy={config.y}
                r={config.r}
                className={`${config.color} cursor-pointer`}
                initial={{ opacity: 0.3 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0.6,
                  scale: isHovered ? 1.2 : 1,
                  filter: isHovered ? 'blur(0px)' : 'blur(1px)'
                }}
                onMouseEnter={() => setHoveredOrgan(od.organ)}
                onMouseLeave={() => setHoveredOrgan(null)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredOrgan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute top-1/2 left-full ml-4 z-50 bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl min-w-[120px]"
            >
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{hoveredOrgan}</p>
              <p className="text-lg font-mono font-bold text-emerald-400">
                {(activity * (activeOrgans.find(o => o.organ === hoveredOrgan)?.coefficientMGyPerMBq || 0)).toFixed(2)}
                <span className="text-xs ml-1 font-normal text-slate-500">mGy</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {activeOrgans.map(od => (
          <div 
            key={od.organ}
            className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border transition-colors cursor-help ${
              hoveredOrgan === od.organ 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            onMouseEnter={() => setHoveredOrgan(od.organ)}
            onMouseLeave={() => setHoveredOrgan(null)}
          >
            {od.organ}
          </div>
        ))}
      </div>
    </div>
  );
};
