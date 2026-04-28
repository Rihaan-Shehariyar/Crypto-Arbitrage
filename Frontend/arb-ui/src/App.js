import useWebSocket from "./useWebSocket";
import OpportunityTable from "./components/OpportunityTable";
import LogsPanel from "./components/LogsPanel";

function App() {
  const { data, logs } = useWebSocket("ws://localhost:8080/ws");

  return (
    <div style={{ padding: "20px" }}>
      <h1>🚀 Crypto Arbitrage Dashboard</h1>

      <OpportunityTable data={data} />
      <br />
      <LogsPanel logs={logs} />
    </div>
  );
}

export default App;