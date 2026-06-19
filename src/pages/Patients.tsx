import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Pencil, Trash2, Calculator, X, Loader2, UserPlus } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Card, focusRing } from '../components/ui';
import { useAuth } from '../lib/AuthContext';
import { useActivePatient } from '../lib/ActivePatientContext';
import { subscribePatients, createPatient, updatePatient, deletePatient } from '../lib/db';
import { calculateBSA } from '../lib/dosimetry';
import { Patient } from '../types';
import { cn } from '../lib/cn';

const ageFromBirth = (iso?: string): number | null => {
  if (!iso) return null;
  const b = new Date(iso);
  if (Number.isNaN(b.getTime())) return null;
  const diff = Date.now() - b.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
};

type Draft = Partial<Patient>;

export const Patients: React.FC = () => {
  const { profile, hasPermission } = useAuth();
  const { setPatient } = useActivePatient();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Draft | null>(null);
  const canWrite = hasPermission('patients:write');

  useEffect(() => {
    const unsub = subscribePatients(
      (list) => { setPatients(list); setLoading(false); },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName} ${p.dossierNumber ?? ''}`.toLowerCase().includes(q),
    );
  }, [patients, search]);

  const useInCalculator = (p: Patient) => {
    setPatient(p);
    navigate('/app');
  };

  const remove = async (p: Patient) => {
    if (window.confirm(`Supprimer définitivement le patient ${p.firstName} ${p.lastName} ?`)) {
      await deletePatient(p.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">Patients</h1>
            <span className="text-sm text-slate-500">({patients.length})</span>
          </div>
          {canWrite && (
            <button onClick={() => setEditing({ gender: 'M' })} className={cn('flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all', focusRing)}>
              <Plus className="w-4 h-4" /> Nouveau patient
            </button>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou n° de dossier…"
            aria-label="Rechercher un patient"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin motion-reduce:animate-none" /></div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <UserPlus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">{patients.length === 0 ? 'Aucun patient enregistré pour le moment.' : 'Aucun patient ne correspond à la recherche.'}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <Card key={p.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-100">{p.lastName.toUpperCase()} {p.firstName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {p.dossierNumber ? `Dossier ${p.dossierNumber} • ` : ''}{p.gender === 'M' ? 'H' : 'F'} • {p.age} ans
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {canWrite && (
                      <button onClick={() => setEditing(p)} className={cn('p-1.5 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors', focusRing)} aria-label="Modifier"><Pencil className="w-4 h-4" /></button>
                    )}
                    {canWrite && (
                      <button onClick={() => remove(p)} className={cn('p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors', focusRing)} aria-label="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-slate-400 font-mono">
                  <span>{p.weight} kg</span><span>{p.height} cm</span><span>BSA {calculateBSA(p.weight, p.height).toFixed(2)} m²</span>
                </div>
                <button onClick={() => useInCalculator(p)} className={cn('mt-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700', focusRing)}>
                  <Calculator className="w-4 h-4" /> Calculer pour ce patient
                </button>
              </Card>
            ))}
          </div>
        )}
      </main>

      {editing && profile && (
        <PatientFormModal
          draft={editing}
          actor={{ uid: profile.uid, name: profile.displayName }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

const PatientFormModal: React.FC<{ draft: Draft; actor: { uid: string; name: string }; onClose: () => void }> = ({ draft, actor, onClose }) => {
  const [form, setForm] = useState<Draft>(draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!draft.id;

  const set = (k: keyof Patient, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => (v === '' ? undefined : parseFloat(v));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const computedAge = ageFromBirth(form.birthDate) ?? Number(form.age);
    if (!form.firstName || !form.lastName || !form.gender || !computedAge || !form.weight || !form.height) {
      setError('Nom, prénom, sexe, âge, poids et taille sont requis.');
      return;
    }
    setBusy(true);
    const payload = {
      dossierNumber: form.dossierNumber,
      firstName: form.firstName!.trim(),
      lastName: form.lastName!.trim(),
      birthDate: form.birthDate,
      gender: form.gender as 'M' | 'F',
      age: computedAge,
      weight: Number(form.weight),
      height: Number(form.height),
      creatinine: form.creatinine,
      isPregnant: form.isPregnant,
      isBreastfeeding: form.isBreastfeeding,
      notes: form.notes,
    };
    try {
      if (isEdit) await updatePatient(draft.id!, payload);
      else await createPatient(payload, actor);
      onClose();
    } catch {
      setError("Enregistrement impossible. Vérifiez vos droits et votre connexion.");
      setBusy(false);
    }
  };

  const field = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all';
  const auto = ageFromBirth(form.birthDate);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900">
          <h2 className="text-lg font-bold text-slate-100">{isEdit ? 'Modifier le patient' : 'Nouveau patient'}</h2>
          <button onClick={onClose} className={cn('p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg', focusRing)} aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="p-last" className="text-xs font-bold text-slate-400 uppercase">Nom</label><input id="p-last" className={field} value={form.lastName ?? ''} onChange={(e) => set('lastName', e.target.value)} required /></div>
            <div><label htmlFor="p-first" className="text-xs font-bold text-slate-400 uppercase">Prénom</label><input id="p-first" className={field} value={form.firstName ?? ''} onChange={(e) => set('firstName', e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="p-dossier" className="text-xs font-bold text-slate-400 uppercase">N° Dossier</label><input id="p-dossier" className={field} value={form.dossierNumber ?? ''} onChange={(e) => set('dossierNumber', e.target.value)} /></div>
            <div>
              <label htmlFor="p-gender" className="text-xs font-bold text-slate-400 uppercase">Sexe</label>
              <select id="p-gender" className={field} value={form.gender ?? 'M'} onChange={(e) => set('gender', e.target.value)}>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-birth" className="text-xs font-bold text-slate-400 uppercase">Date de naissance</label>
              <input id="p-birth" type="date" className={field} value={form.birthDate ?? ''} onChange={(e) => set('birthDate', e.target.value)} />
            </div>
            <div>
              <label htmlFor="p-age" className="text-xs font-bold text-slate-400 uppercase">Âge {auto != null && <span className="text-emerald-400 normal-case">(auto {auto})</span>}</label>
              <input id="p-age" type="number" min="0" max="130" className={field} value={auto != null ? auto : form.age ?? ''} onChange={(e) => set('age', num(e.target.value))} disabled={auto != null} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label htmlFor="p-weight" className="text-xs font-bold text-slate-400 uppercase">Poids (kg)</label><input id="p-weight" type="number" min="0" max="400" className={field} value={form.weight ?? ''} onChange={(e) => set('weight', num(e.target.value))} required /></div>
            <div><label htmlFor="p-height" className="text-xs font-bold text-slate-400 uppercase">Taille (cm)</label><input id="p-height" type="number" min="0" max="260" className={field} value={form.height ?? ''} onChange={(e) => set('height', num(e.target.value))} required /></div>
            <div><label htmlFor="p-creat" className="text-xs font-bold text-slate-400 uppercase">Créat. (µmol/L)</label><input id="p-creat" type="number" min="0" className={field} value={form.creatinine ?? ''} onChange={(e) => set('creatinine', num(e.target.value))} /></div>
          </div>
          {form.gender === 'F' && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={!!form.isPregnant} onChange={(e) => set('isPregnant', e.target.checked)} className="accent-rose-500" /> Grossesse</label>
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={!!form.isBreastfeeding} onChange={(e) => set('isBreastfeeding', e.target.checked)} className="accent-amber-500" /> Allaitement</label>
            </div>
          )}
          <div><label htmlFor="p-notes" className="text-xs font-bold text-slate-400 uppercase">Notes</label><textarea id="p-notes" className={cn(field, 'resize-none h-20')} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={cn('flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold', focusRing)}>Annuler</button>
            <button type="submit" disabled={busy} className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold disabled:opacity-60', focusRing)}>
              {busy && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />} {isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
