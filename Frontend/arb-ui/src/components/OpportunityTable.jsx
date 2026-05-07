export default function OpportunityTable({ data = [] }) {

  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Realtime Arbitrage Opportunities
        </h2>

        <span className="text-xs text-gray-400">
          Live Market Feed
        </span>
      </div>

      {data.length === 0 && (
        <p className="text-gray-500 text-center py-6">
          Waiting for arbitrage opportunities...
        </p>
      )}

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-left">

          <thead className="text-gray-400 border-b border-gray-700">

            <tr>
              <th className="py-3">Symbol</th>
              <th>Buy From</th>
              <th>Sell To</th>
              <th>Spread %</th>
              <th>Expected Profit</th>
              <th>Status</th>
              <th>Time</th>
            </tr>

          </thead>

          <tbody>

            {data.map((o, i) => {

              const isProfit = o.percent > 0;
              const isHot = o.percent > 0.1;

              return (

                <tr
                  key={i}
                  className={`
                    border-b border-gray-800
                    hover:bg-gray-800
                    transition
                    ${isHot ? "bg-green-900/20" : ""}
                  `}
                >

                  {/* SYMBOL */}
                  <td className="py-3 font-semibold">

                    <div className="flex items-center">

                      {o.symbol}

                      {isHot && (
                        <span className="
                          ml-2
                          text-xs
                          bg-green-500
                          px-2
                          py-1
                          rounded
                        ">
                          HOT
                        </span>
                      )}
                    </div>

                  </td>

                  {/* BUY */}
                  <td>

                    <div className="flex flex-col">

                      <span className="font-medium">
                        {o.buy_from}
                      </span>

                      <span className="text-xs text-green-400">
                        {o.buy_price?.toFixed(8)}
                      </span>

                    </div>

                  </td>

                  {/* SELL */}
                  <td>

                    <div className="flex flex-col">

                      <span className="font-medium">
                        {o.sell_to}
                      </span>

                      <span className="text-xs text-red-400">
                        {o.sell_price?.toFixed(8)}
                      </span>

                    </div>

                  </td>

                  {/* SPREAD */}
                  <td
                    className={`
                      font-semibold
                      ${isProfit
                        ? "text-green-400"
                        : "text-red-400"
                      }
                    `}
                  >
                    {o.percent?.toFixed(3)}%
                  </td>

                  {/* PROFIT */}
                  <td className="text-gray-300">
                    ${o.profit?.toFixed(4)}
                  </td>

                  {/* STATUS */}
                  <td>

                    <span className="
                      text-xs
                      px-2
                      py-1
                      rounded
                      bg-blue-500/20
                      text-blue-300
                    ">
                      ACTIVE
                    </span>

                  </td>

                  {/* TIME */}
                  <td className="text-gray-400 text-xs">

                    {new Date(
                      o.time || Date.now()
                    ).toLocaleTimeString()}

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