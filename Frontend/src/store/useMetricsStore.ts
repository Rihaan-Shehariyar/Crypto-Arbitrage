import { create } from 'zustand';
import type { Trade } from '@/types/api';

export interface ExchangeHealthInfo {
  exchange: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latency_ms: number;
  lastUpdate: number;
}

interface MetricsState {
  // Opportunity Throughput
  totalOpportunitiesReceived: number;
  opsPerSecond: number;
  opportunityTimestamps: number[];
  
  // Exchange Health
  exchangeHealth: Record<string, ExchangeHealthInfo>;
  
  // Realtime Trade Stream
  tradeStream: Trade[];
  
  // Realtime System Metrics / Risk
  systemMetrics: Record<string, number>;
  
  // Actions
  recordOpportunity: () => void;
  updateOpsPerSecond: () => void;
  updateExchangeHealth: (info: { exchange: string; status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; latency_ms: number }) => void;
  addTradeToStream: (trade: Trade) => void;
  updateMetric: (name: string, value: number) => void;
  resetMetrics: () => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  totalOpportunitiesReceived: 0,
  opsPerSecond: 0,
  opportunityTimestamps: [],
  exchangeHealth: {},
  tradeStream: [],
  systemMetrics: {},

  recordOpportunity: () => {
    const now = Date.now();
    set((state) => {
      const timestamps = [...state.opportunityTimestamps, now];
      return {
        totalOpportunitiesReceived: state.totalOpportunitiesReceived + 1,
        opportunityTimestamps: timestamps,
      };
    });
  },

  updateOpsPerSecond: () => {
    const now = Date.now();
    const oneSecAgo = now - 1000;
    set((state) => {
      const filtered = state.opportunityTimestamps.filter((t) => t > oneSecAgo);
      return {
        opportunityTimestamps: filtered,
        opsPerSecond: filtered.length,
      };
    });
  },

  updateExchangeHealth: (info) => {
    set((state) => ({
      exchangeHealth: {
        ...state.exchangeHealth,
        [info.exchange.toLowerCase()]: {
          ...info,
          lastUpdate: Date.now(),
        },
      },
    }));
  },

  addTradeToStream: (trade) => {
    set((state) => ({
      tradeStream: [trade, ...state.tradeStream].slice(0, 50),
    }));
  },

  updateMetric: (name, value) => {
    set((state) => {
      const updatedMetrics = { ...state.systemMetrics, [name]: value };
      return {
        systemMetrics: updatedMetrics,
      };
    });
  },

  resetMetrics: () => {
    set({
      totalOpportunitiesReceived: 0,
      opsPerSecond: 0,
      opportunityTimestamps: [],
      exchangeHealth: {},
      tradeStream: [],
      systemMetrics: {},
    });
  },
}));
