'use client';
import { useEffect, useState } from 'react';
import { getOpenDeals, getRepPipelineForecast, getRepStats, num, withMonthsOpen, getCurrentForecastPeriod } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct, Select, FilterBar, Badge } from '@/components/ui';

export default function MyPipeline() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [sortA, setSortA] = useState('name');
  const [sortP, setSortP] = useState('name');
  const [filterMonths, setFilterMonths] = useState('all');
  const [showFilter, setShowFilter] = useState('all');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const isAdmin = role === 'admin';
  const rep = isAdmin ? 'admin' : user;
  const stats = getRepStats(rep);
  const forecast = getRepPipelineForecast(rep);
  const forecastPeriod = getCurrentForecastPeriod();
  const open = getOpenDeals(rep);
  let assessOpen = withMonthsOpen(open.assess);
  let partnerOpen = withMonthsOpen(open.partner);

  if (showFilter === 'forecast') { assessOpen = assessOpen.filter(d => d.inCurrentForecast); partnerOpen = partnerOpen.filter(d => d.inCurrentForecast); }
  else if (showFilter === 'stale') { assessOpen = assessOpen.filter(d => !d.inCurrentForecast); partnerOpen = partnerOpen.filter(d => !d.inCurrentForecast); }
  if (filterMonths !== 'all') { const max = parseInt(filterMonths); assessOpen = assessOpen.filter(d => (d.monthsOpen||0) <= max); partnerOpen = partnerOpen.filter(d => (d.monthsOpen||0) <= max); }

  const sortFn = (key) => (a, b) => {
    if (key === 'name') return (a.name||'').localeCompare(b.name||'');
    if (key === 'value') return num(b.predictedValue||b.totalValue) - num(a.predictedValue||a.totalValue);
    if (key === 'chance') return num(b.current30) - num(a.current30);
    if (key === 'months') return (b.monthsOpen||0) - (a.monthsOpen||0);
    if (key === 'owner') return (a.owner||'').localeCompare(b.owner||'');
    return 0;
  };
  assessOpen.sort(sortFn(sortA)); partnerOpen.sort(sortFn(sortP));
  const sortOpts = [{value:'name',label:'Name'},{value:'value',label:'Deal Value'},{value:'chance',label:'Close %'},{value:'months',label:'Months Open'},...(isAdmin?[{value:'owner',label:'Owner'}]:[])];

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-2">{isAdmin ? 'Full Pipeline Overview' : 'My Pipeline'}</h1>
      <p className="text-sm text-gray-500 mb-6">Current forecast: Assessment {forecastPeriod.assess} | Partnership {forecastPeriod.partner}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="In Current Forecast" value={`${forecast.assessOpenForecast} assess / ${forecast.partnerOpenForecast} partner`} color="blue" />
        <StatCard label="All Open Deals" value={`${forecast.assessOpenAll} assess / ${forecast.partnerOpenAll} partner`} sub="Including not in forecast" color="purple" />
        <StatCard label="Forecast Pipeline Value" value={fmt(forecast.totalRaw)} sub="Current model deals only" color="teal" />
        <StatCard label="Total Closed Revenue" value={fmt(stats.totalRevenue)} color="green" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="30-Day Weighted Revenue" value={fmt(forecast.totalWeighted30)} sub="Forecast deals only" color="teal" />
        <StatCard label="60-Day Weighted Revenue" value={fmt(forecast.totalWeighted60)} sub="Forecast deals only" color="teal" />
        <StatCard label="Win Rates" value={`${pct(stats.assessWinRate)} / ${pct(stats.partnerWinRate)}`} sub="Assessment / Partnership" color="gold" />
      </div>
      <FilterBar>
        <Select label="Show" value={showFilter} onChange={setShowFilter} options={[{value:'all',label:'All Open Deals'},{value:'forecast',label:'In Current Forecast Only'},{value:'stale',label:'Not in Current Forecast'}]} />
        <Select label="Max Months Open" value={filterMonths} onChange={setFilterMonths} options={[{value:'all',label:'All'},{value:'3',label:'≤ 3mo'},{value:'6',label:'≤ 6mo'},{value:'12',label:'≤ 12mo'}]} />
      </FilterBar>

      <SectionHeader title={`Open Assessment Deals (${assessOpen.length})`} />
      <FilterBar><Select label="Sort" value={sortA} onChange={setSortA} options={sortOpts} /></FilterBar>
      {assessOpen.length===0 ? <p className="text-gray-400">No deals match filters</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          {isAdmin && <th className="px-3 py-2 text-left font-semibold text-gray-600">Owner</th>}
          <th className="px-3 py-2 text-left font-semibold text-gray-600">Deal</th><th className="px-3 py-2 text-right font-semibold text-gray-600">Value</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">Pipeline</th><th className="px-3 py-2 text-left font-semibold text-gray-600">Stage</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">30d %</th><th className="px-3 py-2 text-center font-semibold text-gray-600">60d %</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-600">30d Wtd</th><th className="px-3 py-2 text-center font-semibold text-gray-600">Open</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">Forecast</th>
        </tr></thead><tbody>
          {assessOpen.map((d,i) => (<tr key={d.id} className={`${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50'}`}>
            {isAdmin && <td className="px-3 py-2">{d.owner}</td>}
            <td className="px-3 py-2 font-medium">{d.name}</td><td className="px-3 py-2 text-right">{fmt(d.predictedValue)}</td>
            <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':d.pipeline==='Brave Digital'?'purple':'blue'} /></td>
            <td className="px-3 py-2 text-xs text-gray-600">{d.stage||'—'}</td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?pct(d.current30):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?pct(d.current60):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2 text-right font-semibold">{fmt(num(d.predictedValue)*num(d.current30))}</td>
            <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'} /></td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Not in model" color="gray"/>}</td>
          </tr>))}
        </tbody></table></div>
      )}

      <SectionHeader title={`Open Partnership Deals (${partnerOpen.length})`} />
      <FilterBar><Select label="Sort" value={sortP} onChange={setSortP} options={sortOpts} /></FilterBar>
      {partnerOpen.length===0 ? <p className="text-gray-400">No deals match filters</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          {isAdmin && <th className="px-3 py-2 text-left font-semibold text-gray-600">Owner</th>}
          <th className="px-3 py-2 text-left font-semibold text-gray-600">Deal</th><th className="px-3 py-2 text-right font-semibold text-gray-600">Total</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-600">One-Time</th><th className="px-3 py-2 text-right font-semibold text-gray-600">Onboard</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-600">Ongoing</th><th className="px-3 py-2 text-center font-semibold text-gray-600">Pipeline</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">30d %</th><th className="px-3 py-2 text-right font-semibold text-gray-600">30d Wtd</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">Open</th><th className="px-3 py-2 text-center font-semibold text-gray-600">Forecast</th>
        </tr></thead><tbody>
          {partnerOpen.map((d,i) => (<tr key={d.id} className={`${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50'}`}>
            {isAdmin && <td className="px-3 py-2">{d.owner}</td>}
            <td className="px-3 py-2 font-medium">{d.name}</td><td className="px-3 py-2 text-right font-semibold">{fmt(d.totalValue)}</td>
            <td className="px-3 py-2 text-right text-gray-500">{fmt(d.oneTime)}</td><td className="px-3 py-2 text-right text-gray-500">{fmt(d.onboarding)}</td>
            <td className="px-3 py-2 text-right text-gray-500">{fmt(d.ongoing)}</td>
            <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':d.pipeline==='Brave Digital'?'purple':'blue'} /></td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?pct(d.current30):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2 text-right font-semibold">{fmt(num(d.totalValue)*num(d.current30))}</td>
            <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'} /></td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Not in model" color="gray"/>}</td>
          </tr>))}
        </tbody></table></div>
      )}
    </div>
  );
}
