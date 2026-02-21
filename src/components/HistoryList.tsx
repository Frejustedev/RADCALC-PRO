import React from 'react';
import { History, Clock, Trash2, Download, FileJson, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { HistoryEntry } from '../types';
import { ISOTOPES } from '../constants';

interface HistoryListProps {
  entries: HistoryEntry[];
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ entries, onClear }) => {
  if (entries.length === 0) return null;

  const exportAuditLog = () => {
    const auditData = {
      version: "1.1.0",
      exportDate: new Date().toISOString(),
      institution: "Service de Médecine Nucléaire",
      referenceData: {
        isotopes: ISOTOPES,
        formulas: {
          bsa: "Mosteller",
          creatinineClearance: "Cockcroft-Gault",
          pediatric: "EANM Dosage Card 2016"
        }
      },
      history: entries
    };

    const dataStr = JSON.stringify(auditData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `radcalc_audit_log_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `radcalc_history_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportCSV = () => {
    const headers = ['Date', 'Heure', 'Isotope', 'Protocole', 'Poids(kg)', 'Age', 'Activite', 'Unite', 'DoseEff(mSv)', 'DigitalPET', 'AjustRenal'];
    const rows = entries.map(entry => [
      new Date(entry.timestamp).toLocaleDateString(),
      new Date(entry.timestamp).toLocaleTimeString(),
      entry.isotope.name,
      entry.protocol.name,
      entry.patientData.weight,
      entry.patientData.age,
      entry.results.recommendedActivity.toFixed(2),
      entry.unit,
      entry.results.estimatedEffectiveDose.toFixed(3),
      entry.isDigitalPET ? 'OUI' : 'NON',
      entry.renalAdjustmentFactor || 1
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `radcalc_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-100">Historique Récent</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportAuditLog}
            className="p-2 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 rounded-lg transition-colors"
            title="Exporter Journal d'Audit (Complet)"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
          <button 
            onClick={exportCSV}
            className="p-2 hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors"
            title="Exporter en CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button 
            onClick={exportJSON}
            className="p-2 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
            title="Exporter en JSON"
          >
            <FileJson className="w-4 h-4" />
          </button>
          <button 
            onClick={onClear}
            className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
            title="Effacer l'historique"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {entries.map((entry) => (
          <div key={entry.id} className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">{entry.isotope.name} • {entry.protocol.name}</span>
                <p className="text-sm text-slate-300 font-medium">{entry.patientData.weight}kg • {entry.patientData.age} ans</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-xs text-slate-500">
                Dose: <span className="text-slate-300 font-mono">{entry.results.recommendedActivity.toFixed(1)} {entry.unit}</span>
              </div>
              <div className="text-xs text-slate-500">
                Eff: <span className="text-emerald-400 font-mono">{entry.results.estimatedEffectiveDose.toFixed(2)} mSv</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
