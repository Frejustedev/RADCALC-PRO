import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SafetyChecklistProps {
  isPregnant?: boolean;
  isPediatric?: boolean;
  clcr?: number;
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({ isPregnant, isPediatric, clcr }) => {
  const checks = [
    { label: "Identité patient vérifiée", status: "pending" },
    { label: "Grossesse exclue", status: isPregnant ? "error" : "success" },
    { label: "Consentement éclairé signé", status: "pending" },
    { label: "Fonction rénale compatible", status: clcr && clcr < 30 ? "error" : "success" },
    { label: "Protocole pédiatrique validé", status: isPediatric ? "warning" : "success" },
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" /> Checklist de Sécurité (Audit)
      </h3>
      <div className="space-y-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-800/50">
            <span className="text-xs text-slate-300">{check.label}</span>
            {check.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {check.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
            {check.status === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
            {check.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
          </div>
        ))}
      </div>
    </div>
  );
};
