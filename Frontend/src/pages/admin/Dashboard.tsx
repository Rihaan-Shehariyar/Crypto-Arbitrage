import { useAdminStats } from '@/hooks/useAdmin';
import {
  Users,
  Activity,
  Cpu,
  Radio,
  Layers,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
          <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
            {label}
          </span>
          {loading
            ? <Skeleton className="h-7 w-20 rounded" />
            : <span className={cn('text-2xl font-bold tracking-tight', valueClass)}>{value}</span>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconClass)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: stats, isLoading, isError, refetch, isFetching } = useAdminStats();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-rose-200 bg-rose-50 rounded-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>
        <div>
          <h3 className="font-bold text-rose-800 mb-1">Metrics Sync Failed</h3>
          <p className="text-sm text-rose-600 font-medium">Unable to reach /admin/stats endpoint.</p>
        </div>
        <Button size="sm" onClick={() => refetch()} className="bg-rose-600 text-white hover:bg-rose-700 rounded-lg cursor-pointer">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Platform Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Real-time statistics and pipeline monitor
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="text-xs gap-2 h-8 border border-border bg-surface text-foreground hover:bg-muted rounded-lg cursor-pointer shadow-sm font-semibold"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Users"
          value={stats?.users}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          label="Active Traders"
          value={stats?.active_traders}
          icon={Activity}
          iconClass="text-emerald-600"
          iconBg="bg-emerald-50 border-emerald-100"
          valueClass="text-emerald-600"
          loading={isLoading}
        />
        <StatCard
          label="Running Engines"
          value={stats?.engines}
          icon={Cpu}
          loading={isLoading}
        />
        <StatCard
          label="WS Clients"
          value={stats?.ws_clients}
          icon={Radio}
          loading={isLoading}
        />
        <StatCard
          label="Queue Depth"
          value={stats?.queue_depth}
          icon={Layers}
          valueClass={stats && stats.queue_depth > 10 ? 'text-amber-600' : 'text-foreground'}
          loading={isLoading}
        />
      </div>
    </div>
  );
}

export default Dashboard;
