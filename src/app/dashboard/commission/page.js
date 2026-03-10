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
    const u = localStorage.getItem('harbinger_user');
    const r = localStorage.getItem('harbinger_role');
    setUser(u); setRole(r);
    if (r !== 'admin') setSelectedRep(u);
    else setSelectedRep(REPS[0]);
  }, []);
  if (!user) return null;

  const isAdmin = role === 'admin';
  const rep = isAdmin ? selectedRep : user;
  const data = getRepCommissionForecast(rep, boost, [...manualCloses]);

  const toggleManualClose = (id) => {
    setManualCloses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const assessItems = data.items.filter(i => i.type === 'Assessment');
  const partnerItems = data.items.filter(i => i.type === 'Partnership');
  const manualTotal = data.items.filter(i => i.manualClose).reduce((s, i) => s + i.value * i.rate, 0);

  const warm = data.items.filter(i => i.pipeline === 'Warm');
  const cold = data.items.filter(i => i.pipeline !== 'Warm');
  const chartData = [
    { name: 'Warm (2.5%)', Current: Math.round(warm.reduce((s,i) => s+i.baseCommission, 0)), Boosted: Math.round(warm.reduce((s,i) => s+i.boostedCommission, 0)) },
    { name: 'Cold/BD (3.5%)', Current: Math.round(cold.reduce((s,i) => s+i.baseCommission, 0)), Boosted: Math.round(cold.reduce((s,i) => s+i.boostedCommission, 0)) },
    { name: 'Total', Current: Math.round(data.totalBase), Boosted: Math.round(data.totalBoosted) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-2">Commission Forecast</h1>
      <p className="text-gray-500 mb-6">Warm leads = 2.5% commission. Cold and Brave Digital = 3.5%. Adjust close rate or select deals to see projected earnings.</p>

      {isAdmin && (
        <FilterBar>
          <Select label="Select Rep" value={selectedRep} onChange={v => { setSelectedRep(v); setManualCloses(new Set()); }}
            options={REPS.map(r => ({ value: r, label: r }))} />
        </FilterBar>
      )}

      {/* Close Rate Boost Slider */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="text-md font-semibold text-gray-700 mb-3">What If You Increase Your Close Rate?</h3>
        <div className="flex items-center gap-6">
          <input type="range" min="0" max="50" step="5" value={boost} onChange={e => setBoost(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-harbinger-700" />
          <div className="text-center min-w-[100px]">
            <span className="text-3xl font-bold text-harbinger-700">+{boost}%</span>
            <p className="text-xs text-gray-400">close rate boost</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Current Forecast" value={fmt(data.totalBase)} sub="Based on existing close %" color="blue" />
        <StatCard label="Boosted Forecast" value={fmt(data.totalBoosted)} sub={`With +${boost}% and ${manualCloses.size} manual closes`} color="green" />
        <StatCard label="Additional Commission" value={fmt(data.additional)} color={data.additional > 0 ? 'gold' : 'blue'} />
        <StatCard label="Open Deals" value={data.items.length} sub={`${warm.length} warm / ${cold.length} cold`} color="purple" />
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" />
            <YAxis tickFormatter={v=>'$'+(v/1000).toFixed(1)+'k'} /><Tooltip formatter={v=>'$'+Math.round(v).toLocaleString()} /><Legend />
            <Bar dataKey="Current" fill="#93c5fd" radius={[4,4,0,0]} /><Bar dataKey="Boosted" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* What If I Close This Deal - Assessment */}
      <SectionHeader title={`What If I Close These? — Assessments (${assessItems.length})`} />
      <p className="text-sm text-gray-500 mb-3">Click the checkbox next to any deal to see what your commission would be if you closed it at 100%.</p>
      {assessItems.length === 0 ? <p className="text-gray-400 mb-6">No open assessment deals</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-100">
              <th className="px-3 py-2 w-10">Close?</th>
              <th className="px-3 py-2 text-left">Deal</th>
              <th className="px-3 py-2 text-center">Pipeline</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2 text-center">Rate</th>
              <th className="px-3 py-2 text-center">Current %</th>
              <th className="px-3 py-2 text-right">Current Comm</th>
              <th className="px-3 py-2 text-right">If Closed</th>
            </tr></thead>
            <tbody>{assessItems.sort((a,b) => b.value-a.value).map((item,i) => (
              <tr key={item.id} className={`${item.manualClose ? 'bg-green-50' : i%2===0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-blue-50`}
                  onClick={() => toggleManualClose(item.id)}>
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" checked={manualCloses.has(item.id)} onChange={() => toggleManualClose(item.id)}
                    className="w-4 h-4 accent-harbinger-700 cursor-pointer" onClick={e => e.stopPropagation()} />
                </td>
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2 text-center"><Badge text={item.pipeline} color={item.pipeline==='Warm'?'gold':'blue'} /></td>
                <td className="px-3 py-2 text-right">{fmt(item.value)}</td>
                <td className="px-3 py-2 text-center">{pct(item.rate)}</td>
                <td className="px-3 py-2 text-center">{item.manualClose ? '100%' : pct(item.closeChance)}</td>
                <td className="px-3 py-2 text-right">{fmt(item.baseCommission)}</td>
                <td className="px-3 py-2 text-right font-semibold text-green-700">{fmt(item.value * item.rate)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}

      {/* What If I Close This Deal - Partnership */}
      <SectionHeader title={`What If I Close These? — Partnerships (${partnerItems.length})`} />
      {partnerItems.length === 0 ? <p className="text-gray-400 mb-6">No open partnership deals</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-100">
              <th className="px-3 py-2 w-10">Close?</th>
              <th className="px-3 py-2 text-left">Deal</th>
              <th className="px-3 py-2 text-center">Pipeline</th>
              <th className="px-3 py-2 text-right">Total Value</th>
              <th className="px-3 py-2 text-right">One-Time</th>
              <th className="px-3 py-2 text-right">Onboarding</th>
              <th className="px-3 py-2 text-right">Ongoing</th>
              <th className="px-3 py-2 text-center">Rate</th>
              <th className="px-3 py-2 text-center">Current %</th>
              <th className="px-3 py-2 text-right">Current Comm</th>
              <th className="px-3 py-2 text-right">If Closed</th>
            </tr></thead>
            <tbody>{partnerItems.sort((a,b) => b.value-a.value).map((item,i) => (
              <tr key={item.id} className={`${item.manualClose ? 'bg-green-50' : i%2===0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-blue-50`}
                  onClick={() => toggleManualClose(item.id)}>
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" checked={manualCloses.has(item.id)} onChange={() => toggleManualClose(item.id)}
                    className="w-4 h-4 accent-harbinger-700 cursor-pointer" onClick={e => e.stopPropagation()} />
                </td>
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2 text-center"><Badge text={item.pipeline} color={item.pipeline==='Warm'?'gold':item.pipeline==='Brave Digital'?'purple':'blue'} /></td>
                <td className="px-3 py-2 text-right font-semibold">{fmt(item.value)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{fmt(item.oneTime)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{fmt(item.onboarding)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{fmt(item.ongoing)}</td>
                <td className="px-3 py-2 text-center">{pct(item.rate)}</td>
                <td className="px-3 py-2 text-center">{item.manualClose ? '100%' : pct(item.closeChance)}</td>
                <td className="px-3 py-2 text-right">{fmt(item.baseCommission)}</td>
                <td className="px-3 py-2 text-right font-semibold text-green-700">{fmt(item.value * item.rate)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-harbinger-900 mb-2">Commission Summary</h3>
        <p className="text-sm text-gray-700">
          {manualCloses.size > 0
            ? `You've selected ${manualCloses.size} deal${manualCloses.size>1?'s':''} as manual closes. If those close at full value plus your +${boost}% rate boost on remaining deals, your projected commission is ${fmt(data.totalBoosted)}.`
            : boost > 0
              ? `With a +${boost}% close rate improvement across all open deals, your projected commission goes from ${fmt(data.totalBase)} to ${fmt(data.totalBoosted)} — an additional ${fmt(data.additional)}.`
              : `Your current projected commission based on existing close probabilities is ${fmt(data.totalBase)}. Use the slider or checkboxes above to model scenarios.`
          }
        </p>
        {data.items.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Average pipeline deal: {fmt(data.items.reduce((s,i)=>s+i.value,0)/data.items.length)} |
            Each 1% close improvement ≈ {fmt(data.items.reduce((s,i)=>s+i.value*0.01*i.rate,0))} additional commission
          </p>
        )}
      </div>
    </div>
  );
}
