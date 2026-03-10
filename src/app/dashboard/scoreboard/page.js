'use client';
import { useEffect, useState } from 'react';
import { getAllRepStats, getAvailableYears, REPS } from '@/data/utils';
import { SectionHeader, fmt, pct, Select, FilterBar } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Scoreboard() {
  const [user, setUser] = useState(null);
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('');
  const [month, setMonth] = useState('');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); }, []);
  if (!user) return null;

  const filters = {};
  if (year) filters.year = parseInt(year);
  if (quarter) filters.quarter = parseInt(quarter);
  if (month) filters.month = parseInt(month);
  const hasFilters = Object.keys(filters).length > 0;

  const stats = getAllRepStats(hasFilters ? filters : undefined);
  const years = getAvailableYears();

  const revenueData = stats.map(s => ({ name: s.rep.split(' ')[0], 'Assessment': s.assessClosedRevenue, 'Partnership': s.partnerClosedRevenue }));
  const closesData = stats.map(s => ({ name: s.rep.split(' ')[0], 'Assess Closes': s.assessClosed, 'Partner Closes': s.partnerClosed }));
  const sorted = [...stats].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const filterLabel = hasFilters ? ` (${year||'All'}${quarter ? ' Q'+quarter : ''}${month ? ' '+MONTHS[month] : ''})` : '';
  const isAdmin = localStorage.getItem('harbinger_role') === 'admin';
  const currentUser = isAdmin ? null : user;

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Rep Scoreboard{filterLabel}</h1>
      <FilterBar>
        <Select label="Year" value={year} onChange={v => { setYear(v); if (!v) { setQuarter(''); setMonth(''); }}}
          options={[{value:'',label:'All Time'}, ...years.map(y => ({value:String(y),label:String(y)}))]} />
        {year && <Select label="Quarter" value={quarter} onChange={v => { setQuarter(v); if (v) setMonth(''); }}
          options={[{value:'',label:'All'},{value:'1',label:'Q1'},{value:'2',label:'Q2'},{value:'3',label:'Q3'},{value:'4',label:'Q4'}]} />}
        {year && !quarter && <Select label="Month" value={month} onChange={setMonth}
          options={[{value:'',label:'All'}, ...MONTHS.slice(1).map((m,i) => ({value:String(i+1),label:m}))]} />}
        {hasFilters && <button onClick={() => { setYear(''); setQuarter(''); setMonth(''); }} className="text-sm text-red-500 hover:text-red-700 mt-5">Clear Filters</button>}
      </FilterBar>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-md font-semibold text-gray-700 mb-4">Closed Revenue by Rep</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" />
              <YAxis tickFormatter={v => '$'+(v/1000).toFixed(0)+'k'} /><Tooltip formatter={v => '$'+Math.round(v).toLocaleString()} /><Legend />
              <Bar dataKey="Assessment" fill="#3b82f6" radius={[4,4,0,0]} /><Bar dataKey="Partnership" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-md font-semibold text-gray-700 mb-4">Number of Closes by Rep</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={closesData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="Assess Closes" fill="#3b82f6" radius={[4,4,0,0]} /><Bar dataKey="Partner Closes" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionHeader title="Leaderboard" />
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-harbinger-900 text-white">
            <th className="px-4 py-3 text-left">Rank</th><th className="px-4 py-3 text-left">Rep</th>
            <th className="px-4 py-3 text-right">Assess Closes</th><th className="px-4 py-3 text-right">Assess Revenue</th><th className="px-4 py-3 text-right">Assess Win %</th>
            <th className="px-4 py-3 text-right">Partner Closes</th><th className="px-4 py-3 text-right">Partner Revenue</th><th className="px-4 py-3 text-right">Partner Win %</th>
            <th className="px-4 py-3 text-right">Avg Deal</th><th className="px-4 py-3 text-right font-bold">Total Revenue</th>
          </tr></thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={s.rep} className={`${currentUser && s.rep === currentUser ? 'bg-blue-50 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-3">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
                <td className="px-4 py-3">{s.rep}{currentUser && s.rep===currentUser?' (You)':''}</td>
                <td className="px-4 py-3 text-right">{s.assessClosed}</td><td className="px-4 py-3 text-right">{fmt(s.assessClosedRevenue)}</td><td className="px-4 py-3 text-right">{pct(s.assessWinRate)}</td>
                <td className="px-4 py-3 text-right">{s.partnerClosed}</td><td className="px-4 py-3 text-right">{fmt(s.partnerClosedRevenue)}</td><td className="px-4 py-3 text-right">{pct(s.partnerWinRate)}</td>
                <td className="px-4 py-3 text-right">{fmt(s.partnerAvgDeal)}</td>
                <td className="px-4 py-3 text-right font-bold text-harbinger-700">{fmt(s.totalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
