import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Info, Printer, Save, Activity as ActivityIcon, QrCode, BarChart3, Baby, Loader2, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalculationResults, Isotope, Unit, Protocol } from '../types';
import { formatActivity } from '../lib/units';
import { organAbsorbedDose, isDoseAboveAlert, resolveEffectiveCoefficient, resolveOrganCoefficients, isTherapeuticProtocol } from '../lib/dosimetry';
import { useConfig } from '../lib/ConfigContext';
import { Card, SectionHeading, IconButton, Pill } from './ui';

interface ResultDisplayProps {
  results: CalculationResults;
  isotope: Isotope;
  protocol: Protocol;
  unit: Unit;
  onSave: () => void;
  canSave?: boolean;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ results, isotope, protocol, unit, onSave, canSave = false, saveState = 'idle' }) => {
  const [showQR, setShowQR] = useState(false);
  const [showDoseChart, setShowDoseChart] = useState(false);

  const config = useConfig();
  const isTherapy = isTherapeuticProtocol(isotope, protocol);
  const isDoseHigh = isDoseAboveAlert(results.estimatedEffectiveDose, isotope, protocol, config.diagnosticDoseAlertMSv);
  const coeff =
    results.effectiveCoefficientUsed ??
    resolveEffectiveCoefficient(isotope, protocol, { thyroidBlocked: results.thyroidBlocked });

  const organSource = resolveOrganCoefficients(isotope, protocol, { thyroidBlocked: results.thyroidBlocked });
  const organDoses =
    results.organDoses ??
    organSource.map((od) => ({ organ: od.organ, dose: organAbsorbedDose(results.recommendedActivity, od.coefficientMGyPerMBq) }));
  const chartData = organDoses.map((od) => ({ name: od.organ, dose: parseFloat(od.dose.toFixed(2)) }));

  // Timestamp captured once when the QR is first shown (not on every keystroke re-render).
  const [qrTimestamp] = useState(() => new Date().toISOString());
  // QR payload is always canonical MBq (machine-readable label).
  const qrData = JSON.stringify({
    iso: isotope.id,
    prot: protocol.id,
    act: results.recommendedActivity.toFixed(2),
    unit: 'MBq',
    ts: qrTimestamp,
    v: '1.2',
  });

  return (
    <div className="space-y-6 print:space-y-4">
      <Card className="print:shadow-none print:border-slate-200 print:bg-white print:text-slate-900">
        <SectionHeading
          icon={<ShieldCheck className="w-5 h-5" />}
          title="Résultats de Dosimétrie"
          right={
            <div className="flex gap-2 print:hidden">
              <IconButton active={showDoseChart} onClick={() => setShowDoseChart(!showDoseChart)} title="Distribution des doses" aria-label="Afficher la distribution des doses">
                <BarChart3 className="w-4 h-4" />
              </IconButton>
              <IconButton active={showQR} accent="indigo" onClick={() => setShowQR(!showQR)} title="Générer le QR code étiquette" aria-label="Générer le QR code">
                <QrCode className="w-4 h-4" />
              </IconButton>
              <IconButton
                onClick={onSave}
                disabled={!canSave || saveState === 'saving'}
                active={saveState === 'saved'}
                title={canSave ? "Enregistrer l'examen dans la base du centre" : 'Sélectionnez un patient pour enregistrer l\'examen'}
                aria-label="Enregistrer l'examen"
                className="disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saveState === 'saving' ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /> : saveState === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              </IconButton>
              <IconButton onClick={() => window.print()} title="Imprimer le rapport" aria-label="Imprimer">
                <Printer className="w-4 h-4" />
              </IconButton>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
              Activité Recommandée
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-mono font-bold text-slate-100 print:text-slate-900">
                {formatActivity(results.recommendedActivity, unit)}
              </span>
              <span className="text-lg text-slate-500">{unit}</span>
            </div>
            <p className="text-xs text-slate-500 italic">
              {isotope.name} • {protocol.name}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {results.isDigitalPET && <Pill tone="indigo"><ActivityIcon className="w-3 h-3" /> PET digital −40%</Pill>}
              {results.isFixedActivity && <Pill tone="amber">Activité fixe</Pill>}
              {results.renalAdjustmentFactor && <Pill tone="amber"><AlertTriangle className="w-3 h-3" /> Rénal ×{results.renalAdjustmentFactor}</Pill>}
              {results.pediatricFloorApplied && <Pill tone="indigo"><Baby className="w-3 h-3" /> Min. EANM</Pill>}
              {results.thyroidBlocked && <Pill tone="rose">Thyroïde bloquée</Pill>}
            </div>

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
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-amber-400 uppercase">Alerte Allaitement</p>
                  <p className="text-[10px] text-slate-400">Interruption de l'allaitement à prévoir (durée variable selon l'isotope).</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
              Dose Efficace {isTherapy ? '' : 'Estimée'} <ShieldCheck className="w-3 h-3 print:hidden" />
            </span>
            {isTherapy ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-bold text-slate-500">N/A</span>
                </div>
                <p className="text-[10px] text-amber-400/90 mt-1 leading-snug">
                  Grandeur non pertinente en thérapie : c'est la <b>dose absorbée à l'organe cible (mGy)</b> qui gouverne, définie par dosimétrie individuelle.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-mono font-bold ${isDoseHigh ? 'text-amber-400 print:text-amber-600' : 'text-emerald-400 print:text-emerald-600'}`}>
                    {results.estimatedEffectiveDose.toFixed(2)}
                  </span>
                  <span className="text-lg text-slate-500">mSv</span>
                </div>
                <p className="text-xs text-slate-500 italic">Coeff : {coeff} mSv/MBq{results.thyroidBlocked !== undefined ? results.thyroidBlocked ? ' (thyroïde bloquée)' : ' (thyroïde fonctionnelle)' : ''}</p>
              </>
            )}
          </div>
        </div>

        {/* Warnings from the calculation engine */}
        {results.warnings && results.warnings.length > 0 && (
          <div className="mt-6 space-y-2 print:mt-3">
            {results.warnings.map((w, i) => (
              <div key={i} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Dose distribution chart */}
        {(showDoseChart || chartData.length > 0) && (
          <div className={`mt-8 pt-6 border-t border-slate-800 print:border-slate-200 ${!showDoseChart ? 'hidden print:block' : ''}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Dose absorbée par organe (mGy)
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
                    formatter={(value) => [`${value} mGy`, 'Dose absorbée']}
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

        {/* QR code */}
        {showQR && (
          <div className="mt-8 p-6 bg-white rounded-xl flex flex-col items-center gap-4 border-2 border-dashed border-slate-300 print:border-none print:p-0">
            <div className="text-center mb-2 print:hidden">
              <p className="text-[10px] font-bold uppercase text-slate-500">Étiquette de Seringue</p>
              <p className="text-xs text-slate-700 font-semibold">{isotope.name} - {protocol.name}</p>
            </div>
            <QRCodeSVG value={qrData} size={120} level="H" marginSize={4} />
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-slate-900">{results.recommendedActivity.toFixed(1)} MBq</p>
              <p className="text-[10px] text-slate-500 font-mono">{new Date(qrTimestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Organ absorbed doses */}
        {organDoses.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800 print:border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <ActivityIcon className="w-3 h-3" /> Dose absorbée par organe critique (mGy)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {organDoses.map((od) => (
                <div key={od.organ} className="p-3 bg-slate-800/30 rounded-xl border border-slate-800/50 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">{od.organ}</span>
                  <span className="text-sm font-mono font-bold text-slate-300 print:text-slate-800">
                    {od.dose.toFixed(2)} <span className="text-[10px] font-normal opacity-70">mGy</span>
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
              La dose efficace estimée dépasse les seuils de routine diagnostique. Veuillez vérifier les protocoles locaux.
            </div>
          </div>
        )}
      </Card>

      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 print:hidden">
        <div className="flex gap-3 items-center text-indigo-300/70 text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <p>
            Calculs basés sur ICRP 128 et la carte pédiatrique EANM.
            {unit === 'mCi' && ' Conversion : 1 mCi = 37 MBq.'} Outil d'aide à la décision — à valider par un professionnel.
          </p>
        </div>
      </div>
    </div>
  );
};
