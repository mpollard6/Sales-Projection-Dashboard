'use client';
import { useEffect, useState } from 'react';
import { getAssessDeals, getPartnerDeals, getDealPredictionHistory, num, REPS, PIPELINES } from '@/data/utils';
import { updateDeal, addNewDeal, getMergedAssessDeals, getMergedPartnerDeals } from '@/data/store';
import { SectionHeader, fmt, pct, Badge, Select, FilterBar, TableWrapper, EmptyState, SearchInput, CalcTooltip } from '@/components/ui';

function EditableCell({ value, onChange, type = 'text', step, min, max, className = '' }) {
  return <input type={type} value={value} onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
    step={step} min={min} max={max}
    className={`border border-gray-300 rounded px-2 py-1 text-sm w-full focus:ring-1 focus:ring-harbinger-500 outline-none bg-white ${className}`} />;
}

function SelectCell({ value, onChange, options }) {
  return <select value={value} onChange={e => onChange(e.target.value)}
    className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:ring-1 focus:ring-harbinger-500 outline-none bg-white">
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>;
}

export default function ForecastBuilder() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState('assess');
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState('open');
  const [editing, setEditing] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newDeal, setNewDeal] = useState({});
  const [saveMsg, setSaveMsg] = useState('');
  const [ver, setVer] = useState(0);

  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const isAdmin = role === 'admin';
  const rep = isAdmin ? 'admin' : user;

  const allAssess = getAssessDeals(rep);
  const allPartner = getPartnerDeals(rep);
  const deals = tab === 'assess' ? allAssess : allPartner;

  let filtered = deals;
  if (showFilter === 'open') filtered = filtered.filter(d => d.status === 'Open');
  else if (showFilter === 'closed') filtered = filtered.filter(d => d.status === 'Closed');
  else if (showFilter === 'forecast') filtered = filtered.filter(d => d.inCurrentForecast);
  else if (showFilter === 'stale') filtered = filtered.filter(d => d.status === 'Open' && !d.inCurrentForecast);

  const q = search.toLowerCase().trim();
  if (q) filtered = filtered.filter(d => (d.name || '').toLowerCase().includes(q) || (d.owner || '').toLowerCase().includes(q));

  const startEdit = (deal) => {
    const lastPred = getDealPredictionHistory(deal.id);
    const latest = lastPred.length > 0 ? lastPred[lastPred.length - 1] : null;
    setEditing({
      id: deal.id,
      name: deal.name,
      predictedValue: tab === 'assess' ? num(deal.predictedValue) : num(deal.totalValue),
      oneTime: num(deal.oneTime),
      onboarding: num(deal.onboarding),
      ongoing: num(deal.ongoing),
      chancePrimary: latest ? num(latest.chance30) : num(deal.chancePrimary),
      chanceFallback: latest ? num(latest.chance60) : num(deal.chanceFallback),
      closeWindow: deal.closeWindow || '30 Days',
      pipeline: deal.pipeline || 'Cold',
      inCurrentForecast: deal.inCurrentForecast,
      status: deal.status,
      stage: deal.stage || '',
      latestPredValue: latest ? num(latest.predictedValue) : null,
      latestChance30: latest ? num(latest.chance30) : null,
      latestChance60: latest ? num(latest.chance60) : null,
    });
  };

  const saveEdit = () => {
    const changes = tab === 'assess'
      ? { predictedValue: editing.predictedValue, chancePrimary: editing.chancePrimary, chanceFallback: editing.chanceFallback, closeWindow: editing.closeWindow, pipeline: editing.pipeline, inCurrentForecast: editing.inCurrentForecast, status: editing.status, stage: editing.stage }
      : { totalValue: editing.predictedValue, oneTime: editing.oneTime, onboarding: editing.onboarding, ongoing: editing.ongoing, chancePrimary: editing.chancePrimary, chanceFallback: editing.chanceFallback, closeWindow: editing.closeWindow, pipeline: editing.pipeline, inCurrentForecast: editing.inCurrentForecast, status: editing.status, stage: editing.stage };
    updateDeal(editing.id, changes);
    setEditing({});
    setSaveMsg('Changes saved!');
    setVer(v => v + 1);
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const initNewDeal = () => {
    setNewDeal({
      name: '', owner: isAdmin ? REPS[0] : user, pipeline: 'Cold', status: 'Open',
      predictedValue: 0, totalValue: 0, oneTime: 0, onboarding: 0, ongoing: 0,
      chancePrimary: 0, chanceFallback: 0, closeWindow: '30 Days',
      inCurrentForecast: true, dateEntered: '2026-03-10', stage: '',
      closeMonth: 'Mar', state: '',
    });
    setShowAdd(true);
  };

  const saveNewDeal = () => {
    const type = tab === 'assess' ? 'assess' : 'partner';
    if (!newDeal.name) { alert('Please enter a deal name'); return; }
    if (tab === 'partner') {
      newDeal.totalValue = num(newDeal.oneTime) + num(newDeal.onboarding) + num(newDeal.ongoing);
    }
    addNewDeal(type, { ...newDeal });
    setShowAdd(false);
    setNewDeal({});
    setSaveMsg('New deal added!');
    setVer(v => v + 1);
    setTimeout(() => setSaveMsg(''), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-harbinger-900">Forecast Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Edit existing deals or add new ones. Last prediction values are auto-loaded when you click edit.</p>
        </div>
        {saveMsg && <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-lg">{saveMsg}</span>}
      </div>

      <div className="flex gap-2 mb-6 mt-4">
        <button onClick={() => { setTab('assess'); setEditing({}); setShowAdd(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'assess' ? 'bg-harbinger-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Assessment Deals
        </button>
        <button onClick={() => { setTab('partner'); setEditing({}); setShowAdd(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'partner' ? 'bg-harbinger-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Partnership Deals
        </button>
      </div>

      <FilterBar>
        <Select label="Show" value={showFilter} onChange={setShowFilter} options={[
          {value:'all',label:'All'},{value:'open',label:'Open'},{value:'closed',label:'Closed'},
          {value:'forecast',label:'In Forecast'},{value:'stale',label:'Stale (Not in Forecast)'}
        ]} />
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search deals..." /></div>
        <button onClick={initNewDeal} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          + Add New {tab === 'assess' ? 'Assessment' : 'Partnership'} Deal
        </button>
      </FilterBar>

      {/* Add new deal form */}
      {showAdd && (
        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
          <h3 className="font-semibold text-harbinger-900 mb-4">New {tab === 'assess' ? 'Assessment' : 'Partnership'} Deal</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><label className="block text-xs text-gray-500 mb-1">Name *</label><EditableCell value={newDeal.name} onChange={v => setNewDeal(p => ({...p, name: v}))} /></div>
            {isAdmin && <div><label className="block text-xs text-gray-500 mb-1">Owner</label><SelectCell value={newDeal.owner} onChange={v => setNewDeal(p => ({...p, owner: v}))} options={REPS} /></div>}
            <div><label className="block text-xs text-gray-500 mb-1">Pipeline</label><SelectCell value={newDeal.pipeline} onChange={v => setNewDeal(p => ({...p, pipeline: v}))} options={PIPELINES} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Close Window</label><SelectCell value={newDeal.closeWindow} onChange={v => setNewDeal(p => ({...p, closeWindow: v}))} options={['30 Days','60 Days']} /></div>
            {tab === 'assess' ? (
              <div><label className="block text-xs text-gray-500 mb-1">Predicted Value</label><EditableCell type="number" value={newDeal.predictedValue} onChange={v => setNewDeal(p => ({...p, predictedValue: v}))} /></div>
            ) : (<>
              <div><label className="block text-xs text-gray-500 mb-1">One-Time</label><EditableCell type="number" value={newDeal.oneTime} onChange={v => setNewDeal(p => ({...p, oneTime: v}))} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Onboarding</label><EditableCell type="number" value={newDeal.onboarding} onChange={v => setNewDeal(p => ({...p, onboarding: v}))} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Ongoing</label><EditableCell type="number" value={newDeal.ongoing} onChange={v => setNewDeal(p => ({...p, ongoing: v}))} /></div>
            </>)}
            <div><label className="block text-xs text-gray-500 mb-1"><CalcTooltip formula="Probability of closing within 30 days (0-1)">30-Day Close %</CalcTooltip></label><EditableCell type="number" step="0.05" min="0" max="1" value={newDeal.chancePrimary} onChange={v => setNewDeal(p => ({...p, chancePrimary: v}))} /></div>
            <div><label className="block text-xs text-gray-500 mb-1"><CalcTooltip formula="Fallback probability for 60-day window (0-1)">60-Day Close %</CalcTooltip></label><EditableCell type="number" step="0.05" min="0" max="1" value={newDeal.chanceFallback} onChange={v => setNewDeal(p => ({...p, chanceFallback: v}))} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">State</label><EditableCell value={newDeal.state || ''} onChange={v => setNewDeal(p => ({...p, state: v}))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveNewDeal} className="px-4 py-2 bg-harbinger-700 text-white rounded-lg text-sm font-medium hover:bg-harbinger-600">Save Deal</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      {/* Edit deal panel */}
      {editing.id && (
        <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-200">
          <h3 className="font-semibold text-harbinger-900 mb-2">Editing: {editing.name} ({editing.id})</h3>
          {editing.latestPredValue !== null && (
            <p className="text-xs text-gray-500 mb-3">Last prediction values auto-loaded: Value={fmt(editing.latestPredValue)}, 30d={pct(editing.latestChance30)}, 60d={pct(editing.latestChance60)}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><label className="block text-xs text-gray-500 mb-1">{tab === 'assess' ? 'Predicted Value' : 'Total Value'}</label><EditableCell type="number" value={editing.predictedValue} onChange={v => setEditing(p => ({...p, predictedValue: v}))} /></div>
            {tab === 'partner' && <>
              <div><label className="block text-xs text-gray-500 mb-1">One-Time</label><EditableCell type="number" value={editing.oneTime} onChange={v => setEditing(p => ({...p, oneTime: v}))} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Onboarding</label><EditableCell type="number" value={editing.onboarding} onChange={v => setEditing(p => ({...p, onboarding: v}))} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Ongoing</label><EditableCell type="number" value={editing.ongoing} onChange={v => setEditing(p => ({...p, ongoing: v}))} /></div>
            </>}
            <div><label className="block text-xs text-gray-500 mb-1"><CalcTooltip formula="Probability of closing within 30 days (0 to 1)">30-Day %</CalcTooltip></label><EditableCell type="number" step="0.05" min="0" max="1" value={editing.chancePrimary} onChange={v => setEditing(p => ({...p, chancePrimary: v}))} /></div>
            <div><label className="block text-xs text-gray-500 mb-1"><CalcTooltip formula="Fallback probability for 60-day window (0 to 1)">60-Day %</CalcTooltip></label><EditableCell type="number" step="0.05" min="0" max="1" value={editing.chanceFallback} onChange={v => setEditing(p => ({...p, chanceFallback: v}))} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Close Window</label><SelectCell value={editing.closeWindow} onChange={v => setEditing(p => ({...p, closeWindow: v}))} options={['30 Days','60 Days']} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Pipeline</label><SelectCell value={editing.pipeline} onChange={v => setEditing(p => ({...p, pipeline: v}))} options={PIPELINES} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">In Forecast</label><SelectCell value={editing.inCurrentForecast ? 'Yes' : 'No'} onChange={v => setEditing(p => ({...p, inCurrentForecast: v === 'Yes'}))} options={['Yes','No']} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Status</label><SelectCell value={editing.status} onChange={v => setEditing(p => ({...p, status: v}))} options={['Open','Closed','Lost']} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Stage</label><EditableCell value={editing.stage} onChange={v => setEditing(p => ({...p, stage: v}))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} className="px-4 py-2 bg-harbinger-700 text-white rounded-lg text-sm font-medium hover:bg-harbinger-600">Save Changes</button>
            <button onClick={() => setEditing({})} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <SectionHeader title={`${tab === 'assess' ? 'Assessment' : 'Partnership'} Deals (${filtered.length})`} />
      {filtered.length === 0 ? <EmptyState message="No deals match your filters." icon="📋" /> : (
        <TableWrapper><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          {isAdmin && <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Owner</th>}
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Deal</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">{tab === 'assess' ? 'Value' : 'Total'}</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Pipe</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Window</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">30d %</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">60d %</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Status</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Forecast</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Action</th>
        </tr></thead><tbody>
          {filtered.map((d, i) => (
            <tr key={d.id} className={`table-row-hover ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              {isAdmin && <td className="px-3 py-2.5 text-gray-600">{d.owner}</td>}
              <td className="px-3 py-2.5 font-medium">{d.name} <span className="text-xs text-gray-400">({d.id})</span></td>
              <td className="px-3 py-2.5 text-right">{fmt(tab === 'assess' ? d.predictedValue : d.totalValue)}</td>
              <td className="px-3 py-2.5 text-center"><Badge text={d.pipeline || '—'} color={d.pipeline === 'Warm' ? 'gold' : d.pipeline === 'Brave Digital' ? 'purple' : 'blue'} /></td>
              <td className="px-3 py-2.5 text-center text-xs">{d.closeWindow || '—'}</td>
              <td className="px-3 py-2.5 text-center">{pct(d.chancePrimary)}</td>
              <td className="px-3 py-2.5 text-center">{pct(d.chanceFallback)}</td>
              <td className="px-3 py-2.5 text-center"><Badge text={d.status} color={d.status === 'Closed' ? 'green' : d.status === 'Lost' ? 'red' : 'blue'} /></td>
              <td className="px-3 py-2.5 text-center">{d.inCurrentForecast ? <Badge text="Yes" color="green" /> : <Badge text="No" color="gray" />}</td>
              <td className="px-3 py-2.5 text-center">
                <button onClick={() => startEdit(d)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
              </td>
            </tr>
          ))}
        </tbody></table></TableWrapper>
      )}
    </div>
  );
}
