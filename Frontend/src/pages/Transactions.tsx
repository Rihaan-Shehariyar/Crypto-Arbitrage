import { useQuery } from '@tanstack/react-query';
import { getTrades } from '@/services/endpoints';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Clock } from 'lucide-react';

export default function Transactions() {
  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: getTrades,
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const p = (n: number, s = 2) => n.toString().padStart(s, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  return (
    <div className="space-y-5 pb-10 flex flex-col h-full">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Execution History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Full log of executed arbitrage trades</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
          <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          Live Feed
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface border border-border shadow-card rounded-xl flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted border-b border-border sticky top-0 z-10 select-none">
              <tr>
                {['Timestamp', 'Status', 'Symbol', 'Route', 'Latency', 'Profit (USDT)', 'Profit (%)'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground text-sm animate-pulse">
                    Loading trade history…
                  </td>
                </tr>
              ) : trades && trades.length > 0 ? (
                trades.map(tx => {
                  const isClosed = tx.status === 'CLOSED';
                  return (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs whitespace-nowrap">
                        {tx.created_at ? formatTime(tx.created_at) : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                          isClosed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50   text-rose-700   border-rose-200'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', isClosed ? 'bg-emerald-500' : 'bg-rose-500')} />
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-foreground tracking-wide">{tx.symbol}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-semibold text-foreground">{tx.buy_exchange}</span>
                          <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="font-semibold text-foreground">{tx.sell_exchange}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{tx.latency_ms}ms</td>
                      <td className={cn(
                        'px-5 py-3.5 text-right font-bold font-mono',
                        tx.profit_usdt > 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {tx.profit_usdt > 0 ? '+' : ''}{tx.profit_usdt.toFixed(4)}
                      </td>
                      <td className={cn(
                        'px-5 py-3.5 text-right font-bold font-mono',
                        tx.profit_percent > 0 ? 'text-emerald-600' : 'text-rose-600'
                      )}>
                        {tx.profit_percent > 0 ? '+' : ''}{tx.profit_percent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No execution history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
