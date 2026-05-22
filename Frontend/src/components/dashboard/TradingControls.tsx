import { useState } from 'react';
import { Play, Square, Activity, Clock, BarChart3, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { startTrading, stopTrading } from '@/services/endpoints';
import { useSessionStore } from '@/store/useSessionStore';

export default function TradingControls() {
  const queryClient = useQueryClient();
  const { 
    tradingEnabled, 
    tradingLoading, 
    setTradingLoading, 
    startSession, 
    stopSession,
    activeSessionDurationSec,
    sessionTrades,
    sessionPnl
  } = useSessionStore();

  const [showConfirmModal, setShowConfirmModal] = useState<'START' | 'STOP' | null>(null);

  const startMutation = useMutation({
    mutationFn: startTrading,
    onMutate: () => {
      setTradingLoading(true, 'STARTING');
    },
    onSuccess: () => {
      startSession();
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success('Paper trading session enabled');
      setShowConfirmModal(null);
    },
    onError: () => {
      setTradingLoading(false, 'INACTIVE');
      toast.error('Failed to start trading session');
    }
  });

  const stopMutation = useMutation({
    mutationFn: stopTrading,
    onMutate: () => {
      setTradingLoading(true, 'STOPPING');
    },
    onSuccess: () => {
      stopSession();
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success('Paper trading session stopped');
      setShowConfirmModal(null);
    },
    onError: () => {
      setTradingLoading(false, 'ACTIVE');
      toast.error('Failed to stop trading session');
    }
  });

  const handleStart = () => {
    setShowConfirmModal('START');
  };

  const handleStop = () => {
    setShowConfirmModal('STOP');
  };

  const confirmAction = () => {
    if (showConfirmModal === 'START') {
      startMutation.mutate();
    } else if (showConfirmModal === 'STOP') {
      stopMutation.mutate();
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLoading = tradingLoading || startMutation.isPending || stopMutation.isPending;

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-lg overflow-hidden">
      <div className="p-3 border-b border-border bg-black/40 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
          <Activity className="w-4 h-4 mr-2 text-primary" />
          Trading Engine
        </h3>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        
        {/* Session Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-black/30 p-3 rounded border border-border/50">
            <div className="flex items-center text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">
              <Clock className="w-3 h-3 mr-1" /> Duration
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {formatDuration(activeSessionDurationSec)}
            </div>
          </div>
          <div className="bg-black/30 p-3 rounded border border-border/50">
            <div className="flex items-center text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">
              <BarChart3 className="w-3 h-3 mr-1" /> Session Trades
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {sessionTrades}
            </div>
          </div>
          <div className="bg-black/30 p-3 rounded border border-border/50 col-span-2">
            <div className="flex items-center text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">
              <Activity className="w-3 h-3 mr-1" /> Session PnL
            </div>
            <div className={cn("font-mono text-xl font-bold", sessionPnl >= 0 ? "text-primary" : "text-red-500")}>
              {sessionPnl >= 0 ? '+' : ''}${sessionPnl.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={handleStart}
            disabled={isLoading || tradingEnabled}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 relative overflow-hidden group",
              tradingEnabled 
                ? "bg-primary/10 border-primary/30 text-primary/50 cursor-not-allowed" 
                : "bg-surface border-border hover:border-primary/50 hover:bg-primary/5 text-white"
            )}
          >
            {tradingEnabled && (
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            )}
            <Play className={cn("w-6 h-6 mb-2", tradingEnabled ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
            <span className="text-xs font-bold uppercase tracking-wider">Start Trading</span>
          </button>
          
          <button
            onClick={handleStop}
            disabled={isLoading || !tradingEnabled}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 relative overflow-hidden group",
              !tradingEnabled 
                ? "bg-red-500/10 border-red-500/30 text-red-500/50 cursor-not-allowed" 
                : "bg-surface border-border hover:border-red-500/50 hover:bg-red-500/10 text-white"
            )}
          >
            {!tradingEnabled && (
              <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            )}
            <Square className={cn("w-6 h-6 mb-2", !tradingEnabled ? "text-red-500" : "text-muted-foreground group-hover:text-red-500")} />
            <span className="text-xs font-bold uppercase tracking-wider">Stop Trading</span>
          </button>
        </div>

      </div>

      {/* Confirmation Modal overlay */}
      {showConfirmModal && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center text-orange-500 mb-4">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h4 className="text-lg font-bold">Confirm Action</h4>
            </div>
            <p className="text-muted-foreground mb-6">
              {showConfirmModal === 'START' 
                ? "Enable paper trading session? The execution engine will begin matching arbitrage opportunities with your portfolio."
                : "Confirm shutdown? The execution engine will immediately stop scheduling your portfolio for new opportunities."}
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 rounded bg-surface border border-border text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction}
                className={cn(
                  "px-4 py-2 rounded text-background font-bold transition-colors text-sm",
                  showConfirmModal === 'START' ? "bg-primary hover:bg-primary/90" : "bg-red-500 hover:bg-red-600"
                )}
              >
                {showConfirmModal === 'START' ? 'Start Trading' : 'Stop Trading'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
