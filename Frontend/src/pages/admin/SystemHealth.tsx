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
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  iconClass?: string;
  iconBg?: string;
  valueClass?: string;
  loading: boolean;
}

function StatCard({ label, value, icon: Icon, iconClass = 'text-primary', iconBg = 'bg-primary/10 border-primary/20', valueClass = 'text-foreground', loading }: StatCardProps) {
  return (
    <Card className="border border-border bg-surface shadow-card rounded-xl">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1.5">
          <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">{label}</span>
          {loading
            ? <Skeleton className="h-7 w-16 rounded" />
            : <span className={cn('text-2xl font-bold tracking-tight', valueClass)}>{value}</span>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconClass)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemHealth() {
  const [countdown, setCountdown] = useState(5);
  const { data: health, isLoading, isError, refetch, isFetching } = useAdminSystem();

  useEffect(() => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 5 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [health]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">System Diagnostics</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Live worker threads, message queues, and active engines
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span className="text-muted-foreground">Auto-sync:</span>
            <span className="text-primary font-bold">{countdown}s</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="text-xs gap-2 h-8 border border-border bg-surface text-foreground hover:bg-muted rounded-lg cursor-pointer shadow-sm font-semibold"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            Sync
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-3 p-4 border border-amber-200 bg-amber-50 rounded-xl text-sm text-amber-800 font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <span>Connection interrupted — auto-refreshing in the background…</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Queue Depth"
          value={health?.queue_depth}
          icon={Layers}
          valueClass={health && health.queue_depth > 10 ? 'text-amber-600' : 'text-foreground'}
          loading={isLoading}
        />
        <StatCard
          label="Active Traders"
          value={health?.active_traders}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          label="Running Engines"
          value={health?.engines}
          icon={Cpu}
          loading={isLoading}
        />
        <StatCard
          label="Worker Threads"
          value={health?.workers}
          icon={Hammer}
          loading={isLoading}
        />
        <StatCard
          label="WS Clients"
          value={health?.ws_clients}
          icon={Radio}
          loading={isLoading}
        />
      </div>
    </div>
  );
}

export default SystemHealth;
