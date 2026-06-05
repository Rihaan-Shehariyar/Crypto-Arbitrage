import { useEffect, useRef, useState } from 'react';
import { useMetricsStore } from '@/store/useMetricsStore';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TradeStream() {
  const tradeStream  = useMetricsStore(state => state.tradeStream);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [tradeStream]);

  return (
    <div className="bg-surface border border-border shadow-card rounded-xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">Live Trade Stream</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Listening
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-0.5"
        style={{ maxHeight: '190px' }}
      >
        {tradeStream.map((trade) => {
          const isSuccess = trade.status === 'CLOSED';
          const timeStr   = trade.created_at && !isNaN(new Date(trade.created_at).getTime())
            ? new Date(trade.created_at).toLocaleTimeString()
            : 'N/A';

          return (
            <div
              key={trade.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors animate-flash-green gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
                )} />
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">{timeStr}</span>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0',
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50   text-rose-700   border-rose-200'
                )}>
                  {trade.status}
                </span>
                <span className="text-xs font-bold text-foreground truncate">{trade.symbol}</span>
                <span className="text-[11px] text-muted-foreground uppercase hidden sm:block truncate">
                  {trade.buy_exchange} → {trade.sell_exchange}
                </span>
              </div>
              <span className={cn(
                'text-xs font-bold shrink-0',
                isSuccess ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {isSuccess ? '+' : ''}${trade.profit_usdt.toFixed(2)}
              </span>
            </div>
          );
        })}

        {tradeStream.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-xs">
            <Activity className="w-6 h-6 mb-2 opacity-30" />
            <span className="animate-pulse">Awaiting execution events…</span>
          </div>
        )}
      </div>
    </div>
  );
}
