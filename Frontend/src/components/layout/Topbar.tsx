import { Bell, Search, Play, Square } from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startTrading, stopTrading } from '@/services/endpoints';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function Topbar() {
  const queryClient = useQueryClient();
  const { sessionStatus, tradingEnabled, tradingLoading, setTradingLoading, startSession, stopSession } = useSessionStore();

  const startMutation = useMutation({
    mutationFn: startTrading,
    onMutate: () => setTradingLoading(true, 'STARTING'),
    onSuccess: () => {
      startSession();
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success('Paper trading session enabled');
    },
    onError: () => {
      setTradingLoading(false, 'INACTIVE');
      toast.error('Failed to start trading session');
    }
  });

  const stopMutation = useMutation({
    mutationFn: stopTrading,
    onMutate: () => setTradingLoading(true, 'STOPPING'),
    onSuccess: () => {
      stopSession();
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success('Paper trading session stopped');
    },
    onError: () => {
      setTradingLoading(false, 'ACTIVE');
      toast.error('Failed to stop trading session');
    }
  });

  const isLoading = tradingLoading || startMutation.isPending || stopMutation.isPending;

  const statusConfig = {
    ACTIVE:   { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Active',   pulse: true  },
    INACTIVE: { dot: 'bg-rose-500',    text: 'text-rose-600',    label: 'Stopped',  pulse: false },
    STARTING: { dot: 'bg-amber-400',   text: 'text-amber-600',   label: 'Starting', pulse: true  },
    STOPPING: { dot: 'bg-orange-400',  text: 'text-orange-600',  label: 'Stopping', pulse: true  },
  };
  const cfg = statusConfig[sessionStatus] ?? statusConfig.INACTIVE;

  return (
    <header className="h-[60px] px-6 border-b border-border flex items-center justify-between bg-surface shadow-sm sticky top-0 z-10 shrink-0">

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pairs, exchanges..."
            className="w-full bg-background border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 ml-4">

        {/* Engine status pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-medium">
          <div className={cn('w-2 h-2 rounded-full shrink-0', cfg.dot, cfg.pulse && 'animate-pulse')} />
          <span className="text-muted-foreground">Engine:</span>
          <span className={cn('font-semibold', cfg.text)}>{cfg.label}</span>
        </div>

        {/* Start / Stop buttons */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden bg-surface h-9 shadow-sm">
          <button
            onClick={() => {
              if (window.confirm('Enable paper trading session?')) startMutation.mutate();
            }}
            disabled={isLoading || tradingEnabled}
            className={cn(
              'px-3 h-full flex items-center gap-1.5 border-r border-border text-xs font-semibold transition-colors',
              tradingEnabled
                ? 'bg-muted/60 text-muted-foreground/50 cursor-not-allowed'
                : 'hover:bg-emerald-50 text-muted-foreground hover:text-emerald-700'
            )}
          >
            <Play className={cn('w-3.5 h-3.5', tradingEnabled ? 'text-muted-foreground/40' : 'text-emerald-500')} />
            Start
          </button>

          <button
            onClick={() => {
              if (window.confirm('Stop trading session?')) stopMutation.mutate();
            }}
            disabled={isLoading || !tradingEnabled}
            className={cn(
              'px-3 h-full flex items-center gap-1.5 text-xs font-semibold transition-colors',
              !tradingEnabled
                ? 'bg-muted/60 text-muted-foreground/50 cursor-not-allowed'
                : 'hover:bg-rose-50 text-muted-foreground hover:text-rose-600'
            )}
          >
            <Square className={cn('w-3.5 h-3.5', !tradingEnabled ? 'text-muted-foreground/40' : 'text-rose-500')} />
            Stop
          </button>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted border border-border transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
