'use client';
import { useEffect, useState } from 'react';
import { getAssessDeals, getPartnerDeals, getDealPredictionHistory, num } from '@/data/utils';
import { SectionHeader, fmt, pct, TableWrapper, EmptyState } from '@/components/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Predictions() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const rep = role === 'admin' ? 'admin' : user;
  const assessDeals = getAssessDeals(rep);
  const partnerDeals = getPartnerDeals(rep);
  const history = selectedDeal ? getDealPredictionHistory(selectedDeal) : [];
  const chartData = history.map(h => ({ period: h.period || h.predDate, '30-Day %': Math.round(num(h.chance30)*100), '60-Day %': Math.round(num(h.chance60)*100) }));
  const info = [...assessDeals, ...partnerDeals].find(d => d.id === selectedDeal);

  const sq = searchTerm.toLowerCase().trim();
  const filteredAssess = sq ? assessDeals.filter(d => (d.name||'').toLowerCase().includes(sq) || (d.owner||'').toLowerCase().includes(sq)) : assessDeals;
  const filteredPartner = sq ? partnerDeals.filter(d => (d.name||'').toLowerCase().includes(sq) || (d.owner||'').toLowerCase().includes(sq)) : partnerDeals;

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-2">Prediction Tracker</h1>
      <p className="text-gray-500 mb-6 text-sm">Select a deal to see how close confidence evolved over bi-monthly snapshots.</p>
      <div className="bg-white rounded-xl shadow p-6 mb-8 border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select a Deal</label>
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Type to filter deals..."
          className="search-input w-full max-w-lg border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-harbinger-500 outline-none mb-3 placeholder-gray-400" />
        <select value={selectedDeal} onChange={e => setSelectedDeal(e.target.value)} size={8}
          className="w-full max-w-lg border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-harbinger-500 outline-none bg-white">
          <option value="">— Choose a deal —</option>
          {filteredAssess.length > 0 && <optgroup label={`Assessment Deals (${filteredAssess.length})`}>
            {filteredAssess.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id}) — {d.status}{role==='admin'?' — '+d.owner:''}</option>)}
          </optgroup>}
          {filteredPartner.length > 0 && <optgroup label={`Partnership Deals (${filteredPartner.length})`}>
            {filteredPartner.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id}) — {d.status}{role==='admin'?' — '+d.owner:''}</option>)}
          </optgroup>}
        </select>
      </div>

      {selectedDeal && history.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
            <div className="flex flex-wrap gap-6 mb-4 text-sm">
              <div><span className="text-gray-500">Deal:</span> <strong>{info?.name}</strong></div>
              <div><span className="text-gray-500">Status:</span> <strong>{info?.status}</strong></div>
              {role==='admin' && <div><span className="text-gray-500">Owner:</span> <strong>{info?.owner}</strong></div>}
              <div><span className="text-gray-500">Snapshots:</span> <strong>{history.length}</strong></div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{fontSize:11}} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0,100]} tickFormatter={v => v+'%'} /><Tooltip formatter={(v,n) => [v+'%',n]} /><Legend />
                <Line type="monotone" dataKey="30-Day %" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} activeDot={{r:6}} />
                <Line type="monotone" dataKey="60-Day %" stroke="#f59e0b" strokeWidth={2} dot={{r:4}} activeDot={{r:6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <SectionHeader title="Snapshot History" />
          <TableWrapper>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-100">
                <th className="px-3 py-2.5 text-left font-semibold">Period</th><th className="px-3 py-2.5 text-left font-semibold">Stage</th>
                <th className="px-3 py-2.5 text-right font-semibold">Value</th><th className="px-3 py-2.5 text-right font-semibold">30-Day %</th>
                <th className="px-3 py-2.5 text-right font-semibold">60-Day %</th><th className="px-3 py-2.5 text-right font-semibold">30d Weighted</th><th className="px-3 py-2.5 font-semibold">Status</th>
              </tr></thead>
              <tbody>{history.map((h,i) => (
                <tr key={i} className={`table-row-hover ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
                  <td className="px-3 py-2.5">{h.period||h.predDate}</td><td className="px-3 py-2.5 text-gray-600 text-xs">{h.stage||'—'}</td>
                  <td className="px-3 py-2.5 text-right">{fmt(h.predictedValue)}</td><td className="px-3 py-2.5 text-right">{pct(h.chance30)}</td>
                  <td className="px-3 py-2.5 text-right">{pct(h.chance60)}</td><td className="px-3 py-2.5 text-right font-semibold">{fmt(num(h.predictedValue)*num(h.chance30))}</td>
                  <td className="px-3 py-2.5">{h.status||'—'}</td>
                </tr>))}</tbody>
            </table>
          </TableWrapper>
        </>
      )}
      {selectedDeal && history.length===0 && <EmptyState message="No prediction snapshots found for this deal." icon="📊" />}
    </div>
  );
}
