'use client';
import { useEffect, useState } from 'react';
import { REPS, getRepStats, getRepPipelineForecast, getOpenDeals, getClosedDeals, withMonthsOpen, num, getRepFunnelStats, calcWeighted30, getMomentum, getWinStreak, getRevenueVelocity, getForecastAccuracy, getPipelineCoverage, getRevByPipeline } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct, Select, FilterBar, Badge } from '@/components/ui';

export default function AdminDeepDive() {
  const [rep, setRep] = useState(REPS[0]);
  const [pipeFilter, setPipeFilter] = useState('all');
  const [role, setRole] = useState(null);
  useEffect(() => { setRole(localStorage.getItem('harbinger_role')); }, []);
  if (role !== 'admin') return <div className="text-center py-20 text-gray-400">Admin access required</div>;

  const pf = pipeFilter === 'all' ? undefined : pipeFilter;
  const stats = getRepStats(rep, null, pf);
  const forecast = getRepPipelineForecast(rep, pf);
  const funnel = getRepFunnelStats(rep);
  const momentum = getMomentum(rep);
  const streak = getWinStreak(rep);
  const velocity = getRevenueVelocity(rep);
  const accuracy = getForecastAccuracy(rep);
  const coverage = getPipelineCoverage(rep);
  const revByPipe = getRevByPipeline(rep);
  const open = getOpenDeals(rep, false, pf);
  const closed = getClosedDeals(rep, null, pf);
  const aOpen = withMonthsOpen(open.assess), pOpen = withMonthsOpen(open.partner);

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Rep Deep Dive</h1>
      <FilterBar>
        <Select label="Rep" value={rep} onChange={setRep} options={REPS.map(r=>({value:r,label:r}))} />
        <Select label="Pipeline" value={pipeFilter} onChange={setPipeFilter} options={[{value:'all',label:'All'},{value:'Warm',label:'Warm'},{value:'Cold',label:'Cold'},{value:'Brave Digital',label:'Brave Digital'}]} />
      </FilterBar>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatCard label="Assessment Closes" value={stats.assessClosed} sub={`Win rate: ${pct(stats.assessWinRate)}`} color="blue" />
        <StatCard label="Partnership Closes" value={stats.partnerClosed} sub={`Win rate: ${pct(stats.partnerWinRate)}`} color="gold" />
        <StatCard label="Closed Revenue" value={fmt(stats.totalRevenue)} color="green" />
        <StatCard label="Avg Partner Deal" value={fmt(stats.partnerAvgDeal)} color="purple" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Revenue Velocity" value={`${fmt(velocity.avgRevPerDay)}/day`} sub={`Avg ${velocity.avgDays} days to close`} color="teal" />
        <StatCard label="Forecast Accuracy" value={`${accuracy.score}%`} sub={`${accuracy.deals} deals measured`} color={accuracy.score>=70?'green':'red'} />
        <StatCard label="Pipeline Coverage" value={`${coverage.ratio.toFixed(1)}x`} sub={`${fmt(coverage.raw)} pipeline`} color={coverage.ratio>=3?'green':coverage.ratio>=2?'gold':'red'} />
        <StatCard label="Win Streak" value={`🔥 ${streak} months`} sub={momentum.trend==='growing'?'📈 Pipeline growing':'📉 Pipeline shrinking'} color="gold" />
      </div>

      {/* Pipeline source */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.entries(revByPipe).map(([pipe,d])=>(
          <div key={pipe} className="bg-white rounded-xl shadow p-4 border-l-4" style={{borderLeftColor:pipe==='Warm'?'#f59e0b':pipe==='Brave Digital'?'#8b5cf6':'#3b82f6'}}>
            <p className="text-sm font-semibold">{pipe}</p>
            <p className="font-bold">{fmt(d.closedRev)} closed ({d.closedCount} deals)</p>
            <p className="text-xs text-gray-500">{d.openCount} open | {fmt(d.openValue)} on table</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <SectionHeader title="Sales Funnel" />
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div><p className="text-2xl font-bold text-harbinger-700">{funnel.totalEntered}</p><p className="text-xs text-gray-500">Entered Pipeline</p></div>
          <div><p className="text-2xl font-bold text-blue-600">{funnel.assessClosed}</p><p className="text-xs text-gray-500">Closed Assessment</p><p className="text-xs text-blue-500">{pct(funnel.entryToCloseRate)} of entries</p></div>
          <div><p className="text-2xl font-bold text-amber-600">{funnel.promoted}</p><p className="text-xs text-gray-500">Promoted to Partner</p><p className="text-xs text-amber-500">{pct(funnel.promotionRate)} of closes</p></div>
          <div><p className="text-2xl font-bold text-emerald-600">{funnel.partnerClosed}</p><p className="text-xs text-gray-500">Closed as Partner</p><p className="text-xs text-emerald-500">{pct(funnel.partnerCloseRate)} of promoted</p></div>
          <div><p className="text-2xl font-bold text-purple-600">{pct(funnel.fullFunnelRate)}</p><p className="text-xs text-gray-500">Full Funnel Rate</p><p className="text-xs text-purple-500">Entry → Partner Close</p></div>
        </div>
      </div>

      {/* Forecast */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Assess 30d Rev" value={fmt(forecast.assessW30)} sub={`~${forecast.assessCloses30.toFixed(1)} closes`} color="blue" />
        <StatCard label="Assess 60d Rev" value={fmt(forecast.assessW60)} sub={`~${forecast.assessCloses60.toFixed(1)} closes`} color="blue" />
        <StatCard label="Partner 30d Rev" value={fmt(forecast.partnerW30)} sub={`~${forecast.partnerCloses30.toFixed(1)} closes`} color="gold" />
        <StatCard label="Partner 60d Rev" value={fmt(forecast.partnerW60)} sub={`~${forecast.partnerCloses60.toFixed(1)} closes`} color="gold" />
      </div>

      <SectionHeader title={`Open Assessments (${aOpen.length})`} />
      {aOpen.length===0?<p className="text-gray-400">None</p>:(
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-right">Value</th><th className="px-3 py-2 text-center">Pipe</th>
          <th className="px-3 py-2 text-center">Close%</th><th className="px-3 py-2 text-right">30d$</th><th className="px-3 py-2 text-center">Open</th><th className="px-3 py-2 text-center">Status</th>
        </tr></thead><tbody>{aOpen.map((d,i)=>(<tr key={d.id} className={`${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50'}`}>
          <td className="px-3 py-2">{d.name}</td><td className="px-3 py-2 text-right">{fmt(d.predictedValue)}</td>
          <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':'blue'}/></td>
          <td className="px-3 py-2 text-center">{pct(d.chancePrimary)}</td><td className="px-3 py-2 text-right">{fmt(calcWeighted30(d))}</td>
          <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'}/></td>
          <td className="px-3 py-2 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Stale" color="gray"/>}</td>
        </tr>))}</tbody></table></div>
      )}

      <SectionHeader title={`Open Partnerships (${pOpen.length})`} />
      {pOpen.length===0?<p className="text-gray-400">None</p>:(
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-center">Pipe</th>
          <th className="px-3 py-2 text-center">Close%</th><th className="px-3 py-2 text-right">30d$</th><th className="px-3 py-2 text-center">Open</th><th className="px-3 py-2 text-center">Status</th>
        </tr></thead><tbody>{pOpen.map((d,i)=>(<tr key={d.id} className={`${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50'}`}>
          <td className="px-3 py-2">{d.name}</td><td className="px-3 py-2 text-right font-semibold">{fmt(d.totalValue)}</td>
          <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':'blue'}/></td>
          <td className="px-3 py-2 text-center">{pct(d.chancePrimary)}</td><td className="px-3 py-2 text-right">{fmt(calcWeighted30(d))}</td>
          <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'}/></td>
          <td className="px-3 py-2 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Stale" color="gray"/>}</td>
        </tr>))}</tbody></table></div>
      )}
    </div>
  );
}
