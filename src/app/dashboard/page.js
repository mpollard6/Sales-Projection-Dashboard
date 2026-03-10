'use client';
import { useEffect, useState } from 'react';
import { getOpenDeals, getRepPipelineForecast, getRepStats, num, withMonthsOpen, getCurrentForecastPeriod, calcWeighted30, calcWeighted60, getMomentum, getWinStreak, getRevByPipeline } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct, Select, FilterBar, Badge, SearchInput, EmptyState, TableWrapper } from '@/components/ui';

export default function MyPipeline() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [sortA, setSortA] = useState('chance');
  const [sortP, setSortP] = useState('chance');
  const [filterMonths, setFilterMonths] = useState('all');
  const [showFilter, setShowFilter] = useState('all');
  const [pipeFilter, setPipeFilter] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); setRole(localStorage.getItem('harbinger_role')); }, []);
  if (!user) return null;

  const isAdmin = role === 'admin';
  const rep = isAdmin ? 'admin' : user;
  const pf = pipeFilter === 'all' ? undefined : pipeFilter;
  const stats = getRepStats(rep, null, pf);
  const forecast = getRepPipelineForecast(rep, pf);
  const fp = getCurrentForecastPeriod();
  const momentum = getMomentum(rep);
  const streak = getWinStreak(rep);
  const revByPipe = getRevByPipeline(rep);
  const open = getOpenDeals(rep, false, pf);
  let aOpen = withMonthsOpen(open.assess), pOpen = withMonthsOpen(open.partner);

  if (showFilter === 'forecast') { aOpen = aOpen.filter(d => d.inCurrentForecast); pOpen = pOpen.filter(d => d.inCurrentForecast); }
  else if (showFilter === 'stale') { aOpen = aOpen.filter(d => !d.inCurrentForecast); pOpen = pOpen.filter(d => !d.inCurrentForecast); }
  if (filterMonths !== 'all') { const m = parseInt(filterMonths); aOpen = aOpen.filter(d => (d.monthsOpen||0) <= m); pOpen = pOpen.filter(d => (d.monthsOpen||0) <= m); }

  const q = search.toLowerCase().trim();
  if (q) {
    aOpen = aOpen.filter(d => (d.name||'').toLowerCase().includes(q) || (d.owner||'').toLowerCase().includes(q));
    pOpen = pOpen.filter(d => (d.name||'').toLowerCase().includes(q) || (d.owner||'').toLowerCase().includes(q));
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-harbinger-900">{isAdmin?'Full Pipeline':'My Pipeline'}</h1>
          <p className="text-sm text-gray-500 mt-1">Forecast: {fp.assess}</p>
        </div>
      </div>

      {/* Momentum + Streak */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-4">
        <div className={`flex-1 rounded-xl p-4 border-2 ${momentum.trend==='growing'?'border-green-400 bg-green-50':momentum.trend==='shrinking'?'border-red-400 bg-red-50':'border-gray-300 bg-gray-50'}`}>
          <p className="text-sm font-semibold text-gray-600">Pipeline Momentum</p>
          <p className="text-2xl font-bold">{momentum.trend==='growing'?'📈 Growing':momentum.trend==='shrinking'?'📉 Shrinking':'➡️ Stable'}</p>
          <p className="text-xs text-gray-500">{momentum.change>0?'+':''}{momentum.change} deals vs last period</p>
        </div>
        <div className="flex-1 rounded-xl p-4 border-2 border-amber-400 bg-amber-50">
          <p className="text-sm font-semibold text-gray-600">Win Streak</p>
          <p className="text-2xl font-bold">🔥 {streak} month{streak!==1?'s':''}</p>
          <p className="text-xs text-gray-500">Consecutive months with closes</p>
        </div>
      </div>

      {/* Split revenue cards: Assessment vs Partnership, 30 vs 60 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard label="Assessment 30d Revenue" value={fmt(forecast.assessW30)} sub={`~${forecast.assessCloses30.toFixed(1)} projected closes`} color="blue" />
        <StatCard label="Assessment 60d Revenue" value={fmt(forecast.assessW60)} sub={`~${forecast.assessCloses60.toFixed(1)} projected closes`} color="blue" />
        <StatCard label="Partnership 30d Revenue" value={fmt(forecast.partnerW30)} sub={`~${forecast.partnerCloses30.toFixed(1)} projected closes`} color="gold" />
        <StatCard label="Partnership 60d Revenue" value={fmt(forecast.partnerW60)} sub={`~${forecast.partnerCloses60.toFixed(1)} projected closes`} color="gold" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard label="Total 30d Revenue" value={fmt(forecast.totalW30)} sub={`~${forecast.totalCloses30.toFixed(1)} closes`} color="teal" />
        <StatCard label="Total 60d Revenue" value={fmt(forecast.totalW60)} sub={`~${forecast.totalCloses60.toFixed(1)} closes`} color="teal" />
        <StatCard label="Forecast Pipeline" value={fmt(forecast.totalRaw)} sub={`${forecast.assessOpenForecast} assess + ${forecast.partnerOpenForecast} partner`} color="purple" />
        <StatCard label="Closed Revenue" value={fmt(stats.totalRevenue)} color="green" />
      </div>

      {/* Pipeline source breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {Object.entries(revByPipe).map(([pipe,d])=>(
          <div key={pipe} className="bg-white rounded-xl shadow p-4 border-l-4 hover:shadow-md" style={{borderLeftColor:pipe==='Warm'?'#f59e0b':pipe==='Brave Digital'?'#8b5cf6':'#3b82f6'}}>
            <p className="text-sm font-semibold text-gray-600">{pipe} Pipeline</p>
            <p className="text-lg font-bold">{fmt(d.closedRev)} closed</p>
            <p className="text-xs text-gray-500">{d.closedCount} deals closed | {d.openCount} still open ({fmt(d.openValue)} on table)</p>
          </div>
        ))}
      </div>

      <FilterBar>
        <Select label="Pipeline" value={pipeFilter} onChange={setPipeFilter} options={[{value:'all',label:'All'},{value:'Warm',label:'Warm'},{value:'Cold',label:'Cold'},{value:'Brave Digital',label:'Brave Digital'}]} />
        <Select label="Show" value={showFilter} onChange={setShowFilter} options={[{value:'all',label:'All Open'},{value:'forecast',label:'In Forecast'},{value:'stale',label:'Not in Forecast'}]} />
        <Select label="Max Months" value={filterMonths} onChange={setFilterMonths} options={[{value:'all',label:'All'},{value:'3',label:'≤3mo'},{value:'6',label:'≤6mo'},{value:'12',label:'≤12mo'}]} />
        <div className="sm:ml-auto">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or owner..." />
        </div>
      </FilterBar>

      <SectionHeader title={`Open Assessment Deals (${aOpen.length})`} />
      <FilterBar><Select label="Sort" value={sortA} onChange={setSortA} options={sOpts} /></FilterBar>
      {aOpen.length===0?<EmptyState message={q ? 'No deals match your search' : 'No deals to display'} icon="📋" />:(
        <TableWrapper><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          {isAdmin&&<th className="px-3 py-2.5 text-left font-semibold text-gray-600">Owner</th>}
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Deal</th><th className="px-3 py-2.5 text-right font-semibold text-gray-600">Value</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Pipeline</th><th className="px-3 py-2.5 text-center font-semibold text-gray-600">Window</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Close %</th><th className="px-3 py-2.5 text-center font-semibold text-gray-600">60d %</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">30d $</th><th className="px-3 py-2.5 text-right font-semibold text-gray-600">60d $</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Open</th><th className="px-3 py-2.5 text-center font-semibold text-gray-600">Status</th>
        </tr></thead><tbody>
          {aOpen.map((d,i)=>(<tr key={d.id} className={`table-row-hover ${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
            {isAdmin&&<td className="px-3 py-2.5 text-gray-600">{d.owner}</td>}
            <td className="px-3 py-2.5 font-medium">{d.name}</td><td className="px-3 py-2.5 text-right">{fmt(d.predictedValue)}</td>
            <td className="px-3 py-2.5 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':d.pipeline==='Brave Digital'?'purple':'blue'}/></td>
            <td className="px-3 py-2.5 text-center text-xs">{d.closeWindow||'—'}</td>
            <td className="px-3 py-2.5 text-center">{d.inCurrentForecast?pct(d.chancePrimary):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2.5 text-center">{d.inCurrentForecast?pct(d.chanceFallback):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2.5 text-right font-semibold">{fmt(calcWeighted30(d))}</td>
            <td className="px-3 py-2.5 text-right font-semibold">{fmt(calcWeighted60(d))}</td>
            <td className="px-3 py-2.5 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'}/></td>
            <td className="px-3 py-2.5 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Not in model" color="gray"/>}</td>
          </tr>))}
        </tbody></table></TableWrapper>
      )}

      <SectionHeader title={`Open Partnership Deals (${pOpen.length})`} />
      <FilterBar><Select label="Sort" value={sortP} onChange={setSortP} options={sOpts} /></FilterBar>
      {pOpen.length===0?<EmptyState message={q ? 'No deals match your search' : 'No deals to display'} icon="📋" />:(
        <TableWrapper><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          {isAdmin&&<th className="px-3 py-2.5 text-left font-semibold text-gray-600">Owner</th>}
          <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Deal</th><th className="px-3 py-2.5 text-right font-semibold text-gray-600">Total</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">1-Time</th><th className="px-3 py-2.5 text-right font-semibold text-gray-600">Onboard</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Ongoing</th><th className="px-3 py-2.5 text-center font-semibold text-gray-600">Pipe</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Window</th><th className="px-3 py-2.5 text-center font-semibold text-gray-600">Close %</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">60d %</th>
          <th className="px-3 py-2.5 text-right font-semibold text-gray-600">30d $</th><th className="px-3 py-2.5 text-right font-semibold text-gray-600">60d $</th>
          <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Open</th><th className="px-3 py-2.5 text-center font-semibold text-gray-600">Status</th>
        </tr></thead><tbody>
          {pOpen.map((d,i)=>(<tr key={d.id} className={`table-row-hover ${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
            {isAdmin&&<td className="px-3 py-2.5 text-gray-600">{d.owner}</td>}
            <td className="px-3 py-2.5 font-medium">{d.name}</td><td className="px-3 py-2.5 text-right font-semibold">{fmt(d.totalValue)}</td>
            <td className="px-3 py-2.5 text-right text-gray-500">{fmt(d.oneTime)}</td><td className="px-3 py-2.5 text-right text-gray-500">{fmt(d.onboarding)}</td>
            <td className="px-3 py-2.5 text-right text-gray-500">{fmt(d.ongoing)}</td>
            <td className="px-3 py-2.5 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':d.pipeline==='Brave Digital'?'purple':'blue'}/></td>
            <td className="px-3 py-2.5 text-center text-xs">{d.closeWindow||'—'}</td>
            <td className="px-3 py-2.5 text-center">{d.inCurrentForecast?pct(d.chancePrimary):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2.5 text-center">{d.inCurrentForecast?pct(d.chanceFallback):<span className="text-gray-400">0%</span>}</td>
            <td className="px-3 py-2.5 text-right font-semibold">{fmt(calcWeighted30(d))}</td>
            <td className="px-3 py-2.5 text-right font-semibold">{fmt(calcWeighted60(d))}</td>
            <td className="px-3 py-2.5 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'}/></td>
            <td className="px-3 py-2.5 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Not in model" color="gray"/>}</td>
          </tr>))}
        </tbody></table></TableWrapper>
      )}
    </div>
  );
}
