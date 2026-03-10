'use client';
import { useEffect, useState } from 'react';
import { getAssessDeals, getPartnerDeals, num, REPS, PIPELINES } from '@/data/utils';
import { updateDeal, resetOverrides, hasOverrides, getOverrideSummary } from '@/data/store';
import { SectionHeader, fmt, pct, Badge, Select, FilterBar, TableWrapper, EmptyState, SearchInput } from '@/components/ui';

export default function DataManager() {
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState('assess');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [saveMsg, setSaveMsg] = useState('');
  const [ver, setVer] = useState(0);

  useEffect(() => { setRole(localStorage.getItem('harbinger_role')); }, []);
  if (role !== 'admin') return <div className="text-center py-20 text-gray-400">Admin access required. Only admins can edit the underlying data.</div>;

  const deals = tab === 'assess' ? getAssessDeals('admin') : getPartnerDeals('admin');
  const summary = getOverrideSummary();
  const hasChanges = hasOverrides();

  const q = search.toLowerCase().trim();
  const filtered = q ? deals.filter(d => (d.name || '').toLowerCase().includes(q) || (d.owner || '').toLowerCase().includes(q) || (d.id || '').toLowerCase().includes(q)) : deals;

  const startEdit = (d) => {
    setEditingId(d.id);
    setEditFields({
      name: d.name, owner: d.owner, pipeline: d.pipeline || 'Cold', status: d.status,
      stage: d.stage || '', state: d.state || '', closeWindow: d.closeWindow || '30 Days',
      predictedValue: tab === 'assess' ? num(d.predictedValue) : num(d.totalValue),
      oneTime: num(d.oneTime), onboarding: num(d.onboarding), ongoing: num(d.ongoing),
      chancePrimary: num(d.chancePrimary), chanceFallback: num(d.chanceFallback),
      inCurrentForecast: d.inCurrentForecast, actualValue: num(d.actualValue),
      actualCloseDate: d.actualCloseDate || '',
    });
  };

  const saveEdit = () => {
    const changes = { ...editFields };
    if (tab === 'assess') {
      changes.predictedValue = editFields.predictedValue;
    } else {
      changes.totalValue = editFields.predictedValue;
      changes.oneTime = editFields.oneTime;
      changes.onboarding = editFields.onboarding;
      changes.ongoing = editFields.ongoing;
    }
    delete changes.predictedValue;
    if (tab === 'assess') changes.predictedValue = editFields.predictedValue;
    else changes.totalValue = editFields.predictedValue;
    updateDeal(editingId, changes);
    setEditingId(null);
    setSaveMsg('Deal updated!');
    setVer(v => v + 1);
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const handleReset = () => {
    if (confirm('This will reset all data changes back to the original dataset. Are you sure?')) {
      resetOverrides();
      setSaveMsg('All changes reset!');
      setVer(v => v + 1);
      setTimeout(() => setSaveMsg(''), 2000);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-harbinger-900">Data Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Edit deal data directly. Changes are saved locally and reflected across all views.</p>
        </div>
        {saveMsg && <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-lg">{saveMsg}</span>}
      </div>

      {hasChanges && (
        <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">You have local data changes</p>
            <p className="text-xs text-amber-600">{summary.editedAssess} assessment edits, {summary.editedPartner} partnership edits, {summary.newAssess} new assessment deals, {summary.newPartner} new partnership deals</p>
          </div>
          <button onClick={handleReset} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">Reset All Changes</button>
        </div>
      )}

      <div className="flex gap-2 mb-6 mt-4">
        <button onClick={() => { setTab('assess'); setEditingId(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'assess' ? 'bg-harbinger-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Assessment Deals ({getAssessDeals('admin').length})
        </button>
        <button onClick={() => { setTab('partner'); setEditingId(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'partner' ? 'bg-harbinger-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Partnership Deals ({getPartnerDeals('admin').length})
        </button>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, owner, or ID..." />
        <span className="text-xs text-gray-500 mt-5">Showing {filtered.length} of {deals.length} deals</span>
      </FilterBar>

      {/* Edit panel */}
      {editingId && (
        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
          <h3 className="font-semibold text-harbinger-900 mb-4">Editing: {editFields.name} ({editingId})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><label className="block text-xs text-gray-500 mb-1">Name</label><input type="text" value={editFields.name} onChange={e => setEditFields(p => ({ ...p, name: e.target.value }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Owner</label><select value={editFields.owner} onChange={e => setEditFields(p => ({ ...p, owner: e.target.value }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500 bg-white">{REPS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Pipeline</label><select value={editFields.pipeline} onChange={e => setEditFields(p => ({ ...p, pipeline: e.target.value }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500 bg-white">{PIPELINES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Status</label><select value={editFields.status} onChange={e => setEditFields(p => ({ ...p, status: e.target.value }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500 bg-white"><option value="Open">Open</option><option value="Closed">Closed</option><option value="Lost">Lost</option></select></div>
            <div><label className="block text-xs text-gray-500 mb-1">{tab === 'assess' ? 'Predicted Value' : 'Total Value'}</label><input type="number" value={editFields.predictedValue} onChange={e => setEditFields(p => ({ ...p, predictedValue: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
            {tab === 'partner' && <>
              <div><label className="block text-xs text-gray-500 mb-1">One-Time</label><input type="number" value={editFields.oneTime} onChange={e => setEditFields(p => ({ ...p, oneTime: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Onboarding</label><input type="number" value={editFields.onboarding} onChange={e => setEditFields(p => ({ ...p, onboarding: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Ongoing</label><input type="number" value={editFields.ongoing} onChange={e => setEditFields(p => ({ ...p, ongoing: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
            </>}
            <div><label className="block text-xs text-gray-500 mb-1">30-Day %</label><input type="number" step="0.05" min="0" max="1" value={editFields.chancePrimary} onChange={e => setEditFields(p => ({ ...p, chancePrimary: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">60-Day %</label><input type="number" step="0.05" min="0" max="1" value={editFields.chanceFallback} onChange={e => setEditFields(p => ({ ...p, chanceFallback: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Close Window</label><select value={editFields.closeWindow} onChange={e => setEditFields(p => ({ ...p, closeWindow: e.target.value }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500 bg-white"><option value="30 Days">30 Days</option><option value="60 Days">60 Days</option></select></div>
            <div><label className="block text-xs text-gray-500 mb-1">In Forecast</label><select value={editFields.inCurrentForecast ? 'Yes' : 'No'} onChange={e => setEditFields(p => ({ ...p, inCurrentForecast: e.target.value === 'Yes' }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500 bg-white"><option value="Yes">Yes</option><option value="No">No</option></select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Stage</label><input type="text" value={editFields.stage} onChange={e => setEditFields(p => ({ ...p, stage: e.target.value }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">State</label><input type="text" value={editFields.state} onChange={e => setEditFields(p => ({ ...p, state: e.target.value }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
            {editFields.status === 'Closed' && <>
              <div><label className="block text-xs text-gray-500 mb-1">Actual Value</label><input type="number" value={editFields.actualValue} onChange={e => setEditFields(p => ({ ...p, actualValue: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Close Date</label><input type="date" value={editFields.actualCloseDate} onChange={e => setEditFields(p => ({ ...p, actualCloseDate: e.target.value }))} className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" /></div>
            </>}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} className="px-4 py-2 bg-harbinger-700 text-white rounded-lg text-sm font-medium hover:bg-harbinger-600">Save</button>
            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <TableWrapper><table className="w-full text-sm"><thead><tr className="bg-gray-100">
        <th className="px-3 py-2.5 text-left font-semibold text-gray-600">ID</th>
        <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Deal</th>
        <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Owner</th>
        <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Value</th>
        <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Pipe</th>
        <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Status</th>
        <th className="px-3 py-2.5 text-center font-semibold text-gray-600">30d %</th>
        <th className="px-3 py-2.5 text-center font-semibold text-gray-600">60d %</th>
        <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Forecast</th>
        <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Edit</th>
      </tr></thead><tbody>
        {filtered.map((d, i) => (
          <tr key={d.id} className={`table-row-hover ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
            <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{d.id}</td>
            <td className="px-3 py-2.5 font-medium">{d.name}</td>
            <td className="px-3 py-2.5 text-gray-600">{d.owner}</td>
            <td className="px-3 py-2.5 text-right">{fmt(tab === 'assess' ? d.predictedValue : d.totalValue)}</td>
            <td className="px-3 py-2.5 text-center"><Badge text={d.pipeline || '—'} color={d.pipeline === 'Warm' ? 'gold' : d.pipeline === 'Brave Digital' ? 'purple' : 'blue'} /></td>
            <td className="px-3 py-2.5 text-center"><Badge text={d.status} color={d.status === 'Closed' ? 'green' : d.status === 'Lost' ? 'red' : 'blue'} /></td>
            <td className="px-3 py-2.5 text-center">{pct(d.chancePrimary)}</td>
            <td className="px-3 py-2.5 text-center">{pct(d.chanceFallback)}</td>
            <td className="px-3 py-2.5 text-center">{d.inCurrentForecast ? <Badge text="Yes" color="green" /> : <Badge text="No" color="gray" />}</td>
            <td className="px-3 py-2.5 text-center">
              <button onClick={() => startEdit(d)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
            </td>
          </tr>
        ))}
      </tbody></table></TableWrapper>
    </div>
  );
}
