import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminUser, useAdminUserTrades } from '@/hooks/useAdmin';
import { 
  activateSubscription, 
  deactivateSubscription 
} from '@/services/adminEndpoints';
import { 
  ArrowLeft, 
  User, 
  ShieldCheck, 
  Wallet, 
  Activity, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!id) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm font-medium">
        Invalid request — missing User ID.
      </div>
    );
  }

  // FETCH USER PROFILE DETAILS
  const { 
    data: user, 
    isLoading: userLoading, 
    isError: userError,
    refetch: refetchUser
  } = useAdminUser(id);

  // FETCH USER TRADES
  const { 
    data: tradesResponse, 
    isLoading: tradesLoading, 
    isError: tradesError,
    refetch: refetchTrades
  } = useAdminUserTrades(id);

  // MUTATIONS FOR SUBSCRIPTION TOGGLE
  const subToggleMutation = useMutation({
    mutationFn: async (active: boolean) => {
      return active ? activateSubscription(id) : deactivateSubscription(id);
    },
    onSuccess: (_, active) => {
      queryClient.invalidateQueries({ queryKey: ['adminUser', id] });
      queryClient.invalidateQueries({ queryKey: ['adminUserTrades', id] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success(`Subscription ${active ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Action failed');
    }
  });

  const handleSubToggle = () => {
    if (!user) return;
    const isCurrentlyActive = user.subscription_active;
    subToggleMutation.mutate(!isCurrentlyActive);
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const isLoading = userLoading || tradesLoading;
  const isError = userError || tradesError;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-rose-200 bg-rose-50 rounded-xl text-center space-y-4 font-sans">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <div>
          <h3 className="font-semibold text-lg text-rose-800">Synchronization Failure</h3>
          <p className="text-xs text-rose-600 mt-1 font-medium">Error querying user data fields from DB</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/users')} className="text-xs rounded-lg border border-border bg-surface text-foreground hover:bg-slate-50 cursor-pointer shadow-xs">
            Back to Users
          </Button>
          <Button size="sm" onClick={() => { refetchUser(); refetchTrades(); }} className="text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs">
            Retry Sync
          </Button>
        </div>
      </div>
    );
  }

  const trades = tradesResponse?.trades || [];
  const stats = tradesResponse?.stats || { total_trades: 0, total_profit: 0 };

  return (
    <div className="space-y-6 font-sans">
      
      {/* BACK NAVIGATION */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Return to directory</span>
      </button>

      {/* USER HEADER PROFILE SUMMARY */}
      <Card className="border border-border bg-surface shadow-sm rounded-xl">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground font-semibold">
                    <span>{user?.email}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span>ID: <span className="text-foreground select-all font-mono">{user?.id}</span></span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-primary uppercase tracking-wide">{user?.role}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TOGGLE OPTIONS */}
          {!isLoading && (
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 px-4 cursor-pointer border border-border hover:bg-slate-50 rounded-lg shadow-xs"
                onClick={handleSubToggle}
                disabled={subToggleMutation.isPending}
              >
                {user?.subscription_active ? (
                  <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                    <XCircle className="w-4 h-4 text-rose-500" /> Deactivate Subscription
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Activate Subscription
                  </span>
                )}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {/* METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Subscription Status Card */}
        <Card className="border border-border bg-surface shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Subscription</span>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge variant={user?.subscription_active ? 'success' : 'destructive'} className="h-5 bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                  {user?.subscription_active ? 'ACTIVE PLAN' : 'INACTIVE'}
                </Badge>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Trading Status Card */}
        <Card className="border border-border bg-surface shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Trading Status</span>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge variant={user?.trading_enabled ? 'success' : 'destructive'} className={cn("h-5 font-bold", user?.trading_enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
                  {user?.trading_enabled ? 'ALLOWED' : 'HALTED'}
                </Badge>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Total Trades Card */}
        <Card className="border border-border bg-surface shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Trade Executions</span>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-lg font-bold text-foreground leading-none block">{stats?.total_trades} trades</span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Profit Card */}
        <Card className="border border-border bg-surface shadow-sm rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">User Gross Profit</span>
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <span className={cn(
                  "text-lg font-bold leading-none block",
                  stats.total_profit > 0 ? "text-emerald-600" : stats.total_profit < 0 ? "text-rose-600" : "text-foreground"
                )}>
                  ${stats.total_profit.toFixed(2)} USDT
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* USER TRADE HISTORY TABLE */}
      <Card className="border border-border bg-surface shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-border pb-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Arbitrage Executions History</CardTitle>
              <CardDescription>Comprehensive log of trades processed by this user's engine session</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : trades.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs font-semibold">
              No trades captured for this session.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50 border-b border-border select-none">
                <TableRow>
                  <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Symbol</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Buy Exchange</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Sell Exchange</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Profit USDT</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Profit %</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Execution Delay</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider py-3">Status</TableHead>
                  <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider py-3 text-right">Execution Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {trades.map((trade, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 border-b border-border/50 last:border-none">
                    
                    {/* Symbol */}
                    <TableCell className="font-sans font-bold text-foreground py-3.5">{trade.symbol}</TableCell>
                    
                    {/* Buy exchange */}
                    <TableCell className="font-semibold text-muted-foreground py-3.5 uppercase">{trade.buy_exchange}</TableCell>
                    
                    {/* Sell exchange */}
                    <TableCell className="font-semibold text-muted-foreground py-3.5 uppercase">{trade.sell_exchange}</TableCell>
                    
                    {/* Profit USDT */}
                    <TableCell className={cn('font-bold py-3.5 font-mono', trade.profit_usdt >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {trade.profit_usdt >= 0 ? '+' : ''}${trade.profit_usdt.toFixed(2)}
                    </TableCell>
                    
                    {/* Profit % */}
                    <TableCell className={cn('font-semibold py-3.5 font-mono', trade.profit_percent >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {trade.profit_percent >= 0 ? '+' : ''}{trade.profit_percent.toFixed(2)}%
                    </TableCell>
                    
                    {/* Latency */}
                    <TableCell className="text-foreground font-medium py-3.5 font-mono">{trade.latency_ms}ms</TableCell>
                    
                    {/* Status */}
                    <TableCell className="py-3.5">
                      {trade.status === 'CLOSED' ? (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Closed</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200">Failed</Badge>
                      )}
                    </TableCell>
                    
                    {/* Time */}
                    <TableCell className="text-right text-muted-foreground text-xs font-mono py-3.5">
                      {formatDateTime(trade.created_at)}
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

        </CardContent>
      </Card>

    </div>
  );
}

export default UserDetails;
