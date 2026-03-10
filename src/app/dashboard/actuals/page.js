'use client';
import { useEffect, useState } from 'react';
import { getPredictedVsActual } from '@/data/utils';
import { StatCard, SectionHeader, fmt, Badge, Select, FilterBar, TableWrapper, EmptyState } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Actuals() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [pipeFilter, setPipeFilter] = useState('all');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const rep = role==='admin'?'admin':user;
  const pf = pipeFilter==='all'?undefined:pipeFilter;
  const data = getPredictedVsActual(rep, pf);
  const tPred=data.reduce((s,d)=>s+d.predicted,0), tAct=data.reduce((s,d)=>s+d.actual,0), tVar=tAct-tPred;
  const chartData = data.slice(0,25).map(d=>({name:d.name.length>16?d.name.slice(0,16)+'…':d.name,Predicted:d.predicted,Actual:d.actual}));

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Predicted vs Actual</h1>
      <FilterBar>
        <Select label="Pipeline" value={pipeFilter} onChange={setPipeFilter} options={[{value:'all',label:'All'},{value:'Warm',label:'Warm'},{value:'Cold',label:'Cold'},{value:'Brave Digital',label:'Brave Digital'}]} />
      </FilterBar>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Deals Closed" value={data.length} color="blue" />
        <StatCard label="Total Predicted" value={fmt(tPred)} color="purple" />
        <StatCard label="Total Actual" value={fmt(tAct)} color="green" />
        <StatCard label="Variance" value={fmt(tVar)} sub={tVar>=0?'Over-delivered':'Under-delivered'} color={tVar>=0?'green':'red'} />
      </div>
      {chartData.length>0&&(
        <div className="bg-white rounded-xl shadow p-6 mb-8 border border-gray-100">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name" tick={{fontSize:10}} angle={-35} textAnchor="end" height={80}/>
              <YAxis tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'}/><Tooltip formatter={v=>'$'+Math.round(v).toLocaleString()}/><Legend/>
              <Bar dataKey="Predicted" fill="#93c5fd" radius={[4,4,0,0]}/><Bar dataKey="Actual" fill="#3b82f6" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <SectionHeader title="All Closed Deals" />
      {data.length===0?<EmptyState message="No closed deals to compare." icon="🎯" />:(
        <TableWrapper><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2.5 text-left font-semibold">Deal</th><th className="px-3 py-2.5 text-left font-semibold">Type</th>
          {role==='admin'&&<th className="px-3 py-2.5 text-left font-semibold">Owner</th>}
          <th className="px-3 py-2.5 text-right font-semibold">Predicted</th><th className="px-3 py-2.5 text-right font-semibold">Actual</th>
          <th className="px-3 py-2.5 text-right font-semibold">Variance</th><th className="px-3 py-2.5 font-semibold">Date</th>
        </tr></thead><tbody>{data.map((d,i)=>(
          <tr key={d.id+d.type} className={`table-row-hover ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
            <td className="px-3 py-2.5 font-medium">{d.name}</td><td className="px-3 py-2.5"><Badge text={d.type} color={d.type==='Assessment'?'blue':'gold'}/></td>
            {role==='admin'&&<td className="px-3 py-2.5 text-gray-600">{d.owner}</td>}
            <td className="px-3 py-2.5 text-right">{fmt(d.predicted)}</td><td className="px-3 py-2.5 text-right">{fmt(d.actual)}</td>
            <td className={`px-3 py-2.5 text-right font-semibold ${d.variance>=0?'text-green-600':'text-red-600'}`}>{fmt(d.variance)}</td>
            <td className="px-3 py-2.5 text-gray-500">{d.closeDate||'—'}</td>
          </tr>))}</tbody></table></TableWrapper>
      )}
    </div>
  );
}
