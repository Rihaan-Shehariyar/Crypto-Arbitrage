import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/admin/dashboard' },
  { icon: Users,           label: 'Users',          path: '/admin/users'     },
  { icon: Activity,        label: 'System Health',  path: '/admin/system'    },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminUser = useAuthStore((s) => s.user);
  const logout    = useAuthStore((s) => s.logout);
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Admin session ended.');
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/admin/dashboard')          return 'Overview Dashboard';
    if (p === '/admin/users')              return 'User Accounts';
    if (p.startsWith('/admin/users/'))     return 'User Details';
    if (p === '/admin/system')             return 'System Health';
    return 'Admin Panel';
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center px-5 shrink-0',
        mobile ? 'justify-between' : '',
        'border-b border-white/10'
      )}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'rgba(244,166,34,0.2)' }}>
            <ShieldCheck className="w-4 h-4" style={{ color: '#f4a622' }} />
          </div>
          <div>
            <span className="font-bold text-sm text-white block leading-tight">Arbitra Admin</span>
            <span className="text-[10px] font-medium tracking-widest uppercase block" style={{ color: '#f4a622' }}>
              Control Panel
            </span>
          </div>
        </div>
        {mobile && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )
            }
            style={({ isActive }) => isActive ? { background: '#f4a622' } : undefined}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer: User + Logout */}
      <div className="shrink-0 p-3 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
               style={{ background: 'linear-gradient(135deg, #f4a622, #3b82f6)' }}>
            <UserCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{adminUser?.name || 'Admin User'}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider truncate" style={{ color: '#f4a622' }}>
              {adminUser?.role || 'Super Admin'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground antialiased">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden md:flex md:w-64 flex-col shrink-0 h-full z-10"
        style={{ background: '#143b63' }}
      >
        <SidebarContent />
      </aside>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="relative w-64 flex flex-col h-full z-10 shadow-2xl"
            style={{ background: '#143b63' }}
          >
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* ── MAIN CONTAINER ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-[60px] border-b border-border bg-surface flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted md:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Arbitra Platform
              </p>
              <p className="text-sm font-semibold text-foreground -mt-0.5 leading-snug">
                {getPageTitle()}
              </p>
            </div>
          </div>

          {/* Admin badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
            <ChevronDown className="w-3 h-3 opacity-60" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

export default AdminLayout;
