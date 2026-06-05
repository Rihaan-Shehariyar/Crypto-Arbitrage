import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ChevronRight,
  Radar,
  ShieldCheck,
  Coins,
  Lock,
  Layers,
  Cpu,
  Menu,
  X,
  TrendingUp,
  ArrowRight,
  BarChart2,
  Zap,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { stopTrading } from '@/services/endpoints';
import { useSessionStore } from '@/store/useSessionStore';

// ── Check icon ─────────────────────────────────────────────────────────
function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Landing() {
  const token               = useAuthStore((s) => s.token);
  const subscriptionActive  = useAuthStore((s) => s.user?.subscription_active);
  const logout              = useAuthStore((s) => s.logout);
  const navigate            = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Live telemetry counters
  const [ticksCount,         setTicksCount]         = useState(1_482_910);
  const [avgLatency,         setAvgLatency]         = useState(12.4);
  const [opportunitySpread,  setOpportunitySpread]  = useState(1.85);

  useEffect(() => {
    const t1 = setInterval(() => {
      setTicksCount(p => p + Math.floor(Math.random() * 5) + 1);
    }, 400);
    const t2 = setInterval(() => {
      setAvgLatency(p   => parseFloat(Math.max(9.2,  Math.min(14.8, p + (Math.random() - 0.5) * 0.4)).toFixed(1)));
      setOpportunitySpread(p => parseFloat(Math.max(0.8, Math.min(3.5, p + (Math.random() - 0.5) * 0.1)).toFixed(2)));
    }, 2000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const handleLogout = async () => {
    try { await stopTrading(); } catch {}
    finally {
      useSessionStore.getState().stopSession();
      useSessionStore.getState().resetSessionMetrics();
      logout();
      navigate('/');
    }
  };

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Reusable feature card ──
  const FeatureCard = ({
    icon: Icon,
    num,
    title,
    desc,
  }: {
    icon: React.ElementType;
    num: string;
    title: string;
    desc: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-[#e5e7eb] rounded-2xl p-6 hover:shadow-lg hover:border-[#f4a622]/30 transition-all duration-300 group"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#f4a622]/10 border border-[#f4a622]/20 flex items-center justify-center group-hover:bg-[#f4a622]/15 transition-colors">
          <Icon className="w-5 h-5 text-[#f4a622]" />
        </div>
        <span className="text-xs font-bold text-[#6b7280] uppercase tracking-widest">{num}</span>
      </div>
      <h3 className="text-sm font-bold text-[#1f2937] mb-2">{title}</h3>
      <p className="text-sm text-[#6b7280] leading-relaxed">{desc}</p>
    </motion.div>
  );

  return (
    <div className="bg-[#f4f6f9] text-[#1f2937] min-h-screen font-sans overflow-x-hidden scroll-smooth">

      {/* ════════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5e7eb] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#143b63' }}>
              <Activity className="w-4 h-4 text-[#f4a622]" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#143b63]">Arbitra</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f4a622]/10 text-[#f4a622] border border-[#f4a622]/25 uppercase tracking-wider">
              Pro
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6b7280]">
            <button onClick={() => scrollTo('features')}    className="hover:text-[#143b63] transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#143b63] transition-colors">How It Works</button>
            <button onClick={() => scrollTo('pricing')}     className="hover:text-[#143b63] transition-colors">Pricing</button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!token ? (
              <>
                <Link to="/login"
                  className="text-sm font-semibold text-[#6b7280] hover:text-[#143b63] px-4 py-2 rounded-lg hover:bg-[#f4f6f9] transition-colors">
                  Sign In
                </Link>
                <Link to="/register"
                  className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#1f2937] hover:border-[#143b63]/30 hover:bg-white transition-colors">
                  Register
                </Link>
                <Link to="/pricing"
                  className="text-sm font-bold px-5 py-2 rounded-lg text-white transition-all hover:opacity-90 shadow-sm"
                  style={{ background: '#f4a622' }}>
                  Get Started
                </Link>
              </>
            ) : !subscriptionActive ? (
              <>
                <Link to="/pricing"
                  className="text-sm font-semibold text-[#6b7280] hover:text-[#143b63] px-4 py-2 rounded-lg hover:bg-[#f4f6f9] transition-colors">
                  Pricing
                </Link>
                <button onClick={handleLogout}
                  className="text-sm font-semibold px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/dashboard"
                  className="text-sm font-bold px-5 py-2 rounded-lg text-white transition-all hover:opacity-90 shadow-sm"
                  style={{ background: '#143b63' }}>
                  Go to Dashboard
                </Link>
                <button onClick={handleLogout}
                  className="text-sm font-semibold px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors">
                  Sign Out
                </button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-[#6b7280] hover:bg-[#f4f6f9] transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-[#e5e7eb] bg-white overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                <button onClick={() => scrollTo('features')}    className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#6b7280] hover:text-[#143b63] hover:bg-[#f4f6f9] rounded-lg transition-colors">Features</button>
                <button onClick={() => scrollTo('how-it-works')} className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#6b7280] hover:text-[#143b63] hover:bg-[#f4f6f9] rounded-lg transition-colors">How It Works</button>
                <button onClick={() => scrollTo('pricing')}     className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#6b7280] hover:text-[#143b63] hover:bg-[#f4f6f9] rounded-lg transition-colors">Pricing</button>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-[#e5e7eb] flex flex-col gap-2">
                {!token ? (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg border border-[#e5e7eb] text-sm font-semibold text-[#6b7280] hover:bg-[#f4f6f9] transition-colors">
                      Sign In
                    </Link>
                    <Link to="/pricing" onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-white transition-all"
                      style={{ background: '#f4a622' }}>
                      Get Started
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-white"
                      style={{ background: '#143b63' }}>
                      Go to Dashboard
                    </Link>
                    <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="w-full text-center py-2.5 rounded-lg border border-rose-200 text-sm font-semibold text-rose-600">
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════ */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Background shape */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.07]"
               style={{ background: 'radial-gradient(circle, #f4a622 0%, transparent 70%)' }} />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-[0.05]"
               style={{ background: 'radial-gradient(circle, #143b63 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: Copy */}
            <div className="lg:col-span-6 space-y-7">
              {/* Badge */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e5e7eb] shadow-sm text-xs font-semibold text-[#6b7280]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live scanner — 14 exchanges connected
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1f2937] leading-[1.1] tracking-tight">
                  Professional
                  <span className="block" style={{ color: '#143b63' }}>Crypto Arbitrage</span>
                  <span className="block" style={{ color: '#f4a622' }}>Intelligence Platform</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base text-[#6b7280] leading-relaxed max-w-lg"
              >
                Monitor cross-exchange price spreads in real time, simulate paper trades with live metrics,
                and track execution data through a single professional dashboard workspace.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-3 pt-1"
              >
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90 transition-all"
                  style={{ background: '#f4a622' }}>
                  Get Started Free <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#143b63] bg-white border border-[#e5e7eb] hover:border-[#143b63]/30 hover:shadow-sm transition-all">
                  Sign In
                </Link>
                <Link to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white transition-all border border-[#e5e7eb] text-[#6b7280] hover:text-[#143b63]">
                  View Pricing
                </Link>
              </motion.div>

              {/* Live Metrics Strip */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-3 gap-4 bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-sm"
              >
                <div className="space-y-1">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold">Avg. Latency</p>
                  <p className="text-xl font-bold" style={{ color: '#f4a622' }}>{avgLatency}<span className="text-sm font-normal text-[#6b7280] ml-1">ms</span></p>
                </div>
                <div className="space-y-1 border-l border-[#e5e7eb] pl-4">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold">Ticks Analyzed</p>
                  <p className="text-xl font-bold text-[#1f2937]">{ticksCount.toLocaleString()}</p>
                </div>
                <div className="space-y-1 border-l border-[#e5e7eb] pl-4">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold">Spread Range</p>
                  <p className="text-xl font-bold text-emerald-600">+{opportunitySpread}%</p>
                </div>
              </motion.div>
            </div>

            {/* Right: Dashboard Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-6 relative"
            >
              <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-xl overflow-hidden">
                {/* Window bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb] bg-[#f4f6f9]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-[#6b7280]">Arbitra — Live Feed Dashboard</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </div>
                </div>

                {/* Mock dashboard body */}
                <div className="p-5 space-y-3">
                  {/* Mini stat row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Portfolio Value', value: '$42,910', color: '#1f2937' },
                      { label: 'Total Trades',   value: '2,108',    color: '#f4a622'  },
                      { label: 'Daily PnL',      value: '+$284.50', color: '#059669'  },
                    ].map(s => (
                      <div key={s.label} className="bg-[#f4f6f9] border border-[#e5e7eb] rounded-xl p-3">
                        <p className="text-[9px] text-[#6b7280] uppercase tracking-wider font-semibold mb-1">{s.label}</p>
                        <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Opportunity rows */}
                  <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                    <div className="bg-[#f4f6f9] border-b border-[#e5e7eb] px-4 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Arbitrage Scanner</span>
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />8 opportunities
                      </span>
                    </div>
                    {[
                      { symbol: 'BTC/USDT', route: 'Binance → Bybit',  spread: '+1.64%', profit: '+$124.50', latency: '11ms' },
                      { symbol: 'ETH/USDT', route: 'OKX → Kraken',     spread: '+0.95%', profit: '+$68.20',  latency: '14ms' },
                      { symbol: 'SOL/USDT', route: 'Bybit → Binance',  spread: '+1.12%', profit: '+$41.80',  latency: '9ms'  },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#e5e7eb] last:border-0 text-xs hover:bg-[#f4f6f9] transition-colors">
                        <span className="font-bold text-[#1f2937] w-20">{row.symbol}</span>
                        <span className="text-[#6b7280] flex-1 flex items-center gap-1">
                          {row.route.split(' → ')[0]}
                          <ArrowRight className="w-3 h-3 opacity-40" />
                          {row.route.split(' → ')[1]}
                        </span>
                        <span className="font-bold text-emerald-600 w-14 text-right">{row.spread}</span>
                        <span className="font-bold text-emerald-600 w-20 text-right">{row.profit}</span>
                        <span className="text-[#6b7280] w-10 text-right text-[10px]">{row.latency}</span>
                      </div>
                    ))}
                  </div>

                  {/* Exchange health mini */}
                  <div className="grid grid-cols-3 gap-2">
                    {['Binance', 'Bybit', 'OKX'].map(ex => (
                      <div key={ex} className="flex items-center gap-2 px-3 py-2 bg-[#f4f6f9] border border-[#e5e7eb] rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-[#1f2937]">{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-3 -right-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e5e7eb] shadow-lg text-xs font-bold text-[#143b63]">
                <TrendingUp className="w-3.5 h-3.5 text-[#f4a622]" />
                Paper Trading Platform
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TRUST BAR
      ════════════════════════════════════════════════════════ */}
      <section className="py-8 border-y border-[#e5e7eb] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {[
              { label: '14+ Exchanges',    icon: Globe },
              { label: 'Sub-15ms Latency', icon: Zap   },
              { label: 'Real-Time Spreads',icon: BarChart2 },
              { label: 'Paper Trading',    icon: ShieldCheck },
              { label: 'No API Keys Required', icon: Coins },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-semibold text-[#6b7280]">
                <Icon className="w-4 h-4 text-[#f4a622]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-[#f4f6f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ background: 'rgba(244,166,34,0.1)', color: '#f4a622' }}>
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1f2937] tracking-tight">From Scan to Insight in Seconds</h2>
            <p className="text-[#6b7280] mt-3 text-sm max-w-lg mx-auto leading-relaxed">
              Arbitra aggregates live exchange orderbooks and surfaces actionable arbitrage data through a clean, professional interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Radar,
                title: 'Continuous Price Monitoring',
                desc: 'Real-time orderbooks across 14+ exchanges are scanned millisecond-by-millisecond to identify cross-exchange price differentials.',
                cta: 'Real-time scan',
              },
              {
                step: '02',
                icon: ShieldCheck,
                title: 'Exposure & Risk Simulation',
                desc: 'Safeguards calculate expected slippage, order weights, and exposure limits before routing simulated paper trades.',
                cta: 'Risk management',
              },
              {
                step: '03',
                icon: BarChart2,
                title: 'Live Workspace Analytics',
                desc: 'Executed paper trades sync instantly to your portfolio dashboard — balance charts, PnL metrics, and trade history.',
                cta: 'Unified analytics',
              },
            ].map((card, i) => (
              <motion.div
                key={card.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white border border-[#e5e7eb] rounded-2xl p-6 hover:shadow-lg hover:border-[#143b63]/20 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: '#143b63' }}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-3xl font-black text-[#e5e7eb]">{card.step}</span>
                </div>
                <h3 className="text-base font-bold text-[#1f2937] mb-2">{card.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed flex-1">{card.desc}</p>
                <div className="flex items-center gap-1.5 mt-5 text-xs font-bold" style={{ color: '#f4a622' }}>
                  {card.cta} <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURES GRID
      ════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ background: 'rgba(244,166,34,0.1)', color: '#f4a622' }}>
              Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1f2937] tracking-tight">Everything You Need</h2>
            <p className="text-[#6b7280] mt-3 text-sm max-w-lg mx-auto leading-relaxed">
              Professional-grade monitoring and simulation tools designed for cryptocurrency arbitrage analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Radar}       num="01" title="Arbitrage Spread Scanner"  desc="Continuously query orderbooks across major crypto venues. Filter and rank real-time opportunity spreads by profitability and latency." />
            <FeatureCard icon={Cpu}         num="02" title="Paper Trading Engine"      desc="Initiate simulated orders across exchange proxies. Verify latency indicators, fills, spread payouts, and execution paths risk-free." />
            <FeatureCard icon={Coins}       num="03" title="Live Portfolio Tracking"   desc="Monitor simulated asset allocations, virtual balances, and cumulative paper PnL updates across all connected exchange accounts." />
            <FeatureCard icon={ShieldCheck} num="04" title="Exposure Risk Monitor"     desc="Protect strategies with automated slippage limits, max open trade thresholds, and real-time rejection reason telemetry." />
            <FeatureCard icon={Activity}    num="05" title="Execution Feed Logs"       desc="Review structured trade history mapping execution latency, routing venues, profit per trade, and trade status in real time." />
            <FeatureCard icon={Layers}      num="06" title="Multi-Exchange Health"     desc="Query status indicators and latency metrics across active exchanges simultaneously to identify optimal trading pathways." />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          LOCKED PREVIEW
      ════════════════════════════════════════════════════════ */}
      <section id="previews" className="py-20 bg-[#f4f6f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ background: 'rgba(20,59,99,0.08)', color: '#143b63' }}>
              Workspace Previews
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1f2937] tracking-tight">Pro Dashboard Access</h2>
            <p className="text-[#6b7280] mt-3 text-sm max-w-lg mx-auto leading-relaxed">
              Full workspace sections are unlocked with an active subscription.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner preview */}
            <div className="relative bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm group">
              <div className="p-5 blur-sm pointer-events-none select-none">
                <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
                  <div className="bg-[#f4f6f9] border-b border-[#e5e7eb] px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Opportunity Scanner</span>
                    <span className="text-xs font-semibold text-emerald-600">14 live</span>
                  </div>
                  {['BTC/USDT · Binance → Bybit · +1.64% · $124.50',
                    'ETH/USDT · OKX → Kraken · +0.95% · $68.20',
                    'SOL/USDT · Bybit → Binance · +1.12% · $41.80'].map((row, i) => (
                    <div key={i} className="px-4 py-3 border-b border-[#e5e7eb] last:border-0 text-xs text-[#6b7280] flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      {row}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[1px]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm" style={{ background: '#143b63' }}>
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-sm text-[#1f2937] mb-1">Opportunity Scanner</p>
                <p className="text-xs text-[#6b7280] mb-4">Active subscription required</p>
                <Link to="/pricing"
                  className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: '#f4a622' }}>
                  Unlock Access
                </Link>
              </div>
            </div>

            {/* Analytics preview */}
            <div className="relative bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm group">
              <div className="p-5 blur-sm pointer-events-none select-none">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[['Net Balance', '$42,910 USDT'], ['Paper Trades', '2,108']].map(([l, v]) => (
                    <div key={l} className="bg-[#f4f6f9] border border-[#e5e7eb] rounded-xl p-3">
                      <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold mb-1">{l}</p>
                      <p className="text-base font-bold text-[#1f2937]">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="h-24 bg-[#f4f6f9] border border-[#e5e7eb] rounded-xl flex items-end px-3 pb-3 gap-1">
                  {[40, 65, 45, 80, 60, 90, 70, 85, 55, 95, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 0.7}%`, background: '#f4a622', opacity: 0.3 + i * 0.06 }} />
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[1px]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm" style={{ background: '#143b63' }}>
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-sm text-[#1f2937] mb-1">Trading Analytics</p>
                <p className="text-xs text-[#6b7280] mb-4">Verify executions & balance charts</p>
                <Link to="/pricing"
                  className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: '#f4a622' }}>
                  Unlock Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ background: 'rgba(244,166,34,0.1)', color: '#f4a622' }}>
              Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1f2937] tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-[#6b7280] mt-3 text-sm max-w-lg mx-auto leading-relaxed">
              One professional plan — everything included, no hidden fees.
            </p>
          </div>

          <div className="max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white border-2 rounded-2xl p-8 shadow-xl relative overflow-hidden"
              style={{ borderColor: '#f4a622' }}
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: '#f4a622' }} />

              <div className="text-center mb-6 pb-6 border-b border-[#e5e7eb]">
                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                      style={{ background: 'rgba(244,166,34,0.1)', color: '#f4a622' }}>
                  Pro Terminal
                </span>
                <div className="text-4xl font-black text-[#1f2937] mb-1">
                  $49
                  <span className="text-base font-normal text-[#6b7280] ml-1">/ month</span>
                </div>
                <p className="text-xs text-[#6b7280]">All features included · Cancel anytime</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Realtime Arbitrage Scanner',
                  'Paper Trading Engine',
                  'Live Portfolio Tracking',
                  'Execution Feed Logs',
                  'Risk Monitoring Dashboard',
                  'Multi-Exchange Health Monitor',
                  'Real-time Analytics Charts',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#1f2937] font-medium">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(244,166,34,0.15)' }}>
                      <Check className="w-3 h-3 text-[#f4a622]" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Link to="/pricing"
                className="block w-full text-center py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-md"
                style={{ background: '#f4a622' }}>
                Start Pro Access
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer className="bg-[#143b63] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/10">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f4a622]/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#f4a622]" />
              </div>
              <span className="font-bold text-base text-white">Arbitra</span>
            </div>
            {/* Links */}
            <nav className="flex gap-6 text-sm font-medium text-slate-300">
              <button onClick={() => scrollTo('features')}     className="hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">How It Works</button>
              <button onClick={() => scrollTo('pricing')}      className="hover:text-white transition-colors">Pricing</button>
            </nav>
          </div>

          {/* Disclaimer */}
          <div className="space-y-3 text-xs text-slate-400 leading-relaxed max-w-4xl">
            <p>
              <strong className="text-amber-400">Important Notice:</strong>{' '}
              Arbitra is a cryptocurrency price-difference monitor, live market terminal, and simulated paper trading platform.
              Arbitra is not a registered financial advisor or broker-dealer.
            </p>
            <p>
              All systems, execution feeds, and balance updates represent purely mock paper runs.
              No actual cryptocurrency is transferred, sold, or traded. Arbitra does not access real exchange wallets, private keys, or trading credentials.
            </p>
            <p>
              Past performance metrics do not guarantee future results. Monitoring cryptocurrency price opportunities carries risk.
              All operators assume full accountability regarding their private trading decisions.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-500">
            <span>© 2026 Arbitra. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
