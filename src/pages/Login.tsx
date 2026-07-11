import React, { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Activity, Loader2, Mail, Lock, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { CENTER } from '../lib/center';
import { FirebaseNotice } from '../components/AuthScreens';
import { cn } from '../lib/cn';
import { focusRing } from '../components/ui';

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/user-disabled': 'Ce compte est désactivé.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
  'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
  'auth/network-request-failed': 'Problème de réseau. Vérifiez votre connexion.',
};

export const Login: React.FC = () => {
  const { user, login, register, resetPassword } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isFirebaseConfigured) return <FirebaseNotice />;
  if (user) return <Navigate to={(location.state as { from?: string })?.from || '/app'} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name.trim(), email, password);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      setError(ERRORS[code] ?? "Une erreur est survenue. Réessayez.");
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError('Saisissez votre email, puis cliquez sur « Mot de passe oublié ».');
      return;
    }
    try {
      await resetPassword(email);
      setNotice('Email de réinitialisation envoyé (vérifiez vos courriers indésirables).');
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      setError(ERRORS[code] ?? "Envoi impossible. Vérifiez l'email.");
    }
  };

  const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-emerald-500/10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[100px] bg-indigo-500/10 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="text-white w-7 h-7" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight">RadCalc <span className="text-emerald-400">Pro</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{CENTER.label}</p>
          </div>
        </Link>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={cn('flex-1 py-2 text-xs font-bold rounded-md transition-all', focusRing, mode === m ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200')}
              >
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input className={inputClass} placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} required aria-label="Nom complet" autoComplete="name" />
              </div>
            )}
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-label="Email" autoComplete="email" />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input className={inputClass} type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} aria-label="Mot de passe" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {notice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">{notice}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className={cn('w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-60', focusRing)}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>

            {mode === 'login' && (
              <button type="button" onClick={forgot} className={cn('w-full text-center text-[11px] text-slate-400 hover:text-emerald-400 transition-colors rounded py-1', focusRing)}>
                Mot de passe oublié ?
              </button>
            )}
          </form>

          {mode === 'register' && (
            <p className="text-[11px] text-slate-500 mt-4 text-center leading-relaxed">
              Les nouveaux comptes sont activés par un administrateur du centre avant tout accès.
            </p>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Accès réservé au personnel autorisé de {CENTER.fullName}.
        </p>
      </div>
    </div>
  );
};
