import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldAlert, Clock, DatabaseZap, Home } from 'lucide-react';
import { CENTER } from '../lib/center';

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
      {children}
    </div>
  </div>
);

export const LoadingScreen: React.FC = () => (
  <Shell>
    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto motion-reduce:animate-none" />
    <p className="mt-4 text-sm text-slate-400">Chargement…</p>
  </Shell>
);

export const PendingScreen: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <Shell>
    <Clock className="w-10 h-10 text-amber-400 mx-auto" />
    <h1 className="mt-4 text-xl font-bold text-slate-100">Compte en attente d'activation</h1>
    <p className="mt-2 text-sm text-slate-400">
      Votre compte a bien été créé. Un administrateur de {CENTER.name} doit l'activer et lui attribuer un rôle
      avant que vous puissiez accéder à l'application.
    </p>
    <button
      onClick={onLogout}
      className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
    >
      Se déconnecter
    </button>
  </Shell>
);

export const ForbiddenScreen: React.FC = () => (
  <Shell>
    <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
    <h1 className="mt-4 text-xl font-bold text-slate-100">Accès non autorisé</h1>
    <p className="mt-2 text-sm text-slate-400">Votre rôle ne permet pas d'accéder à cette page.</p>
    <Link to="/app" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors">
      <Home className="w-4 h-4" /> Retour au calculateur
    </Link>
  </Shell>
);

export const FirebaseNotice: React.FC = () => (
  <Shell>
    <DatabaseZap className="w-10 h-10 text-indigo-400 mx-auto" />
    <h1 className="mt-4 text-xl font-bold text-slate-100">Base de données non configurée</h1>
    <p className="mt-2 text-sm text-slate-400">
      La connexion à Firebase n'est pas configurée. Renseignez les variables <code className="text-emerald-400">VITE_FIREBASE_*</code>{' '}
      dans un fichier <code className="text-emerald-400">.env.local</code> (voir <code className="text-emerald-400">FIREBASE_SETUP.md</code>), puis relancez l'application.
    </p>
    <Link to="/" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors">
      <Home className="w-4 h-4" /> Accueil
    </Link>
  </Shell>
);
