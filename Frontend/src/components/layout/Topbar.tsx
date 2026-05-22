import { Bell, Search, Terminal, Play, Square } from 'lucide-react';
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

  return (
    <header className="h-20 px-6 border-b border-border flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search pairs, exchanges..." 
            className="w-full bg-surface border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-white placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6 ml-4">
        {/* Session Status Widget */}
        <div className="flex items-center space-x-3 px-4 py-1.5 rounded bg-black/40 border border-border font-mono text-xs">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground uppercase tracking-widest">Engine:</span>
          {sessionStatus === 'ACTIVE' && (
            <span className="flex items-center text-primary font-bold shadow-[0_0_10px_rgba(94,234,212,0.2)]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
              ACTIVE
            </span>
          )}
          {sessionStatus === 'INACTIVE' && (
            <span className="flex items-center text-red-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              STOPPED
            </span>
          )}
          {sessionStatus === 'STARTING' && (
            <span className="flex items-center text-yellow-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2" />
              STARTING
            </span>
          )}
          {sessionStatus === 'STOPPING' && (
            <span className="flex items-center text-orange-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse mr-2" />
              STOPPING
            </span>
          )}
        </div>

        {/* Start/Stop Trading Buttons */}
        <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden h-9">
          <button
            onClick={() => {
              if (window.confirm("Enable paper trading session?")) {
                startMutation.mutate();
              }
            }}
            disabled={isLoading || tradingEnabled}
            className={cn(
              "px-3 h-full flex items-center justify-center transition-all duration-300 border-r border-border text-xs font-bold uppercase tracking-wider",
              tradingEnabled 
                ? "bg-primary/10 text-primary/50 cursor-not-allowed" 
                : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
            )}
          >
            <Play className={cn("w-3.5 h-3.5 mr-1.5", tradingEnabled ? "text-primary/50" : "text-primary")} />
            Start
          </button>
          
          <button
            onClick={() => {
              if (window.confirm("Confirm shutdown?")) {
                stopMutation.mutate();
              }
            }}
            disabled={isLoading || !tradingEnabled}
            className={cn(
              "px-3 h-full flex items-center justify-center transition-all duration-300 text-xs font-bold uppercase tracking-wider",
              !tradingEnabled 
                ? "bg-red-500/10 text-red-500/50 cursor-not-allowed" 
                : "hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
            )}
          >
            <Square className={cn("w-3.5 h-3.5 mr-1.5", !tradingEnabled ? "text-red-500/50" : "text-red-500")} />
            Stop
          </button>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-surface border border-border">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">Live Data</span>
        </div>
        
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface transition-colors relative text-muted-foreground hover:text-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
