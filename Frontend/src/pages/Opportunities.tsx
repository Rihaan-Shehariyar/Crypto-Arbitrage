import { useRef, useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Radar, ArrowRight, SlidersHorizontal, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/types/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useMetricsStore } from '@/store/useMetricsStore';

export default function Opportunities() {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();
  const opsPerSecond = useMetricsStore(state => state.opsPerSecond);
  const totalReceived = useMetricsStore(state => state.totalOpportunitiesReceived);
  
  const [spreadFilter, setSpreadFilter] = useState<number>(0);
  const [search, setSearch] = useState('');
  
  // Tick to trigger age and TTL updates every 1s
  const [, setTick] = useState(0);

  // Subscribe to React Query cache for opportunities
  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => [], // Cache only, populated via WS in WebSocketContext
    staleTime: Infinity,
  });

  // TTL & Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);

      // Clean up stale opportunities older than 10 seconds (10000ms)
      queryClient.setQueryData(['opportunities'], (old: Opportunity[] = []) => {
        const now = Date.now();
        const fresh = old.filter(opp => {
          const oppTime = opp.timestamp ? new Date(opp.timestamp).getTime() : 0;
          const age = oppTime > 0 ? now - oppTime : Infinity;
          return age < 10000;
        });
        // Only trigger cache updates if anything was filtered out
        return fresh.length === old.length ? old : fresh;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [queryClient]);

  const filteredData = useMemo(() => {
    return opportunities.filter(opp => 
      opp.spread_percent >= spreadFilter &&
      opp.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }, [opportunities, spreadFilter, search]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // ultra compact rows (32px)
    overscan: 10,
  });

  return (
    <div className="space-y-4 pb-4 h-[calc(100vh-2rem)] flex flex-col font-mono selection:bg-primary/20">
      {/* Header Panel */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-surface border border-border p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
              <Radar className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                ARBITRA_SCANNER_v1.0.4
              </h1>
              <p className="text-[11px] text-muted-foreground">High-frequency multi-exchange arbitrage execution feed</p>
            </div>
          </div>
        </div>

        {/* Real-time WebSocket & Throughput Stats */}
        <div className="flex flex-wrap items-center gap-6 text-[11px]">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 rounded border border-border">
            <span className="text-muted-foreground">FEED:</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-primary animate-pulse" : "bg-red-500 animate-ping")} />
              <span className={cn("font-bold", isConnected ? "text-primary" : "text-red-500")}>
                {isConnected ? "CONNECTED" : "RECONNECTING"}
              </span>
            </div>
          </div>

          {/* Throughput metrics */}
          <div className="flex items-center gap-4 px-2.5 py-1 bg-black/40 rounded border border-border">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">THROUGHPUT:</span>
              <span className="text-white font-bold">{opsPerSecond} opp/s</span>
            </div>
            <div className="w-px h-3 bg-border"></div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">TOTAL:</span>
              <span className="text-white font-bold">{totalReceived}</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 px-3 py-1 bg-black/40 border border-border rounded">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">SPREAD &gt;=</span>
              <span className="text-primary font-bold">{spreadFilter.toFixed(2)}%</span>
              <input 
                type="range" 
                min="0" 
                max="3" 
                step="0.05" 
                value={spreadFilter}
                onChange={(e) => setSpreadFilter(parseFloat(e.target.value))}
                className="w-20 accent-primary cursor-pointer"
              />
            </div>
            <div className="w-px h-3 bg-border"></div>
            <input
              type="text"
              placeholder="FILTER SYMBOL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-white text-[11px] w-24 placeholder:text-muted-foreground font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Terminal Table */}
      <div className="border border-border bg-black/40 rounded-lg flex-1 flex flex-col overflow-hidden relative">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 text-left terminal-header select-none z-10 pr-6">
          <div className="col-span-2">SYMBOL</div>
          <div className="col-span-3 text-center">ARBITRAGE CORRIDOR</div>
          <div className="col-span-1.5 text-right">SPREAD</div>
          <div className="col-span-1.5 text-right">EST. PROFIT</div>
          <div className="col-span-1.5 text-right">BUY PRICE</div>
          <div className="col-span-1.5 text-right">SELL PRICE</div>
          <div className="col-span-1 text-right">LATENCY</div>
        </div>

        {/* Virtualized Body */}
        <div 
          ref={parentRef}
          className="flex-1 overflow-y-auto custom-scrollbar relative bg-black/10"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const opp = filteredData[virtualRow.index];
              if (!opp) return null;

              const oppTime = opp.timestamp ? new Date(opp.timestamp).getTime() : 0;
              const now = Date.now();
              const ageMs = oppTime > 0 ? now - oppTime : Infinity;
              const ageSec = ageMs !== Infinity ? (ageMs / 1000).toFixed(1) : 'N/A';
              
              // Custom flags
              const isNew = ageMs < 1200; // Trigger flash only for rows under 1.2s old
              const isStale = ageMs > 5000; // Stale after 5s

              return (
                <div
                  key={`${opp.timestamp}-${opp.symbol}-${opp.buy_exchange}-${opp.sell_exchange}-${virtualRow.index}`}
                  className={cn(
                    "absolute top-0 left-0 w-full grid grid-cols-12 gap-2 px-4 items-center terminal-row h-8",
                    isNew && "animate-flash-green",
                    isStale && "opacity-45 hover:opacity-100"
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* Symbol */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="font-bold text-white tracking-wide">{opp.symbol}</span>
                    {isStale && (
                      <span className="text-[9px] px-1 border border-yellow-500/40 text-yellow-500 bg-yellow-500/5 rounded font-mono scale-90 origin-left">
                        STALE
                      </span>
                    )}
                  </div>

                  {/* Corridor */}
                  <div className="col-span-3 flex items-center justify-center text-[11px]">
                    <span className="text-muted-foreground uppercase">{opp.buy_exchange}</span>
                    <ArrowRight className="w-3 h-3 mx-2 text-border shrink-0" />
                    <span className="text-white uppercase">{opp.sell_exchange}</span>
                  </div>

                  {/* Spread */}
                  <div className={cn("col-span-1.5 text-right font-bold", (opp.spread_percent ?? 0) > 1.0 ? "text-primary text-shadow-sm" : "text-white")}>
                    {(opp.spread_percent ?? 0).toFixed(2)}%
                  </div>

                  {/* Profit */}
                  <div className="col-span-1.5 text-right text-primary font-bold">
                    +${(opp.estimated_profit ?? 0).toFixed(2)}
                  </div>

                  {/* Prices */}
                  <div className="col-span-1.5 text-right text-muted-foreground">
                    ${(opp.buy_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>
                  <div className="col-span-1.5 text-right text-muted-foreground">
                    ${(opp.sell_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>

                  {/* Latency / Stale Age */}
                  <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
                    <span className={cn(
                      "terminal-badge",
                      (opp.latency_ms ?? 0) < 50 
                        ? "border-primary/30 text-primary bg-primary/5" 
                        : (opp.latency_ms ?? 0) < 150 
                        ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5" 
                        : "border-red-500/30 text-red-500 bg-red-500/5"
                    )}>
                      {opp.latency_ms ?? 0}ms
                    </span>
                    <span className="text-muted-foreground/60 text-[9px] w-8">
                      {ageSec}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredData.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-black/20">
              <Cpu className="w-8 h-8 mb-2 opacity-35 animate-spin" style={{ animationDuration: '4s' }} />
              <div className="text-[11px] font-bold tracking-widest text-primary animate-pulse">LISTENING_FOR_FEED...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

