import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import type { WsMessage } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMetricsStore } from '@/store/useMetricsStore';

interface WebSocketContextType {
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  // Zustand actions
  const recordOpportunity = useMetricsStore(state => state.recordOpportunity);
  const updateOpsPerSecond = useMetricsStore(state => state.updateOpsPerSecond);
  const updateExchangeHealth = useMetricsStore(state => state.updateExchangeHealth);
  const addTradeToStream = useMetricsStore(state => state.addTradeToStream);
  const updateMetric = useMetricsStore(state => state.updateMetric);

  useEffect(() => {
    if (!token) return;

    let reconnectTimer: number;
    let opsTimer: number;
    let isIntentionalClose = false;

    // Start interval to calculate ops/sec
    opsTimer = window.setInterval(() => {
      updateOpsPerSecond();
    }, 200);

    const connect = () => {
      const wsUrl = `ws://127.0.0.1:8080/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        toast.success('Realtime feed connected', { id: 'ws-toast' });
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);

          if (message.type === 'PORTFOLIO_UPDATED') {
            console.log('PORTFOLIO_UPDATED', message.payload);
            queryClient.setQueryData(
              ['portfolio'],
              message.payload
            );
          } else if (message.type === 'TRADE_EXECUTED') {
            addTradeToStream(message.payload);
            queryClient.invalidateQueries({ queryKey: ['trades'] });
          } else if (message.type === 'OPPORTUNITY_FOUND') {
            recordOpportunity();
            queryClient.setQueryData(['opportunities'], (old: any[] = []) => {
              // Deduplicate or append? Keep hard cap of 500 opportunities
              return [message.payload, ...old].slice(0, 500);
            });
          } else if (message.type === 'EXCHANGE_HEALTH') {
            updateExchangeHealth(message.payload);
          } else if (message.type === 'METRIC_UPDATE') {
            updateMetric(message.payload.name, message.payload.value);
          } else if (message.type === 'RISK_UPDATED') {
            console.log('RISK_UPDATED', message.payload);
            queryClient.setQueryData(
              ['risk'],
              message.payload
            );
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!isIntentionalClose) {
          toast.error('Disconnected. Reconnecting...', { id: 'ws-toast' });
          reconnectTimer = window.setTimeout(() => connect(), 3000);
        }
      };

      ws.onerror = (err) => {
        if (isIntentionalClose) return;
        console.error('WebSocket Error', err);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      isIntentionalClose = true;
      clearTimeout(reconnectTimer);
      clearInterval(opsTimer);
      const socketToClose = wsRef.current;
      if (socketToClose) {
        if (socketToClose.readyState === WebSocket.CONNECTING) {
          // Wait for connection to establish before closing to avoid browser native error
          socketToClose.onopen = () => {
            socketToClose.close();
          };
        } else {
          socketToClose.close();
        }
      }
    };
  }, [token, queryClient, recordOpportunity, updateOpsPerSecond, updateExchangeHealth, addTradeToStream, updateMetric]);

  return (
    <WebSocketContext.Provider value={{ isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

