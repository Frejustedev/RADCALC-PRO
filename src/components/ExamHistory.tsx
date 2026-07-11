import React, { useEffect, useState } from 'react';
import { History, FileSpreadsheet, BadgeCheck, Loader2, Syringe } from 'lucide-react';
import { Exam, Unit } from '../types';
import { subscribeExams } from '../lib/db';
import { useAuth } from '../lib/AuthContext';
import { formatActivity } from '../lib/units';
import { areRequiredChecksDone } from '../lib/safety';
import { Card, SectionHeading, Pill, focusRing } from './ui';
import { ExamDetailModal } from './ExamDetailModal';
import { cn } from '../lib/cn';

const DISPLAY_LIMIT = 25;

export const ExamHistory: React.FC = () => {
  useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = exams.find((e) => e.id === selectedId) ?? null;

  useEffect(() => subscribeExams((list) => { setExams(list); setLoading(false); }, () => { setError('Examens indisponibles (droits ou connexion).'); setLoading(false); }), []);

  const exportCSV = () => {
    const headers = ['Date', 'Patient', 'Isotope', 'Protocole', 'Activite', 'Unite', 'DoseEff(mSv)', 'Coeff', 'ThyroideBloquee', 'Statut', 'RealisePar', 'ValidePar'];
    const rows = exams.map((e) => [
      new Date(e.createdAt).toLocaleString(),
      e.patientName,
      e.isotopeName,
      e.protocolName,
      formatActivity(e.recommendedActivityMBq, e.unit as Unit),
      e.unit,
      e.effectiveDoseMSv.toFixed(3),
      e.effectiveCoefficientUsed ?? '',
      e.thyroidBlocked === undefined ? 'N/A' : e.thyroidBlocked ? 'OUI' : 'NON',
      e.status === 'validated' ? 'Validé' : 'Brouillon',
      e.performedByName,
      e.validatedByName ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radcalc_examens_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <SectionHeading
        icon={<History className="w-5 h-5" />}
        accent="text-slate-400"
        title="Examens du centre"
        right={
          exams.length > 0 ? (
            <button onClick={exportCSV} className={cn('p-2 hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors', focusRing)} title="Exporter en CSV" aria-label="Exporter en CSV">
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-3 flex items-center justify-between gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[11px]">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold hover:text-rose-300">✕</button>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin motion-reduce:animate-none" /></div>
      ) : exams.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">Aucun examen enregistré pour le moment.</p>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
          {exams.slice(0, DISPLAY_LIMIT).map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={cn('w-full text-left p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors', focusRing)}
            >
              <div className="flex justify-between items-start mb-1.5 gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{e.patientName}</p>
                  <p className="text-[11px] text-emerald-400 uppercase tracking-tight truncate">{e.isotopeName} • {e.protocolName}</p>
                </div>
                {e.status === 'validated' ? (
                  <Pill tone="emerald"><BadgeCheck className="w-3 h-3" /> Validé</Pill>
                ) : (
                  <Pill tone="amber">Brouillon</Pill>
                )}
              </div>
              <div className="flex justify-between items-end gap-2">
                <div className="text-[11px] text-slate-500">
                  <span className="text-slate-300 font-mono">{formatActivity(e.recommendedActivityMBq, e.unit as Unit)} {e.unit}</span>
                  {' • '}<span className="text-emerald-400 font-mono">{e.effectiveDoseMSv.toFixed(2)} mSv</span>
                  <span className="block text-slate-600 mt-0.5">par {e.performedByName} · {new Date(e.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {e.administration && <Pill tone="indigo"><Syringe className="w-3 h-3" /> Administré</Pill>}
                  {e.status === 'draft' && !areRequiredChecksDone(e.safetyChecks) && <Pill tone="rose">Contrôles ⌛</Pill>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {selected && <ExamDetailModal exam={selected} onClose={() => setSelectedId(null)} />}
    </Card>
  );
};
