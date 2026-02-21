import React from 'react';
import { BookOpen, ExternalLink, Shield, Info } from 'lucide-react';

export const Documentation: React.FC = () => {
  const sources = [
    {
      title: "EANM Pediatric Dosage Card (2016)",
      description: "Utilisé pour le calcul des multiplicateurs d'activité en pédiatrie basés sur le poids corporel.",
      link: "https://www.eanm.org/publications/dosage-calculator/",
      category: "Pédiatrie"
    },
    {
      title: "ICRP Publication 128",
      description: "Source des coefficients de dose efficace (mSv/MBq) et des doses par organe pour les produits radiopharmaceutiques courants.",
      link: "https://www.icrp.org/publication.asp?id=ICRP%20Publication%20128",
      category: "Dosimétrie"
    },
    {
      title: "Formule de Mosteller",
      description: "Calcul de la surface corporelle (BSA) : BSA (m²) = √([Taille(cm) * Poids(kg)] / 3600).",
      category: "Biométrie"
    },
    {
      title: "Formule de Cockcroft-Gault",
      description: "Estimation de la clairance de la créatinine pour l'ajustement des doses en cas d'insuffisance rénale.",
      category: "Physiologie"
    },
    {
      title: "Directives ALARA",
      description: "Principe de base en radioprotection : 'As Low As Reasonably Achievable'. Optimisation des doses selon la technologie (ex: PET Digital).",
      category: "Radioprotection"
    }
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold text-slate-100">Références & Sources Scientifiques</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((source, index) => (
          <div key={index} className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:border-indigo-500/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{source.category}</span>
              {source.link && (
                <a 
                  href={source.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">{source.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{source.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-3 items-start">
        <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-indigo-300 mb-1">Note Importante pour les Physiciens Médicaux</p>
          Cette application est un outil d'aide à la décision. Les calculs doivent être vérifiés selon les protocoles locaux et les spécificités de chaque installation. Les coefficients ICRP 128 sont utilisés par défaut pour les adultes.
        </div>
      </div>
    </div>
  );
};
