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
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Admin session ended. Secure logout complete.');
    navigate('/admin/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Activity, label: 'System Health', path: '/admin/system' },
  ];

  // Derive page title
  const getPageTitle = () => {
    const currentPath = location.pathname;
    if (currentPath === '/admin/dashboard') return 'Overview Dashboard';
    if (currentPath === '/admin/users') return 'User Accounts';
    if (currentPath.startsWith('/admin/users/')) return 'User Details Profile';
    if (currentPath === '/admin/system') return 'System Health Diagnostics';
    return 'Admin Control Center';
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground antialiased">
      
      {/* ----------------------------------- */}
      {/* SIDEBAR: DESKTOP */}
      {/* ----------------------------------- */}
      <aside className="hidden md:flex md:w-64 border-r border-border bg-surface flex-col z-10 shrink-0">
        
        {/* LOGO AREA */}
        <div className="h-16 flex items-center px-6 border-b border-border/60">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <ShieldCheck className="text-primary w-5 h-5 shadow-[0_0_10px_rgba(94,234,212,0.3)] animate-pulse" />
          </div>
          <div className="ml-3">
            <span className="font-bold text-lg tracking-tight text-white block">Arbitra Admin</span>
            <span className="text-[9px] text-primary/80 font-mono tracking-widest uppercase block -mt-1">Control Panel</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-3 rounded-lg transition-all duration-200 group font-mono text-xs tracking-wide",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(94,234,212,0.1)]" 
                    : "text-muted-foreground hover:bg-muted/40 hover:text-white border border-transparent"
                )
              }
            >
              <item.icon className="w-4 h-4 mr-3 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* LOGGED IN USER PROFILE SUMMARY */}
        <div className="p-4 border-t border-border/60 bg-black/20">
          <div className="flex items-center p-2 rounded-lg bg-muted/40 border border-border/40 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 shrink-0 flex items-center justify-center border border-border">
              <UserCheck className="w-4 h-4 text-black" />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{adminUser?.name || 'Admin User'}</p>
              <p className="text-[9px] font-mono text-primary uppercase tracking-wider truncate">{adminUser?.role || 'Super Admin'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* ----------------------------------- */}
      {/* MOBILE DRAWER */}
      {/* ----------------------------------- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-64 bg-surface h-full border-r border-border flex flex-col p-4 animate-slide-right">
            
            {/* MOBILE LOGO */}
            <div className="flex items-center justify-between pb-6 border-b border-border/60">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <ShieldCheck className="text-primary w-5 h-5 animate-pulse" />
                </div>
                <span className="ml-3 font-bold text-md text-white block">Arbitra Control</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MOBILE NAVIGATION */}
            <nav className="flex-1 py-6 space-y-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-4 py-3 rounded-lg transition-all font-mono text-xs",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "text-muted-foreground hover:bg-muted/40 hover:text-white"
                    )
                  }
                >
                  <item.icon className="w-4 h-4 mr-3 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* MOBILE PROFILE INFO */}
            <div className="pt-4 border-t border-border/60">
              <div className="flex items-center p-2 rounded-lg bg-muted/40 border border-border/40 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 shrink-0 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-black" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-semibold text-white truncate">{adminUser?.name || 'Admin User'}</p>
                  <p className="text-[9px] font-mono text-primary uppercase tracking-wider">{adminUser?.role || 'Super Admin'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* ----------------------------------- */}
      {/* MAIN CONTAINER */}
      {/* ----------------------------------- */}
      <div className="flex flex-col flex-1 min-w-0">
        
        {/* TOP NAVBAR */}
        <header className="h-16 border-b border-border bg-surface/40 backdrop-blur-md flex items-center justify-between px-6 z-9 shrink-0">
          
          <div className="flex items-center">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 mr-2 rounded-md text-muted-foreground hover:text-white hover:bg-muted/40 md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Info */}
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-mono font-medium tracking-wide uppercase">Arbitra Platform Control</span>
              <span className="text-sm font-semibold text-white -mt-0.5 leading-tight">{getPageTitle()}</span>
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#090909]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;
