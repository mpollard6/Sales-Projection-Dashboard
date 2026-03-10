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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = localStorage.getItem('harbinger_user');
    const r = localStorage.getItem('harbinger_role');
    if (!u) { router.push('/'); return; }
    setUser(u); setRole(r);
  }, [router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const logout = () => { localStorage.removeItem('harbinger_user'); localStorage.removeItem('harbinger_role'); router.push('/'); };
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-harbinger-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );

  const isAdmin = role === 'admin';
  const nav = isAdmin ? NAV_ADMIN : NAV_REP;
  const sidebarWidth = collapsed ? 'w-20' : 'w-64';
  const mainMargin = collapsed ? 'lg:ml-20' : 'lg:ml-64';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${sidebarWidth} bg-harbinger-900 text-white flex flex-col flex-shrink-0 fixed h-full z-50 sidebar-transition
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-harbinger-700 flex items-center justify-between">
          <div className={collapsed ? 'hidden' : ''}>
            <h1 className="text-lg font-bold tracking-tight">Harbinger</h1>
            <p className="text-sm text-blue-300 mt-1">{isAdmin ? '🔑 Admin View' : user}</p>
          </div>
          {collapsed && <span className="text-xl font-bold mx-auto">H</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-harbinger-700 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${collapsed ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {nav.map(n => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`nav-link flex items-center gap-3 px-6 py-3 text-sm
                  ${active ? 'bg-harbinger-700 text-white font-semibold nav-link-active' : 'text-gray-300 hover:bg-harbinger-800 hover:text-white'}
                  ${collapsed ? 'justify-center px-3' : ''}`}
                title={collapsed ? n.label : undefined}>
                <span className="text-lg">{n.icon}</span>
                {!collapsed && <span>{n.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className={`p-4 border-t border-harbinger-700 ${collapsed ? 'text-center' : ''}`}>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white" title="Sign Out">
            {collapsed ? '🚪' : 'Sign Out'}
          </button>
        </div>
      </aside>

      <main className={`flex-1 ${mainMargin} min-h-screen`}>
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-harbinger-900">Harbinger</h1>
          <span className="ml-auto text-xs text-gray-500">{isAdmin ? 'Admin' : user?.split(' ')[0]}</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
