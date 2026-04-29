import useWebSocket from "./useWebSocket";
import OpportunityTable from "./components/OpportunityTable";
import LogsPanel from "./components/LogPanel";
import useBalance from "./useBalance";
import BalancePanel from "./components/BalancePanel";


function App() {
  const { data, logs } = useWebSocket("ws://localhost:8080/ws");
  const balance = useBalance();


   return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold text-center">
          Crypto Arbitrage Dashboard
        </h1>

        <BalancePanel balance={balance} />

        <OpportunityTable data={data} />

        <LogsPanel logs={logs} />

      </div>
    </div>
  );
}

export default App;