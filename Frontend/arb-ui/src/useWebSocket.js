import { useEffect, useState } from "react";

export default function useWebSocket(url) {

  const [prices, setPrices] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = (err) => {
      console.log("WS error:", err);
    };

    ws.onmessage = (event) => {

      const msg = JSON.parse(event.data);
console.log(msg);

      // -------------------------
      // MARKET PRICE STREAM
      // -------------------------

      if (msg.type === "price") {

        setPrices((prev) => {

          const filtered = prev.filter(
            (p) =>
              !(
                p.exchange === msg.exchange &&
                p.symbol === msg.symbol
              )
          );

          return [
            msg,
            ...filtered,
          ];
        });

        setLogs((prev) => [
          `[PRICE] ${msg.exchange} ${msg.symbol} ${msg.bid} / ${msg.ask}`,
          ...prev.slice(0, 50),
        ]);
      }

      // -------------------------
      // ARBITRAGE OPPORTUNITY
      // -------------------------

      if (msg.type === "opportunity") {

        setOpportunities((prev) => [
          msg,
          ...prev.slice(0, 20),
        ]);

        setLogs((prev) => [
          `[ARB] ${msg.symbol} ${msg.percent.toFixed(3)}%`,
          ...prev.slice(0, 50),
        ]);
      }
    };

    return () => ws.close();

  }, [url]);

  return {
    prices,
    opportunities,
    logs,
  };
}