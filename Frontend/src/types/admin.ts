export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription_active: boolean;
  trading_enabled: boolean;
  created_at?: string;
}

export interface AdminStats {
  users: number;
  active_traders: number;
  engines: number;
  ws_clients: number;
  queue_depth: number;
}

export interface AdminSystemHealth {
  queue_depth: number;
  active_traders: number;
  engines: number;
  ws_clients: number;
  workers: number;
}

export interface AdminTrade {
  symbol: string;
  buy_exchange: string;
  sell_exchange: string;
  profit_usdt: number;
  profit_percent: number;
  latency_ms: number;
  status: string; // e.g., 'CLOSED', 'FAILED'
  created_at: string;
}

export interface AdminUserTradesResponse {
  user: AdminUser;
  stats: {
    total_trades: number;
    total_profit: number;
  };
  trades: AdminTrade[];
}
