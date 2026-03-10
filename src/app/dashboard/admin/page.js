'use client';
import { useEffect, useState } from 'react';
import { REPS, getRepStats, getRepPipelineForecast, getOpenDeals, getClosedDeals, withMonthsOpen, num } from '@/data/utils';
import { StatCard, SectionHeader, fmt, pct, Select, FilterBar, Badge } from '@/components/ui';

export default function AdminDeepDive() {
  const [selectedRep, setSelectedRep] = useState(REPS[0]);
  const [role, setRole] = useState(null);
  useEffect(() => { setRole(localStorage.getItem('harbinger_role')); }, []);
  if (role !== 'admin') return <div className="text-center py-20 text-gray-400">Admin access required</div>;

  const stats = getRepStats(selectedRep);
  const forecast = getRepPipelineForecast(selectedRep);
  const open = getOpenDeals(selectedRep);
  const closed = getClosedDeals(selectedRep);
  const assessOpen = withMonthsOpen(open.assess);
  const partnerOpen = withMonthsOpen(open.partner);

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">Rep Deep Dive</h1>
      <FilterBar>
        <Select label="Select Rep" value={selectedRep} onChange={setSelectedRep}
          options={REPS.map(r => ({ value: r, label: r }))} />
      </FilterBar>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Open Assessments" value={stats.assessOpen} color="blue" />
        <StatCard label="Open Partnerships" value={stats.partnerOpen} color="gold" />
        <StatCard label="Assessment Closes" value={stats.assessClosed} sub={`Win rate: ${pct(stats.assessWinRate)}`} color="green" />
        <StatCard label="Partnership Closes" value={stats.partnerClosed} sub={`Win rate: ${pct(stats.partnerWinRate)}`} color="green" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Pipeline" value={fmt(forecast.totalRaw)} color="purple" />
        <StatCard label="30-Day Weighted" value={fmt(forecast.totalWeighted30)} color="teal" />
        <StatCard label="Total Closed Revenue" value={fmt(stats.totalRevenue)} color="green" />
        <StatCard label="Avg Partner Deal" value={fmt(stats.partnerAvgDeal)} color="gold" />
      </div>

      <SectionHeader title={`${selectedRep} — Open Assessment Deals (${assessOpen.length})`} />
      {assessOpen.length === 0 ? <p className="text-gray-400">None</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2 text-center">Pipeline</th><th className="px-3 py-2 text-center">30-Day %</th>
              <th className="px-3 py-2 text-right">Weighted</th><th className="px-3 py-2 text-center">Months Open</th>
            </tr></thead>
            <tbody>{assessOpen.map((d,i) => (
              <tr key={d.id} className={i%2===0?'bg-white':'bg-gray-50'}>
                <td className="px-3 py-2">{d.name}</td><td className="px-3 py-2 text-right">{fmt(d.predictedValue)}</td>
                <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':'blue'} /></td>
                <td className="px-3 py-2 text-center">{pct(d.current30)}</td>
                <td className="px-3 py-2 text-right">{fmt(num(d.predictedValue)*num(d.current30))}</td>
                <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'} /></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      )}

      <SectionHeader title={`${selectedRep} — Open Partnership Deals (${partnerOpen.length})`} />
      {partnerOpen.length === 0 ? <p className="text-gray-400">None</p> : (
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-right">Total Value</th>
              <th className="px-3 py-2 text-right">One-Time</th><th className="px-3 py-2 text-right">Onboarding</th><th className="px-3 py-2 text-right">Ongoing</th>
              <th className="px-3 py-2 text-center">Pipeline</th><th className="px-3 py-2 text-center">30-Day %</th><th className="px-3 py-2 text-center">Months Open</th>
            </tr></thead>
            <tbody>{partnerOpen.map((d,i) => (
              <tr key={d.id} className={i%2===0?'bg-white':'bg-gray-50'}>
                <td className="px-3 py-2">{d.name}</td><td className="px-3 py-2 text-right font-semibold">{fmt(d.totalValue)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{fmt(d.oneTime)}</td><td className="px-3 py-2 text-right text-gray-500">{fmt(d.onboarding)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{fmt(d.ongoing)}</td>
                <td className="px-3 py-2 text-center"><Badge text={d.pipeline||'—'} color={d.pipeline==='Warm'?'gold':'blue'} /></td>
                <td className="px-3 py-2 text-center">{pct(d.current30)}</td>
                <td className="px-3 py-2 text-center"><Badge text={`${d.monthsOpen??'?'}mo`} color={d.monthsOpen>6?'red':d.monthsOpen>3?'gold':'green'} /></td>
              </tr>))}
            </tbody>
          </table>
        </div>
      )}

      <SectionHeader title={`${selectedRep} — Recent Closes (${closed.assess.length + closed.partner.length})`} />
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-100">
            <th className="px-3 py-2 text-left">Deal</th><th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-right">Predicted</th><th className="px-3 py-2 text-right">Actual</th>
            <th className="px-3 py-2 text-right">Variance</th><th className="px-3 py-2 text-left">Close Date</th>
          </tr></thead>
          <tbody>
            {[...closed.assess.map(d=>({...d,type:'Assessment'})), ...closed.partner.map(d=>({...d,type:'Partnership'}))].map((d,i) => (
              <tr key={d.id} className={i%2===0?'bg-white':'bg-gray-50'}>
                <td className="px-3 py-2">{d.name}</td><td className="px-3 py-2"><Badge text={d.type} color={d.type==='Assessment'?'blue':'gold'} /></td>
                <td className="px-3 py-2 text-right">{fmt(d.predictedValue||d.totalValue)}</td><td className="px-3 py-2 text-right">{fmt(d.actualValue)}</td>
                <td className={`px-3 py-2 text-right font-semibold ${num(d.actualValue)-num(d.predictedValue||d.totalValue)>=0?'text-green-600':'text-red-600'}`}>
                  {fmt(num(d.actualValue)-num(d.predictedValue||d.totalValue))}</td>
                <td className="px-3 py-2 text-gray-500">{d.actualCloseDate||'—'}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
