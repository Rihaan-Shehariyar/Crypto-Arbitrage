import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminUsers } from '@/hooks/useAdmin';
import { 
  activateSubscription, 
  deactivateSubscription 
} from '@/services/adminEndpoints';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tradingFilter, setTradingFilter] = useState('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // FETCH USERS using React Query hook
  const { 
    data, 
    isLoading, 
    isError, 
    refetch 
  } = useAdminUsers();

  const users = data?.users || [];

  // MUTATIONS FOR USER SUBSCRIPTION STATUS
  const subToggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return active ? activateSubscription(id) : deactivateSubscription(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success(`Subscription ${variables.active ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Action failed');
    }
  });

  const handleSubToggle = (id: string, currentlyActive: boolean) => {
    subToggleMutation.mutate({ id, active: !currentlyActive });
  };

  // FILTER USERS
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && user.subscription_active) ||
      (statusFilter === 'INACTIVE' && !user.subscription_active);

    const matchesTrading = 
      tradingFilter === 'ALL' || 
      (tradingFilter === 'ENABLED' && user.trading_enabled) ||
      (tradingFilter === 'DISABLED' && !user.trading_enabled);

    return matchesSearch && matchesStatus && matchesTrading;
  });

  // PAGINATION
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-sans">User Management Directory</h2>
        <p className="text-xs text-muted-foreground font-mono mt-1">Review accounts, adjust subscription plans, and inspect system details</p>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="border-border bg-surface/50 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* SEARCH BAR */}
          <div className="relative w-full md:w-80 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <Input
              type="text"
              placeholder="Search user name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 text-xs font-mono"
            />
          </div>

          {/* DROPDOWN FILTERS */}
          <div className="w-full flex flex-col sm:flex-row gap-4 justify-end">
            
            {/* SUBSCRIPTION FILTER */}
            <div className="w-full sm:w-44 space-y-1">
              <span className="text-[9px] font-mono font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Filter className="w-2.5 h-2.5" /> Subscription Plan
              </span>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-mono"
              >
                <option value="ALL">All Subscriptions</option>
                <option value="ACTIVE">Active Plan</option>
                <option value="INACTIVE">Deactivated Plan</option>
              </Select>
            </div>

            {/* TRADING STATUS FILTER */}
            <div className="w-full sm:w-44 space-y-1">
              <span className="text-[9px] font-mono font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Filter className="w-2.5 h-2.5" /> Trading Status
              </span>
              <Select
                value={tradingFilter}
                onChange={(e) => {
                  setTradingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-mono"
              >
                <option value="ALL">All Trading States</option>
                <option value="ENABLED">Trading Allowed</option>
                <option value="DISABLED">Trading Halted</option>
              </Select>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* USER LIST DATA TABLE */}
      <Card className="border-border bg-surface/50 backdrop-blur-md overflow-hidden">
        <CardContent className="p-0">
          
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <h3 className="text-sm font-semibold text-white">Synchronization Error</h3>
              <p className="text-xs text-muted-foreground">Unable to fetch database users.</p>
              <Button size="sm" onClick={() => refetch()} className="font-mono text-xs cursor-pointer">Retry</Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-mono text-xs">
              No matching records found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email Details</TableHead>
                    <TableHead>Role Type</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Trading Status</TableHead>
                    <TableHead className="text-right">Action Directives</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/10">
                      
                      {/* Name */}
                      <TableCell className="font-sans font-semibold text-white">{user.name}</TableCell>
                      
                      {/* Email */}
                      <TableCell className="text-muted-foreground font-mono text-[11px]">{user.email}</TableCell>
                      
                      {/* Role */}
                      <TableCell className="text-xs font-mono">{user.role}</TableCell>
                      
                      {/* Subscription */}
                      <TableCell>
                        {user.subscription_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      
                      {/* Trading Status */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            user.trading_enabled ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                          )} />
                          <span className={user.trading_enabled ? "text-emerald-400 font-bold" : "text-red-400"}>
                            {user.trading_enabled ? 'ALLOWED' : 'HALTED'}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 pr-2">
                          
                          {/* View Profile */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View User Details"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="w-8 h-8 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </Button>

                          {/* Toggle Subscription */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] font-mono h-8 w-28 cursor-pointer"
                            onClick={() => handleSubToggle(user.id, user.subscription_active)}
                            disabled={subToggleMutation.isPending}
                          >
                            {user.subscription_active ? (
                              <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3 h-3" /> Deactivate</span>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" /> Activate</span>
                            )}
                          </Button>

                        </div>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* PAGINATION BAR */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 font-mono text-xs">
                  <span className="text-muted-foreground">
                    Displaying items <span className="text-white">{indexOfFirstItem + 1}</span>-
                    <span className="text-white">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{' '}
                    <span className="text-white">{filteredUsers.length}</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 cursor-pointer"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-muted-foreground">
                      Page <span className="text-white">{currentPage}</span> of{' '}
                      <span className="text-white">{totalPages}</span>
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 cursor-pointer"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

        </CardContent>
      </Card>

    </div>
  );
}

export default Users;
