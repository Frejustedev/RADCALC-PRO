import React from 'react';
import { Activity, Shield, ArrowRight, Zap, Database, Smartphone, BookOpen, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from '../ThemeContext';

export const Landing: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'} overflow-hidden relative`}>
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-400/20'}`} />
        <div className={`absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[100px] ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-400/20'}`} />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className={`border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'} backdrop-blur-md sticky top-0`}>
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">RadCalc <span className="text-emerald-500">Pro</span></h1>
                <p className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>NucleaTech Solutions</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/docs" className={`text-sm font-semibold hover:text-emerald-500 transition-colors ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Documentation
              </Link>
              <Link to="/app" className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                Ouvrir l'outil <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Version 1.1.0 • EANM & ICRP Compliant
              </div>
              <h2 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                La Dosimétrie Clinique <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Réinventée.</span>
              </h2>
              <p className={`text-lg leading-relaxed max-w-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                RadCalc Pro est la station de travail nouvelle génération pour les radiopharmaciens et médecins nucléaires. Calcul de dose, gestion du volume mort, décroissance isotopique et estimations pédiatriques réunis dans une seule interface ultra-rapide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/app" className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
                  Lancer l'Application
                </Link>
                <Link to="/docs" className={`px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 border ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                  Lire la Documentation
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className={`p-4 rounded-3xl border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-emerald-500/5' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
                {/* Visual mock of the app */}
                <div className={`w-full aspect-[4/3] rounded-2xl border overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  {/* Mock Navbar */}
                  <div className={`h-12 border-b flex items-center px-4 gap-4 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className={`h-4 w-32 rounded ml-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                  </div>
                  {/* Mock Content */}
                  <div className="flex-1 p-6 grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className={`h-32 rounded-xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'}`} />
                      <div className={`h-48 rounded-xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'}`} />
                    </div>
                    <div className="space-y-4">
                      <div className={`h-full rounded-xl flex items-center justify-center relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
                         <Activity className={`w-32 h-32 opacity-10 ${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-500'}`} />
                         <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -right-6 top-20 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">PWA Offline</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">100% Hors-ligne</p>
                </div>
              </div>

              <div className="absolute -left-8 bottom-20 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Dosimétrie</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Mode Pédiatrique</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className={`py-24 border-t ${theme === 'dark' ? 'border-slate-800 bg-slate-900/20' : 'border-slate-200 bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-black mb-4">Un Ecosystème Complet</h3>
              <p className={`text-lg max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Pensée par et pour les professionnels de la médecine nucléaire, conçue pour minimiser les erreurs et maximiser le temps clinique.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Layers className="w-8 h-8 text-emerald-500" />}
                title="Protocoles Paramétrables"
                description="Sélectionnez l'isotope, l'indication clinique, et l'application ajuste dynamiquement l'activité recommandée et les coefficients de dose (ICRP 128)."
                theme={theme}
              />
              <FeatureCard 
                icon={<Smartphone className="w-8 h-8 text-indigo-500" />}
                title="100% Fonctionnel Sans Réseau"
                description="Sous terre, dans le bunker ou dans la zone chaude : Installez RadCalc Pro sur votre tablette et fonctionnez sans aucune connexion internet."
                theme={theme}
              />
              <FeatureCard 
                icon={<BookOpen className="w-8 h-8 text-amber-500" />}
                title="Traçabilité & Rapports"
                description="Exportez l'historique de vos calculs (JSON/CSV), téléchargez vos rapports en PDF et accédez à tout moment à la documentation source reconnue."
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, theme }: any) => (
  <div className={`p-8 rounded-3xl border transition-all hover:-translate-y-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/30' : 'bg-slate-50 border-slate-100 hover:shadow-lg'}`}>
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
      {icon}
    </div>
    <h4 className="text-xl font-bold mb-3">{title}</h4>
    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
      {description}
    </p>
  </div>
);
