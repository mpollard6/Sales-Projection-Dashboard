'use client';
import { useEffect, useState } from 'react';
import { getPredictedVsActual } from '@/data/utils';
import { StatCard, SectionHeader, fmt } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';

export default function Actuals() {
  const [user, setUser] = useState(null);
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); }, []);
  if (!user) return null;

  const data = getPredictedVsActual(user);
  const assess = data.filter(d => d.type === 'Assessment');
  const partner = data.filter(d => d.type === 'Partnership');

  const totalPred = data.reduce((s, d) => s + d.predicted, 0);
  const totalActual = data.reduce((s, d) => s + d.actual, 0);
  const totalVariance = totalActual - totalPred;
  const avgVariance = data.length > 0 ? totalVariance / data.length : 0;

  const chartData = data.slice(0, 20).map(d => ({
    name: d.name.length > 18 ? d.name.slice(0, 18) + '…' : d.name,
    Predicted: d.predicted,
    Actual: d.actual,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Predicted vs Actual</h1>
      <p className="text-gray-500 mb-6">Comparing what you forecasted for each deal versus what it actually closed at.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Deals Closed" value={data.length} color="blue" />
        <StatCard label="Total Predicted" value={fmt(totalPred)} color="purple" />
        <StatCard label="Total Actual" value={fmt(totalActual)} color="green" />
        <StatCard label="Total Variance" value={fmt(totalVariance)} sub={totalVariance >= 0 ? 'Over-delivered' : 'Under-delivered'} color={totalVariance >= 0 ? 'green' : 'red'} />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-md font-semibold text-gray-700 mb-4">Predicted vs Actual by Deal</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={80} />
              <YAxis tickFormatter={v => '$' + (v/1000).toFixed(0) + 'k'} />
              <Tooltip formatter={v => '$' + Math.round(v).toLocaleString()} />
              <Legend />
              <Bar dataKey="Predicted" fill="#93c5fd" radius={[4,4,0,0]} />
              <Bar dataKey="Actual" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {assess.length > 0 && (
        <>
          <SectionHeader title={`Assessment Closes (${assess.length})`} />
          <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Deal</th>
                <th className="px-3 py-2 text-right">Predicted</th>
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">Variance</th>
              </tr></thead>
              <tbody>
                {assess.map((d, i) => (
                  <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2">{d.name}</td>
                    <td className="px-3 py-2 text-right">{fmt(d.predicted)}</td>
                    <td className="px-3 py-2 text-right">{fmt(d.actual)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${d.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(d.variance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {partner.length > 0 && (
        <>
          <SectionHeader title={`Partnership Closes (${partner.length})`} />
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Deal</th>
                <th className="px-3 py-2 text-right">Predicted</th>
                <th className="px-3 py-2 text-right">Actual</th>
                <th className="px-3 py-2 text-right">Variance</th>
              </tr></thead>
              <tbody>
                {partner.map((d, i) => (
                  <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2">{d.name}</td>
                    <td className="px-3 py-2 text-right">{fmt(d.predicted)}</td>
                    <td className="px-3 py-2 text-right">{fmt(d.actual)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${d.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(d.variance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
