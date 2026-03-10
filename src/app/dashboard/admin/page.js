'use client';
import { useEffect, useState } from 'react';
import { REPS, getRepStats, getRepPipelineForecast, getOpenDeals, getClosedDeals, withMonthsOpen, num, getRepFunnelStats, calcWeighted30 } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct, Select, FilterBar, Badge } from '@/components/ui';

export default function AdminDeepDive() {
  const [selectedRep, setSelectedRep] = useState(REPS[0]);
  const [role, setRole] = useState(null);
  useEffect(() => { setRole(localStorage.getItem('harbinger_role')); }, []);
  if (role !== 'admin') return <div className="text-center py-20 text-gray-400">Admin access required</div>;

  const stats = getRepStats(selectedRep);
  const forecast = getRepPipelineForecast(selectedRep);
  const funnel = getRepFunnelStats(selectedRep);
  const open = getOpenDeals(selectedRep);
  const closed = getClosedDeals(selectedRep);
  const aOpen = withMonthsOpen(open.assess);
  const pOpen = withMonthsOpen(open.partner);

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Rep Deep Dive</h1>
      <FilterBar><Select label="Select Rep" value={selectedRep} onChange={setSelectedRep} options={REPS.map(r=>({value:r,label:r}))} /></FilterBar>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Assessment Closes" value={stats.assessClosed} sub={`of ${stats.assessTotal} total entered`} color="blue" />
        <StatCard label="Partnership Closes" value={stats.partnerClosed} sub={`of ${stats.partnerTotal} total entered`} color="gold" />
        <StatCard label="Total Closed Revenue" value={fmt(stats.totalRevenue)} color="green" />
        <StatCard label="Avg Partner Deal" value={fmt(stats.partnerAvgDeal)} color="purple" />
      </div>

      {/* Funnel Metrics */}
      <SectionHeader title="Sales Funnel Conversion" />
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-harbinger-700">{funnel.totalEntered}</p>
            <p className="text-sm text-gray-500">Entered Assessment Pipeline</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{funnel.assessClosed}</p>
            <p className="text-sm text-gray-500">Closed Assessment</p>
            <p className="text-xs text-gray-400">{pct(funnel.entryToCloseRate)} of entries</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600">{funnel.promoted}</p>
            <p className="text-sm text-gray-500">Promoted to Partnership</p>
            <p className="text-xs text-gray-400">{pct(funnel.promotionRate)} of assess closes</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">{funnel.partnerClosed}</p>
            <p className="text-sm text-gray-500">Closed as Partner</p>
            <p className="text-xs text-gray-400">{pct(funnel.fullFunnelRate)} full funnel rate</p>
          </div>
        </div>
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 bg-harbinger-700 h-6 rounded-l" style={{width:`${Math.min(100,funnel.totalEntered/Math.max(1,funnel.totalEntered)*100)}%`}}></div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="bg-blue-500 h-6 rounded-l" style={{width:`${Math.min(100,(funnel.assessClosed/Math.max(1,funnel.totalEntered))*100)}%`}}></div>
            <span className="text-xs whitespace-nowrap">Assessment Win Rate: {pct(funnel.assessCloseRate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="bg-amber-500 h-6 rounded-l" style={{width:`${Math.min(100,(funnel.promoted/Math.max(1,funnel.totalEntered))*100)}%`}}></div>
            <span className="text-xs whitespace-nowrap">Promotion Rate: {pct(funnel.promotionRate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="bg-emerald-500 h-6 rounded-l" style={{width:`${Math.min(100,(funnel.partnerClosed/Math.max(1,funnel.totalEntered))*100)}%`}}></div>
            <span className="text-xs whitespace-nowrap">Full Funnel: {pct(funnel.fullFunnelRate)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Forecast Pipeline" value={fmt(forecast.totalRaw)} sub={`${forecast.assessOpenForecast} assess + ${forecast.partnerOpenForecast} partner`} color="teal" />
        <StatCard label="30-Day Expected" value={fmt(forecast.totalWeighted30)} color="blue" />
        <StatCard label="60-Day Expected" value={fmt(forecast.totalWeighted60)} color="gold" />
      </div>

      <SectionHeader title={`Open Assessments (${aOpen.length})`} />
      {aOpen.length===0?<p className="text-gray-400">None</p>:(
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-right">Value</th>
          <th className="px-3 py-2 text-center">Pipeline</th><th className="px-3 py-2 text-center">Close %</th>
          <th className="px-3 py-2 text-right">30d Wtd</th><th className="px-3 py-2 text-center">Open</th><th className="px-3 py-2 text-center">Forecast</th>
        </tr></thead><tbody>{aOpen.map((d,i)=>(<tr key={d.id} className={`${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50'}`}>
          <td className="px-3 py-2">{d.name}</td><td className="px-3 py-2 text-right">{fmt(d.predictedValue)}</td>
          <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':'blue'}/></td>
          <td className="px-3 py-2 text-center">{pct(d.chancePrimary)}</td>
          <td className="px-3 py-2 text-right">{fmt(calcWeighted30(d))}</td>
          <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'}/></td>
          <td className="px-3 py-2 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Stale" color="gray"/>}</td>
        </tr>))}</tbody></table></div>
      )}

      <SectionHeader title={`Open Partnerships (${pOpen.length})`} />
      {pOpen.length===0?<p className="text-gray-400">None</p>:(
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
          <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-right">Total</th>
          <th className="px-3 py-2 text-center">Pipeline</th><th className="px-3 py-2 text-center">Close %</th>
          <th className="px-3 py-2 text-right">30d Wtd</th><th className="px-3 py-2 text-center">Open</th><th className="px-3 py-2 text-center">Forecast</th>
        </tr></thead><tbody>{pOpen.map((d,i)=>(<tr key={d.id} className={`${!d.inCurrentForecast?'opacity-50':''} ${i%2===0?'bg-white':'bg-gray-50'}`}>
          <td className="px-3 py-2">{d.name}</td><td className="px-3 py-2 text-right font-semibold">{fmt(d.totalValue)}</td>
          <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':'blue'}/></td>
          <td className="px-3 py-2 text-center">{pct(d.chancePrimary)}</td>
          <td className="px-3 py-2 text-right">{fmt(calcWeighted30(d))}</td>
          <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'}/></td>
          <td className="px-3 py-2 text-center">{d.inCurrentForecast?<Badge text="Active" color="green"/>:<Badge text="Stale" color="gray"/>}</td>
        </tr>))}</tbody></table></div>
      )}

      <SectionHeader title={`Closed Deals (${closed.assess.length + closed.partner.length})`} />
      <div className="bg-white rounded-xl shadow overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-100">
        <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-left">Type</th>
        <th className="px-3 py-2 text-right">Predicted</th><th className="px-3 py-2 text-right">Actual</th>
        <th className="px-3 py-2 text-right">Variance</th><th className="px-3 py-2 text-left">Date</th>
      </tr></thead><tbody>
        {[...closed.assess.map(d=>({...d,type:'Assessment',pred:d.predictedValue})),...closed.partner.map(d=>({...d,type:'Partnership',pred:d.totalValue}))].map((d,i)=>(<tr key={d.id+d.type} className={i%2===0?'bg-white':'bg-gray-50'}>
          <td className="px-3 py-2">{d.name}</td><td className="px-3 py-2"><Badge text={d.type} color={d.type==='Assessment'?'blue':'gold'}/></td>
          <td className="px-3 py-2 text-right">{fmt(d.pred)}</td><td className="px-3 py-2 text-right">{fmt(d.actualValue)}</td>
          <td className={`px-3 py-2 text-right font-semibold ${num(d.actualValue)-num(d.pred)>=0?'text-green-600':'text-red-600'}`}>{fmt(num(d.actualValue)-num(d.pred))}</td>
          <td className="px-3 py-2 text-gray-500">{d.actualCloseDate||'—'}</td>
        </tr>))}</tbody></table></div>
    </div>
  );
}
