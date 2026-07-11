import React, { useState } from 'react';
import { X, ClipboardCheck, Syringe, BadgeCheck, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Exam } from '../types';
import { useAuth } from '../lib/AuthContext';
import { recordAdministration, updateSafetyChecks, validateExam } from '../lib/db';
import { SAFETY_ITEMS, areRequiredChecksDone } from '../lib/safety';
import { formatActivity } from '../lib/units';
import { Pill, focusRing } from './ui';
import { cn } from '../lib/cn';

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—');

export const ExamDetailModal: React.FC<{ exam: Exam; onClose: () => void }> = ({ exam, onClose }) => {
  const { profile, hasPermission } = useAuth();
  const actor = profile ? { uid: profile.uid, name: profile.displayName } : null;
  const canEdit = hasPermission('exams:create') && exam.status === 'draft';
  const canValidate = hasPermission('exams:validate') && exam.status === 'draft';
  const checksDone = areRequiredChecksDone(exam.safetyChecks);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Administration form
  const [adm, setAdm] = useState({
    administeredActivityMBq: exam.administration?.administeredActivityMBq ?? '',
    residualActivityMBq: exam.administration?.residualActivityMBq ?? '',
    actualInjectionTime: exam.administration?.actualInjectionTime?.slice(0, 16) ?? '',
    vialLotNumber: exam.administration?.vialLotNumber ?? '',
    route: exam.administration?.route ?? 'IV',
  });

  const toggleCheck = async (key: string) => {
    if (!canEdit || !actor) return;
    const current = exam.safetyChecks?.[key]?.checked === true;
    const next = {
      ...(exam.safetyChecks ?? {}),
      [key]: current
        ? { checked: false }
        : { checked: true, checkedBy: actor.uid, checkedByName: actor.name, checkedAt: new Date().toISOString() },
    };
    try {
      await updateSafetyChecks(exam.id, next);
    } catch {
      setError('Enregistrement du contrôle impossible (droits/connexion).');
    }
  };

  const saveAdministration = async () => {
    if (!canEdit || !actor) return;
    const administered = parseFloat(String(adm.administeredActivityMBq));
    if (!administered || administered <= 0 || !adm.actualInjectionTime) {
      setError("Activité mesurée et heure d'injection sont requises.");
      return;
    }
    const residual = adm.residualActivityMBq === '' ? undefined : parseFloat(String(adm.residualActivityMBq));
    setBusy('adm');
    setError(null);
    try {
      await recordAdministration(
        exam.id,
        {
          administeredActivityMBq: administered,
          residualActivityMBq: residual,
          netActivityMBq: residual !== undefined ? Math.max(0, administered - residual) : administered,
          actualInjectionTime: new Date(adm.actualInjectionTime).toISOString(),
          vialLotNumber: adm.vialLotNumber || undefined,
          route: adm.route || undefined,
        },
        actor,
      );
    } catch {
      setError("Enregistrement de l'administration impossible.");
    } finally {
      setBusy(null);
    }
  };

  const doValidate = async () => {
    if (!canValidate || !actor) return;
    if (!checksDone) {
      setError('Cochez les contrôles de sécurité obligatoires avant de valider.');
      return;
    }
    setBusy('validate');
    setError(null);
    try {
      await validateExam(exam.id, actor);
      onClose();
    } catch {
      setError('Validation impossible.');
      setBusy(null);
    }
  };

  const field = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-100">{exam.patientName}</h2>
            <p className="text-[11px] text-emerald-400 uppercase">{exam.isotopeName} • {exam.protocolName}</p>
          </div>
          <button onClick={onClose} className={cn('p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg', focusRing)} aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-800/40 rounded-xl">
              <p className="text-[10px] uppercase text-slate-500 font-bold">Activité planifiée</p>
              <p className="font-mono text-slate-200">{formatActivity(exam.recommendedActivityMBq, exam.unit)} {exam.unit}</p>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl">
              <p className="text-[10px] uppercase text-slate-500 font-bold">Statut</p>
              {exam.status === 'validated' ? <Pill tone="emerald"><BadgeCheck className="w-3 h-3" /> Validé</Pill> : <Pill tone="amber">Brouillon</Pill>}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Safety checklist */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Contrôles de sécurité
            </h3>
            <div className="space-y-2">
              {SAFETY_ITEMS.map((item) => {
                const c = exam.safetyChecks?.[item.key];
                return (
                  <button
                    key={item.key}
                    disabled={!canEdit}
                    onClick={() => toggleCheck(item.key)}
                    className={cn('w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors disabled:opacity-70', focusRing, c?.checked ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/40 border-slate-800')}
                  >
                    <span className={cn('w-5 h-5 rounded flex items-center justify-center shrink-0 border', c?.checked ? 'bg-emerald-600 border-emerald-500' : 'border-slate-600')}>
                      {c?.checked && <ClipboardCheck className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-xs text-slate-200 block">{item.label} {item.required && <span className="text-rose-400">*</span>}</span>
                      {c?.checked && c.checkedByName && <span className="text-[10px] text-slate-500">{c.checkedByName} · {fmtDate(c.checkedAt)}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">* obligatoire pour valider l'examen.</p>
          </section>

          {/* Administration */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Syringe className="w-4 h-4" /> Administration réelle
            </h3>
            {exam.administration && !canEdit ? (
              <div className="text-xs text-slate-300 space-y-1 p-3 bg-slate-800/40 rounded-xl">
                <p>Mesurée : <b className="font-mono">{exam.administration.administeredActivityMBq} MBq</b>{exam.administration.residualActivityMBq != null && <> · Résidu : <b className="font-mono">{exam.administration.residualActivityMBq} MBq</b></>}</p>
                {exam.administration.netActivityMBq != null && <p>Nette injectée : <b className="font-mono text-emerald-400">{exam.administration.netActivityMBq.toFixed(0)} MBq</b></p>}
                <p>Heure : {fmtDate(exam.administration.actualInjectionTime)}{exam.administration.vialLotNumber && <> · Lot : {exam.administration.vialLotNumber}</>}</p>
                <p className="text-[10px] text-slate-500">Saisie : {exam.administration.recordedByName} · {fmtDate(exam.administration.recordedAt)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase text-slate-500 font-bold">Activité mesurée (MBq)</label><input type="number" min="0" className={field} value={adm.administeredActivityMBq} onChange={(e) => setAdm({ ...adm, administeredActivityMBq: e.target.value })} disabled={!canEdit} /></div>
                <div><label className="text-[10px] uppercase text-slate-500 font-bold">Résidu seringue (MBq)</label><input type="number" min="0" className={field} value={adm.residualActivityMBq} onChange={(e) => setAdm({ ...adm, residualActivityMBq: e.target.value })} disabled={!canEdit} /></div>
                <div><label className="text-[10px] uppercase text-slate-500 font-bold">Heure d'injection</label><input type="datetime-local" className={field} value={adm.actualInjectionTime} onChange={(e) => setAdm({ ...adm, actualInjectionTime: e.target.value })} disabled={!canEdit} /></div>
                <div><label className="text-[10px] uppercase text-slate-500 font-bold">Voie</label>
                  <select className={field} value={adm.route} onChange={(e) => setAdm({ ...adm, route: e.target.value })} disabled={!canEdit}>
                    <option>IV</option><option>Orale</option><option>Inhalation</option><option>Sous-cutanée</option><option>Intra-artérielle</option>
                  </select>
                </div>
                <div className="col-span-2"><label className="text-[10px] uppercase text-slate-500 font-bold">N° de lot / flacon</label><input className={field} value={adm.vialLotNumber} onChange={(e) => setAdm({ ...adm, vialLotNumber: e.target.value })} disabled={!canEdit} /></div>
                {canEdit && (
                  <button onClick={saveAdministration} disabled={busy === 'adm'} className={cn('col-span-2 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold disabled:opacity-60', focusRing)}>
                    {busy === 'adm' && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />} Enregistrer l'administration
                  </button>
                )}
              </div>
            )}
          </section>

          {canValidate && (
            <button
              onClick={doValidate}
              disabled={busy === 'validate' || !checksDone}
              title={checksDone ? '' : 'Cochez les contrôles obligatoires'}
              className={cn('w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed', focusRing)}
            >
              {busy === 'validate' ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /> : <BadgeCheck className="w-4 h-4" />}
              Valider l'examen{!checksDone && ' (contrôles requis)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
