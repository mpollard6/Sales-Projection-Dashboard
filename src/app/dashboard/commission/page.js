'use client';
import { useEffect, useState } from 'react';
import { getRepCommissionForecast, num, REPS } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct, Badge, Select, FilterBar } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Commission() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [boost, setBoost] = useState(0);
  const [manualCloses, setManualCloses] = useState(new Set());
  const [selectedRep, setSelectedRep] = useState('');

  useEffect(() => {
    const u=localStorage.getItem('harbinger_user'), r=localStorage.getItem('harbinger_role');
    setUser(u); setRole(r);
    setSelectedRep(r!=='admin'?u:REPS[0]);
  }, []);
  if (!user) return null;

  const isAdmin = role === 'admin';
  const rep = isAdmin ? selectedRep : user;
  const data = getRepCommissionForecast(rep, boost, [...manualCloses]);

  const toggle = id => setManualCloses(prev => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });

  // Split: forecast deals go in the top summary, non-forecast go in clickable section
  const forecastItems = data.items.filter(i => i.inCurrentForecast);
  const nonForecastAssess = data.items.filter(i => !i.inCurrentForecast && i.type === 'Assessment');
  const nonForecastPartner = data.items.filter(i => !i.inCurrentForecast && i.type === 'Partnership');
  
  const forecastCommission = forecastItems.reduce((s,i) => s + i.boostedCommission, 0);
  const manualCommission = data.items.filter(i => i.manualClose).reduce((s,i) => s + i.value * i.rate, 0);

  const warm = forecastItems.filter(i => i.pipeline === 'Warm');
  const cold = forecastItems.filter(i => i.pipeline !== 'Warm');
  const chartData = [
    {name:'Warm (2.5%)',Current:Math.round(warm.reduce((s,i)=>s+i.baseCommission,0)),Boosted:Math.round(warm.reduce((s,i)=>s+i.boostedCommission,0))},
    {name:'Cold/BD (3.5%)',Current:Math.round(cold.reduce((s,i)=>s+i.baseCommission,0)),Boosted:Math.round(cold.reduce((s,i)=>s+i.boostedCommission,0))},
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-2">Commission Forecast</h1>
      <p className="text-gray-500 mb-6">Warm = 2.5% | Cold & Brave Digital = 3.5%. Top section shows forecast deals. Below, select additional deals you think you can close.</p>

      {isAdmin && (<FilterBar><Select label="Rep" value={selectedRep} onChange={v=>{setSelectedRep(v);setManualCloses(new Set());}} options={REPS.map(r=>({value:r,label:r}))}/></FilterBar>)}

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Close Rate Boost</h3>
        <div className="flex items-center gap-6">
          <input type="range" min="0" max="50" step="5" value={boost} onChange={e=>setBoost(Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-harbinger-700"/>
          <div className="text-center min-w-[100px]"><span className="text-3xl font-bold text-harbinger-700">+{boost}%</span><p className="text-xs text-gray-400">boost</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Forecast Commission" value={fmt(forecastCommission)} sub={`${forecastItems.length} deals in model`} color="blue"/>
        <StatCard label="Manual Close Commission" value={fmt(manualCommission)} sub={`${manualCloses.size} deals selected`} color="gold"/>
        <StatCard label="Total Projected" value={fmt(forecastCommission + manualCommission)} color="green"/>
        <StatCard label="Boost Gain" value={fmt(data.additional)} sub={`From +${boost}%`} color="purple"/>
      </div>

      {forecastItems.length > 0 && (<>
        <SectionHeader title={`Current Forecast Deals (${forecastItems.length}) — Auto-included`}/>
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6"><table className="w-full text-sm"><thead><tr className="bg-blue-50">
          <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-left">Type</th>
          <th className="px-3 py-2 text-center">Pipeline</th><th className="px-3 py-2 text-right">Value</th>
          <th className="px-3 py-2 text-center">Rate</th><th className="px-3 py-2 text-center">Close %</th>
          <th className="px-3 py-2 text-center">Boosted %</th><th className="px-3 py-2 text-right">Commission</th>
        </tr></thead><tbody>{forecastItems.sort((a,b)=>b.boostedCommission-a.boostedCommission).map((item,i)=>(
          <tr key={item.id} className={i%2===0?'bg-white':'bg-gray-50'}>
            <td className="px-3 py-2 font-medium">{item.name}</td>
            <td className="px-3 py-2"><Badge text={item.type} color={item.type==='Assessment'?'blue':'gold'}/></td>
            <td className="px-3 py-2 text-center"><Badge text={item.pipeline} color={item.pipeline==='Warm'?'gold':'blue'}/></td>
            <td className="px-3 py-2 text-right">{fmt(item.value)}</td>
            <td className="px-3 py-2 text-center">{pct(item.rate)}</td>
            <td className="px-3 py-2 text-center">{pct(item.chancePrimary)}</td>
            <td className="px-3 py-2 text-center font-semibold">{pct(item.boostedPrimary)}</td>
            <td className="px-3 py-2 text-right font-semibold text-harbinger-700">{fmt(item.boostedCommission)}</td>
          </tr>))}</tbody></table></div>
      </>)}

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/>
            <YAxis tickFormatter={v=>'$'+(v/1000).toFixed(1)+'k'}/><Tooltip formatter={v=>'$'+Math.round(v).toLocaleString()}/><Legend/>
            <Bar dataKey="Current" fill="#93c5fd" radius={[4,4,0,0]}/><Bar dataKey="Boosted" fill="#3b82f6" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Non-forecast deals: clickable to model manual closes */}
      {nonForecastAssess.length > 0 && (<>
        <SectionHeader title={`What If I Close These? — Assessments Not in Forecast (${nonForecastAssess.length})`}/>
        <p className="text-sm text-gray-500 mb-3">These deals are not in the current prediction model. Check any you think you can close to add their commission.</p>
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2 w-10">Close?</th><th className="px-3 py-2 text-left">Deal</th>
          <th className="px-3 py-2 text-center">Pipeline</th><th className="px-3 py-2 text-right">Value</th>
          <th className="px-3 py-2 text-center">Rate</th><th className="px-3 py-2 text-right">If Closed</th>
        </tr></thead><tbody>{nonForecastAssess.sort((a,b)=>b.value-a.value).map((item,i)=>(
          <tr key={item.id} className={`${item.manualClose?'bg-green-50':i%2===0?'bg-white':'bg-gray-50'} cursor-pointer hover:bg-blue-50`} onClick={()=>toggle(item.id)}>
            <td className="px-3 py-2 text-center"><input type="checkbox" checked={manualCloses.has(item.id)} onChange={()=>toggle(item.id)} className="w-4 h-4 accent-harbinger-700 cursor-pointer" onClick={e=>e.stopPropagation()}/></td>
            <td className="px-3 py-2 font-medium">{item.name}</td>
            <td className="px-3 py-2 text-center"><Badge text={item.pipeline||'—'} color={item.pipeline==='Warm'?'gold':'blue'}/></td>
            <td className="px-3 py-2 text-right">{fmt(item.value)}</td>
            <td className="px-3 py-2 text-center">{pct(item.rate)}</td>
            <td className="px-3 py-2 text-right font-semibold text-green-700">{fmt(item.value*item.rate)}</td>
          </tr>))}</tbody></table></div>
      </>)}

      {nonForecastPartner.length > 0 && (<>
        <SectionHeader title={`What If I Close These? — Partnerships Not in Forecast (${nonForecastPartner.length})`}/>
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2 w-10">Close?</th><th className="px-3 py-2 text-left">Deal</th>
          <th className="px-3 py-2 text-center">Pipeline</th><th className="px-3 py-2 text-right">Total</th>
          <th className="px-3 py-2 text-right">One-Time</th><th className="px-3 py-2 text-right">Onboard</th>
          <th className="px-3 py-2 text-right">Ongoing</th><th className="px-3 py-2 text-center">Rate</th>
          <th className="px-3 py-2 text-right">If Closed</th>
        </tr></thead><tbody>{nonForecastPartner.sort((a,b)=>b.value-a.value).map((item,i)=>(
          <tr key={item.id} className={`${item.manualClose?'bg-green-50':i%2===0?'bg-white':'bg-gray-50'} cursor-pointer hover:bg-blue-50`} onClick={()=>toggle(item.id)}>
            <td className="px-3 py-2 text-center"><input type="checkbox" checked={manualCloses.has(item.id)} onChange={()=>toggle(item.id)} className="w-4 h-4 accent-harbinger-700 cursor-pointer" onClick={e=>e.stopPropagation()}/></td>
            <td className="px-3 py-2 font-medium">{item.name}</td>
            <td className="px-3 py-2 text-center"><Badge text={item.pipeline||'—'} color={item.pipeline==='Warm'?'gold':item.pipeline==='Brave Digital'?'purple':'blue'}/></td>
            <td className="px-3 py-2 text-right font-semibold">{fmt(item.value)}</td>
            <td className="px-3 py-2 text-right text-gray-500">{fmt(item.oneTime)}</td>
            <td className="px-3 py-2 text-right text-gray-500">{fmt(item.onboarding)}</td>
            <td className="px-3 py-2 text-right text-gray-500">{fmt(item.ongoing)}</td>
            <td className="px-3 py-2 text-center">{pct(item.rate)}</td>
            <td className="px-3 py-2 text-right font-semibold text-green-700">{fmt(item.value*item.rate)}</td>
          </tr>))}</tbody></table></div>
      </>)}

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-harbinger-900 mb-2">Summary</h3>
        <p className="text-sm text-gray-700">
          Forecast deals ({forecastItems.length}){boost>0?` with +${boost}% boost`:''}: <strong>{fmt(forecastCommission)}</strong>
          {manualCloses.size > 0 && <> + {manualCloses.size} manual close{manualCloses.size>1?'s':''}: <strong>{fmt(manualCommission)}</strong></>}
          {' '}= Total projected: <strong>{fmt(forecastCommission + manualCommission)}</strong>
        </p>
      </div>
    </div>
  );
}
