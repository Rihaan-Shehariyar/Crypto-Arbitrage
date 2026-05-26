import React, { useEffect } from 'react';
import { Topbar } from './Topbar';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Radar,
  LogOut,
  User,
} from 'lucide-react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { cn } from '@/lib/utils';

import { useAuthStore } from '@/store/useAuthStore';

import { toast } from 'sonner';

import { stopTrading } from '@/services/endpoints';

import { useSessionStore } from '@/store/useSessionStore';

export function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const location = useLocation();

  const navigate = useNavigate();

  const token =
    useAuthStore(
      (state) => state.token,
    );

  const logout =
    useAuthStore(
      (state) => state.logout,
    );

  const {
    tradingEnabled,
    stopSession,
    resetSessionMetrics,
  } = useSessionStore();

  const isActive = (
    path: string,
  ) => location.pathname === path;

  // -----------------------------------
  // TAB / BROWSER CLOSE PROTECTION
  // -----------------------------------

  useEffect(() => {

    if (!token || !tradingEnabled)
      return;

    const handleUnload = () => {

      navigator.sendBeacon(
        `http://127.0.0.1:8080/trading/stop?token=${token}`,
      );
    };

    window.addEventListener(
      'pagehide',
      handleUnload,
    );

    return () => {

      window.removeEventListener(
        'pagehide',
        handleUnload,
      );
    };

  }, [token, tradingEnabled]);

  // -----------------------------------
  // HEARTBEAT SYSTEM
  // -----------------------------------

  useEffect(() => {

    if (!token)
      return;

    const interval =
      window.setInterval(
        async () => {

          try {

            // -----------------------------------
            // GET LIVE STATE
            // -----------------------------------

            const active =
              useSessionStore
                .getState()
                .tradingEnabled;

            if (!active)
              return;

            // -----------------------------------
            // SEND HEARTBEAT
            // -----------------------------------

            await fetch(
              'http://127.0.0.1:8080/heartbeat',
              {
                method: 'POST',

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

            console.log(
              'heartbeat sent',
            );

          } catch (err) {

            console.error(
              'heartbeat failed',
              err,
            );
          }

        },

        2000,
      );

    return () => {

      clearInterval(interval);

      console.log(
        'heartbeat cleanup',
      );
    };

  }, [token]);

  // -----------------------------------
  // LOGOUT
  // -----------------------------------

  const handleLogout =
    async () => {

      const loadingToast =
        toast.loading(
          'Terminating active trading execution...',
        );

      try {

        await stopTrading();

        toast.success(
          'Trading stopped. Secure session terminated.',
        );

      } catch (err) {

        console.error(
          'Failed to stop trading during logout:',
          err,
        );

        toast.warning(
          'Trading shutdown signal sent. Terminating session.',
        );

      } finally {

        toast.dismiss(
          loadingToast,
        );

        stopSession();

        resetSessionMetrics();

        logout();

        navigate('/');
      }
    };

  return (

    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">

      {/* ----------------------------------- */}
      {/* SIDEBAR */}
      {/* ----------------------------------- */}

      <aside className="w-20 border-r border-border bg-surface flex flex-col items-center py-6 z-10">

        {/* APP STATUS */}

        <Link
          to="/"
          className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(94,234,212,0.2)]"
        >
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
        </Link>

        {/* NAVIGATION */}

        <nav className="flex-1 flex flex-col gap-4 mt-4">

          <Link
            to="/dashboard"
            className={cn(
              'p-3 rounded-xl transition-all duration-300 group',

              isActive('/dashboard')
                ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(94,234,212,0.15)]'
                : 'text-muted-foreground hover:bg-surface hover:text-white',
            )}
            title="Dashboard"
          >
            <LayoutDashboard className="w-6 h-6" />
          </Link>

          <Link
            to="/opportunities"
            className={cn(
              'p-3 rounded-xl transition-all duration-300 group',

              isActive('/opportunities')
                ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(94,234,212,0.15)]'
                : 'text-muted-foreground hover:bg-surface hover:text-white',
            )}
            title="Opportunities"
          >
            <Radar className="w-6 h-6" />
          </Link>

          <Link
            to="/portfolio"
            className={cn(
              'p-3 rounded-xl transition-all duration-300 group',

              isActive('/portfolio')
                ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(94,234,212,0.15)]'
                : 'text-muted-foreground hover:bg-surface hover:text-white',
            )}
            title="Portfolio"
          >
            <Wallet className="w-6 h-6" />
          </Link>

          <Link
            to="/transactions"
            className={cn(
              'p-3 rounded-xl transition-all duration-300 group',

              isActive('/transactions')
                ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(94,234,212,0.15)]'
                : 'text-muted-foreground hover:bg-surface hover:text-white',
            )}
            title="Transactions"
          >
            <ArrowLeftRight className="w-6 h-6" />
          </Link>

          <Link
            to="/profile"
            className={cn(
              'p-3 rounded-xl transition-all duration-300 group',

              isActive('/profile')
                ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(94,234,212,0.15)]'
                : 'text-muted-foreground hover:bg-surface hover:text-white',
            )}
            title="Profile"
          >
            <User className="w-6 h-6" />
          </Link>

        </nav>

        {/* LOGOUT */}

        <div className="mt-auto">

          <button
            onClick={handleLogout}
            className="p-3 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 group"
            title="Terminate Session"
          >
            <LogOut className="w-6 h-6" />
          </button>

        </div>

      </aside>

      {/* ----------------------------------- */}
      {/* MAIN */}
      {/* ----------------------------------- */}

      <div className="flex flex-col flex-1 min-w-0">

        <Topbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">

          {children}

        </main>

      </div>

    </div>
  );
}