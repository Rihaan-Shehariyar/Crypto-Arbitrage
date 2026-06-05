import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Opportunity } from '@/types/api';
import { TrendingUp } from 'lucide-react';

export default function OpportunitiesChart() {
  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => [],
    staleTime: Infinity,
  });

  const chartData = useMemo(() => {
    const items = [...opportunities].slice(0, 20).reverse();
    return items.map((opp, idx) => ({
      name: `${idx + 1}`,
      spread: parseFloat((opp.spread_percent ?? 0).toFixed(2)),
      profit: parseFloat((opp.estimated_profit ?? 0).toFixed(2)),
      symbol: opp.symbol,
    }));
  }, [opportunities]);

  return (
    <div className="bg-surface border border-border shadow-card rounded-xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold text-foreground uppercase tracking-wide">Opportunity Analytics</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Spread %</span>
      </div>

      <div className="flex-1 min-h-0 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="spreadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f4a622" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f4a622" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor:     '#e5e7eb',
                  borderRadius:    '8px',
                  fontSize:        '11px',
                  boxShadow:       '0 4px 12px rgba(0,0,0,0.08)',
                  fontFamily:      'Inter, sans-serif',
                  padding:         '8px 12px',
                }}
                itemStyle={{ color: '#f4a622', fontWeight: 600 }}
                labelStyle={{ color: '#6b7280', fontWeight: 500 }}
                labelFormatter={(label) => `Opportunity #${label}`}
                formatter={(val: number) => [`${val}%`, 'Spread']}
              />
              <Area
                type="monotone"
                dataKey="spread"
                stroke="#f4a622"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#spreadGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#f4a622', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <TrendingUp className="w-6 h-6 opacity-30" />
            <span className="animate-pulse">Awaiting opportunity metrics…</span>
          </div>
        )}
      </div>
    </div>
  );
}
