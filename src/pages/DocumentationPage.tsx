import React from 'react';
import { ExternalLink, Shield, Beaker } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { Navbar } from '../components/Navbar';

export const DocumentationPage: React.FC = () => {
  const { theme } = useTheme();

  const sources = [
    {
      title: "EANM Pediatric Dosage Card v5.7 (2016)",
      description: "Activité administrée = Activité de base (MBq) × Multiplicateur(poids), selon la classe du radiopharmaceutique (A, B ou C — trois colonnes distinctes), puis application de l'activité minimale recommandée. Optimisation ALARA.",
      link: "https://www.eanm.org/publications/dosage-calculator/",
      category: "Pédiatrie & ALARA",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20"
    },
    {
      title: "ICRP Publication 128",
      description: "Coefficients de dose efficace (mSv/MBq). Les coefficients par organe sont des doses ABSORBÉES en mGy/MBq (≠ dose efficace). Pour l'I-131 iodure, la dose efficace dépend fortement du blocage thyroïdien (≈0,24 thyroïde bloquée vs ≈22 mSv/MBq thyroïde fonctionnelle).",
      link: "https://www.icrp.org/publication.asp?id=ICRP%20Publication%20128",
      category: "Dosimétrie Organes",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20"
    },
    {
      title: "Formule de Mosteller (1987)",
      description: "Calcul de la surface corporelle (BSA) : BSA (m²) = √([Taille(cm) × Poids(kg)] / 3600). Utilisée pour certains protocoles de radiothérapie interne vectorisée (RIV) et indexation rénale.",
      link: "https://pubmed.ncbi.nlm.nih.gov/3657876/",
      category: "Biométrie & Modélisation",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      border: "border-indigo-400/20"
    },
    {
      title: "Formule de Cockcroft-Gault",
      description: "Estimation de la clairance de la créatinine (ClCr, ml/min) pour l'ajustement des doses en cas d'insuffisance rénale (ex: MAG3). Calculée à partir de l'âge, du poids corporel, du genre et de la créatininémie (µmol/L). NB : il s'agit d'une clairance, non d'un DFG normalisé /1,73 m².",
      link: null,
      category: "Néphrologie Physiologique",
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      border: "border-rose-400/20"
    },
    {
      title: "Algorithme de Décroissance Radioactive",
      description: "A(t) = A(0) × e^(-λt) avec λ = ln(2) / T½. L'application calcule en temps réel l'activité résiduelle et l'activité mère à prélever, compensée pour le Volume Mort des tubulures.",
      link: null,
      category: "Physique Nucléaire",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20"
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'} pb-24`}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-12">
        <div className="mb-12 text-center space-y-4">
          <h2 className="text-4xl font-black">Bases & Références <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Algorithmiques</span></h2>
          <p className={`text-lg max-w-2xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            RadCalc Pro est construit sur des bases cliniques validées internationalement. Voici la cartographie détaillée des équations, constantes et recommandations implémentées dans le moteur de calcul.
          </p>
        </div>

        <div className="space-y-6">
          {sources.map((source, index) => (
            <div key={index} className={`p-6 md:p-8 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className={`p-4 rounded-2xl shrink-0 ${source.bg} ${source.border} border`}>
                  <Beaker className={`w-8 h-8 ${source.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] items-center px-3 py-1 rounded-full font-bold uppercase tracking-widest ${source.bg} ${source.color}`}>
                      {source.category}
                    </span>
                    {source.link && (
                      <a
                        href={source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`transition-colors flex items-center gap-1 text-xs font-bold rounded outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${theme === 'dark' ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}
                      >
                        Consulter <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <h3 className={`text-xl font-bold mb-3 mt-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{source.title}</h3>
                  <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {source.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-12 p-8 rounded-3xl border flex flex-col md:flex-row gap-6 items-center ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 text-white">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>Avertissement Légal & Paramétrage Local</h4>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-indigo-200/70' : 'text-indigo-900/70'}`}>
              Cette application est un outil algorithmique d'aide à la décision. Les calculs finaux produits ainsi que les protocoles de préparation (Volume mort, facteurs pédiatriques EANM) <strong>doivent impérativement être validés par un radiopharmacien ou un médecin nucléaire</strong>. Les coefficients ICRP 128 par défaut peuvent ne pas correspondre aux législations locales de votre pays.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
