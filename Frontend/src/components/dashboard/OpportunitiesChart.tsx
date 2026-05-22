import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Opportunity } from '@/types/api';
import { TrendingUp } from 'lucide-react';

export default function OpportunitiesChart() {
  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ['opportunities'],
    queryFn: () => [],
    staleTime: Infinity,
  });

  const chartData = useMemo(() => {
    // Take the last 15 opportunities, reverse them so they flow chronologically (left to right)
    const items = [...opportunities].slice(0, 15).reverse();
    return items.map((opp, idx) => ({
      name: `${idx + 1}`,
      spread: parseFloat((opp.spread_percent ?? 0).toFixed(2)),
      profit: parseFloat((opp.estimated_profit ?? 0).toFixed(2)),
      symbol: opp.symbol,
    }));
  }, [opportunities]);

  return (
    <div className="border border-border bg-black/40 rounded-lg p-4 font-mono text-xs flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-border pb-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-bold text-white uppercase tracking-wider">LIVE_OPPORTUNITY_ANALYTICS</span>
        </div>
        <span className="text-[9px] text-muted-foreground">SPREAD_CORRIDOR_%</span>
      </div>

      <div className="flex-1 min-h-[140px] w-full mt-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpread" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5EEAD4" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#5EEAD4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke="#A1A1AA" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#A1A1AA" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#222222', borderRadius: '4px', fontSize: '10px' }}
                itemStyle={{ color: '#5EEAD4' }}
                labelClassName="text-muted-foreground"
                labelFormatter={(label) => `Opportunity #${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="spread" 
                stroke="#5EEAD4" 
                strokeWidth={1.5} 
                fillOpacity={1} 
                fill="url(#colorSpread)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <span className="animate-pulse">AWAITING_OPPORTUNITY_METRICS...</span>
          </div>
        )}
      </div>
    </div>
  );
}
