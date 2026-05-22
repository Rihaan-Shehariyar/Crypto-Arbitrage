import { create } from 'zustand';

export type SessionStatus = 'ACTIVE' | 'INACTIVE' | 'STARTING' | 'STOPPING';

interface SessionState {
  tradingEnabled: boolean;
  tradingLoading: boolean;
  lastStartedAt: number | null;
  sessionStatus: SessionStatus;
  
  // Metrics for current session
  activeSessionDurationSec: number;
  sessionTrades: number;
  sessionPnl: number;

  // Actions
  setTradingLoading: (loading: boolean, status?: SessionStatus) => void;
  startSession: () => void;
  stopSession: () => void;
  tickDuration: () => void;
  incrementSessionTrades: (pnl: number) => void;
  resetSessionMetrics: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  tradingEnabled: false,
  tradingLoading: false,
  lastStartedAt: null,
  sessionStatus: 'INACTIVE',
  
  activeSessionDurationSec: 0,
  sessionTrades: 0,
  sessionPnl: 0,

  setTradingLoading: (loading, status) => set(() => ({ 
    tradingLoading: loading,
    ...(status ? { sessionStatus: status } : {})
  })),

  startSession: () => set({
    tradingEnabled: true,
    tradingLoading: false,
    sessionStatus: 'ACTIVE',
    lastStartedAt: Date.now(),
    activeSessionDurationSec: 0,
    sessionTrades: 0,
    sessionPnl: 0,
  }),

  stopSession: () => set({
    tradingEnabled: false,
    tradingLoading: false,
    sessionStatus: 'INACTIVE',
    lastStartedAt: null,
  }),

  tickDuration: () => set((state) => {
    if (state.sessionStatus === 'ACTIVE' && state.lastStartedAt) {
      return { activeSessionDurationSec: Math.floor((Date.now() - state.lastStartedAt) / 1000) };
    }
    return state;
  }),

  incrementSessionTrades: (pnl: number) => set((state) => ({
    sessionTrades: state.sessionTrades + 1,
    sessionPnl: state.sessionPnl + pnl,
  })),

  resetSessionMetrics: () => set({
    activeSessionDurationSec: 0,
    sessionTrades: 0,
    sessionPnl: 0,
  }),
}));
