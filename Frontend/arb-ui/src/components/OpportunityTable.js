export default function OpportunityTable({ data }) {
  return (
    <div>
      <h2>📊 Arbitrage Opportunities</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Coin</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>%</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {data.map((o, i) => (
            <tr key={i}>
              <td>{o.coin}</td>
              <td>{o.buy_from}</td>
              <td>{o.sell_to}</td>
              <td style={{ color: o.percent > 0 ? "green" : "red" }}>
                {o.percent.toFixed(3)}%
              </td>
              <td>{o.profit.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}