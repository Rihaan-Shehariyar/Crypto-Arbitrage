import { useAdminStats } from '@/hooks/useAdmin';
import { 
  Users, 
  Activity, 
  Cpu, 
  Radio, 
  Layers, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const { 
    data: stats, 
    isLoading, 
    isError, 
    refetch, 
    isFetching 
  } = useAdminStats();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-red-500/20 bg-red-500/5 rounded-xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <div>
          <h3 className="font-semibold text-lg text-white">Metrics Sync Failed</h3>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Unable to communicate with endpoint /admin/stats.</p>
        </div>
        <Button size="sm" onClick={() => refetch()} className="font-mono text-xs cursor-pointer">
          Retry Sync
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">Arbitrage Platform Console</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">Real-time statistics aggregator and pipeline monitor</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          className="font-mono text-xs gap-1.5 h-8 cursor-pointer"
          disabled={isLoading || isFetching}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Sync Data</span>
        </Button>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* CARD 1: Total Users */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Total Users</span>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <span className="text-2xl font-semibold font-mono text-white tracking-tight">{stats?.users}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: Active Traders */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Active Traders</span>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <span className="text-2xl font-semibold font-mono text-emerald-400 tracking-tight">{stats?.active_traders}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: Running Engines */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Running Engines</span>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <span className="text-2xl font-semibold font-mono text-white tracking-tight">{stats?.engines}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Cpu className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: WebSocket Clients */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">WS Clients</span>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <span className="text-2xl font-semibold font-mono text-white tracking-tight">{stats?.ws_clients}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Radio className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 5: Queue Depth */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Queue Depth</span>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <span className={`text-2xl font-semibold font-mono tracking-tight ${stats && stats.queue_depth > 10 ? 'text-amber-500' : 'text-white'}`}>{stats?.queue_depth}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

export default Dashboard;
