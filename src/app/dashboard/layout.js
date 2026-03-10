'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/dashboard', label: 'My Pipeline', icon: '📊' },
  { href: '/dashboard/scoreboard', label: 'Scoreboard', icon: '🏆' },
  { href: '/dashboard/predictions', label: 'Prediction Tracker', icon: '📈' },
  { href: '/dashboard/actuals', label: 'Predicted vs Actual', icon: '🎯' },
  { href: '/dashboard/commission', label: 'Commission Forecast', icon: '💰' },
];

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = localStorage.getItem('harbinger_user');
    if (!u) { router.push('/'); return; }
    setUser(u);
  }, [router]);

  const logout = () => { localStorage.removeItem('harbinger_user'); router.push('/'); };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-harbinger-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-harbinger-700">
          <h1 className="text-lg font-bold">Harbinger</h1>
          <p className="text-sm text-blue-300 mt-1">{user}</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(n => {
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
      <main className="flex-1 p-8 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
