export function fmt(n) {
  if (n == null || isNaN(n)) return '$0';
  return '$' + Math.round(n).toLocaleString();
}
export function pct(n) {
  if (n == null || isNaN(n)) return '0%';
  return (n * 100).toFixed(1) + '%';
}

export function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = { blue:'from-blue-500 to-blue-700', green:'from-emerald-500 to-emerald-700', gold:'from-amber-500 to-amber-700', purple:'from-purple-500 to-purple-700', red:'from-red-500 to-red-700', teal:'from-teal-500 to-teal-700' };
  return (
    <div className={`bg-gradient-to-br ${colors[color]||colors.blue} rounded-xl p-5 text-white shadow-lg`}>
      <p className="text-sm font-medium opacity-85">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-75 mt-1">{sub}</p>}
    </div>
  );
}

export function SectionHeader({ title }) {
  return <h2 className="text-lg font-bold text-harbinger-900 mb-4 mt-8 border-b-2 border-harbinger-500 pb-2">{title}</h2>;
}

export function FilterBar({ children }) {
  return <div className="flex flex-wrap gap-3 mb-6 items-center">{children}</div>;
}

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-harbinger-500 outline-none bg-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Badge({ text, color = 'blue' }) {
  const colors = { blue:'bg-blue-100 text-blue-800', green:'bg-emerald-100 text-emerald-800', gold:'bg-amber-100 text-amber-800', red:'bg-red-100 text-red-800', gray:'bg-gray-100 text-gray-800', purple:'bg-purple-100 text-purple-800' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]||colors.blue}`}>{text}</span>;
}
