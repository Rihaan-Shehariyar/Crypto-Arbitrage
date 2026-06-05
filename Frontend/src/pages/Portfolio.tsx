import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPortfolio } from '@/services/endpoints';
import { useInventory, useDeposit } from '@/hooks/useFunding';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Activity,
  Plus,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  Wallet
} from 'lucide-react';
import type { PortfolioResponse, DepositRequest } from '@/types/api';

// ShadCN UI imports
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function Portfolio() {
  // Queries
  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery<PortfolioResponse>({
    queryKey: ['portfolio'],
    queryFn: getPortfolio,
  });

  const { data: inventory, isLoading: isLoadingInventory } = useInventory();
  const depositMutation = useDeposit();

  // Form State
  const [exchange, setExchange] = useState('binance');
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');

  // Calculations
  const availableCapital = useMemo(() => {
    if (!inventory) return 0;
    return Object.values(inventory).reduce((sum, assets) => {
      if (!assets) return sum;
      return sum + (assets['USDT'] || 0);
    }, 0);
  }, [inventory]);

  const totalPortfolioValue = useMemo(() => {
    if (!inventory) return 0;
    return Object.values(inventory).reduce((sum, assets) => {
      if (!assets) return sum;
      return sum + Object.values(assets).reduce((exSum, bal) => exSum + Number(bal), 0);
    }, 0);
  }, [inventory]);

  const totalProfit = portfolio?.total_profit_usdt ?? portfolio?.summary?.total_profit_usdt ?? 0;
  const totalTrades = portfolio?.total_trades ?? portfolio?.summary?.total_trades ?? 0;

  // Handlers
  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    const data: DepositRequest = {
      exchange,
      asset,
      amount: depositAmount
    };

    depositMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Funds added successfully');
        setAmount('');
      },
      onError: (err: any) => {
        console.error("Deposit error:", err);
        toast.error(`Failed to add funds: ${err?.response?.data?.message || err?.message || 'Unknown error'}`);
      }
    });
  };

  const handleQuickDeposit = (value: number) => {
    setAmount(value.toString());
    setAsset('USDT');
  };

  const formatBalance = (val: number, isUsdt: boolean = false) => {
    if (isUsdt) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const isLoading = isLoadingPortfolio || isLoadingInventory;

    return (
    <div className="space-y-6 pb-10">
      {/* Title */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Portfolio & Capital Desk</h1>
          <p className="text-muted-foreground mt-1 text-sm">Directly fund your exchange accounts and view overall portfolio asset allocations</p>
        </div>
      </div>

      {/* Top Section: Fund Portfolio Form (Left) & Portfolio Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fund Portfolio Card */}
        <Card className="lg:col-span-2 shadow-sm bg-surface">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-bold tracking-wider uppercase flex items-center gap-2 text-foreground">
              <Plus className="w-4 h-4 text-primary" />
              Fund Portfolio
            </CardTitle>
            <CardDescription>
              Allocate virtual test funds into connected exchange balances instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Exchange Select */}
                <div className="space-y-1.5">
                  <label htmlFor="exchange" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Exchange
                  </label>
                  <Select
                    id="exchange"
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    className="hover:border-border/80 transition-colors bg-surface text-foreground"
                  >
                    <option value="binance">Binance</option>
                    <option value="bybit">Bybit</option>
                    <option value="okx">OKX</option>
                    <option value="kucoin">KuCoin</option>
                    <option value="gate">Gate</option>
                  </Select>
                </div>

                {/* Asset Select */}
                <div className="space-y-1.5">
                  <label htmlFor="asset" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Asset
                  </label>
                  <Select
                    id="asset"
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    className="hover:border-border/80 transition-colors bg-surface text-foreground"
                  >
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="SOL">SOL</option>
                  </Select>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <label htmlFor="amount" className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                    Amount
                  </label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      min="0.000001"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-surface text-foreground"
                    />
                    <div className="absolute right-3 top-2 text-xs text-muted-foreground font-semibold font-sans">
                      {asset}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Deposit Buttons & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                {/* Quick select buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1 font-semibold">Quick Add:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDeposit(100)}
                    className="text-[10px] font-bold border-border/80 hover:bg-slate-50 text-foreground"
                  >
                    +100 USDT
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDeposit(500)}
                    className="text-[10px] font-bold border-border/80 hover:bg-slate-50 text-foreground"
                  >
                    +500 USDT
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDeposit(1000)}
                    className="text-[10px] font-bold border-border/80 hover:bg-slate-50 text-foreground"
                  >
                    +1000 USDT
                  </Button>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={depositMutation.isPending}
                  className="font-bold text-xs uppercase tracking-widest px-6 bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-1.5 min-w-[140px]"
                >
                  {depositMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ADDING...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add Funds
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Portfolio Summary Card */}
        <Card className="lg:col-span-1 shadow-sm bg-surface">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-bold tracking-wider uppercase flex items-center gap-2 text-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              Portfolio Summary
            </CardTitle>
            <CardDescription>Overall metrics and available trading balances</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 font-sans">
            {/* Metric 1: Total Portfolio Value */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-semibold">PORTFOLIO VALUE</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-24 mt-1" />
                ) : (
                  <span className="text-foreground font-bold text-base">
                    ${formatBalance(totalPortfolioValue, true)}
                  </span>
                )}
              </div>
              <Badge className="bg-slate-100 text-muted-foreground border-border pointer-events-none text-[9px] font-bold">
                USD EST
              </Badge>
            </div>

            {/* Metric 2: Available Capital */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-semibold">AVAILABLE CAPITAL</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-24 mt-1" />
                ) : (
                  <span className="text-foreground font-bold text-base">
                    ${formatBalance(availableCapital, true)}
                  </span>
                )}
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 pointer-events-none text-[9px] font-bold">
                USDT
              </Badge>
            </div>

            {/* Metric 3: Total Profit */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-semibold">TOTAL PROFIT</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-20 mt-1" />
                ) : (
                  <span className={cn("font-bold text-sm", totalProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {totalProfit >= 0 ? '+' : ''}${formatBalance(totalProfit, true)}
                  </span>
                )}
              </div>
              <div className="flex items-center text-[10px]">
                {totalProfit >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
              </div>
            </div>

            {/* Metric 4: Total Trades */}
            <div className="flex justify-between items-center py-2">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-semibold">TOTAL TRADES</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-16 mt-1" />
                ) : (
                  <span className="text-foreground font-bold text-sm">
                    {totalTrades}
                  </span>
                )}
              </div>
              <Badge className="bg-slate-100 text-muted-foreground border-border pointer-events-none text-[9px] font-bold">
                EXECUTED
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Balances Card Grid */}
      <div className="space-y-4 pt-4 font-sans">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground uppercase text-xs tracking-wider">Exchange Balances</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="shadow-sm bg-surface">
                <CardHeader className="pb-3 border-b border-border">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          ) : inventory && Object.entries(inventory).length > 0 ? (
            Object.entries(inventory).map(([exchangeName, assets]) => (
              <Card
                key={exchangeName}
                className="hover:border-primary/30 transition-all duration-300 flex flex-col justify-between shadow-sm bg-surface"
              >
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-bold tracking-wider uppercase flex items-center justify-between text-foreground">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-border flex items-center justify-center mr-2">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {exchangeName}
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary font-bold">
                      CONNECTED
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <div className="space-y-2">
                    {assets && Object.entries(assets).length > 0 ? (
                      Object.entries(assets).map(([assetName, amountVal]) => (
                        <div
                          key={assetName}
                          className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-none text-xs"
                        >
                          <span className="text-muted-foreground font-semibold">{assetName}</span>
                          <span className="text-foreground font-bold">{formatBalance(Number(amountVal))}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground italic py-2">
                        No active assets
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full border border-border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center text-muted-foreground bg-surface shadow-sm">
              <Wallet className="w-8 h-8 opacity-25 mb-2" />
              <span className="text-xs">No active exchange balance allocations.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
