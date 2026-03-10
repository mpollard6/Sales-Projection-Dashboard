'use client';
import { useEffect, useState } from 'react';
import { getOpenDeals, getRepPipelineForecast, getRepStats, num } from '@/data/utils';
import { StatCard, Table, SectionHeader, fmt, pct } from '@/components/ui';

export default function MyPipeline() {
  const [user, setUser] = useState(null);
  useEffect(() => { setUser(localStorage.getItem('harbinger_user')); }, []);
  if (!user) return null;

  const stats = getRepStats(user);
  const forecast = getRepPipelineForecast(user);
  const open = getOpenDeals(user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-harbinger-900 mb-6">My Pipeline</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open Assessment Deals" value={forecast.assessOpen} color="blue" />
        <StatCard label="Open Partnership Deals" value={forecast.partnerOpen} color="gold" />
        <StatCard label="Total Raw Pipeline" value={fmt(forecast.totalRaw)} color="purple" />
        <StatCard label="Total Closed Revenue" value={fmt(stats.totalRevenue)} color="green" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="30-Day Weighted Revenue" value={fmt(forecast.totalWeighted30)} sub="Probability-adjusted" color="teal" />
        <StatCard label="60-Day Weighted Revenue" value={fmt(forecast.totalWeighted60)} sub="Probability-adjusted" color="teal" />
        <StatCard label="Assessment Win Rate" value={pct(stats.assessWinRate)} sub={`${stats.assessClosed} won / ${stats.assessLost} lost`} color="blue" />
        <StatCard label="Partnership Win Rate" value={pct(stats.partnerWinRate)} sub={`${stats.partnerClosed} won / ${stats.partnerLost} lost`} color="gold" />
      </div>

      <SectionHeader title="Open Assessment Deals" />
      {open.assess.length === 0 ? <p className="text-gray-500">No open assessment deals</p> : (
        <Table
          headers={['Deal', 'Value', 'Pipeline', 'Stage', 'Close Window', '30-Day %', '60-Day %', '30d Weighted']}
          rows={open.assess.map(d => [
            d.name, fmt(d.predictedValue), d.pipeline || '—', d.stage || '—', d.closeWindow || '—',
            pct(d.current30), pct(d.current60), fmt(num(d.predictedValue) * num(d.current30))
          ])}
        />
      )}

      <SectionHeader title="Open Partnership Deals" />
      {open.partner.length === 0 ? <p className="text-gray-500">No open partnership deals</p> : (
        <Table
          headers={['Deal', 'Total Value', 'One-Time', 'Ongoing', 'Pipeline', 'Stage', '30-Day %', '30d Weighted']}
          rows={open.partner.map(d => [
            d.name, fmt(d.totalValue), fmt(d.oneTime), fmt(d.ongoing), d.pipeline || '—', d.stage || '—',
            pct(d.current30), fmt(num(d.totalValue) * num(d.current30))
          ])}
        />
      )}
    </div>
  );
}
