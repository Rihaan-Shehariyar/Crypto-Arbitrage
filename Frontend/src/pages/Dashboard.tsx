import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Zap, Play, Square, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPortfolio, startTrading, stopTrading } from '@/services/endpoints';
import { useWebSocket } from '@/contexts/WebSocketContext';
import ExchangeHealth from '@/components/dashboard/ExchangeHealth';
import RiskStatus from '@/components/dashboard/RiskStatus';
import TradeStream from '@/components/dashboard/TradeStream';
import OpportunitiesChart from '@/components/dashboard/OpportunitiesChart';
import { useSessionStore } from '@/store/useSessionStore';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { PortfolioResponse } from '@/types/api';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-surface/80 rounded-md", className)} />
);

export default function Dashboard() {
  const { isConnected } = useWebSocket();
  const { sessionStatus, tradingLoading, setTradingLoading, startSession, stopSession, tickDuration } = useSessionStore();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const interval = setInterval(() => {
      tickDuration();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickDuration]);

  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery<PortfolioResponse>({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
  });

  const startMutation = useMutation({
    mutationFn: startTrading,
    onMutate: () => setTradingLoading(true, 'STARTING'),
    onSuccess: () => {
      startSession();
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success('Paper trading engine initialized.');
    },
    onError: () => {
      setTradingLoading(false, 'INACTIVE');
      toast.error('Failed to start trading engine.');
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
      toast.success('Paper trading engine stopped.');
    },
    onError: () => {
      setTradingLoading(false, 'ACTIVE');
      toast.error('Failed to stop trading engine.');
    }
  });

  const handleStartTrading = () => {
    if (window.confirm("CONFIRM SYSTEM ACTION: Initialize active trading execution engine?")) {
      startMutation.mutate();
    }
  };

  const handleStopTrading = () => {
    if (window.confirm("CONFIRM SYSTEM ACTION: Shut down active trading execution engine?")) {
      stopMutation.mutate();
    }
  };

  const isPending = tradingLoading || startMutation.isPending || stopMutation.isPending;

  const formatBalance = (val: number) => {
    const parts = val.toFixed(2).split('.');
    return {
      whole: Number(parts[0]).toLocaleString(),
      decimal: '.' + parts[1]
    };
  };

  const totalBalance = portfolio?.balances ? Object.values(portfolio.balances).reduce((acc, exchange) => {
    return acc + Object.values(exchange ?? {}).reduce((sum, bal) => sum + bal, 0);
  }, 0) : 0;

  const { whole, decimal } = formatBalance(totalBalance);
  const totalProfit = portfolio?.total_profit_usdt ?? portfolio?.summary?.total_profit_usdt ?? 0;
  const totalTrades = portfolio?.total_trades ?? portfolio?.summary?.total_trades ?? 0;

  return (
    <div className="space-y-4 pb-4 font-mono">
      {/* Top Banner: Wallet & PnL Summary */}
      <div className="border border-border bg-black/40 rounded-lg p-4 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Zap className="w-32 h-32 text-primary" />
        </div>
        
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">WALLET_CAPITAL_ALLOCATION</span>
            <span className={cn(
              "px-1 py-0.5 rounded text-[8px] border font-bold",
              isConnected ? "border-primary/30 text-primary bg-primary/5" : "border-red-500/30 text-red-500 bg-red-500/5"
            )}>
              {isConnected ? "FEED_ONLINE" : "FEED_OFFLINE"}
            </span>
          </div>
          {isLoadingPortfolio ? (
            <Skeleton className="h-10 w-48 mb-1" />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight text-white">
              ${whole}<span className="text-muted-foreground text-xl">{decimal}</span>
              <span className="text-xs text-muted-foreground ml-2 font-normal">USDT</span>
            </h1>
          )}
          <div className="flex items-center text-primary font-medium text-xs mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
            <span>
              {isLoadingPortfolio ? '...' : `+$${totalProfit.toFixed(2)} Today (Est. PnL)`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 z-10 text-xs">
          <div className="flex flex-col bg-black/20 p-2 border border-border/40 rounded min-w-[100px]">
            <span className="text-[9px] text-muted-foreground">TOTAL_TRADES</span>
            <span className="text-white font-bold text-sm mt-0.5">
              {isLoadingPortfolio ? '...' : totalTrades}
            </span>
          </div>
          
          <div className="flex flex-col bg-black/20 p-2 border border-border/40 rounded min-w-[100px]">
            <span className="text-[9px] text-muted-foreground">SYSTEM_EFFICIENCY</span>
            <span className="text-primary font-bold text-sm mt-0.5">99.87%</span>
          </div>

          <div className="flex flex-col bg-black/20 p-2 border border-border/40 rounded min-w-[100px]">
            <span className="text-[9px] text-muted-foreground">LATENCY_SENSITIVITY</span>
            <span className="text-white font-bold text-sm mt-0.5">&lt; 15ms</span>
          </div>
        </div>
      </div>

      {/* Trading Engine Console Panel */}
      <div className="border border-border bg-[#090909] rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-y-0 right-0 w-64 bg-[linear-gradient(to_left,#111_1px,transparent_1px)] bg-[size:1rem_1rem] pointer-events-none opacity-30" />
        
        <div className="flex items-center gap-3.5 z-10 w-full sm:w-auto">
          <div className="w-9 h-9 rounded bg-[#111] border border-border/60 flex items-center justify-center relative shrink-0">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <span className={cn(
              "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black",
              sessionStatus === 'ACTIVE'
                ? "bg-primary animate-pulse"
                : sessionStatus === 'STARTING' || sessionStatus === 'STOPPING'
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
            )} />
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">TRADING EXECUTOR ENGINE</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-bold border",
                sessionStatus === 'ACTIVE'
                  ? "border-primary/20 text-primary bg-primary/5"
                  : "border-red-500/20 text-red-500 bg-red-500/5"
              )}>
                {sessionStatus === 'ACTIVE' ? "LIVE_PARTICIPATION" : "OFFLINE_STANDBY"}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-xs text-muted-foreground uppercase">STATUS:</span>
              <span className={cn(
                "text-xs uppercase tracking-wider font-black",
                sessionStatus === 'ACTIVE' 
                  ? "text-primary shadow-[0_0_10px_rgba(94,234,212,0.2)]" 
                  : sessionStatus === 'STARTING' || sessionStatus === 'STOPPING'
                  ? "text-yellow-500"
                  : "text-muted-foreground"
              )}>
                {sessionStatus === 'ACTIVE' ? 'TRADING ACTIVE' : `TRADING STOPPED (${sessionStatus === 'INACTIVE' ? 'STOPPED' : sessionStatus})`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto z-10 shrink-0">
          <button
            onClick={handleStartTrading}
            disabled={isPending || sessionStatus === 'ACTIVE'}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border flex items-center justify-center gap-1.5",
              sessionStatus === 'ACTIVE'
                ? "bg-primary/5 border-primary/20 text-primary/30 cursor-not-allowed"
                : "bg-primary text-black border-primary hover:bg-primary/95 hover:shadow-[0_0_15px_rgba(94,234,212,0.25)]"
            )}
          >
            <Play className="w-3.5 h-3.5 shrink-0" />
            START TRADING
          </button>
          
          <button
            onClick={handleStopTrading}
            disabled={isPending || sessionStatus === 'INACTIVE'}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border flex items-center justify-center gap-1.5",
              sessionStatus === 'INACTIVE'
                ? "bg-black/40 border-[#222] text-[#444] cursor-not-allowed"
                : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
            )}
          >
            <Square className="w-3.5 h-3.5 shrink-0" />
            STOP TRADING
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 relative">
        {/* Left Side: Realtime Charts & Live logs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="h-[240px]">
            <OpportunitiesChart />
          </div>
          <div className="h-[250px]">
            <TradeStream />
          </div>
        </div>

        {/* Right Side: Risk & Exchange Metrics */}
        <div className="space-y-4 lg:col-span-1">
          <div className="h-[240px]">
            <RiskStatus />
          </div>
          <div className="h-[280px]">
            <ExchangeHealth />
          </div>
        </div>
      </div>
    </div>
  );
}
