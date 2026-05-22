import React from 'react';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  History,
  RefreshCcw,
  ArrowRightLeft,
  Search,
} from 'lucide-react';

const Dashboard = ({
  opportunities = [],
  balance = {},
  logs = [],
}) => {

  // Safe total balance calculation
  const totalBalance = Object.values(balance || {}).reduce(
    (acc, exchange) => {

      if (!exchange || typeof exchange !== 'object') {
        return acc;
      }

      const usdt = Number(exchange.USDT || 0);
      const usd = Number(exchange.USD || 0);
      const usdc = Number(exchange.USDC || 0);

      return acc + usdt + usd + usdc;
    },
    0
  );

  return (
    <div className="flex min-h-screen bg-background text-white font-sans selection:bg-accent-green/30">

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-sidebar border-r border-white/5 flex flex-col p-6 sticky top-0 h-screen">

        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-background rounded-full" />
          </div>

          <span className="text-xl font-bold tracking-tight">
            Arbitra
          </span>
        </div>

        <nav className="flex-1 space-y-8">

          <div>
            <p className="text-[10px] font-bold text-muted-text uppercase tracking-[2px] mb-4 opacity-50">
              General
            </p>

            <NavItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active
            />

            <NavItem
              icon={<FileText size={18} />}
              label="Documents"
              badge={logs.length > 0 ? '!' : null}
            />
          </div>

          <div>
            <p className="text-[10px] font-bold text-muted-text uppercase tracking-[2px] mb-4 opacity-50">
              Arbitrage
            </p>

            <NavItem
              icon={<PlusCircle size={18} />}
              label="New arbitrage"
            />

            <NavItem
              icon={<History size={18} />}
              label="History"
            />

            <NavItem
              icon={<RefreshCcw size={18} />}
              label="Exchanges"
            />
          </div>

        </nav>

        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 p-2">

            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10" />

            <div className="flex-1 overflow-hidden text-sm">
              <p className="font-medium truncate">
                Live Node
              </p>

              <p className="text-xs text-muted-text truncate font-mono">
                localhost:8080
              </p>
            </div>

            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />

          </div>
        </div>

      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8">

        <header className="flex justify-between items-center mb-10">

          <div className="relative w-96">

            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text"
              size={18}
            />

            <input
              type="text"
              placeholder="Search pairs or exchanges..."
              className="w-full bg-card border border-white/5 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-accent-green/30 transition-all text-sm"
            />
          </div>

          <div className="flex gap-4">
            <button className="bg-accent-green text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2">

              <PlusCircle size={18} />

              Manual Trade
            </button>
          </div>

        </header>

        {/* --- WALLET SECTION --- */}
        <section className="mb-10">

          <h2 className="text-sm font-semibold text-muted-text mb-4 uppercase tracking-wider">
            Total Portfolio
          </h2>

          <div className="bg-card rounded-2xl p-6 border border-white/5 relative overflow-hidden">

            <div className="flex items-baseline gap-3 mb-6">

              <h1 className="text-4xl font-bold tracking-tighter">
                {totalBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}

                <span className="text-xl text-muted-text font-normal ml-1">
                  USD
                </span>
              </h1>

              <span className="text-accent-green text-sm font-medium bg-accent-green/10 px-2 py-0.5 rounded-md">
                ↗ Live
              </span>

            </div>

            {/* Asset Bar */}
            <div className="flex gap-1 h-2 mb-6">

              {Object.keys(balance || {}).map((ex, i) => (

                <div
                  key={ex}
                  className="flex-1 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor:
                      i % 2 === 0 ? '#5EEAD4' : '#3B82F6',
                    opacity: 0.3 + (i * 0.2),
                  }}
                />

              ))}

            </div>

            {/* Exchange Balances */}
            <div className="flex flex-wrap gap-6 text-xs font-mono text-muted-text">

              {Object.entries(balance || {}).map(
                ([exchange, assets]) => (

                  <div
                    key={exchange}
                    className="flex items-center gap-2"
                  >

                    <div className="w-2 h-2 rounded-full bg-white/20" />

                    <span className="text-white uppercase font-bold">
                      {exchange}:
                    </span>

                    {Object.entries(assets || {})
                      .slice(0, 2)
                      .map(([coin, val]) => (

                        <span key={coin}>
                          {Number(val || 0).toFixed(2)} {coin}
                        </span>

                      ))}

                  </div>

                )
              )}

            </div>

          </div>

        </section>

        {/* --- OPPORTUNITIES TABLE --- */}
        <section>

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-sm font-semibold text-muted-text uppercase tracking-wider">
              Live Arbitrage Feed
            </h2>

            <div className="flex gap-2 text-[10px] font-bold">
              <span className="px-2 py-1 bg-white/5 rounded text-muted-text">
                1D
              </span>

              <span className="px-2 py-1 bg-accent-green text-black rounded">
                LIVE
              </span>
            </div>

          </div>

          <div className="bg-card rounded-2xl border border-white/5 overflow-hidden">

            <table className="w-full text-left border-collapse">

              <thead className="text-muted-text text-[11px] uppercase tracking-widest border-b border-white/5">

                <tr>
                  <th className="px-6 py-5 font-bold">
                    Market / Status
                  </th>

                  <th className="px-6 py-5 font-bold">
                    Route
                  </th>

                  <th className="px-6 py-5 font-bold">
                    Buy Price
                  </th>

                  <th className="px-6 py-5 font-bold">
                    Sell Price
                  </th>

                  <th className="px-6 py-5 font-bold text-right">
                    Spread
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {opportunities.length > 0 ? (

                  opportunities.map((o, i) => (

                    <tr
                      key={i}
                      className={`hover:bg-white/[0.02] transition-colors group ${
                        o?.percent > 0.1
                          ? 'bg-accent-green/[0.02]'
                          : ''
                      }`}
                    >

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <span className="font-bold text-sm tracking-tight">
                            {o?.symbol || 'N/A'}
                          </span>

                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              o?.percent > 0.1
                                ? 'bg-accent-green text-black'
                                : 'bg-white/5 text-muted-text'
                            }`}
                          >
                            {o?.percent > 0.1
                              ? 'HOT'
                              : 'ACTIVE'}
                          </span>

                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2 text-xs text-muted-text">

                          <span className="text-white font-medium">
                            {o?.buy_from || 'N/A'}
                          </span>

                          <ArrowRightLeft
                            size={12}
                            className="opacity-30"
                          />

                          <span className="text-white font-medium">
                            {o?.sell_to || 'N/A'}
                          </span>

                        </div>

                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-accent-green">
                        {Number(o?.buy_price || 0).toFixed(6)}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-accent-red">
                        {Number(o?.sell_price || 0).toFixed(6)}
                      </td>

                      <td className="px-6 py-4 text-right">

                        <div className="flex flex-col items-end">

                          <span
                            className={`text-sm font-bold ${
                              o?.percent > 0
                                ? 'text-accent-green'
                                : 'text-accent-red'
                            }`}
                          >
                            {Number(o?.percent || 0).toFixed(3)}%
                          </span>

                          <span className="text-[10px] text-muted-text font-mono">
                            Est. $
                            {Number(o?.profit || 0).toFixed(2)}
                          </span>

                        </div>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-muted-text italic text-sm"
                    >

                      <div className="flex flex-col items-center gap-3">

                        <div className="w-5 h-5 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />

                        Listening for arbitrage opportunities...

                      </div>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
  badge,
}) => (

  <div
    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
      active
        ? 'bg-white/10 text-white'
        : 'text-muted-text hover:bg-white/5 hover:text-white'
    }`}
  >


    <div className="flex items-center gap-3">

      <span
        className={`${
          active
            ? 'text-accent-green'
            : 'group-hover:text-accent-green'
        } transition-colors`}
      >
        {icon}
      </span>

      <span className="text-sm font-semibold tracking-tight">
        {label}
      </span>

    </div>

    {badge && (
      <span className="bg-accent-red text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
        {badge}
      </span>
    )}

  </div>
);

export default Dashboard;