import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, TrendingUp, Play, Square, Zap, BarChart2 } from 'lucide-react';
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
  <div className={cn('animate-pulse bg-muted rounded-md', className)} />
);

export default function Dashboard() {
  const { isConnected } = useWebSocket();
  const { sessionStatus, tradingLoading, setTradingLoading, startSession, stopSession, tickDuration } = useSessionStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => tickDuration(), 1000);
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

  const isPending = tradingLoading || startMutation.isPending || stopMutation.isPending;

  const totalBalance = portfolio?.balances
    ? Object.values(portfolio.balances).reduce((acc, exchange) =>
        acc + Object.values(exchange ?? {}).reduce((s, b) => s + b, 0), 0)
    : 0;

  const totalProfit = portfolio?.total_profit_usdt ?? portfolio?.summary?.total_profit_usdt ?? 0;
  const totalTrades = portfolio?.total_trades ?? portfolio?.summary?.total_trades ?? 0;
  const balanceParts = totalBalance.toFixed(2).split('.');

  return (
    <div className="space-y-5 pb-6">

      {/* ── TOP STATS ROW ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Balance */}
        <div className="bg-surface border border-border shadow-card rounded-xl p-5 relative overflow-hidden col-span-1 sm:col-span-2">
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full opacity-[0.04] bg-primary pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Total Portfolio Balance
              </p>
              {isLoadingPortfolio ? (
                <Skeleton className="h-9 w-40 mb-1" />
              ) : (
                <h2 className="text-3xl font-bold text-foreground tracking-tight">
                  ${Number(balanceParts[0]).toLocaleString()}
                  <span className="text-xl text-muted-foreground">.{balanceParts[1]}</span>
                  <span className="text-sm text-muted-foreground font-normal ml-1.5">USDT</span>
                </h2>
              )}
              <div className="flex items-center gap-1.5 mt-1.5 text-emerald-600 text-xs font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {isLoadingPortfolio ? '…' : `+$${totalProfit.toFixed(2)} Est. PnL`}
              </div>
            </div>
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50   text-rose-700   border-rose-200'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
              {isConnected ? 'Feed Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Stat: Total Trades */}
        <div className="bg-surface border border-border shadow-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Trades</p>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-primary" />
            </div>
          </div>
          {isLoadingPortfolio
            ? <Skeleton className="h-7 w-16" />
            : <p className="text-2xl font-bold text-foreground">{totalTrades}</p>}
          <p className="text-[11px] text-muted-foreground mt-1">Executed arbitrage cycles</p>
        </div>

        {/* Stat: Efficiency */}
        <div className="bg-surface border border-border shadow-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Efficiency</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">99.87%</p>
          <p className="text-[11px] text-muted-foreground mt-1">Uptime this session</p>
        </div>
      </div>

      {/* ── ENGINE CONTROL PANEL ────────────────────────────────────── */}
      <div className="bg-surface border border-border shadow-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-muted-foreground" />
            <span className={cn(
              'absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface',
              sessionStatus === 'ACTIVE'                                     ? 'bg-emerald-500 animate-pulse' :
              sessionStatus === 'STARTING' || sessionStatus === 'STOPPING'  ? 'bg-amber-400 animate-pulse' :
              'bg-rose-500'
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold text-foreground">Trading Engine</p>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                sessionStatus === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-muted-foreground border-border'
              )}>
                {sessionStatus === 'ACTIVE' ? 'Live Execution' : 'Standby'}
              </span>
            </div>
            <p className={cn(
              'text-xs font-semibold',
              sessionStatus === 'ACTIVE'                                    ? 'text-emerald-600' :
              sessionStatus === 'STARTING' || sessionStatus === 'STOPPING' ? 'text-amber-600'  :
              'text-muted-foreground'
            )}>
              {sessionStatus === 'ACTIVE'
                ? 'Trading Active — Scanning for opportunities'
                : `Stopped (${sessionStatus})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => { if (window.confirm('Initialize paper trading engine?')) startMutation.mutate(); }}
            disabled={isPending || sessionStatus === 'ACTIVE'}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200',
              sessionStatus === 'ACTIVE'
                ? 'bg-muted text-muted-foreground border-border cursor-not-allowed'
                : 'bg-primary text-white border-primary hover:bg-primary/90 shadow-sm cursor-pointer'
            )}
          >
            <Play className="w-4 h-4" />
            Start Trading
          </button>
          <button
            onClick={() => { if (window.confirm('Stop trading engine?')) stopMutation.mutate(); }}
            disabled={isPending || sessionStatus === 'INACTIVE'}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200',
              sessionStatus === 'INACTIVE'
                ? 'bg-muted text-muted-foreground border-border cursor-not-allowed'
                : 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600 shadow-sm cursor-pointer'
            )}
          >
            <Square className="w-4 h-4" />
            Stop Trading
          </button>
        </div>
      </div>

      {/* ── CHARTS + METRICS GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Charts */}
        <div className="lg:col-span-3 space-y-4">
          <div className="h-[220px]">
            <OpportunitiesChart />
          </div>
          <div className="h-[240px]">
            <TradeStream />
          </div>
        </div>

        {/* Right: Risk + Exchange */}
        <div className="space-y-4 lg:col-span-1">
          <div className="h-[220px]">
            <RiskStatus />
          </div>
          <div className="h-[268px]">
            <ExchangeHealth />
          </div>
        </div>
      </div>

    </div>
  );
}
