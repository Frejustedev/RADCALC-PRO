import React from 'react';
import { X } from 'lucide-react';

export type LegalPage = 'privacy' | 'terms' | 'source' | null;

interface LegalModalProps {
  page: LegalPage;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ page, onClose }) => {
  if (!page) return null;

  const content = {
    privacy: {
      title: "Politique de Confidentialité",
      body: (
        <div className="space-y-4 text-sm text-slate-300">
          <p>La protection des données et le respect du secret médical sont une priorité. RadCalc Pro est déployé pour un <strong>centre unique (IMeNA, Côte d'Ivoire)</strong> et utilise une base de données cloud sécurisée (Google Firebase).</p>

          <h3 className="text-emerald-400 font-bold mt-4 text-base">1. Données enregistrées</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dossiers patients (identité, biométrie, clairance, statut grossesse/allaitement)</li>
            <li>Examens et calculs dosimétriques réalisés</li>
            <li>Inventaire des flacons du service</li>
            <li>Comptes utilisateurs et rôles</li>
          </ul>

          <h3 className="text-emerald-400 font-bold mt-4 text-base">2. Stockage cloud sécurisé et contrôle d'accès</h3>
          <p>Les données sont stockées dans <strong>Cloud Firestore (Google Firebase)</strong>, protégées par une authentification obligatoire et des règles de sécurité qui restreignent l'accès <strong>au seul personnel autorisé du centre</strong>, selon son rôle (médecin, radiopharmacien, manipulateur…). Un cache local chiffré par le navigateur permet le fonctionnement hors-ligne, avec synchronisation au retour du réseau.</p>

          <h3 className="text-emerald-400 font-bold mt-4 text-base">3. Conformité</h3>
          <p>Le responsable de traitement est le centre (IMeNA). Il lui appartient de définir la base légale, la durée de conservation et les droits des personnes, conformément à la réglementation applicable (protection des données de santé, secret médical, RGPD le cas échéant). Aucune donnée n'est revendue ni utilisée à des fins publicitaires.</p>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-4">
            <p className="text-xs text-emerald-300 font-mono text-center">🔐 Accès restreint au personnel autorisé du centre, par authentification et rôles.</p>
          </div>
        </div>
      )
    },
    terms: {
      title: "Mentions Légales",
      body: (
        <div className="space-y-4 text-sm text-slate-300">
          <p>Conformément aux dispositions légales en vigueur, nous portons à la connaissance des utilisateurs de l'application RadCalc Pro les informations suivantes :</p>
          
          <h3 className="text-emerald-400 font-bold mt-4 text-base">Informations Générales</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Propriétaire et Développeur :</strong> Dr. Fréjuste Agboton</li>
            <li><strong>Société éditrice :</strong> NucleaTech Solutions <span className="italic text-slate-500">(en cours d'immatriculation)</span></li>
            <li><strong>Objet social :</strong> Création de solutions numériques et digitales pour la santé</li>
            <li><strong>Contact :</strong> <a href="mailto:contact@radcalc.nucleatlas.org" className="text-emerald-400 hover:underline">contact@radcalc.nucleatlas.org</a></li>
          </ul>
          
          <h3 className="text-emerald-400 font-bold mt-4 text-base">Propriété Intellectuelle</h3>
          <p>L'ensemble de cette application (structure visuelle, design, ergonomie, adaptation des algorithmes de calcul) relève de la législation sur le droit d'auteur et la propriété intellectuelle. Toute reproduction ou distribution non autorisée est expressément interdite sans l'accord préalable de l'auteur et de NucleaTech Solutions.</p>
          
          <h3 className="text-emerald-400 font-bold mt-4 text-base bg-rose-500/10 border border-rose-500/20 p-2 rounded inline-block text-rose-400">Avertissement Médical et Responsabilité</h3>
          <p><strong>RadCalc Pro est un outil informatique d'aide à la décision conçu pour les professionnels de santé.</strong> Bien que rigoureusement basé sur des formules validées de l'EANM et de la CIPR, les résultats fournis (activités à injecter, dosimétrie, clairance rénale) doivent toujours être vérifiés, interprétés et validés par un médecin nucléaire ou un radiopharmacien responsable avant toute application clinique.</p>
          <p>L'auteur et la société éditrice ne sauraient être tenus responsables d'une erreur de dosage, d'injections inappropriées, de conséquences médicales indésirables ou d'une utilisation incorrecte des résultats fournis par l'application.</p>
        </div>
      )
    },
    source: {
      title: "À propos du Développement",
      body: (
        <div className="space-y-4 text-sm text-slate-300">
          <div className="flex flex-col items-center justify-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 mb-6">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
              <span className="text-2xl font-bold text-emerald-400">N</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-widest text-center">NucleaTech Solutions</h3>
            <p className="text-xs text-slate-500 font-medium">Digitalisation de la médecine nucléaire</p>
          </div>

          <p>L'application <strong>RadCalc Pro</strong> a été pensée et développée par <strong>Dr. Fréjuste Agboton</strong> dans le but de simplifier, fiabiliser et documenter le processus de préparation et de dispensation radiopharmaceutique en médecine nucléaire.</p>
          
          <h3 className="text-emerald-400 font-bold mt-4 text-base">Technologies Utilisées</h3>
          <p>L'interface a été conçue pour offrir les meilleures performances même sur du matériel ancien, en limitant la consommation de ressources tout en maximisant l'ergonomie :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Framework : React 19 / TypeScript</li>
            <li>Stylisation : Tailwind CSS V4</li>
            <li>Visualisation anatomique et Graphiques : Recharts / SVG interactif</li>
            <li>Mode hors-ligne : Vite PWA (Service Workers)</li>
          </ul>

          <h3 className="text-emerald-400 font-bold mt-4 text-base">Algorithmes et Sources Médicales</h3>
          <p>Les fondements mathématiques de l'application proviennent des recommandations internationales. Le détail précis de ces sources est disponible en permanence dans le composant "Documentation & Sources" situé au bas de la vue principale.</p>

          <div className="mt-8 p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
            <p className="text-slate-400 mb-2">Pour des requêtes commerciales, des intégrations hospitalières personnalisées ou des rapports de bugs, n'hésitez pas à nous contacter.</p>
            <a href="mailto:contact@radcalc.nucleatlas.org" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
              contact@radcalc.nucleatlas.org
            </a>
          </div>
        </div>
      )
    }
  };

  const { title, body } = content[page];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {body}
        </div>
      </div>
    </div>
  );
};
