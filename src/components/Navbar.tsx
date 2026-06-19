import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, BookOpen, Calculator, Home, Menu, X, Sun, Moon, Users, ShieldCheck, LogOut, LogIn } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_TONE } from '../lib/roles';
import { CENTER } from '../lib/center';
import { cn } from '../lib/cn';
import { focusRing, Pill } from './ui';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, logout, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const links = [
    { to: '/', label: 'Accueil', icon: Home, end: true, show: true },
    { to: '/app', label: 'Calculateur', icon: Calculator, end: false, show: true },
    { to: '/patients', label: 'Patients', icon: Users, end: false, show: hasPermission('patients:read') },
    { to: '/admin', label: 'Comptes', icon: ShieldCheck, end: false, show: hasPermission('users:manage') },
    { to: '/docs', label: 'Documentation', icon: BookOpen, end: false, show: true },
  ].filter((l) => l.show);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
      focusRing,
      isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60',
    );

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-3 group shrink-0" aria-label="RadCalc Pro — accueil">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div className="leading-none">
            <h1 className="text-lg font-bold tracking-tight text-slate-100">
              RadCalc <span className="text-emerald-400">Pro</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">{CENTER.label}</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
            aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {profile ? (
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right leading-tight">
                <p className="text-xs font-semibold text-slate-200 max-w-[140px] truncate">{profile.displayName}</p>
                <Pill tone={ROLE_BADGE_TONE[profile.role]} className="!px-1.5 !py-0">{ROLE_LABELS[profile.role]}</Pill>
              </div>
              <button onClick={handleLogout} className={cn('p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors', focusRing)} title="Se déconnecter" aria-label="Se déconnecter">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className={cn('hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20', focusRing)}>
              <LogIn className="w-4 h-4" /> Connexion
            </Link>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="mobile-drawer"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 top-16 bg-slate-950/70 backdrop-blur-sm lg:hidden z-40" onClick={() => setOpen(false)} />
            <motion.nav
              id="mobile-drawer"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="lg:hidden absolute left-0 right-0 top-16 z-50 bg-slate-900 border-b border-slate-800 p-4 space-y-2 shadow-2xl"
              aria-label="Navigation mobile"
            >
              {profile && (
                <div className="flex items-center justify-between px-4 py-3 mb-1 bg-slate-800/40 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{profile.displayName}</p>
                    <Pill tone={ROLE_BADGE_TONE[profile.role]} className="mt-1">{ROLE_LABELS[profile.role]}</Pill>
                  </div>
                </div>
              )}
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors', focusRing, isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-slate-800')}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              ))}
              {profile ? (
                <button onClick={handleLogout} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-slate-800 transition-colors', focusRing)}>
                  <LogOut className="w-5 h-5" /> Se déconnecter
                </button>
              ) : (
                <NavLink to="/login" className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-600 text-white', focusRing)}>
                  <LogIn className="w-5 h-5" /> Connexion
                </NavLink>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
