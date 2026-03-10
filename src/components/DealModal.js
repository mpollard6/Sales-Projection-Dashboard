'use client';
import { getDealPredictionHistory, num } from '@/data/utils';
import { fmt, pct, Badge } from '@/components/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function DealModal({ deal, onClose }) {
  if (!deal) return null;
  const isAssess = deal.id?.startsWith('A-') || deal.id?.startsWith('NA-');
  const history = getDealPredictionHistory(deal.id);
  const chartData = history.map(h => ({
    period: h.period || h.predDate,
    '30-Day %': Math.round(num(h.chance30) * 100),
    '60-Day %': Math.round(num(h.chance60) * 100),
  }));

  const val = isAssess ? num(deal.predictedValue) : num(deal.totalValue);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto z-10" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-harbinger-900">{deal.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{deal.id} &middot; {deal.owner}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Key Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InfoItem label="Status" value={<Badge text={deal.status || '—'} color={deal.status === 'Closed' ? 'green' : deal.status === 'Lost' ? 'red' : 'blue'} />} />
            <InfoItem label="Pipeline" value={<Badge text={deal.pipeline || '—'} color={deal.pipeline === 'Warm' ? 'gold' : deal.pipeline === 'Brave Digital' ? 'purple' : 'blue'} />} />
            <InfoItem label="Stage" value={deal.stage || '—'} />
            <InfoItem label={isAssess ? 'Predicted Value' : 'Total Value'} value={fmt(val)} />
            <InfoItem label="Close Window" value={deal.closeWindow || '—'} />
            <InfoItem label="Date Entered" value={deal.dateEntered || '—'} />
            {deal.status === 'Open' && <>
              <InfoItem label="30-Day Close %" value={pct(deal.chancePrimary)} />
              <InfoItem label="60-Day Close %" value={pct(deal.chanceFallback)} />
              <InfoItem label="In Forecast" value={deal.inCurrentForecast ? 'Yes' : 'No'} />
            </>}
            {deal.status === 'Closed' && <>
              <InfoItem label="Actual Value" value={fmt(deal.actualValue)} />
              <InfoItem label="Close Date" value={deal.actualCloseDate || '—'} />
              <InfoItem label="Variance" value={fmt(num(deal.actualValue) - val)} />
            </>}
            {!isAssess && <>
              <InfoItem label="One-Time" value={fmt(deal.oneTime)} />
              <InfoItem label="Onboarding" value={fmt(deal.onboarding)} />
              <InfoItem label="Ongoing" value={fmt(deal.ongoing)} />
            </>}
            {isAssess && <InfoItem label="Promoted" value={deal.promoted || 'No'} />}
            <InfoItem label="State" value={deal.state || '—'} />
          </div>

          {/* Revenue Breakdown for open deals */}
          {deal.status === 'Open' && deal.inCurrentForecast && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm font-semibold text-harbinger-900 mb-2">Weighted Revenue</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">30-Day Weighted:</span> <strong>{fmt(val * num(deal.chancePrimary))}</strong></div>
                <div><span className="text-gray-500">60-Day Weighted:</span> <strong>{fmt(val * num(deal.chanceFallback))}</strong></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">= Value ({fmt(val)}) x Close % ({pct(deal.chancePrimary)} / {pct(deal.chanceFallback)})</p>
            </div>
          )}

          {/* Prediction History Chart */}
          {chartData.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-harbinger-900 mb-3">Prediction History ({history.length} snapshots)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} />
                  <Tooltip formatter={(v, n) => [v + '%', n]} />
                  <Legend />
                  <Line type="monotone" dataKey="30-Day %" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="60-Day %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-sm font-semibold text-harbinger-900 mb-3">Timeline</p>
            <div className="space-y-2">
              <TimelineItem date={deal.dateEntered} label="Entered pipeline" />
              {deal.lastPredDate && <TimelineItem date={deal.lastPredDate} label="Last prediction" />}
              {deal.actualCloseDate && <TimelineItem date={deal.actualCloseDate} label={deal.status === 'Closed' ? 'Closed' : 'Lost'} color={deal.status === 'Closed' ? 'green' : 'red'} />}
              {!deal.actualCloseDate && deal.closeWindow && <TimelineItem date={`${deal.closeWindow} window`} label="Expected close" color="blue" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium mt-0.5">{typeof value === 'string' ? value : value}</p>
    </div>
  );
}

function TimelineItem({ date, label, color = 'gray' }) {
  const dotColors = { green: 'bg-green-500', red: 'bg-red-500', blue: 'bg-blue-500', gray: 'bg-gray-400' };
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={`w-2.5 h-2.5 rounded-full ${dotColors[color] || dotColors.gray} flex-shrink-0`} />
      <span className="text-gray-500 min-w-[100px]">{date}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
