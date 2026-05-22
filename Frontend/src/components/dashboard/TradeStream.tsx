import { useEffect, useRef } from 'react';
import { useMetricsStore } from '@/store/useMetricsStore';
import { Terminal, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TradeStream() {
  const tradeStream = useMetricsStore(state => state.tradeStream);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0; // Scroll to top since we prepend new trades
    }
  }, [tradeStream]);

  return (
    <div className="border border-border bg-black/40 rounded-lg p-4 font-mono text-xs flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-border pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-bold text-white uppercase tracking-wider">TRADE_EXECUTION_STREAM</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <Circle className="w-1.5 h-1.5 text-primary fill-primary animate-pulse" />
          <span>LISTENING</span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-[11px]"
        style={{ maxHeight: '200px' }}
      >
        {tradeStream.map((trade) => {
          const isSuccess = trade.status === 'CLOSED';
          const timeStr = trade.created_at && !isNaN(new Date(trade.created_at).getTime())
            ? new Date(trade.created_at).toLocaleTimeString()
            : 'N/A';

          return (
            <div 
              key={trade.id} 
              className={cn(
                "p-1.5 rounded border border-border/20 bg-black/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-1 hover:border-border/40 transition-colors animate-flash-green"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground/60">[{timeStr}]</span>
                <span className={cn(
                  "font-bold px-1 rounded text-[9px] scale-90 border",
                  isSuccess 
                    ? "border-primary/30 text-primary bg-primary/5" 
                    : "border-red-500/30 text-red-500 bg-red-500/5"
                )}>
                  {trade.status}
                </span>
                <span className="font-bold text-white">{trade.symbol}</span>
                <span className="text-muted-foreground/80 uppercase">
                  {trade.buy_exchange} → {trade.sell_exchange}
                </span>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto">
                <span className="text-muted-foreground/60">PROFIT:</span>
                <span className={cn("font-bold", isSuccess ? "text-primary" : "text-red-500")}>
                  {isSuccess ? '+' : ''}${trade.profit_usdt.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}

        {tradeStream.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-8 text-muted-foreground">
            <span className="animate-pulse">AWAITING_EXECUTION_EVENTS...</span>
          </div>
        )}
      </div>
    </div>
  );
}
