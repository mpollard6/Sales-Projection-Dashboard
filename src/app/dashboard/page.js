'use client';
import { useEffect, useState } from 'react';
import { getOpenDeals, getRepPipelineForecast, getRepStats, num, withMonthsOpen } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct, Select, FilterBar, Badge } from '@/components/ui';

export default function MyPipeline() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [sortA, setSortA] = useState('name');
  const [sortP, setSortP] = useState('name');
  const [filterMonths, setFilterMonths] = useState('all');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const isAdmin = role === 'admin';
  const rep = isAdmin ? 'admin' : user;
  const stats = getRepStats(rep);
  const forecast = getRepPipelineForecast(rep);
  const open = getOpenDeals(rep);
  let assessOpen = withMonthsOpen(open.assess);
  let partnerOpen = withMonthsOpen(open.partner);

  // Filter by months open
  if (filterMonths !== 'all') {
    const max = parseInt(filterMonths);
    assessOpen = assessOpen.filter(d => (d.monthsOpen || 0) <= max);
    partnerOpen = partnerOpen.filter(d => (d.monthsOpen || 0) <= max);
  }

  // Sort
  const sortFn = (key) => (a, b) => {
    if (key === 'name') return (a.name || '').localeCompare(b.name || '');
    if (key === 'value') return num(b.predictedValue || b.totalValue) - num(a.predictedValue || a.totalValue);
    if (key === 'chance') return num(b.current30) - num(a.current30);
    if (key === 'months') return (b.monthsOpen || 0) - (a.monthsOpen || 0);
    if (key === 'owner') return (a.owner || '').localeCompare(b.owner || '');
    return 0;
  };
  assessOpen.sort(sortFn(sortA));
  partnerOpen.sort(sortFn(sortP));

  const sortOptions = [
    { value: 'name', label: 'Name' }, { value: 'value', label: 'Deal Value' },
    { value: 'chance', label: 'Close %' }, { value: 'months', label: 'Months Open' },
    ...(isAdmin ? [{ value: 'owner', label: 'Owner' }] : []),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">{isAdmin ? 'Full Pipeline Overview' : 'My Pipeline'}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Open Assessments" value={assessOpen.length} color="blue" />
        <StatCard label="Open Partnerships" value={partnerOpen.length} color="gold" />
        <StatCard label="Total Raw Pipeline" value={fmt(forecast.totalRaw)} color="purple" />
        <StatCard label="Total Closed Revenue" value={fmt(stats.totalRevenue)} color="green" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="30-Day Weighted Revenue" value={fmt(forecast.totalWeighted30)} sub="Probability-adjusted" color="teal" />
        <StatCard label="60-Day Weighted Revenue" value={fmt(forecast.totalWeighted60)} sub="Probability-adjusted" color="teal" />
        <StatCard label="Assessment Win Rate" value={pct(stats.assessWinRate)} color="blue" />
        <StatCard label="Partnership Win Rate" value={pct(stats.partnerWinRate)} color="gold" />
      </div>

      <FilterBar>
        <Select label="Filter by Max Months Open" value={filterMonths} onChange={setFilterMonths}
          options={[{value:'all',label:'All'},{value:'3',label:'≤ 3 months'},{value:'6',label:'≤ 6 months'},{value:'12',label:'≤ 12 months'}]} />
      </FilterBar>

      <SectionHeader title={`Open Assessment Deals (${assessOpen.length})`} />
      <FilterBar>
        <Select label="Sort by" value={sortA} onChange={setSortA} options={sortOptions} />
      </FilterBar>
      {assessOpen.length === 0 ? <p className="text-gray-400">No open assessment deals</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-100">
              {isAdmin && <th className="px-3 py-2 text-left font-semibold text-gray-600">Owner</th>}
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Deal</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Value</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Pipeline</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Stage</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Window</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">30-Day %</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">60-Day %</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">30d Weighted</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Months Open</th>
            </tr></thead>
            <tbody>
              {assessOpen.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {isAdmin && <td className="px-3 py-2 text-gray-700">{d.owner}</td>}
                  <td className="px-3 py-2 font-medium text-gray-800">{d.name}</td>
                  <td className="px-3 py-2 text-right">{fmt(d.predictedValue)}</td>
                  <td className="px-3 py-2 text-center"><Badge text={d.pipeline || '—'} color={d.pipeline === 'Warm' ? 'gold' : d.pipeline === 'Brave Digital' ? 'purple' : 'blue'} /></td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{d.stage || '—'}</td>
                  <td className="px-3 py-2 text-center text-xs">{d.closeWindow || '—'}</td>
                  <td className="px-3 py-2 text-center">{pct(d.current30)}</td>
                  <td className="px-3 py-2 text-center">{pct(d.current60)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt(num(d.predictedValue) * num(d.current30))}</td>
                  <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen ?? '?'}mo`} color={d.monthsOpen > 6 ? 'red' : d.monthsOpen > 3 ? 'gold' : 'green'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SectionHeader title={`Open Partnership Deals (${partnerOpen.length})`} />
      <FilterBar>
        <Select label="Sort by" value={sortP} onChange={setSortP} options={sortOptions} />
      </FilterBar>
      {partnerOpen.length === 0 ? <p className="text-gray-400">No open partnership deals</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-100">
              {isAdmin && <th className="px-3 py-2 text-left font-semibold text-gray-600">Owner</th>}
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Deal</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Total Value</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">One-Time</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Onboarding</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Ongoing</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Pipeline</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">30-Day %</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">30d Weighted</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Months Open</th>
            </tr></thead>
            <tbody>
              {partnerOpen.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {isAdmin && <td className="px-3 py-2 text-gray-700">{d.owner}</td>}
                  <td className="px-3 py-2 font-medium text-gray-800">{d.name}</td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt(d.totalValue)}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{fmt(d.oneTime)}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{fmt(d.onboarding)}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{fmt(d.ongoing)}</td>
                  <td className="px-3 py-2 text-center"><Badge text={d.pipeline || '—'} color={d.pipeline === 'Warm' ? 'gold' : d.pipeline === 'Brave Digital' ? 'purple' : 'blue'} /></td>
                  <td className="px-3 py-2 text-center">{pct(d.current30)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt(num(d.totalValue) * num(d.current30))}</td>
                  <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen ?? '?'}mo`} color={d.monthsOpen > 6 ? 'red' : d.monthsOpen > 3 ? 'gold' : 'green'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
