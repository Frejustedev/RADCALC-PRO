import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2, Activity, BadgeCheck, Users as UsersIcon, Syringe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui';
import { subscribeExams } from '../lib/db';
import { CENTER } from '../lib/center';
import { Exam } from '../types';

const DAY = 86400000;
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#06b6d4', '#a855f7', '#84cc16'];

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string }> = ({ icon, label, value, sub }) => (
  <Card className="p-4">
    <div className="flex items-center gap-2 text-slate-500 mb-1">{icon}<span className="text-[10px] uppercase font-bold tracking-wider">{label}</span></div>
    <p className="text-2xl font-mono font-bold text-slate-100">{value}</p>
    {sub && <p className="text-[10px] text-slate-600">{sub}</p>}
  </Card>
);

export const Dashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeExams((list) => { setExams(list); setLoading(false); }, () => setLoading(false)), []);

  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * DAY;
    const validated = exams.filter((e) => e.status === 'validated');
    const thisWeek = exams.filter((e) => new Date(e.createdAt).getTime() >= weekAgo);
    const administered = exams.filter((e) => e.administration);
    const patients = new Set(exams.map((e) => e.patientId)).size;

    // Exams per day (last 14 days)
    const perDay: { day: string; n: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      const key = d.toISOString().slice(0, 10);
      const n = exams.filter((e) => e.createdAt.slice(0, 10) === key).length;
      perDay.push({ day: d.toLocaleDateString([], { day: '2-digit', month: '2-digit' }), n });
    }

    // By isotope
    const byIso = new Map<string, { name: string; count: number; dose: number }>();
    for (const e of exams) {
      const cur = byIso.get(e.isotopeId) ?? { name: e.isotopeName.split(' ')[0], count: 0, dose: 0 };
      cur.count += 1;
      cur.dose += e.effectiveDoseMSv || 0;
      byIso.set(e.isotopeId, cur);
    }
    const isoData = Array.from(byIso.values()).sort((a, b) => b.count - a.count);

    return { total: exams.length, validated: validated.length, thisWeek: thisWeek.length, administered: administered.length, patients, perDay, isoData };
  }, [exams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <h1 className="text-2xl font-bold text-slate-100">Tableau de bord</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">{CENTER.fullName}</p>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin motion-reduce:animate-none" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <Stat icon={<Activity className="w-4 h-4" />} label="Examens" value={stats.total} sub={`${stats.thisWeek} cette semaine`} />
              <Stat icon={<BadgeCheck className="w-4 h-4" />} label="Validés" value={stats.validated} sub={`${stats.total - stats.validated} brouillons`} />
              <Stat icon={<Syringe className="w-4 h-4" />} label="Administrés" value={stats.administered} />
              <Stat icon={<UsersIcon className="w-4 h-4" />} label="Patients" value={stats.patients} />
              <Stat icon={<Activity className="w-4 h-4" />} label="Isotopes" value={stats.isoData.length} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Examens / jour (14 j)</h2>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.perDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={9} interval={1} />
                      <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} itemStyle={{ color: '#10b981' }} />
                      <Bar dataKey="n" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Examens par isotope</h2>
                {stats.isoData.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-16">Aucune donnée.</p>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.isoData} layout="vertical" margin={{ left: 10, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={10} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={60} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {stats.isoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>

            <Card className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Dose efficace cumulée par isotope</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {stats.isoData.map((iso) => (
                  <div key={iso.name} className="p-3 bg-slate-800/40 rounded-xl">
                    <p className="text-[10px] uppercase text-slate-500 font-bold">{iso.name}</p>
                    <p className="text-sm font-mono text-emerald-400">{iso.dose.toFixed(1)} mSv</p>
                    <p className="text-[10px] text-slate-600">{iso.count} examen(s)</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};
