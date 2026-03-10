'use client';
import { useEffect, useState } from 'react';
import { getOpenDeals, getRepPipelineForecast, getRepStats, num, withMonthsOpen, getCurrentForecastPeriod, calcWeighted30, calcWeighted60 } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct, Select, FilterBar, Badge } from '@/components/ui';

export default function MyPipeline() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [sortA, setSortA] = useState('chance');
  const [sortP, setSortP] = useState('chance');
  const [filterMonths, setFilterMonths] = useState('all');
  const [showFilter, setShowFilter] = useState('all');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const isAdmin = role === 'admin';
  const rep = isAdmin ? 'admin' : user;
  const stats = getRepStats(rep);
  const forecast = getRepPipelineForecast(rep);
  const fp = getCurrentForecastPeriod();
  const open = getOpenDeals(rep);
  let aOpen = withMonthsOpen(open.assess), pOpen = withMonthsOpen(open.partner);

  if (showFilter === 'forecast') { aOpen = aOpen.filter(d => d.inCurrentForecast); pOpen = pOpen.filter(d => d.inCurrentForecast); }
  else if (showFilter === 'stale') { aOpen = aOpen.filter(d => !d.inCurrentForecast); pOpen = pOpen.filter(d => !d.inCurrentForecast); }
  if (filterMonths !== 'all') { const m = parseInt(filterMonths); aOpen = aOpen.filter(d => (d.monthsOpen||0) <= m); pOpen = pOpen.filter(d => (d.monthsOpen||0) <= m); }

  const sortFn = k => (a,b) => {
    if (k==='name') return (a.name||'').localeCompare(b.name||'');
    if (k==='value') return num(b.predictedValue||b.totalValue)-num(a.predictedValue||a.totalValue);
    if (k==='chance') return num(b.chancePrimary)-num(a.chancePrimary);
    if (k==='months') return (b.monthsOpen||0)-(a.monthsOpen||0);
    if (k==='owner') return (a.owner||'').localeCompare(b.owner||'');
    return 0;
  };
  aOpen.sort(sortFn(sortA)); pOpen.sort(sortFn(sortP));
  const sOpts=[{value:'name',label:'Name'},{value:'value',label:'Value'},{value:'chance',label:'Close %'},{value:'months',label:'Months Open'},...(isAdmin?[{value:'owner',label:'Owner'}]:[])];

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-2">{isAdmin?'Full Pipeline':'My Pipeline'}</h1>
      <p className="text-sm text-gray-500 mb-6">Current forecast: {fp.assess} | {fp.partner}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="In Current Forecast" value={`${forecast.assessOpenForecast} assess / ${forecast.partnerOpenForecast} partner`} color="blue" />
        <StatCard label="All Open Deals" value={`${forecast.assessOpenAll} assess / ${forecast.partnerOpenAll} partner`} color="purple" />
        <StatCard label="Forecast Pipeline Value" value={fmt(forecast.totalRaw)} sub="Current model only" color="teal" />
        <StatCard label="Closed Revenue" value={fmt(stats.totalRevenue)} color="green" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="30-Day Expected Revenue" value={fmt(forecast.totalWeighted30)} sub="30-day window deals" color="blue" />
        <StatCard label="60-Day Expected Revenue" value={fmt(forecast.totalWeighted60)} sub="60-day + fallback deals" color="gold" />
        <StatCard label="Assessment Win Rate" value={pct(stats.assessWinRate)} color="teal" />
        <StatCard label="Partnership Win Rate" value={pct(stats.partnerWinRate)} color="teal" />
      </div>
      <FilterBar>
        <Select label="Show" value={showFilter} onChange={setShowFilter} options={[{value:'all',label:'All Open'},{value:'forecast',label:'In Forecast Only'},{value:'stale',label:'Not in Forecast'}]} />
        <Select label="Max Months" value={filterMonths} onChange={setFilterMonths} options={[{value:'all',label:'All'},{value:'3',label:'≤3mo'},{value:'6',label:'≤6mo'},{value:'12',label:'≤12mo'}]} />
      </FilterBar>

      <SectionHeader title={`Open Assessment Deals (${aOpen.length})`} />
      <FilterBar><Select label="Sort" value={sortA} onChange={setSortA} options={sOpts} /></FilterBar>
      {aOpen.length===0?<p className="text-gray-400">No deals</p>:(
        <div className="bg-white rounded-xl shadow overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          {isAdmin&&<th className="px-3 py-2 text-left font-semibold text-gray-600">Owner</th>}
          <th className="px-3 py-2 text-left font-semibold text-gray-600">Deal</th><th className="px-3 py-2 text-right font-semibold text-gray-600">Value</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">Pipeline</th><th className="px-3 py-2 text-center font-semibold text-gray-600">Window</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">Close %</th><th className="px-3 py-2 text-center font-semibold text-gray-600">60d Fallback</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-600">30d Wtd</th><th className="px-3 py-2 text-right font-semibold text-gray-600">60d Wtd</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">Open</th><th className="px-3 py-2 text-center font-semibold text-gray-600">Status</th>
        </tr></thead><tbody>
          {aOpen.map((d,i)=>(<tr key={d.id} className={`${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50'}`}>
            {isAdmin&&<td className="px-3 py-2">{d.owner}</td>}
            <td className="px-3 py-2 font-medium">{d.name}</td><td className="px-3 py-2 text-right">{fmt(d.predictedValue)}</td>
            <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':d.pipeline==='Brave Digital'?'purple':'blue'}/></td>
            <td className="px-3 py-2 text-center text-xs">{d.closeWindow||'—'}</td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?pct(d.chancePrimary):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?pct(d.chanceFallback):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2 text-right font-semibold">{fmt(calcWeighted30(d))}</td>
            <td className="px-3 py-2 text-right font-semibold">{fmt(calcWeighted60(d))}</td>
            <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'}/></td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Not in model" color="gray"/>}</td>
          </tr>))}
        </tbody></table></div>
      )}

      <SectionHeader title={`Open Partnership Deals (${pOpen.length})`} />
      <FilterBar><Select label="Sort" value={sortP} onChange={setSortP} options={sOpts} /></FilterBar>
      {pOpen.length===0?<p className="text-gray-400">No deals</p>:(
        <div className="bg-white rounded-xl shadow overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          {isAdmin&&<th className="px-3 py-2 text-left font-semibold text-gray-600">Owner</th>}
          <th className="px-3 py-2 text-left font-semibold text-gray-600">Deal</th><th className="px-3 py-2 text-right font-semibold text-gray-600">Total</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-600">One-Time</th><th className="px-3 py-2 text-right font-semibold text-gray-600">Onboard</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-600">Ongoing</th><th className="px-3 py-2 text-center font-semibold text-gray-600">Pipeline</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">Window</th><th className="px-3 py-2 text-center font-semibold text-gray-600">Close %</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">60d %</th>
          <th className="px-3 py-2 text-right font-semibold text-gray-600">30d Wtd</th><th className="px-3 py-2 text-right font-semibold text-gray-600">60d Wtd</th>
          <th className="px-3 py-2 text-center font-semibold text-gray-600">Open</th><th className="px-3 py-2 text-center font-semibold text-gray-600">Status</th>
        </tr></thead><tbody>
          {pOpen.map((d,i)=>(<tr key={d.id} className={`${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50'}`}>
            {isAdmin&&<td className="px-3 py-2">{d.owner}</td>}
            <td className="px-3 py-2 font-medium">{d.name}</td><td className="px-3 py-2 text-right font-semibold">{fmt(d.totalValue)}</td>
            <td className="px-3 py-2 text-right text-gray-500">{fmt(d.oneTime)}</td><td className="px-3 py-2 text-right text-gray-500">{fmt(d.onboarding)}</td>
            <td className="px-3 py-2 text-right text-gray-500">{fmt(d.ongoing)}</td>
            <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':d.pipeline==='Brave Digital'?'purple':'blue'}/></td>
            <td className="px-3 py-2 text-center text-xs">{d.closeWindow||'—'}</td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?pct(d.chancePrimary):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?pct(d.chanceFallback):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2 text-right font-semibold">{fmt(calcWeighted30(d))}</td>
            <td className="px-3 py-2 text-right font-semibold">{fmt(calcWeighted60(d))}</td>
            <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'}/></td>
            <td className="px-3 py-2 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Not in model" color="gray"/>}</td>
          </tr>))}
        </tbody></table></div>
      )}
    </div>
  );
}
