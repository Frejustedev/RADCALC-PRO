/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Shield, Info, Github, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { PatientForm } from './components/PatientForm';
import { IsotopeSelector } from './components/IsotopeSelector';
import { DecayCalculator } from './components/DecayCalculator';
import { ResultDisplay } from './components/ResultDisplay';
import { VialManager } from './components/VialManager';
import { HistoryList } from './components/HistoryList';
import { HumanSilhouette } from './components/HumanSilhouette';
import { Documentation } from './components/Documentation';
import { SafetyChecklist } from './components/SafetyChecklist';
import { useTheme } from './ThemeContext';
import { ISOTOPES, getPediatricMultiplier } from './constants';
import { PatientData, Isotope, CalculationResults, Unit, VialData, HistoryEntry, Protocol } from './types';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [unit, setUnit] = useState<Unit>('MBq');
  const [patientData, setPatientData] = useState<PatientData>({
    weight: 70,
    height: 175,
    age: 45,
    gender: 'M',
    bsa: 1.85,
    isPediatric: false,
  });

  const [vialData, setVialData] = useState<VialData>({
    activity: 3700,
    volume: 10,
    referenceTime: '',
    deadVolume: 0.1,
  });

  const [selectedIsotope, setSelectedIsotope] = useState<Isotope>(ISOTOPES[0]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(ISOTOPES[0].protocols[0]);
  const [results, setResults] = useState<CalculationResults>({
    recommendedActivity: 0,
    estimatedEffectiveDose: 0,
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('radcalc_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [isDigitalPET, setIsDigitalPET] = useState(false);

  const calculateAll = useCallback(() => {
    let recommended = 0;
    
    if (patientData.isPediatric) {
      // EANM Pediatric Dosage Card Logic
      const multiplier = getPediatricMultiplier(patientData.weight);
      recommended = selectedProtocol.activityMBqPerKg * multiplier;
    } else {
      recommended = patientData.weight * selectedProtocol.activityMBqPerKg;
    }

    // Digital PET Reduction (approx 40% reduction if digital)
    if (isDigitalPET && selectedIsotope.id === 'f18') {
      recommended *= 0.6;
    }

    // Renal Adjustment (MAG3 example)
    let renalFactor = 1;
    if (selectedProtocol.id === 'renal-mag3' && patientData.egfr && patientData.egfr < 30) {
      renalFactor = 0.5;
      recommended *= renalFactor;
    }

    const dose = recommended * selectedIsotope.doseCoefficientMSvPerMBq;

    setResults(prev => ({
      ...prev,
      recommendedActivity: recommended,
      estimatedEffectiveDose: dose,
      isDigitalPET,
      renalAdjustmentFactor: renalFactor !== 1 ? renalFactor : undefined,
      isPregnant: patientData.isPregnant,
      isBreastfeeding: patientData.isBreastfeeding,
    }));
  }, [patientData.weight, patientData.isPediatric, patientData.egfr, patientData.isPregnant, patientData.isBreastfeeding, selectedIsotope, selectedProtocol, isDigitalPET]);

  useEffect(() => {
    calculateAll();
  }, [calculateAll]);

  const handleIsotopeChange = (isotope: Isotope) => {
    setSelectedIsotope(isotope);
    setSelectedProtocol(isotope.protocols[0]);
  };

  const handleDecayChange = useCallback((decayResults: { decayedActivity: number; initialNeeded: number }) => {
    setResults(prev => ({
      ...prev,
      decayedActivity: decayResults.decayedActivity,
      initialActivityNeeded: decayResults.initialNeeded,
    }));
  }, []);

  const saveToHistory = () => {
    const newEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      patientData,
      isotope: selectedIsotope,
      protocol: selectedProtocol,
      results,
      unit,
      isDigitalPET: results.isDigitalPET,
      renalAdjustmentFactor: results.renalAdjustmentFactor,
    };
    const newHistory = [newEntry, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('radcalc_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('radcalc_history');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200 print:bg-white print:text-slate-900 transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">RadCalc <span className="text-emerald-400">Pro</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Dosimétrie Médicale</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Unit Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setUnit('MBq')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${unit === 'MBq' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                MBq
              </button>
              <button 
                onClick={() => setUnit('mCi')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${unit === 'mCi' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                mCi
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">Standard EANM / CIPR</span>
            </div>

            <button 
              onClick={toggleTheme} 
              className="p-1.5 ml-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
              title={theme === 'dark' ? "Passer au thème clair" : "Passer au thème sombre"}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-7 space-y-8 print:hidden">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PatientForm data={patientData} onChange={setPatientData} />
            </motion.section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <IsotopeSelector 
                  selectedIsotopeId={selectedIsotope.id} 
                  selectedProtocolId={selectedProtocol.id}
                  onIsotopeSelect={handleIsotopeChange} 
                  onProtocolSelect={setSelectedProtocol}
                />

                {selectedIsotope.id === 'f18' && (
                  <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDigitalPET ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Technologie PET Digitale</p>
                        <p className="text-[10px] text-slate-500">Réduction de dose optimisée (-40%)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDigitalPET(!isDigitalPET)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isDigitalPET ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDigitalPET ? 'left-7' : 'left-1'}`} />
                    </button>
                  </motion.section>
                )}
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <VialManager 
                  data={vialData} 
                  onChange={setVialData} 
                  requiredActivity={results.initialActivityNeeded || results.recommendedActivity}
                  unit={unit}
                  onVolumeCalculated={() => {}}
                  isotopeId={selectedIsotope.id}
                />
              </motion.section>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DecayCalculator 
                halfLifeMinutes={selectedIsotope.halfLifeMinutes}
                recommendedActivity={results.recommendedActivity}
                onDecayChange={handleDecayChange}
                unit={unit}
              />
            </motion.section>
          </div>

          {/* Right Column: Results & History */}
          <div className="lg:col-span-5 space-y-8">
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:sticky lg:top-24 space-y-8"
            >
              <ResultDisplay 
                results={results} 
                isotope={selectedIsotope} 
                protocol={selectedProtocol}
                unit={unit} 
                onSave={saveToHistory}
              />

              <HumanSilhouette 
                isotope={selectedIsotope} 
                activity={results.recommendedActivity} 
              />

              <SafetyChecklist 
                isPregnant={patientData.isPregnant}
                isPediatric={patientData.isPediatric}
                egfr={patientData.egfr}
              />
              
              <div className="mt-8 print:hidden">
                <HistoryList entries={history} onClear={clearHistory} />
              </div>

              <div className="mt-8 print:hidden">
                <Documentation />
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800 py-12 bg-slate-900/20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Activity className="w-4 h-4" />
            <span>RadCalc Pro v1.1.0 — Outil de Dosimétrie Clinique</span>
          </div>
          <div className="flex gap-8 text-xs text-slate-600 uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-emerald-400 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Mentions Légales</a>
            <a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <Github className="w-3 h-3" /> Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
