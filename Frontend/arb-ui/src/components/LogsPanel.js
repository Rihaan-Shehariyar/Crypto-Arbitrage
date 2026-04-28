export default function LogsPanel({ logs }) {
  return (
    <div>
      <h2>📡 Live Logs</h2>
      <div
        style={{
          background: "#111",
          color: "#0f0",
          padding: "10px",
          height: "200px",
          overflowY: "scroll",
        }}
      >
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}