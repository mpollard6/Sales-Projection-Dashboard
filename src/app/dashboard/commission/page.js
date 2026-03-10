'use client';
import { useEffect, useState } from 'react';
import { getRepCommissionForecast, num } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Commission() {
  const [user, setUser] = useState(null);
  const [boost, setBoost] = useState(0);
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); }, []);
  if (!user) return null;

  const data = getRepCommissionForecast(user, boost);
  const warm = data.items.filter(i => i.pipeline === 'Warm');
  const cold = data.items.filter(i => i.pipeline !== 'Warm');

  const warmBase = warm.reduce((s, i) => s + i.baseCommission, 0);
  const warmBoosted = warm.reduce((s, i) => s + i.boostedCommission, 0);
  const coldBase = cold.reduce((s, i) => s + i.baseCommission, 0);
  const coldBoosted = cold.reduce((s, i) => s + i.boostedCommission, 0);

  const chartData = [
    { name: 'Warm (2.5%)', 'Current Forecast': Math.round(warmBase), 'With Boost': Math.round(warmBoosted) },
    { name: 'Cold (3.5%)', 'Current Forecast': Math.round(coldBase), 'With Boost': Math.round(coldBoosted) },
    { name: 'Total', 'Current Forecast': Math.round(data.totalBase), 'With Boost': Math.round(data.totalBoosted) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-2">Commission Forecast</h1>
      <p className="text-gray-500 mb-6">See projected commissions on your open pipeline. Warm leads pay 2.5%, cold leads pay 3.5%. Use the slider to model what happens if you increase your close rate.</p>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-md font-semibold text-gray-700 mb-3">What If You Increase Your Close Rate?</h3>
        <p className="text-sm text-gray-500 mb-4">Drag the slider to add percentage points to your current close probability on every open deal.</p>
        <div className="flex items-center gap-6">
          <input
            type="range" min="0" max="50" step="5" value={boost}
            onChange={e => setBoost(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-harbinger-700"
          />
          <div className="text-center min-w-[100px]">
            <span className="text-3xl font-bold text-harbinger-700">+{boost}%</span>
            <p className="text-xs text-gray-400">close rate boost</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Current Commission Forecast" value={fmt(data.totalBase)} sub="Based on existing close %" color="blue" />
        <StatCard label="Boosted Commission Forecast" value={fmt(data.totalBoosted)} sub={`With +${boost}% close rate`} color="green" />
        <StatCard label="Additional Commission" value={fmt(data.additional)} sub={`From +${boost}% improvement`} color={data.additional > 0 ? 'gold' : 'blue'} />
        <StatCard label="Open Deals in Pipeline" value={data.items.length} sub={`${warm.length} warm / ${cold.length} cold`} color="purple" />
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h3 className="text-md font-semibold text-gray-700 mb-4">Commission by Pipeline Source</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => '$' + (v/1000).toFixed(1) + 'k'} />
            <Tooltip formatter={v => '$' + Math.round(v).toLocaleString()} />
            <Legend />
            <Bar dataKey="Current Forecast" fill="#93c5fd" radius={[4,4,0,0]} />
            <Bar dataKey="With Boost" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader title="Deal-by-Deal Commission Breakdown" />
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Deal</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Pipeline</th>
              <th className="px-3 py-2 text-right">Deal Value</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Current %</th>
              <th className="px-3 py-2 text-right">Boosted %</th>
              <th className="px-3 py-2 text-right">Current $</th>
              <th className="px-3 py-2 text-right">Boosted $</th>
              <th className="px-3 py-2 text-right">Gain</th>
            </tr>
          </thead>
          <tbody>
            {data.items.sort((a, b) => b.boostedCommission - a.boostedCommission).map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2 text-xs">{item.type}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.pipeline === 'Warm' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                    {item.pipeline}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{fmt(item.value)}</td>
                <td className="px-3 py-2 text-right">{pct(item.rate)}</td>
                <td className="px-3 py-2 text-right">{pct(item.closeChance)}</td>
                <td className="px-3 py-2 text-right font-semibold">{pct(item.boostedChance)}</td>
                <td className="px-3 py-2 text-right">{fmt(item.baseCommission)}</td>
                <td className="px-3 py-2 text-right font-semibold">{fmt(item.boostedCommission)}</td>
                <td className={`px-3 py-2 text-right font-semibold ${item.boostedCommission - item.baseCommission > 0 ? 'text-green-600' : ''}`}>
                  {fmt(item.boostedCommission - item.baseCommission)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-harbinger-900 mb-2">What This Means</h3>
        <p className="text-sm text-gray-700">
          {boost === 0
            ? `Based on your current close probabilities, your projected commission on open pipeline deals is ${fmt(data.totalBase)}.`
            : `If you increase your close rate by ${boost} percentage points across all open deals, your projected commission goes from ${fmt(data.totalBase)} to ${fmt(data.totalBoosted)} — an additional ${fmt(data.additional)} in potential commission earnings.`
          }
        </p>
        {boost > 0 && data.items.length > 0 && (
          <p className="text-sm text-gray-700 mt-2">
            Your average pipeline deal is worth {fmt(data.items.reduce((s, i) => s + i.value, 0) / data.items.length)}.
            Each percentage point of close rate improvement translates to roughly {fmt(data.items.reduce((s, i) => s + i.value * 0.01 * i.rate, 0))} in additional commission.
          </p>
        )}
      </div>
    </div>
  );
}
