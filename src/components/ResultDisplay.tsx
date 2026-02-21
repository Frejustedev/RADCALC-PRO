import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Info, Printer, Save, Activity as ActivityIcon, QrCode, BarChart3 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalculationResults, Isotope, Unit, Protocol } from '../types';
import { MBQ_TO_MCI } from '../constants';

interface ResultDisplayProps {
  results: CalculationResults;
  isotope: Isotope;
  protocol: Protocol;
  unit: Unit;
  onSave: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ results, isotope, protocol, unit, onSave }) => {
  const [showQR, setShowQR] = useState(false);
  const [showDoseChart, setShowDoseChart] = useState(false);
  const isDoseHigh = results.estimatedEffectiveDose > 15;

  const formatActivity = (mbq: number) => {
    const val = unit === 'mCi' ? mbq * MBQ_TO_MCI : mbq;
    return val.toFixed(unit === 'mCi' ? 2 : 1);
  };

  const handlePrint = () => {
    window.print();
  };

  // Prepare chart data
  const chartData = isotope.organDoses?.map(od => ({
    name: od.organ,
    dose: od.coefficient * results.recommendedActivity
  })) || [];

  // Data for QR code (Machine readable format)
  const qrData = JSON.stringify({
    iso: isotope.id,
    prot: protocol.id,
    act: results.recommendedActivity.toFixed(2),
    unit: 'MBq',
    ts: new Date().toISOString(),
    v: "1.0"
  });

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl print:shadow-none print:border-slate-200 print:bg-white print:text-slate-900">
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 print:text-emerald-600" />
            <h2 className="text-xl font-semibold text-slate-100 print:text-slate-900">Résultats de Dosimétrie</h2>
          </div>
          <div className="flex gap-2 print:hidden">
            <button 
              onClick={() => setShowDoseChart(!showDoseChart)}
              className={`p-2 rounded-lg transition-colors border ${showDoseChart ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
              title="Distribution des Doses"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowQR(!showQR)}
              className={`p-2 rounded-lg transition-colors border ${showQR ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
              title="Générer QR Code Étiquette"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button 
              onClick={onSave}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
              title="Sauvegarder dans l'historique"
            >
              <Save className="w-4 h-4" />
            </button>
            <button 
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
              title="Imprimer le rapport"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
              Activité Recommandée <Info className="w-3 h-3 print:hidden" />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-mono font-bold text-slate-100 print:text-slate-900">
                {formatActivity(results.recommendedActivity)}
              </span>
              <span className="text-lg text-slate-500">{unit}</span>
            </div>
            <p className="text-xs text-slate-500 italic">
              {isotope.name} • {protocol.name}
            </p>
            {results.isDigitalPET && (
              <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1 flex items-center gap-1">
                <ActivityIcon className="w-3 h-3" /> Optimisé pour PET Digital (-40%)
              </p>
            )}
            {results.renalAdjustmentFactor && (
              <p className="text-[10px] text-amber-400 font-bold uppercase mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Ajustement Rénal (x{results.renalAdjustmentFactor})
              </p>
            )}
            {results.isPregnant && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase">Alerte Grossesse</p>
                  <p className="text-[10px] text-slate-400">Examen contre-indiqué ou nécessitant une justification stricte. Risque fœtal à évaluer.</p>
                </div>
              </div>
            )}
            {results.isBreastfeeding && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-amber-400 uppercase">Alerte Allaitement</p>
                  <p className="text-[10px] text-slate-400">Interruption de l'allaitement recommandée (durée variable selon l'isotope).</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
              Dose Efficace Estimée <ShieldCheck className="w-3 h-3 print:hidden" />
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-mono font-bold ${isDoseHigh ? 'text-amber-400 print:text-amber-600' : 'text-emerald-400 print:text-emerald-600'}`}>
                {results.estimatedEffectiveDose.toFixed(2)}
              </span>
              <span className="text-lg text-slate-500">mSv</span>
            </div>
            <p className="text-xs text-slate-500 italic">
              Coeff: {isotope.doseCoefficientMSvPerMBq} mSv/MBq
            </p>
          </div>
        </div>

        {/* Dose Distribution Chart */}
        {(showDoseChart || chartData.length > 0) && (
          <div className={`mt-8 pt-6 border-t border-slate-800 print:border-slate-200 ${!showDoseChart ? 'hidden print:block' : ''}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Distribution des Doses par Organe (mGy)
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981', fontSize: '12px' }}
                  />
                  <Bar dataKey="dose" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        {showQR && (
          <div className="mt-8 p-6 bg-white rounded-xl flex flex-col items-center gap-4 border-2 border-dashed border-slate-200 print:border-none print:p-0">
            <div className="text-center mb-2 print:hidden">
              <p className="text-[10px] font-bold uppercase text-slate-400">Étiquette de Seringue</p>
              <p className="text-xs text-slate-600 font-semibold">{isotope.name} - {protocol.name}</p>
            </div>
            <QRCodeSVG 
              value={qrData} 
              size={120}
              level="H"
              includeMargin={true}
            />
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-slate-900">
                {results.recommendedActivity.toFixed(1)} MBq
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Organ Doses Section */}
        {isotope.organDoses && (
          <div className="mt-8 pt-6 border-t border-slate-800 print:border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <ActivityIcon className="w-3 h-3" /> Doses par Organe Critique
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {isotope.organDoses.map((od) => (
                <div key={od.organ} className="p-3 bg-slate-800/30 rounded-xl border border-slate-800/50 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">{od.organ}</span>
                  <span className="text-sm font-mono font-bold text-slate-300 print:text-slate-800">
                    {(results.recommendedActivity * od.coefficient).toFixed(2)} <span className="text-[10px] font-normal opacity-70">mSv</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isDoseHigh && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start print:hidden">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/80">
              <p className="font-semibold text-amber-400 mb-1">Alerte de Dosimétrie</p>
              La dose efficace estimée dépasse les seuils de routine. Veuillez vérifier les protocoles locaux.
            </div>
          </div>
        )}
      </div>

      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 print:hidden">
        <div className="flex gap-3 items-center text-indigo-300/70 text-xs">
          <Info className="w-4 h-4" />
          <p>
            Calculs basés sur les publications de la CIPR (ICRP). 
            {unit === 'mCi' && " Conversion: 1 mCi = 37 MBq."}
          </p>
        </div>
      </div>
    </div>
  );
};
