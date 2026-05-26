export interface LoginResponse {
  token: string;
  subscription_active?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscription_active: boolean;
  trading_enabled: boolean;
  auth_provider: string;
}

export interface PortfolioSummary {
  total_profit_usdt: number;
  total_trades: number;
}

export interface ExchangeBalances {
  [asset: string]: number;
}

export interface PortfolioResponse {
  summary?: PortfolioSummary;
  total_profit_usdt?: number;
  total_trades?: number;
  balances: Record<string, ExchangeBalances>;
}

export type InventoryResponse = Record<string, ExchangeBalances>;

export interface DepositRequest {
  exchange: string;
  asset: string;
  amount: number;
}

export interface Trade {
  id: string;
  symbol: string;
  buy_exchange: string;
  sell_exchange: string;
  profit_usdt: number;
  profit_percent: number;
  latency_ms: number;
  status: string; // e.g., 'CLOSED', 'FAILED'
  created_at: string;
}

export interface Opportunity {
  symbol: string;
  buy_exchange: string;
  sell_exchange: string;
  buy_price: number;
  sell_price: number;
  spread_percent: number;
  estimated_profit: number;
  latency_ms: number;
  timestamp: string;
}

export interface RiskMetrics {
  current_exposure: number;
  open_trades: number;
  daily_pnl: number;
  last_reject_reason: string;
}

// WebSocket Event Contracts
export type WsEventType = 
  | 'TRADE_EXECUTED'
  | 'PORTFOLIO_UPDATED'
  | 'OPPORTUNITY_FOUND'
  | 'EXCHANGE_HEALTH'
  | 'METRIC_UPDATE'
  | 'RISK_UPDATED';

export interface WsMessage<T = any> {
  type: WsEventType;
  payload: T;
}
