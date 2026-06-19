import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Card, Pill, focusRing } from '../components/ui';
import { useAuth } from '../lib/AuthContext';
import { subscribeUsers, setUserRole, setUserActive } from '../lib/db';
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_BADGE_TONE, Role } from '../lib/roles';
import { UserProfile } from '../types';
import { CENTER } from '../lib/center';
import { cn } from '../lib/cn';

export const Admin: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeUsers(
      (list) => { setUsers(list); setLoading(false); },
      () => { setError('Lecture des comptes impossible (droits ou connexion).'); setLoading(false); },
    );
    return unsub;
  }, []);

  const changeRole = (uid: string, role: Role) =>
    setUserRole(uid, role).catch(() => setError("Modification du rôle impossible. Vérifiez vos droits et votre connexion."));
  const toggleActive = (uid: string, active: boolean) =>
    setUserActive(uid, active).catch(() => setError("Modification du statut impossible. Vérifiez vos droits et votre connexion."));

  const pending = users.filter((u) => !u.active).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-rose-400" />
          <h1 className="text-2xl font-bold text-slate-100">Gestion des comptes</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {CENTER.fullName} — {users.length} compte(s){pending > 0 && <span className="text-amber-400"> • {pending} en attente d'activation</span>}
        </p>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold hover:text-rose-300">✕</button>
          </div>
        )}

        {/* Role legend */}
        <Card className="mb-6 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Rôles disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <div key={r} className="flex items-start gap-2 text-xs">
                <Pill tone={ROLE_BADGE_TONE[r]}>{ROLE_LABELS[r]}</Pill>
                <span className="text-slate-500 flex-1">{ROLE_DESCRIPTIONS[r]}</span>
              </div>
            ))}
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin motion-reduce:animate-none" /></div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const isSelf = u.uid === profile?.uid;
              return (
                <Card key={u.uid} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-100 truncate">
                      {u.displayName} {isSelf && <span className="text-[10px] text-slate-500 font-normal">(vous)</span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={u.role}
                      disabled={isSelf}
                      onChange={(e) => changeRole(u.uid, e.target.value as Role)}
                      aria-label={`Rôle de ${u.displayName}`}
                      className={cn('bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none disabled:opacity-50', focusRing)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => toggleActive(u.uid, !u.active)}
                      disabled={isSelf}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50',
                        focusRing,
                        u.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700',
                      )}
                      title={isSelf ? 'Vous ne pouvez pas modifier votre propre statut' : u.active ? 'Désactiver' : 'Activer'}
                    >
                      {u.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {u.active ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
