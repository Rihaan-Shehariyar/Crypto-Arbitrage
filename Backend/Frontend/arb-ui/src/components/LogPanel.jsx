export default function LogsPanel({ logs }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">
        Live Logs
      </h2>

      <div className="h-48 overflow-y-auto bg-black rounded-lg p-3 text-green-400 text-sm font-mono">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}