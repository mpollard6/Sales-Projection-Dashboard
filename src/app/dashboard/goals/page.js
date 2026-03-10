'use client';
import { useEffect, useState } from 'react';
import { REPS, getRepPipelineForecast, getRepStats, getClosedDeals, num, getYear, getQuarter } from '@/data/utils';
import { loadGoals, saveGoals } from '@/data/store';
import { StatCard, SectionHeader, fmt, pct, Select, FilterBar, TableWrapper, ProgressBar, CalcTooltip } from '@/components/ui';

const QUARTERS = [
  { value: 'Q1-2026', label: 'Q1 2026 (Jan-Mar)', year: 2026, quarter: 1 },
  { value: 'Q2-2026', label: 'Q2 2026 (Apr-Jun)', year: 2026, quarter: 2 },
  { value: 'Q3-2026', label: 'Q3 2026 (Jul-Sep)', year: 2026, quarter: 3 },
  { value: 'Q4-2026', label: 'Q4 2026 (Oct-Dec)', year: 2026, quarter: 4 },
  { value: 'Q1-2025', label: 'Q1 2025 (Jan-Mar)', year: 2025, quarter: 1 },
  { value: 'Q2-2025', label: 'Q2 2025 (Apr-Jun)', year: 2025, quarter: 2 },
  { value: 'Q3-2025', label: 'Q3 2025 (Jul-Sep)', year: 2025, quarter: 3 },
  { value: 'Q4-2025', label: 'Q4 2025 (Oct-Dec)', year: 2025, quarter: 4 },
];

export default function Goals() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState({});
  const [period, setPeriod] = useState('Q1-2026');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    setRole(localStorage.getItem('harbinger_role'));
    setUser(localStorage.getItem('harbinger_user'));
    setGoals(loadGoals());
  }, []);
  if (!user) return null;

  const isAdmin = role === 'admin';
  const selectedQ = QUARTERS.find(q => q.value === period);
  const periodGoals = goals[period] || {};

  const startEdit = () => {
    const d = {};
    REPS.forEach(r => { d[r] = periodGoals[r] || 0; });
    setDraft(d);
    setEditing(true);
  };

  const saveEdit = () => {
    const updated = { ...goals, [period]: draft };
    saveGoals(updated);
    setGoals(updated);
    setEditing(false);
    setSaveMsg('Goals saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const repData = REPS.map(rep => {
    const target = periodGoals[rep] || 0;
    const forecast = getRepPipelineForecast(rep);
    const closed = getClosedDeals(rep, selectedQ ? { year: selectedQ.year, quarter: selectedQ.quarter } : null);
    const closedRev = closed.assess.reduce((s, d) => s + num(d.actualValue), 0) + closed.partner.reduce((s, d) => s + num(d.actualValue), 0);
    const projected30 = forecast.totalW30;
    const projected60 = forecast.totalW60;
    const projectedTotal = closedRev + projected30;
    const attainment = target > 0 ? closedRev / target : 0;
    const projectedAttainment = target > 0 ? projectedTotal / target : 0;

    return {
      rep, target, closedRev, projected30, projected60, projectedTotal, attainment, projectedAttainment,
      closedCount: closed.assess.length + closed.partner.length,
    };
  });

  const totalTarget = repData.reduce((s, r) => s + r.target, 0);
  const totalClosed = repData.reduce((s, r) => s + r.closedRev, 0);
  const totalProjected = repData.reduce((s, r) => s + r.projectedTotal, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-harbinger-900">Goal Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Set quarterly revenue targets per rep and track progress with projected attainment.</p>
        </div>
        {saveMsg && <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-lg">{saveMsg}</span>}
      </div>

      <FilterBar>
        <Select label="Period" value={period} onChange={setPeriod} options={QUARTERS.map(q => ({ value: q.value, label: q.label }))} />
        {isAdmin && !editing && <button onClick={startEdit} className="mt-4 px-4 py-2 bg-harbinger-700 text-white rounded-lg text-sm font-medium hover:bg-harbinger-600">Set Goals</button>}
      </FilterBar>

      {editing && (
        <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
          <h3 className="font-semibold text-harbinger-900 mb-4">Set Revenue Targets for {selectedQ?.label}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {REPS.map(r => (
              <div key={r}>
                <label className="block text-xs text-gray-500 mb-1">{r}</label>
                <input type="number" value={draft[r] || 0} onChange={e => setDraft(p => ({ ...p, [r]: parseFloat(e.target.value) || 0 }))}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-sm outline-none focus:ring-1 focus:ring-harbinger-500" placeholder="e.g. 175000" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} className="px-4 py-2 bg-harbinger-700 text-white rounded-lg text-sm font-medium hover:bg-harbinger-600">Save Goals</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Team Target" value={fmt(totalTarget)} sub={selectedQ?.label} color="purple" />
        <StatCard label={<CalcTooltip formula="Sum of actual closed deal values for the selected period">Closed Revenue</CalcTooltip>} value={fmt(totalClosed)} sub={`${pct(totalTarget > 0 ? totalClosed / totalTarget : 0)} of target`} color={totalClosed >= totalTarget ? 'green' : 'blue'} />
        <StatCard label={<CalcTooltip formula="Closed revenue + 30-day weighted forecast revenue">Projected Total</CalcTooltip>} value={fmt(totalProjected)} sub={`${pct(totalTarget > 0 ? totalProjected / totalTarget : 0)} projected attainment`} color="teal" />
        <StatCard label="Gap to Target" value={fmt(Math.max(0, totalTarget - totalClosed))} sub={totalClosed >= totalTarget ? 'Target exceeded!' : 'Still needed'} color={totalClosed >= totalTarget ? 'green' : 'gold'} />
      </div>

      <SectionHeader title="Rep Goal Progress" />
      <div className="space-y-4 mb-8">
        {repData.map(r => (
          <div key={r.rep} className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-harbinger-900">{r.rep}</h3>
                <p className="text-xs text-gray-500">Target: {fmt(r.target)} | Closed: {fmt(r.closedRev)} ({r.closedCount} deals)</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-harbinger-700">{pct(r.attainment)}</p>
                <p className="text-xs text-gray-500">actual attainment</p>
              </div>
            </div>
            <ProgressBar value={r.closedRev} max={r.target || 1} color={r.attainment >= 1 ? 'green' : r.attainment >= 0.7 ? 'blue' : r.attainment >= 0.4 ? 'gold' : 'red'} label="Closed vs Target" />
            <div className="mt-2">
              <ProgressBar value={r.projectedTotal} max={r.target || 1} color="teal" label={`Projected (Closed + 30d Weighted = ${fmt(r.projectedTotal)})`} />
            </div>
            {r.target > 0 && r.closedRev < r.target && (
              <p className="text-xs text-gray-500 mt-2">Gap: {fmt(r.target - r.closedRev)} remaining | 30d forecast adds {fmt(r.projected30)}</p>
            )}
          </div>
        ))}
      </div>

      <SectionHeader title="Summary Table" />
      <TableWrapper><table className="w-full text-sm"><thead><tr className="bg-gray-100">
        <th className="px-3 py-2.5 text-left font-semibold">Rep</th>
        <th className="px-3 py-2.5 text-right font-semibold">Target</th>
        <th className="px-3 py-2.5 text-right font-semibold">Closed</th>
        <th className="px-3 py-2.5 text-right font-semibold"><CalcTooltip formula="Closed Revenue / Target">Attainment</CalcTooltip></th>
        <th className="px-3 py-2.5 text-right font-semibold"><CalcTooltip formula="Sum of (Value x Close %) for forecast deals in 30-day window">30d Forecast</CalcTooltip></th>
        <th className="px-3 py-2.5 text-right font-semibold"><CalcTooltip formula="Closed + 30d Forecast">Projected</CalcTooltip></th>
        <th className="px-3 py-2.5 text-right font-semibold"><CalcTooltip formula="(Closed + 30d Forecast) / Target">Proj. Attainment</CalcTooltip></th>
        <th className="px-3 py-2.5 text-right font-semibold">Gap</th>
      </tr></thead><tbody>
        {repData.map((r, i) => (
          <tr key={r.rep} className={`table-row-hover ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
            <td className="px-3 py-2.5 font-medium">{r.rep}</td>
            <td className="px-3 py-2.5 text-right">{fmt(r.target)}</td>
            <td className="px-3 py-2.5 text-right">{fmt(r.closedRev)}</td>
            <td className="px-3 py-2.5 text-right font-semibold">{pct(r.attainment)}</td>
            <td className="px-3 py-2.5 text-right">{fmt(r.projected30)}</td>
            <td className="px-3 py-2.5 text-right font-semibold">{fmt(r.projectedTotal)}</td>
            <td className="px-3 py-2.5 text-right font-semibold">{pct(r.projectedAttainment)}</td>
            <td className={`px-3 py-2.5 text-right font-semibold ${r.closedRev >= r.target ? 'text-green-600' : 'text-red-600'}`}>
              {r.closedRev >= r.target ? 'Met!' : fmt(r.target - r.closedRev)}
            </td>
          </tr>
        ))}
        <tr className="bg-harbinger-900 text-white font-semibold">
          <td className="px-3 py-2.5">Total</td>
          <td className="px-3 py-2.5 text-right">{fmt(totalTarget)}</td>
          <td className="px-3 py-2.5 text-right">{fmt(totalClosed)}</td>
          <td className="px-3 py-2.5 text-right">{pct(totalTarget > 0 ? totalClosed / totalTarget : 0)}</td>
          <td className="px-3 py-2.5 text-right">{fmt(repData.reduce((s, r) => s + r.projected30, 0))}</td>
          <td className="px-3 py-2.5 text-right">{fmt(totalProjected)}</td>
          <td className="px-3 py-2.5 text-right">{pct(totalTarget > 0 ? totalProjected / totalTarget : 0)}</td>
          <td className="px-3 py-2.5 text-right">{totalClosed >= totalTarget ? 'Met!' : fmt(totalTarget - totalClosed)}</td>
        </tr>
      </tbody></table></TableWrapper>
    </div>
  );
}
