import { useQuery } from '@tanstack/react-query';
import { getPortfolio } from '@/services/endpoints';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import type { PortfolioResponse } from '@/types/api';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-surface/80 rounded-md", className)} />
);

export default function Portfolio() {
  const { data: portfolio, isLoading } = useQuery<PortfolioResponse>({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
  });

  const inventory = portfolio?.balances;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Exchange Balances</h1>
          <p className="text-muted-foreground mt-1">Live inventory distribution across connected exchanges</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))
        ) : inventory && Object.entries(inventory).length > 0 ? (
          Object.entries(inventory).map(([exchange, balances]) => (
            <div key={exchange} className="glass-panel p-6 rounded-2xl flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white capitalize flex items-center">
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center mr-3">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  {exchange}
                </h3>
              </div>
              <div className="space-y-3 flex-1">
                {Object.entries(balances).map(([asset, amount]) => (
                  <div key={asset} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground font-medium">{asset}</span>
                    <span className="text-white font-bold">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                  </div>
                ))}
                {Object.keys(balances).length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No assets</p>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-border/50">
                 <button className="w-full bg-surface hover:bg-surface/80 text-white text-sm font-medium py-2 rounded-lg transition-colors border border-border">
                   Deposit {exchange}
                 </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center glass-panel rounded-2xl">
            <p className="text-muted-foreground">No inventory data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
