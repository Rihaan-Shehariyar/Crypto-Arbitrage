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
      <div className="p-6 text-center text-red-500 font-mono text-xs">
        Invalid Parameter. Missing User ID.
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
      <div className="flex flex-col items-center justify-center p-12 border border-red-500/20 bg-red-500/5 rounded-xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <div>
          <h3 className="font-semibold text-lg text-white">Synchronization Failure</h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Error querying user data fields from DB</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/users')} className="font-mono text-xs cursor-pointer">
            Back to Users
          </Button>
          <Button size="sm" onClick={() => { refetchUser(); refetchTrades(); }} className="font-mono text-xs cursor-pointer">
            Retry Sync
          </Button>
        </div>
      </div>
    );
  }

  const trades = tradesResponse?.trades || [];
  const stats = tradesResponse?.stats || { total_trades: 0, total_profit: 0 };

  return (
    <div className="space-y-6">
      
      {/* BACK NAVIGATION */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-white transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Return to directory</span>
      </button>

      {/* USER HEADER PROFILE SUMMARY */}
      <Card className="border-border bg-surface/50 backdrop-blur-md">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(94,234,212,0.15)] shrink-0">
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
                  <h2 className="text-lg font-bold text-white font-sans">{user?.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 font-mono text-[10px]">
                    <span className="text-muted-foreground">{user?.email}</span>
                    <span className="text-border">•</span>
                    <span className="text-muted-foreground">ID: <span className="text-white select-all">{user?.id}</span></span>
                    <span className="text-border">•</span>
                    <span className="text-primary font-bold uppercase">{user?.role}</span>
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
                className="font-mono text-[11px] h-9 px-4 cursor-pointer"
                onClick={handleSubToggle}
                disabled={subToggleMutation.isPending}
              >
                {user?.subscription_active ? (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3.5 h-3.5" /> Deactivate Subscription
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" /> Activate Subscription
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
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Subscription</span>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge variant={user?.subscription_active ? 'success' : 'destructive'} className="h-5">
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
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Trading Status</span>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge variant={user?.trading_enabled ? 'success' : 'destructive'} className="h-5">
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
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">Trade Executions</span>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-xl font-semibold font-mono text-white leading-none block">{stats?.total_trades} trades</span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Profit Card */}
        <Card className="border-border bg-surface/50 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider block">User Gross Profit</span>
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <span className={cn(
                  "text-xl font-semibold font-mono leading-none block",
                  stats.total_profit > 0 ? "text-emerald-400" : stats.total_profit < 0 ? "text-red-400" : "text-white"
                )}>
                  ${stats.total_profit.toFixed(2)} USDT
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* USER TRADE HISTORY TABLE */}
      <Card className="border-border bg-surface/50 backdrop-blur-md">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono">Arbitrage Executions History</CardTitle>
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
            <div className="p-12 text-center text-muted-foreground font-mono text-xs">
              No trades captured for this session.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Buy Exchange</TableHead>
                  <TableHead>Sell Exchange</TableHead>
                  <TableHead>Profit USDT</TableHead>
                  <TableHead>Profit %</TableHead>
                  <TableHead>Execution Delay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Execution Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10">
                    
                    {/* Symbol */}
                    <TableCell className="font-sans font-bold text-white">{trade.symbol}</TableCell>
                    
                    {/* Buy exchange */}
                    <TableCell>{trade.buy_exchange}</TableCell>
                    
                    {/* Sell exchange */}
                    <TableCell>{trade.sell_exchange}</TableCell>
                    
                    {/* Profit USDT */}
                    <TableCell className={trade.profit_usdt >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {trade.profit_usdt >= 0 ? '+' : ''}${trade.profit_usdt.toFixed(2)}
                    </TableCell>
                    
                    {/* Profit % */}
                    <TableCell className={trade.profit_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {trade.profit_percent >= 0 ? '+' : ''}{trade.profit_percent.toFixed(2)}%
                    </TableCell>
                    
                    {/* Latency */}
                    <TableCell className="text-primary font-bold">{trade.latency_ms}ms</TableCell>
                    
                    {/* Status */}
                    <TableCell>
                      {trade.status === 'CLOSED' ? (
                        <Badge variant="success">Closed</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </TableCell>
                    
                    {/* Time */}
                    <TableCell className="text-right text-muted-foreground text-[10px]">
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
