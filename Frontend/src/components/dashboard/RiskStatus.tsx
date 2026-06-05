import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskMetrics } from '@/types/api';
import { getRiskMetrics } from '@/services/endpoints';

export default function RiskStatus() {
  const { data: risk, isLoading } = useQuery<RiskMetrics>({
    queryKey: ['risk'],
    queryFn: getRiskMetrics,
    staleTime: Infinity,
  });

  const prevExposureRef = useRef<number>(0);
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (risk && risk.current_exposure !== undefined) {
      if (risk.current_exposure !== prevExposureRef.current) {
        setShouldPulse(true);
        const timer = setTimeout(() => setShouldPulse(false), 500);
        prevExposureRef.current = risk.current_exposure;
        return () => clearTimeout(timer);
      }
    }
  }, [risk?.current_exposure]);

  const hasRejection = risk &&
    risk.last_reject_reason &&
    risk.last_reject_reason !== 'NONE' &&
    risk.last_reject_reason !== '' &&
    risk.last_reject_reason.toLowerCase() !== 'no rejection';
  const isSafe = !hasRejection;

  const rejectStyles = (reason: string) => {
    if (!reason || reason === 'NONE' || reason === '' || reason.toLowerCase() === 'no rejection' || reason === 'SYSTEM_PASS')
      return 'text-emerald-700 border-emerald-200 bg-emerald-50';
    const u = reason.toUpperCase();
    if (u.includes('SPREAD_TOO_LOW'))  return 'text-amber-700 border-amber-200 bg-amber-50';
    if (u.includes('MAX_EXPOSURE'))    return 'text-rose-700  border-rose-200  bg-rose-50';
    if (u.includes('MAX_OPEN_TRADES')) return 'text-orange-700 border-orange-200 bg-orange-50';
    return 'text-amber-700 border-amber-200 bg-amber-50';
  };

  const currentExposure = risk?.current_exposure ?? 0;
  const openTrades      = risk?.open_trades ?? 0;
  const dailyPnl        = risk?.daily_pnl ?? 0;
  const rejectReason    = risk?.last_reject_reason || 'SYSTEM_PASS';
  const isExposureSpiked = currentExposure > 100;
  const exposurePct = Math.min((currentExposure / 150) * 100, 100);

  return (
    <div className="bg-surface border border-border shadow-card rounded-xl p-4 flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">Risk Monitor</span>
        </div>
        <span className={cn(
          'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
          isSafe
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50   text-rose-700   border-rose-200 animate-pulse'
        )}>
          {isSafe ? 'All Clear' : 'Risk Alert'}
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs animate-pulse">
          Loading risk data…
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3">

          {/* Exposure */}
          <div className={cn(
            'p-3 rounded-lg border',
            isExposureSpiked ? 'bg-rose-50 border-rose-200' : 'bg-background border-border'
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                Current Exposure
              </span>
              {isExposureSpiked && (
                <div className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  High
                </div>
              )}
            </div>
            <p className={cn(
              'text-xl font-bold tracking-tight',
              isExposureSpiked ? 'text-rose-600' : 'text-foreground'
            )}>
              ${currentExposure.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground ml-1">USDT</span>
            </p>
            <div className="w-full bg-border h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isExposureSpiked ? 'bg-rose-500' : 'bg-primary'
                )}
                style={{ width: `${exposurePct}%` }}
              />
            </div>
          </div>

          {/* Open Trades & Daily PnL */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-background border border-border">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Open Trades</p>
              <p className="text-lg font-bold text-foreground">{openTrades}</p>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Daily PnL</p>
              <p className={cn(
                'text-lg font-bold',
                dailyPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {dailyPnl >= 0 ? '+' : ''}${dailyPnl.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Last rejection */}
          <div className="mt-auto pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">Last Rejection</p>
            <div className={cn(
              'w-full px-2.5 py-1.5 rounded-lg border text-[10px] font-bold text-center uppercase tracking-wider',
              rejectStyles(rejectReason)
            )}>
              {rejectReason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
