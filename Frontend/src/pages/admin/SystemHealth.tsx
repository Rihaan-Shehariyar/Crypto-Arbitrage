import { useState, useEffect } from 'react';
import { useAdminSystem } from '@/hooks/useAdmin';
import { 
  Cpu, 
  Layers, 
  Users, 
  Radio, 
  Hammer,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function SystemHealth() {
  const [countdown, setCountdown] = useState(5);

  const { 
    data: health, 
    isLoading, 
    isError, 
    refetch, 
    isFetching 
  } = useAdminSystem();

  // Countdown timer effect to show when next poll happens
  useEffect(() => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 5;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [health]);

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">System Diagnostics & Pipelines</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">Live worker thread analysis, message queue logs, and active engines</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Pulsing countdown timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-black/40 border border-border/80 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span className="text-muted-foreground">Auto-Sync:</span>
            <span className="text-primary font-bold">{countdown}s</span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="font-mono text-xs gap-1.5 h-8 cursor-pointer"
            disabled={isLoading || isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 rounded-xl font-mono text-xs text-red-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Connection interrupted. Auto-refreshing in the background...</span>
        </div>
      )}

      {/* CORE STATS CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* CARD 1: Queue Depth */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Queue Depth</span>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className={`text-2xl font-semibold font-mono tracking-tight ${health && health.queue_depth > 10 ? 'text-amber-500' : 'text-white'}`}>
                  {health?.queue_depth}
                </span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: Active Traders */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Active Traders</span>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className="text-2xl font-semibold font-mono text-white tracking-tight">{health?.active_traders}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: Running Engines */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Running Engines</span>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className="text-2xl font-semibold font-mono text-white tracking-tight">{health?.engines}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Cpu className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: Worker Count */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Worker Count</span>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className="text-2xl font-semibold font-mono text-white tracking-tight">{health?.workers}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Hammer className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 5: WebSocket Clients */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">WS Clients</span>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className="text-2xl font-semibold font-mono text-white tracking-tight">{health?.ws_clients}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Radio className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}

export default SystemHealth;
