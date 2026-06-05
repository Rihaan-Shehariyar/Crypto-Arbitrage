import React, { useEffect, useState } from 'react';
import { Topbar } from './Topbar';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Radar,
  LogOut,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { API_URL } from '@/config/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { stopTrading } from '@/services/endpoints';
import { useSessionStore } from '@/store/useSessionStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
  { icon: Radar,           label: 'Scanner',       path: '/opportunities' },
  { icon: Wallet,          label: 'Portfolio',     path: '/portfolio' },
  { icon: ArrowLeftRight,  label: 'Transactions',  path: '/transactions' },
  { icon: User,            label: 'Profile',       path: '/profile' },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const token  = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const { tradingEnabled, stopSession, resetSessionMetrics } = useSessionStore();

  const isActive = (path: string) => location.pathname === path;

  // ── TAB / BROWSER CLOSE PROTECTION ──────────────────────────────────
  useEffect(() => {
    if (!token || !tradingEnabled) return;
    const handleUnload = () => {
      navigator.sendBeacon(`${API_URL}/trading/stop?token=${token}`);
    };
    window.addEventListener('pagehide', handleUnload);
    return () => window.removeEventListener('pagehide', handleUnload);
  }, [token, tradingEnabled]);

  // ── HEARTBEAT ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const interval = window.setInterval(async () => {
      try {
        const active = useSessionStore.getState().tradingEnabled;
        if (!active) return;
        await fetch(`${API_URL}/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('heartbeat failed', err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [token]);

  // ── LOGOUT ───────────────────────────────────────────────────────────
  const handleLogout = async () => {
    const t = toast.loading('Terminating active trading execution...');
    try {
      await stopTrading();
      toast.success('Trading stopped. Session terminated.');
    } catch {
      toast.warning('Trading shutdown signal sent.');
    } finally {
      toast.dismiss(t);
      stopSession();
      resetSessionMetrics();
      logout();
      navigate('/');
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">

      {/* ─── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col shrink-0 h-full transition-all duration-300 z-20',
          'shadow-sidebar',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
        style={{ background: '#143b63' }}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 border-b px-4 shrink-0',
          'border-white/10',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: 'rgba(244,166,34,0.2)' }}>
              <Activity className="w-4 h-4" style={{ color: '#f4a622' }} />
            </div>
            {!collapsed && (
              <span className="font-bold text-base text-white tracking-tight truncate">
                Arbitra
              </span>
            )}
          </Link>
          {/* Collapse toggle – only visible on md+ */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex w-6 h-6 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg transition-all duration-150 select-none',
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                  active
                    ? 'text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white font-medium'
                )}
                style={active ? { background: '#f4a622' } : undefined}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="shrink-0 px-2.5 pb-4 pt-2 border-t border-white/10 space-y-2">
          <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
              'hover:bg-white/10 cursor-pointer',
              collapsed && 'justify-center px-2',
            )}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                 style={{ background: 'linear-gradient(135deg, #f4a622, #3b82f6)' }}>
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">My Profile</p>
                <p className="text-[10px] truncate" style={{ color: '#f4a622' }}>View Details</p>
              </div>
            )}
          </Link>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
              'text-slate-400 hover:bg-red-500/15 hover:text-red-400',
              collapsed && 'justify-center px-2',
            )}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {children}
        </main>
      </div>

    </div>
  );
}