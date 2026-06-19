/**
 * RadCalc Pro — © 2026 Dr Fréjuste Agboton / NucleaTech Solutions.
 * Tous droits réservés. Voir le fichier LICENSE.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, User, FlaskConical, Clock, ShieldCheck, Cpu, UserCheck, X, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { PatientForm, DEFAULT_PATIENT } from './components/PatientForm';
import { IsotopeSelector } from './components/IsotopeSelector';
import { DecayCalculator } from './components/DecayCalculator';
import { ResultDisplay } from './components/ResultDisplay';
import { VialManager } from './components/VialManager';
import { ExamHistory } from './components/ExamHistory';
import { HumanSilhouette } from './components/HumanSilhouette';
import { SafetyChecklist } from './components/SafetyChecklist';
import { LegalModal, LegalPage } from './components/LegalModal';
import { Navbar } from './components/Navbar';
import { SectionNav, SectionDef } from './components/SectionNav';
import { Segmented, focusRing } from './components/ui';
import { ISOTOPES } from './constants';
import { recommendActivity, resolveEffectiveCoefficient, organAbsorbedDose, calculateBSA, calculateCreatinineClearance, PEDIATRIC_AGE_THRESHOLD } from './lib/dosimetry';
import { useAuth } from './lib/AuthContext';
import { useActivePatient } from './lib/ActivePatientContext';
import { createExam } from './lib/db';
import { cn } from './lib/cn';
import { PatientData, Isotope, CalculationResults, Unit, VialData, Protocol } from './types';

const SECTIONS: SectionDef[] = [
  { id: 'sec-patient', label: 'Patient', icon: <User className="w-3.5 h-3.5" /> },
  { id: 'sec-isotope', label: 'Isotope', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'sec-vial', label: 'Flacon', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: 'sec-decay', label: 'Décroissance', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'sec-results', label: 'Résultats', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
];

export default function App() {
  const { profile, hasPermission } = useAuth();
  const { patient: activePatient, setPatient: setActivePatient } = useActivePatient();
  const [legalPage, setLegalPage] = useState<LegalPage>(null);
  const [unit, setUnit] = useState<Unit>('MBq');
  const [patientData, setPatientData] = useState<PatientData>(DEFAULT_PATIENT);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  const [isDigitalPET, setIsDigitalPET] = useState(false);
  const [thyroidBlocked, setThyroidBlocked] = useState(false);

  // Load the patient selected on the Patients page into the calculator inputs.
  useEffect(() => {
    if (!activePatient) return;
    const { weight, height, age, gender, creatinine } = activePatient;
    const isPediatric = age < PEDIATRIC_AGE_THRESHOLD;
    setPatientData({
      weight,
      height,
      age,
      gender,
      creatinine,
      bsa: calculateBSA(weight, height),
      clcr: !isPediatric && creatinine ? calculateCreatinineClearance(age, weight, gender, creatinine) : undefined,
      isPediatric,
      isPregnant: activePatient.isPregnant,
      isBreastfeeding: activePatient.isBreastfeeding,
    });
  }, [activePatient]);

  const calculateAll = useCallback(() => {
    const rec = recommendActivity({
      protocol: selectedProtocol,
      isotope: selectedIsotope,
      weightKg: patientData.weight,
      isPediatric: patientData.isPediatric,
      isDigitalPET,
      renalClearanceMlMin: patientData.clcr,
    });

    const coeff = resolveEffectiveCoefficient(selectedIsotope, selectedProtocol, { thyroidBlocked });
    const dose = rec.activityMBq * coeff;
    const organSource = selectedProtocol.organDoses ?? selectedIsotope.organDoses;
    const organDoses = organSource?.map((od) => ({
      organ: od.organ,
      dose: organAbsorbedDose(rec.activityMBq, od.coefficientMGyPerMBq),
    }));

    setResults((prev) => ({
      ...prev,
      recommendedActivity: rec.activityMBq,
      estimatedEffectiveDose: dose,
      effectiveCoefficientUsed: coeff,
      organDoses,
      isDigitalPET,
      isFixedActivity: rec.isFixedActivity,
      thyroidBlocked: selectedIsotope.id === 'i131' ? thyroidBlocked : undefined,
      renalAdjustmentFactor: rec.renalAdjustmentFactor,
      pediatricFloorApplied: rec.pediatricFloorApplied,
      warnings: rec.warnings,
      isPregnant: patientData.isPregnant,
      isBreastfeeding: patientData.isBreastfeeding,
    }));
  }, [
    patientData.weight,
    patientData.isPediatric,
    patientData.clcr,
    patientData.isPregnant,
    patientData.isBreastfeeding,
    selectedIsotope,
    selectedProtocol,
    isDigitalPET,
    thyroidBlocked,
  ]);

  useEffect(() => {
    calculateAll();
  }, [calculateAll]);

  const handleIsotopeChange = (isotope: Isotope) => {
    setSelectedIsotope(isotope);
    setSelectedProtocol(isotope.protocols[0]);
    if (isotope.id !== 'f18') setIsDigitalPET(false);
    if (isotope.id !== 'i131') setThyroidBlocked(false);
  };

  const handleDecayChange = useCallback((decayResults: { decayedActivity: number; initialNeeded: number }) => {
    setResults((prev) => ({
      ...prev,
      decayedActivity: decayResults.decayedActivity,
      initialActivityNeeded: decayResults.initialNeeded,
    }));
  }, []);

  const canSaveExam = hasPermission('exams:create') && !!activePatient && results.recommendedActivity > 0;

  const saveExam = async () => {
    if (!profile || !activePatient || !canSaveExam) return;
    setSaveState('saving');
    try {
      await createExam(
        {
          patientId: activePatient.id,
          patientName: `${activePatient.lastName.toUpperCase()} ${activePatient.firstName}`,
          isotopeId: selectedIsotope.id,
          isotopeName: selectedIsotope.name,
          protocolId: selectedProtocol.id,
          protocolName: selectedProtocol.name,
          unit,
          recommendedActivityMBq: results.recommendedActivity,
          administeredActivityMBq: results.initialActivityNeeded || results.recommendedActivity,
          effectiveDoseMSv: results.estimatedEffectiveDose,
          effectiveCoefficientUsed: results.effectiveCoefficientUsed,
          isDigitalPET: results.isDigitalPET,
          thyroidBlocked: results.thyroidBlocked,
          renalAdjustmentFactor: results.renalAdjustmentFactor,
          patientSnapshot: {
            weight: patientData.weight,
            height: patientData.height,
            age: patientData.age,
            gender: patientData.gender,
            isPediatric: patientData.isPediatric,
            creatinine: patientData.creatinine,
            clcr: patientData.clcr,
            bsa: patientData.bsa,
            isPregnant: patientData.isPregnant,
            isBreastfeeding: patientData.isBreastfeeding,
          },
        },
        { uid: profile.uid, name: profile.displayName },
      );
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200 print:bg-white print:text-slate-900 transition-colors duration-200">
      <Navbar />

      {/* Tool toolbar: unit + standard badge */}
      <div className="border-b border-slate-800/60 bg-slate-900/30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Station de calcul dosimétrique</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Standard EANM / ICRP</span>
            </div>
            <Segmented
              ariaLabel="Unité d'activité"
              size="sm"
              value={unit}
              onChange={(v) => setUnit(v)}
              options={[
                { value: 'MBq', label: 'MBq' },
                { value: 'mCi', label: 'mCi' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Active patient banner */}
      <div className="border-b border-slate-800/60 bg-slate-950 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          {activePatient ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-slate-300 truncate">
                  Patient : <span className="font-bold text-slate-100">{activePatient.lastName.toUpperCase()} {activePatient.firstName}</span>
                  <span className="text-slate-500"> · {activePatient.age} ans · {activePatient.weight} kg</span>
                </span>
              </div>
              <button onClick={() => setActivePatient(null)} className={cn('flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg transition-colors shrink-0', focusRing)}>
                <X className="w-3.5 h-3.5" /> Retirer
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 w-full">
              <span className="text-xs text-slate-500">Aucun patient sélectionné — calcul non rattaché à un dossier.</span>
              {hasPermission('patients:read') && (
                <Link to="/patients" className={cn('flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg transition-colors shrink-0', focusRing)}>
                  <Users className="w-3.5 h-3.5" /> Choisir un patient
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <SectionNav sections={SECTIONS} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column: inputs */}
          <div className="lg:col-span-7 space-y-8 print:hidden">
            <motion.section id="sec-patient" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="scroll-mt-36">
              <PatientForm data={patientData} onChange={setPatientData} />
            </motion.section>

            <div id="sec-isotope" className="grid grid-cols-1 md:grid-cols-2 gap-8 scroll-mt-36">
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="space-y-4">
                <IsotopeSelector
                  selectedIsotopeId={selectedIsotope.id}
                  selectedProtocolId={selectedProtocol.id}
                  onIsotopeSelect={handleIsotopeChange}
                  onProtocolSelect={setSelectedProtocol}
                />

                {selectedIsotope.id === 'f18' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDigitalPET ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Technologie PET Digitale</p>
                        <p className="text-[10px] text-slate-500">Réduction de dose optimisée (−40%)</p>
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={isDigitalPET}
                      aria-label="Activer le mode PET digital"
                      onClick={() => setIsDigitalPET(!isDigitalPET)}
                      className={`w-12 h-6 rounded-full transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDigitalPET ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDigitalPET ? 'left-7' : 'left-1'}`} />
                    </button>
                  </motion.div>
                )}

                {selectedIsotope.id === 'i131' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${thyroidBlocked ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Thyroïde bloquée</p>
                        <p className="text-[10px] text-slate-500">
                          Change radicalement la dose efficace ({thyroidBlocked ? '≈0,24' : '≈22'} mSv/MBq)
                        </p>
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={thyroidBlocked}
                      aria-label="Thyroïde bloquée"
                      onClick={() => setThyroidBlocked(!thyroidBlocked)}
                      className={`w-12 h-6 rounded-full transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shrink-0 ${thyroidBlocked ? 'bg-rose-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${thyroidBlocked ? 'left-7' : 'left-1'}`} />
                    </button>
                  </motion.div>
                )}
              </motion.section>

              <motion.section id="sec-vial" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="scroll-mt-36">
                <VialManager
                  data={vialData}
                  onChange={setVialData}
                  requiredActivityMBq={results.initialActivityNeeded || results.recommendedActivity}
                  unit={unit}
                  isotopeId={selectedIsotope.id}
                />
              </motion.section>
            </div>

            <motion.section id="sec-decay" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="scroll-mt-36">
              <DecayCalculator
                halfLifeMinutes={selectedIsotope.halfLifeMinutes}
                recommendedActivity={results.recommendedActivity}
                onDecayChange={handleDecayChange}
                unit={unit}
              />
            </motion.section>
          </div>

          {/* Right column: results & history */}
          <div className="lg:col-span-5 space-y-8">
            <motion.section
              id="sec-results"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:sticky lg:top-36 space-y-8 scroll-mt-36"
            >
              <ResultDisplay
                results={results}
                isotope={selectedIsotope}
                protocol={selectedProtocol}
                unit={unit}
                onSave={saveExam}
                canSave={canSaveExam}
                saveState={saveState}
              />

              <HumanSilhouette isotope={selectedIsotope} activity={results.recommendedActivity} />

              <SafetyChecklist
                isPregnant={patientData.isPregnant}
                isPediatric={patientData.isPediatric}
                clcr={patientData.clcr}
              />

              <div className="print:hidden">
                <ExamHistory />
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-800 py-12 bg-slate-900/20 print:hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Activity className="w-4 h-4" />
            <span>RadCalc Pro v1.3.0 — Outil de Dosimétrie Clinique</span>
          </div>
          <div className="flex gap-8 text-xs text-slate-600 uppercase tracking-widest font-bold">
            <button onClick={() => setLegalPage('privacy')} className="hover:text-emerald-400 transition-colors">Confidentialité</button>
            <button onClick={() => setLegalPage('terms')} className="hover:text-emerald-400 transition-colors">Mentions Légales</button>
            <button onClick={() => setLegalPage('source')} className="hover:text-emerald-400 transition-colors">Développeur</button>
          </div>
        </div>
      </footer>

      <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />
    </div>
  );
}
