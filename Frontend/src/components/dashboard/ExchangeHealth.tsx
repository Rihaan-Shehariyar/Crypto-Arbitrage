import { useMetricsStore } from '@/store/useMetricsStore';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExchangeHealth() {
  const exchangeHealth = useMetricsStore(state => state.exchangeHealth);

  const defaultExchanges = ['binance', 'coinbase', 'kraken'];

  return (
    <div className="border border-border bg-black/40 rounded-lg p-4 font-mono text-xs flex flex-col h-full">
      <div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
        <Cpu className="w-4 h-4 text-primary" />
        <span className="font-bold text-white uppercase tracking-wider">EXCHANGE_HEALTH_MONITOR</span>
      </div>

      <div className="space-y-2.5 flex-1">
        {defaultExchanges.map((name) => {
          const health = exchangeHealth[name.toLowerCase()];
          const status = health?.status || 'ONLINE';
          const latency = health?.latency_ms || 42; // default placeholder until websocket updates
          const lastUpdate = health?.lastUpdate ? new Date(health.lastUpdate).toLocaleTimeString() : 'LIVE';

          const isOnline = status === 'ONLINE';
          const isDegraded = status === 'DEGRADED';

          return (
            <div key={name} className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase">{name}</span>
                <span className={cn(
                  "px-1 py-0.5 text-[9px] rounded font-bold tracking-tight scale-90 border",
                  isOnline 
                    ? "border-primary/30 text-primary bg-primary/5" 
                    : isDegraded 
                    ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5" 
                    : "border-red-500/30 text-red-500 bg-red-500/5"
                )}>
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-bold",
                  latency < 60 ? "text-primary" : latency < 150 ? "text-yellow-500" : "text-red-500"
                )}>
                  {latency}ms
                </span>
                <span className="text-[10px] text-muted-foreground/60">{lastUpdate}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
