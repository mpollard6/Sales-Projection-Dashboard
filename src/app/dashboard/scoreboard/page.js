'use client';
import { useEffect, useState } from 'react';
import { getAllRepStats, getAvailableYears, REPS, getRepPipelineForecast, getMomentum, getWinStreak, getRevenueVelocity, getForecastAccuracy, getPipelineCoverage } from '@/data/utils';
import { SectionHeader, fmt, pct, Select, FilterBar, Badge, TableWrapper } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const MO=['','January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Scoreboard() {
  const [user, setUser] = useState(null);
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('');
  const [month, setMonth] = useState('');
  const [pipeFilter, setPipeFilter] = useState('all');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); }, []);
  if (!user) return null;

  const filters = {};
  if (year) filters.year = parseInt(year);
  if (quarter) filters.quarter = parseInt(quarter);
  if (month) filters.month = parseInt(month);
  const hf = Object.keys(filters).length > 0;
  const pf = pipeFilter === 'all' ? undefined : pipeFilter;

  const stats = getAllRepStats(hf ? filters : undefined, pf);
  const years = getAvailableYears();
  const isAdmin = localStorage.getItem('harbinger_role') === 'admin';

  const repMetrics = REPS.map(r => {
    const s = stats.find(x => x.rep === r) || {};
    const f = getRepPipelineForecast(r, pf);
    const m = getMomentum(r);
    const ws = getWinStreak(r);
    const rv = getRevenueVelocity(r);
    const fa = getForecastAccuracy(r);
    const pc = getPipelineCoverage(r);
    return { ...s, forecast: f, momentum: m, winStreak: ws, velocity: rv, accuracy: fa, coverage: pc };
  });

  const revenueData = stats.map(s => ({ name: s.rep.split(' ')[0], Assessment: s.assessClosedRevenue, Partnership: s.partnerClosedRevenue }));
  const sorted = [...repMetrics].sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Rep Scoreboard</h1>
      <FilterBar>
        <Select label="Pipeline" value={pipeFilter} onChange={setPipeFilter} options={[{value:'all',label:'All'},{value:'Warm',label:'Warm'},{value:'Cold',label:'Cold'},{value:'Brave Digital',label:'Brave Digital'}]} />
        <Select label="Year" value={year} onChange={v=>{setYear(v);if(!v){setQuarter('');setMonth('');}}} options={[{value:'',label:'All Time'},...years.map(y=>({value:String(y),label:String(y)}))]} />
        {year && <Select label="Quarter" value={quarter} onChange={v=>{setQuarter(v);if(v)setMonth('');}} options={[{value:'',label:'All'},{value:'1',label:'Q1'},{value:'2',label:'Q2'},{value:'3',label:'Q3'},{value:'4',label:'Q4'}]} />}
        {year && !quarter && <Select label="Month" value={month} onChange={setMonth} options={[{value:'',label:'All'},...MO.slice(1).map((m,i)=>({value:String(i+1),label:m}))]} />}
        {(hf||pf)&&<button onClick={()=>{setYear('');setQuarter('');setMonth('');setPipeFilter('all');}} className="text-sm text-red-500 hover:text-red-700 mt-5">Clear</button>}
      </FilterBar>

      <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" />
            <YAxis tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'} /><Tooltip formatter={v=>'$'+Math.round(v).toLocaleString()} /><Legend />
            <Bar dataKey="Assessment" fill="#3b82f6" radius={[4,4,0,0]} /><Bar dataKey="Partnership" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader title="Leaderboard" />
      <TableWrapper>
        <table className="w-full text-sm"><thead><tr className="bg-harbinger-900 text-white">
          <th className="px-3 py-3 text-left">Rank</th><th className="px-3 py-3 text-left">Rep</th>
          <th className="px-3 py-3 text-right">A-Closes</th><th className="px-3 py-3 text-right">A-Rev</th><th className="px-3 py-3 text-right">A-Win%</th>
          <th className="px-3 py-3 text-right">P-Closes</th><th className="px-3 py-3 text-right">P-Rev</th><th className="px-3 py-3 text-right">P-Win%</th>
          <th className="px-3 py-3 text-right font-bold">Total Rev</th>
          <th className="px-3 py-3 text-center">Streak</th><th className="px-3 py-3 text-center">Momentum</th>
        </tr></thead><tbody>
          {sorted.map((s,i)=>{const cu=!isAdmin&&s.rep===user;return(
            <tr key={s.rep} className={`table-row-hover ${cu?'bg-blue-50 font-semibold':i%2===0?'bg-white':'bg-gray-50/50'}`}>
              <td className="px-3 py-3">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
              <td className="px-3 py-3 font-medium">{s.rep}{cu?' (You)':''}</td>
              <td className="px-3 py-3 text-right">{s.assessClosed}</td><td className="px-3 py-3 text-right">{fmt(s.assessClosedRevenue)}</td><td className="px-3 py-3 text-right">{pct(s.assessWinRate)}</td>
              <td className="px-3 py-3 text-right">{s.partnerClosed}</td><td className="px-3 py-3 text-right">{fmt(s.partnerClosedRevenue)}</td><td className="px-3 py-3 text-right">{pct(s.partnerWinRate)}</td>
              <td className="px-3 py-3 text-right font-bold text-harbinger-700">{fmt(s.totalRevenue)}</td>
              <td className="px-3 py-3 text-center">🔥{s.winStreak}</td>
              <td className="px-3 py-3 text-center">{s.momentum.trend==='growing'?'📈':s.momentum.trend==='shrinking'?'📉':'➡️'}</td>
            </tr>);})}
        </tbody></table>
      </TableWrapper>

      <SectionHeader title="Leadership Metrics" />
      <TableWrapper>
        <table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2.5 text-left font-semibold">Rep</th>
          <th className="px-3 py-2.5 text-center font-semibold">Revenue Velocity</th>
          <th className="px-3 py-2.5 text-center font-semibold">Avg Days to Close</th>
          <th className="px-3 py-2.5 text-center font-semibold">Forecast Accuracy</th>
          <th className="px-3 py-2.5 text-center font-semibold">Pipeline Coverage</th>
          <th className="px-3 py-2.5 text-right font-semibold">30d Forecast Rev</th>
          <th className="px-3 py-2.5 text-right font-semibold">60d Forecast Rev</th>
        </tr></thead><tbody>
          {repMetrics.map((r,i)=>(
            <tr key={r.rep} className={`table-row-hover ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
              <td className="px-3 py-2.5 font-medium">{r.rep}</td>
              <td className="px-3 py-2.5 text-center">{fmt(r.velocity.avgRevPerDay)}/day</td>
              <td className="px-3 py-2.5 text-center">{r.velocity.avgDays} days</td>
              <td className="px-3 py-2.5 text-center"><Badge text={`${r.accuracy.score}%`} color={r.accuracy.score>=80?'green':r.accuracy.score>=60?'gold':'red'} /></td>
              <td className="px-3 py-2.5 text-center"><Badge text={`${r.coverage.ratio.toFixed(1)}x`} color={r.coverage.ratio>=3?'green':r.coverage.ratio>=2?'gold':'red'} /></td>
              <td className="px-3 py-2.5 text-right">{fmt(r.forecast.totalW30)}</td>
              <td className="px-3 py-2.5 text-right">{fmt(r.forecast.totalW60)}</td>
            </tr>
          ))}
        </tbody></table>
      </TableWrapper>
    </div>
  );
}
