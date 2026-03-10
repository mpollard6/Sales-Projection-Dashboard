'use client';
import { useEffect, useState } from 'react';
import { getAllRepStats } from '@/data/utils';
import { SectionHeader, fmt, pct } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const fmtTip = (v) => '$' + Math.round(v).toLocaleString();

export default function Scoreboard() {
  const [user, setUser] = useState(null);
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); }, []);
  if (!user) return null;

  const stats = getAllRepStats();
  const revenueData = stats.map(s => ({
    name: s.rep.split(' ')[0],
    'Assessment Revenue': s.assessClosedRevenue,
    'Partnership Revenue': s.partnerClosedRevenue,
  }));
  const closesData = stats.map(s => ({
    name: s.rep.split(' ')[0],
    'Assessment Closes': s.assessClosed,
    'Partnership Closes': s.partnerClosed,
  }));
  const sorted = [...stats].sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Rep Scoreboard</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-md font-semibold text-gray-700 mb-4">Total Closed Revenue by Rep</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => '$' + (v/1000).toFixed(0) + 'k'} />
            <Tooltip formatter={fmtTip} />
            <Legend />
            <Bar dataKey="Assessment Revenue" fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="Partnership Revenue" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-md font-semibold text-gray-700 mb-4">Number of Closes by Rep</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={closesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Assessment Closes" fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="Partnership Closes" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader title="Leaderboard — Total Revenue" />
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-harbinger-900 text-white">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Rep</th>
              <th className="px-4 py-3 text-right">Assess Closes</th>
              <th className="px-4 py-3 text-right">Assess Revenue</th>
              <th className="px-4 py-3 text-right">Assess Win %</th>
              <th className="px-4 py-3 text-right">Partner Closes</th>
              <th className="px-4 py-3 text-right">Partner Revenue</th>
              <th className="px-4 py-3 text-right">Partner Win %</th>
              <th className="px-4 py-3 text-right font-bold">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={s.rep} className={`${s.rep === user ? 'bg-blue-50 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-3">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</td>
                <td className="px-4 py-3">{s.rep}{s.rep === user ? ' (You)' : ''}</td>
                <td className="px-4 py-3 text-right">{s.assessClosed}</td>
                <td className="px-4 py-3 text-right">{fmt(s.assessClosedRevenue)}</td>
                <td className="px-4 py-3 text-right">{pct(s.assessWinRate)}</td>
                <td className="px-4 py-3 text-right">{s.partnerClosed}</td>
                <td className="px-4 py-3 text-right">{fmt(s.partnerClosedRevenue)}</td>
                <td className="px-4 py-3 text-right">{pct(s.partnerWinRate)}</td>
                <td className="px-4 py-3 text-right font-bold text-harbinger-700">{fmt(s.totalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
