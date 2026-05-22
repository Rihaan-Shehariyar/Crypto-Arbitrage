import { useQuery } from '@tanstack/react-query';
import { getTrades } from '@/services/endpoints';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

export default function Transactions() {
  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: getTrades,
  });

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Execution Feed</h1>
          <p className="text-muted-foreground mt-1">Realtime institutional trade history</p>
        </div>
        <div className="flex items-center text-primary text-sm font-medium bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
          <Clock className="w-4 h-4 mr-2 animate-pulse" />
          Live Sink Connected
        </div>
      </div>

      <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-surface/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Symbol</th>
                <th className="px-6 py-4 font-medium">Route (Buy → Sell)</th>
                <th className="px-6 py-4 font-medium">Latency</th>
                <th className="px-6 py-4 font-medium text-right">Profit USDT</th>
                <th className="px-6 py-4 font-medium text-right">Profit %</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground animate-pulse">
                    Loading execution feed...
                  </td>
                </tr>
              ) : trades && trades.length > 0 ? (
                trades.map((tx) => {
                  const formatLocalTime = (dateStr: string) => {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return 'N/A';
                    const pad = (num: number, size = 2) => num.toString().padStart(size, '0');
                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
                  };

                  return (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors group">
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap font-mono text-xs">
                        {tx.created_at ? formatLocalTime(tx.created_at) : 'N/A'}
                      </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={cn("w-2 h-2 rounded-full mr-2", tx.status === 'CLOSED' ? 'bg-primary shadow-[0_0_8px_#5EEAD4]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]')} />
                        <span className="capitalize text-white text-xs font-bold">{tx.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white tracking-wide">{tx.symbol}</td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">
                      <span className="text-white">{tx.buy_exchange}</span> <span className="text-muted-foreground mx-1">→</span> <span className="text-white">{tx.sell_exchange}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{tx.latency_ms}ms</td>
                    <td className={cn("px-6 py-4 text-right font-bold font-mono", tx.profit_usdt > 0 ? 'text-primary' : 'text-red-400')}>
                      {tx.profit_usdt > 0 ? '+' : ''}{tx.profit_usdt.toFixed(4)}
                    </td>
                    <td className={cn("px-6 py-4 text-right font-bold font-mono", tx.profit_percent > 0 ? 'text-primary' : 'text-red-400')}>
                      {tx.profit_percent > 0 ? '+' : ''}{tx.profit_percent.toFixed(2)}%
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
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
