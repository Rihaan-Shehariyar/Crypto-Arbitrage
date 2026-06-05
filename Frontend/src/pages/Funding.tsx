import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInventory, useDeposit } from '@/hooks/useFunding';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Wallet,
  Activity,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  AlertTriangle,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import type { DepositRequest } from '@/types/api';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-slate-200 rounded-md", className)} />
);

interface FlatInventoryItem {
  id: string;
  exchange: string;
  asset: string;
  balance: number;
}

export default function Funding() {
  const { data: inventory, isLoading, error, refetch } = useInventory();
  const depositMutation = useDeposit();
  const [searchParams] = useSearchParams();

  // Deposit Form State
  const [exchange, setExchange] = useState('binance');
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState<string>('');

  // Auto-select exchange if passed in URL query param
  useEffect(() => {
    const exchangeParam = searchParams.get('exchange')?.toLowerCase();
    if (exchangeParam && ['binance', 'bybit', 'okx', 'kucoin', 'gate'].includes(exchangeParam)) {
      setExchange(exchangeParam);
    }
  }, [searchParams]);

  // Table Search, Sort, Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'exchange' | 'asset' | 'balance' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Transfer Simulation State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isFeatureComingSoonOpen, setIsFeatureComingSoonOpen] = useState(false);
  const [simSource, setSimSource] = useState('binance');
  const [simDest, setSimDest] = useState('bybit');
  const [simAsset, setSimAsset] = useState('USDT');
  const [simAmount, setSimAmount] = useState('');

  // Flatten nested inventory data
  const flatInventory = useMemo(() => {
    if (!inventory) return [];
    const items: FlatInventoryItem[] = [];
    Object.entries(inventory).forEach(([exName, assets]) => {
      if (assets) {
        Object.entries(assets).forEach(([asName, bal]) => {
          items.push({
            id: `${exName}-${asName}`,
            exchange: exName,
            asset: asName,
            balance: Number(bal),
          });
        });
      }
    });
    return items;
  }, [inventory]);

  // Funding Summary calculations
  const totalUsdt = useMemo(() => {
    return flatInventory
      .filter(item => item.asset.toUpperCase() === 'USDT')
      .reduce((sum, item) => sum + item.balance, 0);
  }, [flatInventory]);

  const totalAssetsCount = useMemo(() => {
    const activeAssets = flatInventory.filter(item => item.balance > 0).map(item => item.asset.toUpperCase());
    return new Set(activeAssets).size;
  }, [flatInventory]);

  const activeExchangesCount = useMemo(() => {
    const exchangesWithFunds = flatInventory.filter(item => item.balance > 0).map(item => item.exchange.toLowerCase());
    return new Set(exchangesWithFunds).size;
  }, [flatInventory]);

  // Form submission handler
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error('Please enter a valid deposit amount greater than 0.');
      return;
    }

    const requestData: DepositRequest = {
      exchange,
      asset,
      amount: depositAmount
    };

    depositMutation.mutate(requestData, {
      onSuccess: () => {
        toast.success(`Successfully deposited ${depositAmount} ${asset} to ${exchange.toUpperCase()}.`);
        setAmount('');
      },
      onError: (err: any) => {
        console.error("Deposit error:", err);
        toast.error(`Deposit failed: ${err?.response?.data?.message || err?.message || 'Unknown backend API error'}`);
      }
    });
  };

  // Transfer simulation handler
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transferAmount = parseFloat(simAmount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Please enter a valid transfer amount.');
      return;
    }

    if (simSource === simDest) {
      toast.error('Source and destination exchanges must be different.');
      return;
    }

    // Open "Feature coming soon" sub-modal
    setIsFeatureComingSoonOpen(true);
  };

  // Reset pagination on search/sort adjustments
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortOrder, pageSize]);

  // Table filtering (Search)
  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return flatInventory;

    return flatInventory.filter(
      item =>
        item.exchange.toLowerCase().includes(query) ||
        item.asset.toLowerCase().includes(query)
    );
  }, [flatInventory, searchQuery]);

  // Table sorting
  const sortedInventory = useMemo(() => {
    if (!sortField || !sortOrder) return filteredInventory;

    return [...filteredInventory].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        const compare = valA.localeCompare(valB);
        return sortOrder === 'asc' ? compare : -compare;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [filteredInventory, sortField, sortOrder]);

  // Table pagination
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedInventory.slice(startIndex, startIndex + pageSize);
  }, [sortedInventory, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedInventory.length / pageSize) || 1;

  const handleSort = (field: 'exchange' | 'asset' | 'balance') => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatBalance = (val: number, isUsdt: boolean = false) => {
    if (isUsdt) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  return (
    <div className="space-y-6 pb-10 font-sans text-sm">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-border p-5 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Funding Desk</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Manage virtual deposits and simulate fund transfers across connected exchanges</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setSimAmount('');
            setIsTransferModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-primary text-white border border-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all duration-300 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Send className="w-3.5 h-3.5 shrink-0" />
          SIMULATE TRANSFER
        </button>
      </div>

      {/* Error Fallback */}
      {error && (
        <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-xl flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h4 className="text-foreground font-bold mb-1">Data Fetch Error</h4>
          <p className="text-muted-foreground text-xs max-w-md mb-4 font-medium">
            Could not communicate with the virtual inventory server. Ensure the backend API is running.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-surface hover:bg-slate-50 text-foreground text-xs font-bold rounded-lg border border-border transition-colors uppercase tracking-wider shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Section 1: Funding Summary Cards */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                <Skeleton className="h-3 w-32 mb-3" />
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))
          ) : (
            <>
              {/* Card 1: Total USDT */}
              <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300 shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <DollarSign className="w-20 h-20 text-primary" />
                </div>
                <div className="z-10">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total USDT Capital</span>
                  <h2 className="text-2xl font-bold text-foreground mt-1.5">
                    ${formatBalance(totalUsdt, true)}
                    <span className="text-xs text-muted-foreground ml-1.5 font-normal">USDT</span>
                  </h2>
                  <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Aggregated capital across all accounts
                  </p>
                </div>
              </div>

              {/* Card 2: Total Assets */}
              <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300 shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Activity className="w-20 h-20 text-primary" />
                </div>
                <div className="z-10">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Unique Assets</span>
                  <h2 className="text-2xl font-bold text-foreground mt-1.5">
                    {totalAssetsCount}
                    <span className="text-xs text-muted-foreground ml-1.5 font-normal">Active Tokens</span>
                  </h2>
                  <div className="text-[10px] text-muted-foreground mt-1.5 truncate font-medium">
                    Assets: {flatInventory.filter(item => item.balance > 0).map(item => item.asset).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'None'}
                  </div>
                </div>
              </div>

              {/* Card 3: Active Exchanges */}
              <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300 shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Wallet className="w-20 h-20 text-primary" />
                </div>
                <div className="z-10">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Active Exchanges</span>
                  <h2 className="text-2xl font-bold text-foreground mt-1.5">
                    {activeExchangesCount}
                    <span className="text-xs text-muted-foreground ml-1.5 font-normal">Connected Hubs</span>
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                    Exchanges with allocated capital
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Grid: Section 2 (Deposit Form) & Section 3 (Exchange Inventory Cards) */}
      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 2: Deposit Funds Form */}
          <div className="bg-surface border border-border shadow-sm rounded-xl p-5 lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                <Plus className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground uppercase text-xs tracking-wider">Deposit Funds Form</span>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                {/* Exchange Select */}
                <div className="space-y-1">
                  <label htmlFor="exchange" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Target Exchange</label>
                  <select
                    id="exchange"
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs w-full cursor-pointer hover:border-border/80 transition-colors"
                  >
                    <option value="binance">Binance</option>
                    <option value="bybit">Bybit</option>
                    <option value="okx">OKX</option>
                    <option value="kucoin">KuCoin</option>
                    <option value="gate">Gate</option>
                  </select>
                </div>

                {/* Asset Select */}
                <div className="space-y-1">
                  <label htmlFor="asset" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Asset Token</label>
                  <select
                    id="asset"
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs w-full cursor-pointer hover:border-border/80 transition-colors"
                  >
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="SOL">SOL</option>
                  </select>
                </div>

                {/* Amount Input */}
                <div className="space-y-1">
                  <label htmlFor="amount" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Deposit Amount</label>
                  <div className="relative">
                    <input
                      id="amount"
                      type="number"
                      step="any"
                      min="0.000001"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-surface border border-border rounded-lg pl-3 pr-16 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-3 top-2 text-xs text-muted-foreground font-semibold font-sans">
                      {asset}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={depositMutation.isPending}
                  className="w-full mt-2 py-2.5 bg-primary text-white border border-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/95 disabled:opacity-55 disabled:cursor-not-allowed transition-all duration-200 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {depositMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      PROCESSING DEPOSIT...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      SUBMIT DEPOSIT
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 p-3 bg-slate-50 border border-border rounded-lg text-[11px] text-muted-foreground flex items-start gap-2 font-medium">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                All deposits made here represent virtual sandbox adjustments for testing multi-exchange trading limits and system parameters.
              </span>
            </div>
          </div>

          {/* Section 3: Exchange Inventory Cards */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground uppercase text-xs tracking-wider">Exchange Inventories</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                    <Skeleton className="h-5 w-24 mb-4" />
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))
              ) : inventory && Object.keys(inventory).length > 0 ? (
                Object.entries(inventory).map(([exchangeName, assets]) => (
                  <div
                    key={exchangeName}
                    className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/20 transition-all duration-300 shadow-sm"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-foreground uppercase tracking-wider text-xs">
                          {exchangeName}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary font-bold">
                          CONNECTED
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                        {assets && Object.entries(assets).length > 0 ? (
                          Object.entries(assets).map(([assetName, bal]) => (
                            <div
                              key={assetName}
                              className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-none text-xs"
                            >
                              <span className="text-muted-foreground font-semibold">{assetName}</span>
                              <span className="text-foreground font-semibold font-mono">
                                {formatBalance(Number(bal))}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground italic py-2">
                            No active balances found
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex gap-2">
                      <button
                        onClick={() => {
                          setExchange(exchangeName.toLowerCase());
                          const firstAsset = assets && Object.keys(assets).length > 0 ? Object.keys(assets)[0] : 'USDT';
                          setAsset(firstAsset);
                          setAmount('');
                        }}
                        className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-foreground text-[10px] font-bold uppercase border border-border/80 rounded-lg transition-colors text-center shadow-xs"
                      >
                        Quick Deposit
                      </button>
                      <button
                        onClick={() => {
                          setSimSource(exchangeName.toLowerCase());
                          setSimAmount('');
                          setIsTransferModalOpen(true);
                        }}
                        className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-foreground text-[10px] font-bold uppercase border border-border/80 rounded-lg transition-colors text-center shadow-xs"
                      >
                        Simulate Out
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full border border-border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground bg-surface shadow-sm">
                  <Activity className="w-8 h-8 opacity-25 mb-2" />
                  <span className="text-xs">No exchange inventory data available.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Inventory Table */}
      {!error && (
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground uppercase text-xs tracking-wider">Inventory Ledger</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-border bg-slate-100 text-muted-foreground font-semibold">FLATTENED VIEW</span>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search exchange or asset..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs w-full placeholder:text-muted-foreground placeholder:font-medium"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-bold text-muted-foreground uppercase bg-slate-50 border-b border-border select-none">
                <tr>
                  <th
                    onClick={() => handleSort('exchange')}
                    className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Exchange
                      <ArrowUpDown className={cn("w-3 h-3 text-muted-foreground/60", sortField === 'exchange' && "text-primary")} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('asset')}
                    className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Asset
                      <ArrowUpDown className={cn("w-3 h-3 text-muted-foreground/60", sortField === 'asset' && "text-primary")} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('balance')}
                    className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Balance
                      <ArrowUpDown className={cn("w-3 h-3 text-muted-foreground/60", sortField === 'balance' && "text-primary")} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array(5).fill(0).map((_, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="px-6 py-4"><Skeleton className="h-3.5 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-3.5 w-12" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-3.5 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedInventory.length > 0 ? (
                  paginatedInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-border/50 last:border-none">
                      <td className="px-6 py-3 font-semibold text-foreground uppercase tracking-wider">
                        {item.exchange}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground font-semibold">
                        {item.asset}
                      </td>
                      <td className="px-6 py-3 text-right text-foreground font-mono font-bold">
                        {formatBalance(item.balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-muted-foreground font-medium">
                      No matching inventory entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {!isLoading && sortedInventory.length > 0 && (
            <div className="p-4 bg-slate-50/50 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-muted-foreground text-[11px] font-medium">
              {/* Pagination Meta */}
              <div>
                Showing{' '}
                <span className="text-foreground font-bold">
                  {Math.min((currentPage - 1) * pageSize + 1, sortedInventory.length)}
                </span>{' '}
                to{' '}
                <span className="text-foreground font-bold">
                  {Math.min(currentPage * pageSize, sortedInventory.length)}
                </span>{' '}
                of <span className="text-foreground font-bold">{sortedInventory.length}</span> entries
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Page Size Select */}
                <div className="flex items-center gap-1.5">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-surface border border-border rounded-lg px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[11px] cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>rows</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-border rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-foreground"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-foreground font-bold font-mono px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1 border border-border rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer text-foreground"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 5: Transfer Simulation Modal Overlay */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="border border-border bg-surface max-w-md w-full rounded-xl overflow-hidden shadow-2xl relative animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-border bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground uppercase text-xs tracking-wider">Transfer Simulator</span>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleTransferSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Source Exchange */}
                <div className="space-y-1">
                  <label htmlFor="simSource" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Source Hub</label>
                  <select
                    id="simSource"
                    value={simSource}
                    onChange={(e) => setSimSource(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs w-full cursor-pointer hover:border-border/80 transition-colors"
                  >
                    <option value="binance">Binance</option>
                    <option value="bybit">Bybit</option>
                    <option value="okx">OKX</option>
                    <option value="kucoin">KuCoin</option>
                    <option value="gate">Gate</option>
                  </select>
                </div>

                {/* Destination Exchange */}
                <div className="space-y-1">
                  <label htmlFor="simDest" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Destination Hub</label>
                  <select
                    id="simDest"
                    value={simDest}
                    onChange={(e) => setSimDest(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs w-full cursor-pointer hover:border-border/80 transition-colors"
                  >
                    <option value="binance">Binance</option>
                    <option value="bybit">Bybit</option>
                    <option value="okx">OKX</option>
                    <option value="kucoin">KuCoin</option>
                    <option value="gate">Gate</option>
                  </select>
                </div>
              </div>

              {/* Asset Select */}
              <div className="space-y-1">
                <label htmlFor="simAsset" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Asset Token</label>
                <select
                  id="simAsset"
                  value={simAsset}
                  onChange={(e) => setSimAsset(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs w-full cursor-pointer hover:border-border/80 transition-colors"
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                </select>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label htmlFor="simAmount" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Simulated Amount</label>
                <div className="relative">
                  <input
                    id="simAmount"
                    type="number"
                    step="any"
                    min="0.000001"
                    required
                    placeholder="0.00"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="bg-surface border border-border rounded-lg pl-3 pr-16 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute right-3 top-2 text-xs text-muted-foreground font-semibold font-sans">
                    {simAsset}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-primary text-white border border-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/95 transition-all duration-200 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                EXECUTE SIMULATION
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feature Coming Soon dialog modal */}
      {isFeatureComingSoonOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="border border-border bg-surface max-w-sm w-full rounded-xl overflow-hidden shadow-2xl relative p-6 text-center animate-in scale-in duration-200">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Info className="w-6 h-6 text-primary animate-pulse" />
            </div>

            <h3 className="text-foreground font-bold text-base tracking-wider uppercase mb-2">
              Feature coming soon
            </h3>
            
            <p className="text-muted-foreground text-xs leading-relaxed mb-6 font-medium">
              The multi-exchange transfer simulation is frontend-only for now. In a future update, this will initiate an on-chain/API transfer between exchange accounts.
            </p>

            <button
              onClick={() => {
                setIsFeatureComingSoonOpen(false);
                setIsTransferModalOpen(false);
              }}
              className="w-full py-2 bg-primary text-white border border-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/95 transition-colors rounded-lg shadow-sm"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
