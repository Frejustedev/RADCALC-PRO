import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calculator, Loader2, BadgeCheck, Activity, Syringe } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Card, Pill, focusRing } from '../components/ui';
import { ExamDetailModal } from '../components/ExamDetailModal';
import { useAuth } from '../lib/AuthContext';
import { useActivePatient } from '../lib/ActivePatientContext';
import { subscribePatient, subscribeExamsByPatient } from '../lib/db';
import { calculateBSA } from '../lib/dosimetry';
import { areRequiredChecksDone } from '../lib/safety';
import { formatActivity } from '../lib/units';
import { Patient, Exam } from '../types';
import { cn } from '../lib/cn';

export const PatientDetail: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { setPatient } = useActivePatient();
  const [patient, setPatientState] = useState<Patient | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = exams.find((e) => e.id === selectedId) ?? null;

  useEffect(() => subscribePatient(id, setPatientState, () => setPatientState(null)), [id]);
  useEffect(() => subscribeExamsByPatient(id, (list) => { setExams(list); setLoading(false); }, () => setLoading(false)), [id]);

  const validated = exams.filter((e) => e.status === 'validated');
  const cumulativeDose = validated.reduce((sum, e) => sum + (e.effectiveDoseMSv || 0), 0);

  const useInCalculator = () => {
    if (patient) {
      setPatient(patient);
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/patients" className={cn('inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 mb-6 rounded px-1', focusRing)}>
          <ArrowLeft className="w-4 h-4" /> Patients
        </Link>

        {!patient ? (
          <Card className="text-center py-12"><p className="text-slate-400">Patient introuvable.</p></Card>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">{patient.lastName.toUpperCase()} {patient.firstName}</h1>
                <p className="text-sm text-slate-500 font-mono">
                  {patient.dossierNumber ? `Dossier ${patient.dossierNumber} · ` : ''}{patient.gender === 'M' ? 'Homme' : 'Femme'} · {patient.age} ans · {patient.weight} kg · {patient.height} cm · BSA {calculateBSA(patient.weight, patient.height).toFixed(2)} m²
                </p>
                {patient.notes && <p className="text-xs text-slate-500 italic mt-2 max-w-xl">{patient.notes}</p>}
              </div>
              {hasPermission('exams:create') && (
                <button onClick={useInCalculator} className={cn('flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm', focusRing)}>
                  <Calculator className="w-4 h-4" /> Nouvel examen
                </button>
              )}
            </div>

            {/* Radioprotection summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Dose efficace cumulée</p>
                <p className="text-2xl font-mono font-bold text-emerald-400">{cumulativeDose.toFixed(2)} <span className="text-sm text-slate-500">mSv</span></p>
                <p className="text-[10px] text-slate-600">sur {validated.length} examen(s) validé(s)</p>
              </Card>
              <Card className="p-4">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Examens</p>
                <p className="text-2xl font-mono font-bold text-slate-200">{exams.length}</p>
                <p className="text-[10px] text-slate-600">{exams.length - validated.length} brouillon(s)</p>
              </Card>
              <Card className="p-4 hidden sm:block">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Dernier examen</p>
                <p className="text-sm font-mono text-slate-200 mt-1">{exams[0] ? new Date(exams[0].createdAt).toLocaleDateString() : '—'}</p>
              </Card>
            </div>

            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Historique des examens</h2>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin motion-reduce:animate-none" /></div>
            ) : exams.length === 0 ? (
              <Card className="text-center py-10"><p className="text-slate-400">Aucun examen pour ce patient.</p></Card>
            ) : (
              <div className="space-y-3">
                {exams.map((e) => (
                  <button key={e.id} onClick={() => setSelectedId(e.id)} className={cn('w-full text-left', focusRing, 'rounded-2xl')}>
                    <Card className="p-4 hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-emerald-400 uppercase truncate">{e.isotopeName} • {e.protocolName}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {formatActivity(e.recommendedActivityMBq, e.unit)} {e.unit} · {e.effectiveDoseMSv.toFixed(2)} mSv · {new Date(e.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {e.status === 'validated' ? <Pill tone="emerald"><BadgeCheck className="w-3 h-3" /> Validé</Pill> : <Pill tone="amber">Brouillon</Pill>}
                          {e.administration && <Pill tone="indigo"><Syringe className="w-3 h-3" /> Administré</Pill>}
                          {e.status === 'draft' && !areRequiredChecksDone(e.safetyChecks) && <Pill tone="rose">Contrôles ⌛</Pill>}
                        </div>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      {selected && <ExamDetailModal exam={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
};
