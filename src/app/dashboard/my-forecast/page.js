'use client';
import { useEffect, useState } from 'react';
import { getOpenDeals, num, PIPELINES } from '@/data/utils';
import { loadRepProjections, saveRepProjections } from '@/data/store';
import { StatCard, SectionHeader, fmt, pct, Badge, TableWrapper, EmptyState, CalcTooltip } from '@/components/ui';

export default function MyForecast() {
  const [user, setUser] = useState(null);
  const [projections, setProjections] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProj, setNewProj] = useState({ name: '', value: 0, confidence: 0.5, pipeline: 'Cold', closeMonth: 'Apr', notes: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [editIdx, setEditIdx] = useState(-1);

  useEffect(() => {
    const u = localStorage.getItem('harbinger_user');
    setUser(u);
    if (u) {
      const all = loadRepProjections();
      setProjections(all[u] || []);
    }
  }, []);
  if (!user) return null;

  const open = getOpenDeals(user, false);
  const openDeals = [...open.assess, ...open.partner].filter(d => d.inCurrentForecast);

  const save = (updated) => {
    const all = loadRepProjections();
    all[user] = updated;
    saveRepProjections(all);
    setProjections(updated);
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const addProjection = () => {
    if (!newProj.name) return;
    save([...projections, { ...newProj, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10) }]);
    setNewProj({ name: '', value: 0, confidence: 0.5, pipeline: 'Cold', closeMonth: 'Apr', notes: '' });
    setShowAdd(false);
  };

  const removeProjection = (idx) => {
    save(projections.filter((_, i) => i !== idx));
  };

  const updateProjection = (idx, changes) => {
    const updated = [...projections];
    updated[idx] = { ...updated[idx], ...changes };
    save(updated);
    setEditIdx(-1);
  };

  const totalValue = projections.reduce((s, p) => s + num(p.value), 0);
  const weightedValue = projections.reduce((s, p) => s + num(p.value) * num(p.confidence), 0);
  const avgConf = projections.length > 0 ? projections.reduce((s, p) => s + num(p.confidence), 0) / projections.length : 0;

  const modelDealsValue = openDeals.reduce((s, d) => s + num(d.predictedValue || d.totalValue), 0);
  const combinedPipeline = modelDealsValue + totalValue;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-harbinger-900">My Forecast</h1>
          <p className="text-sm text-gray-500 mt-1">Add your own projections for upcoming potential closes and track your personal forecast.</p>
        </div>
        {saveMsg && <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-lg">{saveMsg}</span>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 mt-4">
        <StatCard label={<CalcTooltip formula="Sum of all your personal projection values (raw, before weighting)">My Projections Total</CalcTooltip>} value={fmt(totalValue)} sub={`${projections.length} deals`} color="purple" />
        <StatCard label={<CalcTooltip formula="Sum of (Value x Confidence %) for each projection">Weighted Forecast</CalcTooltip>} value={fmt(weightedValue)} sub={`Avg confidence: ${pct(avgConf)}`} color="blue" />
        <StatCard label="Model Pipeline" value={fmt(modelDealsValue)} sub={`${openDeals.length} deals in forecast`} color="teal" />
        <StatCard label={<CalcTooltip formula="Model pipeline + your personal projection values">Combined Pipeline</CalcTooltip>} value={fmt(combinedPipeline)} color="green" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="My Projections" />
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          + Add Projection
        </button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
          <h3 className="font-semibold text-harbinger-900 mb-4">New Projection</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><label className="block text-xs text-gray-500 mb-1">Company / Deal Name *</label>
              <input type="text" value={newProj.name} onChange={e => setNewProj(p => ({ ...p, name: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring-1 focus:ring-harbinger-500 outline-none" placeholder="Acme Corp" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Estimated Value</label>
              <input type="number" value={newProj.value} onChange={e => setNewProj(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring-1 focus:ring-harbinger-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1"><CalcTooltip formula="Your personal estimate of how likely this deal is to close (0 to 1)">Confidence (0-1)</CalcTooltip></label>
              <input type="number" step="0.05" min="0" max="1" value={newProj.confidence} onChange={e => setNewProj(p => ({ ...p, confidence: parseFloat(e.target.value) || 0 }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring-1 focus:ring-harbinger-500 outline-none" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Pipeline</label>
              <select value={newProj.pipeline} onChange={e => setNewProj(p => ({ ...p, pipeline: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring-1 focus:ring-harbinger-500 outline-none bg-white">
                {PIPELINES.map(p => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Expected Close Month</label>
              <select value={newProj.closeMonth} onChange={e => setNewProj(p => ({ ...p, closeMonth: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring-1 focus:ring-harbinger-500 outline-none bg-white">
                {['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m} value={m}>{m} 2026</option>)}
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Notes</label>
              <input type="text" value={newProj.notes} onChange={e => setNewProj(p => ({ ...p, notes: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:ring-1 focus:ring-harbinger-500 outline-none" placeholder="Meeting scheduled..." /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addProjection} className="px-4 py-2 bg-harbinger-700 text-white rounded-lg text-sm font-medium hover:bg-harbinger-600">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      {projections.length === 0 ? <EmptyState message="No personal projections yet. Add your first deal above!" icon="📝" /> : (
        <TableWrapper><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Deal</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Value</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Confidence</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600"><CalcTooltip formula="Value x Confidence %">Weighted</CalcTooltip></th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Pipeline</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Close Month</th>
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Notes</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Actions</th>
        </tr></thead><tbody>
          {projections.map((p, i) => (
            <tr key={p.id || i} className={`table-row-hover ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              <td className="px-3 py-2.5 font-medium">{p.name}</td>
              <td className="px-3 py-2.5 text-right">{fmt(p.value)}</td>
              <td className="px-3 py-2.5 text-center"><Badge text={pct(p.confidence)} color={p.confidence >= 0.7 ? 'green' : p.confidence >= 0.4 ? 'gold' : 'red'} /></td>
              <td className="px-3 py-2.5 text-right font-semibold">{fmt(num(p.value) * num(p.confidence))}</td>
              <td className="px-3 py-2.5 text-center"><Badge text={p.pipeline} color={p.pipeline === 'Warm' ? 'gold' : p.pipeline === 'Brave Digital' ? 'purple' : 'blue'} /></td>
              <td className="px-3 py-2.5 text-center">{p.closeMonth}</td>
              <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[200px] truncate">{p.notes || '—'}</td>
              <td className="px-3 py-2.5 text-center">
                <button onClick={() => removeProjection(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
              </td>
            </tr>
          ))}
        </tbody></table></TableWrapper>
      )}

      {/* Current model deals for reference */}
      <SectionHeader title={`Deals Currently in Forecast Model (${openDeals.length})`} />
      <p className="text-xs text-gray-500 -mt-3 mb-4">These are the deals already in the prediction model. Your projections above are in addition to these.</p>
      {openDeals.length === 0 ? <EmptyState message="No deals in forecast." icon="📋" /> : (
        <TableWrapper><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Deal</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Value</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Close %</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Window</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Pipeline</th>
        </tr></thead><tbody>
          {openDeals.map((d, i) => (
            <tr key={d.id} className={`table-row-hover ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              <td className="px-3 py-2.5 font-medium">{d.name}</td>
              <td className="px-3 py-2.5 text-right">{fmt(d.predictedValue || d.totalValue)}</td>
              <td className="px-3 py-2.5 text-center">{pct(d.chancePrimary)}</td>
              <td className="px-3 py-2.5 text-center text-xs">{d.closeWindow || '—'}</td>
              <td className="px-3 py-2.5 text-center"><Badge text={d.pipeline || '—'} color={d.pipeline === 'Warm' ? 'gold' : 'blue'} /></td>
            </tr>
          ))}
        </tbody></table></TableWrapper>
      )}
    </div>
  );
}
