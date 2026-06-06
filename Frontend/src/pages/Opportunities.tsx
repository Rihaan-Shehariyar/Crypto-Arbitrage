import { useRef, useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Radar, ArrowRight, SlidersHorizontal, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/types/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useMetricsStore } from '@/store/useMetricsStore';

export default function Opportunities() {
  const queryClient  = useQueryClient();
  const { isConnected } = useWebSocket();
  const opsPerSecond   = useMetricsStore(s => s.opsPerSecond);
  const totalReceived  = useMetricsStore(s => s.totalOpportunitiesReceived);

  const [spreadFilter, setSpreadFilter] = useState<number>(0);
  const [search, setSearch]             = useState('');
  const [, setTick]                     = useState(0);

  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => [],
    staleTime: Infinity,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
      queryClient.setQueryData(['opportunities'], (old: Opportunity[] = []) => {
        const now  = Date.now();
        const fresh = old.filter(opp => {
          const t   = opp.timestamp ? new Date(opp.timestamp).getTime() : 0;
          const age = t > 0 ? now - t : Infinity;
          return age < 10000;
        });
        return fresh.length === old.length ? old : fresh;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [queryClient]);

  const filteredData = useMemo(() =>
    opportunities.filter(o =>
      o.spread_percent >= spreadFilter &&
      o.symbol.toLowerCase().includes(search.toLowerCase())
    ),
  [opportunities, spreadFilter, search]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count:           filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize:    () => 40,
    overscan:        10,
  });

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 pb-4">

      {/* ── Header Card ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-border shadow-card rounded-xl p-4 flex flex-col xl:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Radar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Arbitrage Scanner</h1>
            <p className="text-xs text-muted-foreground font-medium">
              High-frequency multi-exchange opportunity feed
            </p>
          </div>
        </div>

        {/* Metrics + Filters */}
        <div className="flex flex-wrap items-center gap-3">

          {/* WS status */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold',
            isConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50   border-rose-200   text-rose-700'
          )}>
            <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
            {isConnected ? 'Connected' : 'Reconnecting'}
          </div>

          {/* Throughput */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-muted-foreground">
            <span className="text-foreground font-bold">{opsPerSecond} opp/s</span>
            <div className="w-px h-3 bg-border" />
            <span>Total: <span className="text-foreground font-bold">{totalReceived}</span></span>
          </div>

          {/* Spread filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Spread ≥</span>
            <span className="text-primary font-bold w-10 text-center">{spreadFilter.toFixed(2)}%</span>
            <input
              type="range" min="0" max="3" step="0.05"
              value={spreadFilter}
              onChange={e => setSpreadFilter(parseFloat(e.target.value))}
              className="w-20 accent-primary cursor-pointer"
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter symbol…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all w-36"
            />
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border shadow-card rounded-xl flex-1 flex flex-col overflow-hidden">

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 text-left bg-muted border-b border-border py-3 px-5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none pr-7 shrink-0">
          <div className="col-span-2">Symbol</div>
          <div className="col-span-3 text-center">Arbitrage Route</div>
          <div className="col-span-2 text-right">Spread</div>
          <div className="col-span-2 text-right">Est. Profit</div>
          <div className="col-span-1 text-right">Buy</div>
          <div className="col-span-1 text-right">Sell</div>
          <div className="col-span-1 text-right">Latency</div>
        </div>

        {/* Virtualized Rows */}
        <div ref={parentRef} className="flex-1 overflow-y-auto relative">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const opp = filteredData[virtualRow.index];
              if (!opp) return null;

              const oppTime  = opp.timestamp ? new Date(opp.timestamp).getTime() : 0;
              const now      = Date.now();
              const ageMs    = oppTime > 0 ? now - oppTime : Infinity;
              const isNew    = ageMs < 1200;
              const isStale  = ageMs > 5000;

              return (
                <div
                  key={`${opp.timestamp}-${opp.symbol}-${opp.buy_exchange}-${virtualRow.index}`}
                  className={cn(
                    'absolute top-0 left-0 w-full grid grid-cols-12 gap-2 px-5 items-center border-b border-border/50 text-xs text-foreground transition-colors hover:bg-muted/30',
                    isNew   && 'animate-flash-green',
                    isStale && 'opacity-50 hover:opacity-100'
                  )}
                  style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                >
                  {/* Symbol */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{opp.symbol}</span>
                    {isStale && (
                      <span className="text-[9px] px-1 py-0.5 rounded border border-amber-200 text-amber-700 bg-amber-50 font-semibold">
                        STALE
                      </span>
                    )}
                  </div>

                  {/* Route */}
                  <div className="col-span-3 flex items-center justify-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground uppercase font-medium">{opp.buy_exchange}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                    <span className="text-foreground font-semibold uppercase">{opp.sell_exchange}</span>
                  </div>

                  {/* Spread */}
                  <div className={cn(
                    'col-span-2 text-right font-bold',
                    (opp.spread_percent ?? 0) > 1.0 ? 'text-emerald-600' : 'text-foreground'
                  )}>
                    {(opp.spread_percent ?? 0).toFixed(2)}%
                  </div>

                  {/* Profit */}
                  <div className="col-span-2 text-right text-emerald-600 font-bold">
                    +${(opp.estimated_profit ?? 0).toFixed(2)}
                  </div>

                  {/* Buy price */}
                  <div className="col-span-1 text-right text-muted-foreground font-medium">
                    ${(opp.buy_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>

                  {/* Sell price */}
                  <div className="col-span-1 text-right text-muted-foreground font-medium">
                    ${(opp.sell_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>

                  {/* Latency */}
                  <div className="col-span-1 text-right">
                    <span className={cn(
                      'inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold',
                      (opp.latency_ms ?? 0) < 50
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : (opp.latency_ms ?? 0) < 150
                        ? 'bg-amber-50   text-amber-700   border-amber-200'
                        : 'bg-rose-50    text-rose-700    border-rose-200'
                    )}>
                      {opp.latency_ms ?? 0}ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredData.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="w-7 h-7 opacity-30 animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-sm font-medium">Scanning for arbitrage opportunities…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
