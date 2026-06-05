import { useMetricsStore } from '@/store/useMetricsStore';
import { Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExchangeHealth() {
  const exchangeHealth = useMetricsStore(state => state.exchangeHealth);
  const defaultExchanges = ['binance', 'coinbase', 'kraken'];

  return (
    <div className="bg-surface border border-border shadow-card rounded-xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wifi className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">Exchange Health</span>
        </div>
        <span className="badge-success text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {defaultExchanges.map((name) => {
          const health    = exchangeHealth[name.toLowerCase()];
          const status    = health?.status || 'ONLINE';
          const latency   = health?.latency_ms || 42;
          const isOnline  = status === 'ONLINE';
          const isDegraded = status === 'DEGRADED';

          return (
            <div key={name} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  isOnline   ? 'bg-emerald-500' :
                  isDegraded ? 'bg-amber-400'   : 'bg-rose-500'
                )} />
                <span className="text-sm font-semibold text-foreground capitalize truncate">{name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className={cn(
                  'text-xs font-bold',
                  latency < 60   ? 'text-emerald-600' :
                  latency < 150  ? 'text-amber-600'   : 'text-rose-600'
                )}>
                  {latency}ms
                </span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isDegraded
                    ? 'bg-amber-50  text-amber-700  border-amber-200'
                    : 'bg-rose-50   text-rose-700   border-rose-200'
                )}>
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
