export default function OpportunityTable({ data }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">
         Arbitrage Opportunities
      </h2>

      {data.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          No opportunities yet...
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="py-2">Coin</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>%</th>
              <th>Profit</th>
            </tr>
          </thead>

          <tbody>
            {data.map((o, i) => {
              const isProfit = o.percent > 0;
              const isHot = o.percent > 0.1;

              return (
                <tr
                  key={i}
                  className={`border-b border-gray-800 hover:bg-gray-800 transition ${
                    isHot ? "bg-green-900/30" : ""
                  }`}
                >
                  <td className="py-2 font-medium">
                    {o.coin}
                    {isHot && (
                      <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded">
                        HOT
                      </span>
                    )}
                  </td>

                  <td>{o.buy_from}</td>
                  <td>{o.sell_to}</td>

                  <td
                    className={`font-semibold ${
                      isProfit ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {o.percent.toFixed(3)}%
                  </td>

                  <td className="text-gray-300">
                    {o.profit.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}