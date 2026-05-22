import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';
import { Shield, AlertOctagon } from 'lucide-react';
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

  const hasRejection = risk && risk.last_reject_reason && 
                       risk.last_reject_reason !== 'NONE' && 
                       risk.last_reject_reason !== '' &&
                       risk.last_reject_reason.toLowerCase() !== 'no rejection';
  const isSafe = !hasRejection;

  const getRejectBadgeStyles = (reason: string) => {
    if (!reason || reason === 'NONE' || reason === '' || reason.toLowerCase() === 'no rejection' || reason === 'SYSTEM_PASS') {
      return 'text-primary border-primary/20 bg-primary/5';
    }
    const upper = reason.toUpperCase();
    if (upper.includes('SPREAD_TOO_LOW')) {
      return 'text-yellow-500 border-yellow-500/25 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.1)]';
    }
    if (upper.includes('MAX_EXPOSURE')) {
      return 'text-red-500 border-red-500/25 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
    }
    if (upper.includes('MAX_OPEN_TRADES')) {
      return 'text-orange-500 border-orange-500/25 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.15)]';
    }
    return 'text-yellow-500 border-yellow-500/25 bg-yellow-500/10';
  };

  const currentExposure = risk?.current_exposure ?? 0;
  const openTrades = risk?.open_trades ?? 0;
  const dailyPnl = risk?.daily_pnl ?? 0;
  const rejectReason = risk?.last_reject_reason || 'SYSTEM_PASS';

  // Highlight risk spikes visually if exposure is large
  const isExposureSpiked = currentExposure > 100;

  return (
    <div className="border border-border bg-black/40 rounded-lg p-4 font-mono text-xs flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-bold text-white uppercase tracking-wider">REALTIME_RISK_STATUS</span>
        </div>
        <span className={cn(
          "px-1.5 py-0.5 rounded font-bold text-[9px] border tracking-wider",
          isSafe 
            ? "border-primary/30 text-primary bg-primary/5" 
            : "border-red-500/30 text-red-500 bg-red-500/5 animate-pulse"
        )}>
          {isSafe ? "SYSTEM_SAFE" : "RISK_WARN"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] uppercase tracking-widest animate-pulse">
          CONNECTING_TELEMETRY...
        </div>
      ) : (
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {/* Exposure telemetry */}
          <div className="space-y-1 bg-black/20 p-2.5 border border-border/30 rounded relative">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground tracking-wider uppercase">
              <span>Current Exposure</span>
              {isExposureSpiked && (
                <span className="text-red-500 text-[8px] animate-ping font-bold">● SPIKE_WARN</span>
              )}
            </div>
            
            <div className={cn(
              "p-2 rounded font-bold text-lg text-white flex justify-between items-center transition-all duration-300 relative overflow-hidden",
              shouldPulse && "animate-pulse-cyan",
              isExposureSpiked && "border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
            )}>
              <span className={cn("neon-text font-bold text-white tracking-tight", isExposureSpiked && "text-red-400 text-shadow-red")}>
                ${currentExposure.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">USDT</span>
              </span>
              <span className="text-[10px] text-muted-foreground/50">LTM_RISK</span>
            </div>

            {/* Custom bar matching active exposure */}
            <div className="w-full bg-border/40 h-1.5 rounded overflow-hidden mt-1">
              <div 
                className={cn(
                  "h-full transition-all duration-500 ease-out", 
                  isExposureSpiked ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-primary shadow-[0_0_8px_#5eead4]"
                )}
                style={{ width: `${Math.min((currentExposure / 150) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Two Columns for Open Trades & Daily PnL */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 p-2 border border-border/30 rounded flex flex-col justify-center">
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Open Trades</div>
              <div className="text-sm font-bold text-white mt-0.5 tracking-tight">{openTrades}</div>
            </div>
            <div className="bg-black/20 p-2 border border-border/30 rounded flex flex-col justify-center">
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Daily PnL</div>
              <div className={cn("text-sm font-bold mt-0.5 tracking-tight", dailyPnl >= 0 ? "text-primary neon-text" : "text-red-500")}>
                {dailyPnl >= 0 ? '+' : ''}${dailyPnl.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Rejection telemetry */}
          <div className="space-y-1 border-t border-border/20 pt-2.5 mt-auto">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Last Reject Reason</div>
            <div className={cn(
              "w-full px-2 py-1.5 rounded border text-[10px] font-bold text-center uppercase tracking-widest terminal-badge justify-center flex items-center gap-1.5",
              getRejectBadgeStyles(rejectReason)
            )}>
              {!isSafe && <AlertOctagon className="w-3.5 h-3.5 shrink-0" />}
              {rejectReason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
