'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_REP = [
  { href: '/dashboard', label: 'My Pipeline', icon: '📊' },
  { href: '/dashboard/scoreboard', label: 'Scoreboard', icon: '🏆' },
  { href: '/dashboard/predictions', label: 'Prediction Tracker', icon: '📈' },
  { href: '/dashboard/actuals', label: 'Predicted vs Actual', icon: '🎯' },
  { href: '/dashboard/commission', label: 'Commission Forecast', icon: '💰' },
];
const NAV_ADMIN = [
  { href: '/dashboard', label: 'Full Pipeline', icon: '📊' },
  { href: '/dashboard/scoreboard', label: 'Rep Scoreboard', icon: '🏆' },
  { href: '/dashboard/admin', label: 'Rep Deep Dive', icon: '🔍' },
  { href: '/dashboard/predictions', label: 'Prediction Tracker', icon: '📈' },
  { href: '/dashboard/actuals', label: 'Predicted vs Actual', icon: '🎯' },
  { href: '/dashboard/commission', label: 'Commission Modeling', icon: '💰' },
];

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = localStorage.getItem('harbinger_user');
    const r = localStorage.getItem('harbinger_role');
    if (!u) { router.push('/'); return; }
    setUser(u); setRole(r);
  }, [router]);

  const logout = () => { localStorage.removeItem('harbinger_user'); localStorage.removeItem('harbinger_role'); router.push('/'); };
  if (!user) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;

  const isAdmin = role === 'admin';
  const nav = isAdmin ? NAV_ADMIN : NAV_REP;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-harbinger-900 text-white flex flex-col flex-shrink-0 fixed h-full">
        <div className="p-6 border-b border-harbinger-700">
          <h1 className="text-lg font-bold">Harbinger</h1>
          <p className="text-sm text-blue-300 mt-1">{isAdmin ? '🔑 Admin View' : user}</p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {nav.map(n => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${active ? 'bg-harbinger-700 text-white font-semibold' : 'text-gray-300 hover:bg-harbinger-800 hover:text-white'}`}>
                <span>{n.icon}</span>{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-harbinger-700">
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white transition-colors">Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8 overflow-auto bg-gray-50 min-h-screen">{children}</main>
    </div>
  );
}
