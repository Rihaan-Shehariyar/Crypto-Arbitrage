import useWebSocket from "./useWebSocket";
import useBalance from "./useBalance";
import Dashboard from "./components/Dashboard";

function App() {
  const { prices, opportunities, logs } = useWebSocket("ws://localhost:8080/ws");
  const balance = useBalance();

  return (
    <div className="antialiased">
      {/* Pass live data into the Dashboard component */}
      <Dashboard 
        liveOpportunities={opportunities} 
        liveLogs={logs} 
        balance={balance} 
      />
    </div>
  );
}

export default App;