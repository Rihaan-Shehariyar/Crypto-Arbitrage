import { useEffect, useState } from "react";

export default function useWebSocket(url) {
  const [data, setData] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      // store opportunities
      setData((prev) => [msg, ...prev.slice(0, 20)]);

      // store logs
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ${msg.coin} ${msg.percent.toFixed(3)}%`,
        ...prev.slice(0, 50),
      ]);
    };

    return () => ws.close();
  }, [url]);

  return { data, logs };
}