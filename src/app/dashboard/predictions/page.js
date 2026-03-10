'use client';
import { useEffect, useState } from 'react';
import { getAssessDeals, getPartnerDeals, getDealPredictionHistory, num } from '@/data/utils';
import { SectionHeader, fmt, pct } from '@/components/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Predictions() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState('');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const rep = role === 'admin' ? 'admin' : user;
  const assessDeals = getAssessDeals(rep);
  const partnerDeals = getPartnerDeals(rep);
  const history = selectedDeal ? getDealPredictionHistory(selectedDeal) : [];
  const chartData = history.map(h => ({ period: h.period || h.predDate, '30-Day %': Math.round(num(h.chance30)*100), '60-Day %': Math.round(num(h.chance60)*100) }));
  const info = [...assessDeals, ...partnerDeals].find(d => d.id === selectedDeal);

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Prediction Tracker</h1>
      <p className="text-gray-500 mb-6">Select a deal to see how close confidence evolved over bi-monthly snapshots.</p>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select a Deal</label>
        <select value={selectedDeal} onChange={e => setSelectedDeal(e.target.value)}
          className="w-full max-w-lg border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-harbinger-500 outline-none">
          <option value="">— Choose a deal —</option>
          <optgroup label="Assessment Deals">
            {assessDeals.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id}) — {d.status}{role==='admin'?' — '+d.owner:''}</option>)}
          </optgroup>
          <optgroup label="Partnership Deals">
            {partnerDeals.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id}) — {d.status}{role==='admin'?' — '+d.owner:''}</option>)}
          </optgroup>
        </select>
      </div>

      {selectedDeal && history.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex flex-wrap gap-8 mb-4 text-sm">
              <div><span className="text-gray-500">Deal:</span> <strong>{info?.name}</strong></div>
              <div><span className="text-gray-500">Status:</span> <strong>{info?.status}</strong></div>
              {role==='admin' && <div><span className="text-gray-500">Owner:</span> <strong>{info?.owner}</strong></div>}
              <div><span className="text-gray-500">Snapshots:</span> <strong>{history.length}</strong></div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{fontSize:11}} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0,100]} tickFormatter={v => v+'%'} /><Tooltip formatter={(v,n) => [v+'%',n]} />
                <Line type="monotone" dataKey="30-Day %" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} />
                <Line type="monotone" dataKey="60-Day %" stroke="#f59e0b" strokeWidth={2} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <SectionHeader title="Snapshot History" />
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Period</th><th className="px-3 py-2 text-left">Stage</th>
                <th className="px-3 py-2 text-right">Value</th><th className="px-3 py-2 text-right">30-Day %</th>
                <th className="px-3 py-2 text-right">60-Day %</th><th className="px-3 py-2 text-right">30d Weighted</th><th className="px-3 py-2">Status</th>
              </tr></thead>
              <tbody>{history.map((h,i) => (
                <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                  <td className="px-3 py-2">{h.period||h.predDate}</td><td className="px-3 py-2 text-gray-600 text-xs">{h.stage||'—'}</td>
                  <td className="px-3 py-2 text-right">{fmt(h.predictedValue)}</td><td className="px-3 py-2 text-right">{pct(h.chance30)}</td>
                  <td className="px-3 py-2 text-right">{pct(h.chance60)}</td><td className="px-3 py-2 text-right font-semibold">{fmt(num(h.predictedValue)*num(h.chance30))}</td>
                  <td className="px-3 py-2">{h.status||'—'}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </>
      )}
      {selectedDeal && history.length===0 && <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">No prediction snapshots found.</div>}
    </div>
  );
}
