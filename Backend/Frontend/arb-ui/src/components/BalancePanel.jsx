export default function BalancePanel({ balance }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">
        Exchange Balances
      </h2>

      {/* handle loading / empty */}
      {!balance && (
        <p className="text-gray-500 text-center py-4">
          Loading balances...
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(balance || {}).map(([exchange, assets]) => {

          const filtered = Object.entries(assets || {})
            .filter(([_, value]) => value > 0);

          if (filtered.length === 0) return null;

          return (
            <div
              key={exchange}
              className="bg-gray-800 p-3 rounded-lg"
            >
              <h3 className="font-semibold mb-2 capitalize">
                {exchange}
              </h3>

              {filtered.slice(0, 10).map(([asset, value]) => (
                <div key={asset} className="text-sm text-gray-300">
                  {asset}:{" "}
                  {typeof value === "number"
                    ? value.toFixed(4)
                    : value}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}