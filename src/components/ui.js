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
    <div className={`stat-card bg-gradient-to-br ${colors[color]||colors.blue} rounded-xl p-5 text-white shadow-lg cursor-default`}>
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
      <select value={value} onChange={e => onChange(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-harbinger-500 outline-none bg-white hover:border-gray-400 cursor-pointer">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Badge({ text, color = 'blue' }) {
  const colors = { blue:'bg-blue-100 text-blue-800', green:'bg-emerald-100 text-emerald-800', gold:'bg-amber-100 text-amber-800', red:'bg-red-100 text-red-800', gray:'bg-gray-100 text-gray-800', purple:'bg-purple-100 text-purple-800' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]||colors.blue}`}>{text}</span>;
}

export function SearchInput({ value, onChange, placeholder = 'Search deals...' }) {
  return (
    <div className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input w-full max-w-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-harbinger-500 focus:border-harbinger-500 outline-none bg-white placeholder-gray-400" />
    </div>
  );
}

export function EmptyState({ message = 'No data to display', icon = '📭' }) {
  return (
    <div className="bg-white rounded-xl shadow p-12 text-center">
      <span className="text-4xl block mb-3">{icon}</span>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

export function TableWrapper({ children }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto border border-gray-100">
      {children}
    </div>
  );
}

export function CalcTooltip({ formula, children }) {
  return (
    <span className="relative group inline-flex items-center gap-1 cursor-help">
      {children}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0">
        <path fillRule="evenodd" d="M15 8A7 7 0 111 8a7 7 0 0114 0zm-6 3.5a1 1 0 11-2 0 1 1 0 012 0zM7.293 5.293a1 1 0 011.414 0L8 5.586V4.5a.5.5 0 011 0v1.086l.293-.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      <span className="calc-tooltip invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-harbinger-900 text-white text-xs rounded-lg shadow-lg whitespace-pre-line max-w-xs z-50 pointer-events-none">
        {formula}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-harbinger-900" />
      </span>
    </span>
  );
}

export function ProgressBar({ value, max, color = 'blue', label, showPct = true }) {
  const pctVal = max > 0 ? Math.min(value / max, 1) : 0;
  const colors = { blue: 'bg-blue-500', green: 'bg-emerald-500', gold: 'bg-amber-500', red: 'bg-red-500', purple: 'bg-purple-500', teal: 'bg-teal-500' };
  return (
    <div>
      {label && <div className="flex justify-between text-xs mb-1"><span className="text-gray-600 font-medium">{label}</span>{showPct && <span className="text-gray-500">{(pctVal * 100).toFixed(0)}%</span>}</div>}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${colors[color] || colors.blue}`} style={{ width: `${pctVal * 100}%` }} />
      </div>
    </div>
  );
}
