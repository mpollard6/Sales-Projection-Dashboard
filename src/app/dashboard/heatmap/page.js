'use client';
import { useEffect, useState } from 'react';
import { getAssessDeals, getPartnerDeals, num } from '@/data/utils';
import { SectionHeader, fmt, Select, FilterBar, CalcTooltip } from '@/components/ui';

function monthsBetween(d1, d2) {
  if (!d1 || !d2) return 0;
  const a = new Date(d1), b = new Date(d2);
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth());
}

const STAGES_ASSESS = ['Pre-Assessment Presentation', 'Assessment Proposal Presented', 'Assessment Close Attempt', 'Other'];
const STAGES_PARTNER = ['Partnership Proposal Presented', 'Partnership Close Attempt', 'Other'];
const AGE_BUCKETS = [
  { label: '0-1 mo', min: 0, max: 1 },
  { label: '2-3 mo', min: 2, max: 3 },
  { label: '4-6 mo', min: 4, max: 6 },
  { label: '7-9 mo', min: 7, max: 9 },
  { label: '10-12 mo', min: 10, max: 12 },
  { label: '12+ mo', min: 13, max: 999 },
];

function getColor(value, maxVal) {
  if (value === 0) return 'bg-gray-100 text-gray-400';
  const intensity = Math.min(value / Math.max(maxVal, 1), 1);
  if (intensity < 0.2) return 'bg-blue-100 text-blue-800';
  if (intensity < 0.4) return 'bg-blue-200 text-blue-900';
  if (intensity < 0.6) return 'bg-blue-300 text-blue-900';
  if (intensity < 0.8) return 'bg-blue-500 text-white';
  return 'bg-blue-700 text-white';
}

function getCountColor(count) {
  if (count === 0) return 'bg-gray-100 text-gray-400';
  if (count <= 2) return 'bg-amber-100 text-amber-800';
  if (count <= 5) return 'bg-amber-300 text-amber-900';
  if (count <= 10) return 'bg-red-400 text-white';
  return 'bg-red-600 text-white';
}

export default function Heatmap() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [mode, setMode] = useState('value');
  const [dealType, setDealType] = useState('assess');

  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const rep = role === 'admin' ? 'admin' : user;
  const deals = dealType === 'assess'
    ? getAssessDeals(rep).filter(d => d.status === 'Open')
    : getPartnerDeals(rep).filter(d => d.status === 'Open');

  const stages = dealType === 'assess' ? STAGES_ASSESS : STAGES_PARTNER;
  const now = '2026-03-10';

  const getStage = (d) => {
    const s = d.stage || '';
    return stages.includes(s) ? s : 'Other';
  };

  // Build grid data
  const grid = {};
  let maxVal = 0;
  stages.forEach(stage => {
    grid[stage] = {};
    AGE_BUCKETS.forEach(bucket => {
      const matching = deals.filter(d => {
        const age = monthsBetween(d.dateEntered, now);
        return getStage(d) === stage && age >= bucket.min && age <= bucket.max;
      });
      const val = mode === 'value'
        ? matching.reduce((s, d) => s + num(d.predictedValue || d.totalValue), 0)
        : matching.length;
      grid[stage][bucket.label] = { value: val, count: matching.length, deals: matching };
      if (val > maxVal) maxVal = val;
    });
  });

  const totalDeals = deals.length;
  const totalValue = deals.reduce((s, d) => s + num(d.predictedValue || d.totalValue), 0);
  const staleDeals = deals.filter(d => monthsBetween(d.dateEntered, now) > 6);

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-2">Pipeline Aging Heatmap</h1>
      <p className="text-sm text-gray-500 mb-6">Visual grid of open deals by stage vs. time in pipeline. Darker cells indicate higher {mode === 'value' ? 'dollar value' : 'deal count'}. Hover cells for details.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm font-semibold text-gray-600">Total Open Deals</p>
          <p className="text-2xl font-bold">{totalDeals}</p>
          <p className="text-xs text-gray-500">{fmt(totalValue)} total pipeline</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
          <p className="text-sm font-semibold text-gray-600"><CalcTooltip formula="Deals open for more than 6 months">Aging Deals (6+ mo)</CalcTooltip></p>
          <p className="text-2xl font-bold text-amber-600">{staleDeals.length}</p>
          <p className="text-xs text-gray-500">{fmt(staleDeals.reduce((s, d) => s + num(d.predictedValue || d.totalValue), 0))} at risk</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-sm font-semibold text-gray-600">Avg Deal Age</p>
          <p className="text-2xl font-bold">{totalDeals > 0 ? Math.round(deals.reduce((s, d) => s + monthsBetween(d.dateEntered, now), 0) / totalDeals) : 0} mo</p>
        </div>
      </div>

      <FilterBar>
        <Select label="Deal Type" value={dealType} onChange={setDealType} options={[{ value: 'assess', label: 'Assessment' }, { value: 'partner', label: 'Partnership' }]} />
        <Select label="Color By" value={mode} onChange={setMode} options={[{ value: 'value', label: 'Dollar Value' }, { value: 'count', label: 'Deal Count' }]} />
      </FilterBar>

      <SectionHeader title="Heatmap" />
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto border border-gray-100">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 min-w-[180px]">Stage</th>
              {AGE_BUCKETS.map(b => (
                <th key={b.label} className="px-3 py-2 text-center text-xs font-semibold text-gray-600 min-w-[90px]">{b.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stages.map(stage => (
              <tr key={stage}>
                <td className="px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-200">{stage}</td>
                {AGE_BUCKETS.map(bucket => {
                  const cell = grid[stage][bucket.label];
                  const colorClass = mode === 'value' ? getColor(cell.value, maxVal) : getCountColor(cell.count);
                  return (
                    <td key={bucket.label} className="px-1 py-1">
                      <div className={`heatmap-cell rounded-lg p-3 text-center cursor-default ${colorClass}`} title={`${stage} | ${bucket.label}\n${cell.count} deals | ${fmt(cell.value)}`}>
                        <p className="text-sm font-bold">{mode === 'value' ? (cell.value > 0 ? fmt(cell.value) : '—') : (cell.count > 0 ? cell.count : '—')}</p>
                        {cell.count > 0 && mode === 'value' && <p className="text-xs opacity-75">{cell.count} deal{cell.count > 1 ? 's' : ''}</p>}
                        {cell.count > 0 && mode === 'count' && <p className="text-xs opacity-75">{fmt(cell.value)}</p>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Legend:</span>
          {mode === 'value' ? (
            <>
              <span className="inline-block w-6 h-4 bg-gray-100 rounded" /> None
              <span className="inline-block w-6 h-4 bg-blue-100 rounded" /> Low
              <span className="inline-block w-6 h-4 bg-blue-300 rounded" /> Medium
              <span className="inline-block w-6 h-4 bg-blue-500 rounded" /> High
              <span className="inline-block w-6 h-4 bg-blue-700 rounded" /> Very High
            </>
          ) : (
            <>
              <span className="inline-block w-6 h-4 bg-gray-100 rounded" /> 0
              <span className="inline-block w-6 h-4 bg-amber-100 rounded" /> 1-2
              <span className="inline-block w-6 h-4 bg-amber-300 rounded" /> 3-5
              <span className="inline-block w-6 h-4 bg-red-400 rounded" /> 6-10
              <span className="inline-block w-6 h-4 bg-red-600 rounded" /> 10+
            </>
          )}
        </div>
      </div>
    </div>
  );
}
