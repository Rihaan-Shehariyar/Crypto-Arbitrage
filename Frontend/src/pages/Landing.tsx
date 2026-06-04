import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  ChevronRight, 
  Terminal, 
  Radar, 
  ShieldCheck, 
  Coins, 
  Lock, 
  Layers,
  Database,
  Cpu,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { stopTrading } from '@/services/endpoints';
import { useSessionStore } from '@/store/useSessionStore';

export default function Landing() {
  const token = useAuthStore((state) => state.token);
  const subscriptionActive = useAuthStore((state) => state.user?.subscription_active);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await stopTrading();
    } catch (err) {
      console.error('Failed to stop trading during landing logout:', err);
    } finally {
      useSessionStore.getState().stopSession();
      useSessionStore.getState().resetSessionMetrics();
      logout();
      navigate('/');
    }
  };

  // Mobile navbar collapse state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Live telemetry counters
  const [ticksCount, setTicksCount] = useState(1482910);
  const [avgLatency, setAvgLatency] = useState(12.4);
  const [opportunitySpread, setOpportunitySpread] = useState(1.85);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTicksCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 400);

    const metricsInterval = setInterval(() => {
      setAvgLatency((prev) => {
        const change = (Math.random() - 0.5) * 0.4;
        return parseFloat(Math.max(9.2, Math.min(14.8, prev + change)).toFixed(1));
      });
      setOpportunitySpread((prev) => {
        const change = (Math.random() - 0.5) * 0.1;
        return parseFloat(Math.max(0.8, Math.min(3.5, prev + change)).toFixed(2));
      });
    }, 2000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(metricsInterval);
    };
  }, []);



  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#050505] text-[#F3F4F6] min-h-screen font-mono relative overflow-x-hidden scroll-smooth">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F0F_1px,transparent_1px),linear-gradient(to_bottom,#0F0F0F_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="border-b border-[#1A1A1A] bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left Side: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(94,234,212,0.1)]">
              <Activity className="text-primary w-5 h-5 animate-pulse" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-wider text-white">ARBITRA</span>
            <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded tracking-widest font-bold">
              PRO
            </span>
          </div>

          {/* Center Navigation Links (smooth scroll) */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            <button onClick={() => scrollToSection('features')} className="hover:text-primary transition-colors focus:outline-none">FEATURES</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-primary transition-colors focus:outline-none">HOW IT WORKS</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-primary transition-colors focus:outline-none">PRICING</button>
          </nav>

          {/* Right Nav Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!token ? (
              <>
                <Link 
                  to="/login" 
                  className="text-muted-foreground hover:text-white px-3 py-1.5 border border-transparent hover:border-border rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="text-white hover:text-primary border border-[#222] hover:border-primary px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_10px_rgba(94,234,212,0.2)] bg-black/40"
                >
                  Register
                </Link>
                <Link 
                  to="/pricing" 
                  className="bg-primary text-black hover:bg-primary/95 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(94,234,212,0.15)] duration-300 hover:shadow-[0_0_20px_rgba(94,234,212,0.3)]"
                >
                  Upgrade
                </Link>
              </>
            ) : !subscriptionActive ? (
              <>
                <Link 
                  to="/pricing" 
                  className="text-muted-foreground hover:text-white px-3 py-1.5 border border-transparent hover:border-border rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Pricing
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className="bg-primary text-black hover:bg-primary/90 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(94,234,212,0.15)] duration-300 hover:shadow-[0_0_20px_rgba(94,234,212,0.3)]"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="text-muted-foreground hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden border-t border-[#1A1A1A] bg-[#0A0A0A] px-4 py-4 space-y-4 font-mono overflow-hidden"
            >
              <div className="flex flex-col gap-3.5 text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                <button onClick={() => scrollToSection('features')} className="text-left py-1.5 hover:text-primary transition-colors">FEATURES</button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-left py-1.5 hover:text-primary transition-colors">HOW IT WORKS</button>
                <button onClick={() => scrollToSection('pricing')} className="text-left py-1.5 hover:text-primary transition-colors">PRICING</button>
              </div>

              <div className="border-t border-[#222] my-2 pt-4 flex flex-col gap-2.5">
                {!token ? (
                  <>
                    <Link 
                      to="/login" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center text-muted-foreground hover:text-white py-2 border border-border rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center text-white hover:text-primary border border-border hover:border-primary py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      Register
                    </Link>
                    <Link 
                      to="/pricing" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center bg-primary text-black hover:bg-primary/90 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      Upgrade
                    </Link>
                  </>
                ) : !subscriptionActive ? (
                  <>
                    <Link 
                      to="/pricing" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center text-muted-foreground hover:text-white py-2 border border-border rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      Pricing
                    </Link>
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-center bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/dashboard" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center bg-primary text-black hover:bg-primary/90 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-center bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-r border-l border-[#141414]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            {/* Live Indicator Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-black/40 border border-[#222] font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Realtime Scanner: 14 exchanges connected</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-[1.1] font-mono">
              Realtime Crypto <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 neon-text">
                Arbitrage Monitor
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground font-mono leading-relaxed max-w-xl uppercase tracking-wide">
              Track cross-exchange price differences, simulate paper trades with live metrics, and monitor execution data through a single professional trading terminal workspace.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/register"
                className="bg-primary text-black hover:bg-primary/95 px-6 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(94,234,212,0.2)] hover:shadow-[0_0_30px_rgba(94,234,212,0.3)] duration-300 flex items-center justify-center min-w-[140px] gap-1.5"
              >
                Get Started <ChevronRight className="w-4 h-4 text-black" />
              </Link>
              <Link
                to="/login"
                className="bg-[#0E0E0E] hover:bg-[#151515] border border-[#262626] hover:border-primary/50 text-white px-6 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center min-w-[120px]"
              >
                Login
              </Link>
              <Link
                to="/pricing"
                className="bg-[#050505] hover:bg-[#111] border border-primary/20 hover:border-primary text-primary px-6 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center min-w-[120px]"
              >
                Upgrade
              </Link>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-3 gap-4 border border-[#1A1A1A] bg-black/30 p-4 rounded mt-8">
              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground block uppercase tracking-wider">LATENCY TIMER</span>
                <span className="text-sm sm:text-lg font-bold text-primary font-mono">{avgLatency} ms</span>
              </div>
              <div className="space-y-1 border-l border-[#1A1A1A] pl-4">
                <span className="text-[9px] text-muted-foreground block uppercase tracking-wider">TICKS ANALYZED</span>
                <span className="text-sm sm:text-lg font-bold text-white font-mono">{ticksCount.toLocaleString()}</span>
              </div>
              <div className="space-y-1 border-l border-[#1A1A1A] pl-4">
                <span className="text-[9px] text-muted-foreground block uppercase tracking-wider">SPREAD RANGE</span>
                <span className="text-sm sm:text-lg font-bold text-blue-400 font-mono">+{opportunitySpread}%</span>
              </div>
            </div>
          </div>

          {/* Right Visual Console Graphic */}
          <div className="lg:col-span-5 relative">
            <div className="border border-border/80 bg-[#0F0F0F] rounded overflow-hidden shadow-2xl">
              <div className="bg-[#161616] px-4 py-2 border-b border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-primary" />
                  <span className="font-bold tracking-wider">TERMINAL PREVIEW [LIVE_FEED]</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
              </div>

              <div className="p-4 font-mono text-[9px] leading-relaxed h-64 overflow-hidden space-y-2.5 text-muted-foreground">
                <div className="text-primary font-semibold flex justify-between">
                  <span>[MONITOR] GATEWAYS SYNCHRONIZED</span>
                  <span className="text-white">SYS OK</span>
                </div>
                <div className="border-t border-[#1C1C1C] my-1" />
                <div className="flex justify-between hover:text-white transition-colors duration-200">
                  <span className="text-white">BTC/USDT SPREAD SCANNING</span>
                  <span className="text-primary font-semibold">BINANCE → BYBIT (+1.48%)</span>
                </div>
                <div className="flex justify-between hover:text-white transition-colors duration-200">
                  <span>↳ LATENCY SPEED</span>
                  <span className="text-gray-400">11.8ms</span>
                </div>
                <div className="flex justify-between hover:text-white transition-colors duration-200">
                  <span>↳ PAPER PROFIT EST</span>
                  <span className="text-primary font-semibold">$124.50 USDT</span>
                </div>
                <div className="flex justify-between text-yellow-500 font-semibold">
                  <span>[SHIELD] SLIPPAGE LIMIT CHECKS PASSING</span>
                  <span>NORMAL</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>[SYS] ACTIVE WORKSPACE LOGGED IN</span>
                  <span>FEED_SYNC_ON</span>
                </div>
                <div className="flex justify-between text-primary font-semibold">
                  <span>ETH/USDT SPREAD SCANNING</span>
                  <span>OKX → KRAKEN (+0.95%)</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>[WS] ACTIVE TELEMETRY LINKED</span>
                  <span>SECURE</span>
                </div>
              </div>
            </div>

            {/* Glowing Corner Badge */}
            <div className="absolute -bottom-4 -right-4 bg-primary text-black font-black text-[9px] px-2 py-1 rounded tracking-widest uppercase border border-white/20 shadow-[0_0_15px_rgba(94,234,212,0.3)]">
              PAPER MONITOR TERMINAL
            </div>
          </div>
        </div>
      </section>

      {/* HOW THE PLATFORM WORKS */}
      <section id="how-it-works" className="py-20 bg-[#070707] border-t border-b border-[#141414]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs text-primary font-bold tracking-widest uppercase font-mono">FLOW ARCHITECTURE</h2>
            <h3 className="text-xl sm:text-3xl font-bold uppercase tracking-tight text-white font-mono">How The Platform Works</h3>
            <p className="text-[11px] text-muted-foreground uppercase max-w-xl mx-auto leading-relaxed tracking-wider font-mono">
              Aggregating live exchange details into an intuitive paper execution layout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center text-primary font-bold text-xs">
                  01
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Continuous Price Monitoring</h4>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide leading-relaxed">
                  Realtime exchange orderbooks are scanned to identify cross-exchange price differences.
                </p>
              </div>
              <div className="pt-6 text-[10px] text-primary flex items-center gap-1 font-bold">
                REALTIME SCAN <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center text-primary font-bold text-xs">
                  02
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Exposure & Slippage Simulation</h4>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide leading-relaxed">
                  Safeguards calculate expected slippage and order weights before executing paper trades.
                </p>
              </div>
              <div className="pt-6 text-[10px] text-primary flex items-center gap-1 font-bold">
                RISK SHIELD <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-6 rounded flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center text-primary font-bold text-xs">
                  03
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Workspace Analytics</h4>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide leading-relaxed">
                  Trades are executed as simulated runs, syncing active portfolio charts and balances instantly.
                </p>
              </div>
              <div className="pt-6 text-[10px] text-primary flex items-center gap-1 font-bold">
                WORKSPACE UPDATE <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-l border-r border-[#141414]">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs text-primary font-bold tracking-widest uppercase font-mono">CORE SPECIFICATION</span>
          <h2 className="text-xl sm:text-3xl font-bold uppercase text-white tracking-tight font-mono">Workspace Features</h2>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider max-w-lg mx-auto">
            Believable, latency-focused quant monitoring details for cryptocurrency assets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-[#0A0A0A] border border-border p-6 rounded relative overflow-hidden group hover:border-primary/45 transition-colors duration-300">
            <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-300">
              <Radar className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase mb-2 tracking-wider">01. Arbitrage Spread Scanner</h3>
            <p className="text-[11px] text-muted-foreground uppercase leading-relaxed tracking-wide">
              Continuously query orderbooks across major crypto venues. Filter and organize real-time opportunity spreads.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0A0A0A] border border-border p-6 rounded relative overflow-hidden group hover:border-primary/45 transition-colors duration-300">
            <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-300">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase mb-2 tracking-wider">02. Paper Trading Engine</h3>
            <p className="text-[11px] text-muted-foreground uppercase leading-relaxed tracking-wide">
              Initiate simulated orders across exchange proxies. Verify latency indicators, fills, and spread payouts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0A0A0A] border border-border p-6 rounded relative overflow-hidden group hover:border-primary/45 transition-colors duration-300">
            <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-300">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase mb-2 tracking-wider">03. Live Portfolio Tracking</h3>
            <p className="text-[11px] text-muted-foreground uppercase leading-relaxed tracking-wide">
              Monitor simulated asset allocations, leverage filters, and cumulative paper PnL updates instantly.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#0A0A0A] border border-border p-6 rounded relative overflow-hidden group hover:border-primary/45 transition-colors duration-300">
            <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase mb-2 tracking-wider">04. Exposure Risk Monitoring</h3>
            <p className="text-[11px] text-muted-foreground uppercase leading-relaxed tracking-wide">
              Protect mock strategies with standard concurrency safeguards and automated slippage warning alerts.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-[#0A0A0A] border border-border p-6 rounded relative overflow-hidden group hover:border-primary/45 transition-colors duration-300">
            <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-300">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase mb-2 tracking-wider">05. Execution Feed</h3>
            <p className="text-[11px] text-muted-foreground uppercase leading-relaxed tracking-wide">
              Review structured JSON telemetry streams mapping execution latency, routing venues, and trade parameters.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-[#0A0A0A] border border-border p-6 rounded relative overflow-hidden group hover:border-primary/45 transition-colors duration-300">
            <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-300">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase mb-2 tracking-wider">06. Multi-Exchange Monitoring</h3>
            <p className="text-[11px] text-muted-foreground uppercase leading-relaxed tracking-wide">
              Query status indicators across active exchanges simultaneously to identify trading paths.
            </p>
          </div>
        </div>
      </section>

      {/* SCREENSHOTS / LOCKED PREVIEW SECTION */}
      <section id="previews" className="py-20 bg-[#070707] border-t border-b border-[#141414]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs text-primary font-bold tracking-widest uppercase font-mono">WORKSPACE ACCESS PREVIEWS</span>
            <h2 className="text-xl sm:text-3xl font-bold uppercase text-white font-mono">Workspace Previews</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider max-w-lg mx-auto font-mono">
              Pro Terminal workspace sections locked behind active subscription deeds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Opportunity Scanner Preview */}
            <div className="bg-[#0B0B0B] border border-border rounded overflow-hidden shadow-xl relative group">
              <div className="p-5 blur-[2.5px] pointer-events-none select-none">
                <div className="flex justify-between items-center text-xs font-mono uppercase mb-4 border-b border-[#222] pb-2 text-muted-foreground">
                  <span>🔍 OPPORTUNITY SCANNER (BTC/ETH)</span>
                  <span className="text-primary font-bold">14 DETAILS</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-black/50 p-2.5 rounded border border-[#222] flex justify-between font-mono text-[10px]">
                    <span className="text-white">BTC/USDT</span>
                    <span className="text-primary">SPREAD: +1.64%</span>
                    <span className="text-gray-400">11ms</span>
                  </div>
                  <div className="bg-black/50 p-2.5 rounded border border-[#222] flex justify-between font-mono text-[10px]">
                    <span className="text-white">ETH/USDT</span>
                    <span className="text-primary">SPREAD: +1.12%</span>
                    <span className="text-gray-400">14ms</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-[#050505]/80 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:bg-[#050505]/85">
                <div className="w-9 h-9 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 shadow-[0_0_15px_rgba(94,234,212,0.1)]">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] uppercase tracking-widest text-white">OPPORTUNITY SCANNER</span>
                <span className="text-[9px] text-[#A1A1AA] uppercase tracking-wider max-w-xs mt-1 block">
                  Terminal subscription license required
                </span>
                <Link to="/pricing" className="mt-3.5 bg-primary text-black font-bold text-[9px] px-3.5 py-1.5 rounded uppercase tracking-widest hover:bg-primary/90 transition-all">
                  Unlock Scanner
                </Link>
              </div>
            </div>

            {/* Live Metrics Dashboard Preview */}
            <div className="bg-[#0B0B0B] border border-border rounded overflow-hidden shadow-xl relative group">
              <div className="p-5 blur-[2.5px] pointer-events-none select-none">
                <div className="flex justify-between items-center text-xs font-mono uppercase mb-4 border-b border-[#222] pb-2 text-muted-foreground">
                  <span>📊 WORKSPACE PERFORMANCE ANALYTICS</span>
                  <span className="text-blue-400 font-bold">MONITORING</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-black/50 p-3 rounded border border-[#222] flex justify-between font-mono text-[10px]">
                    <span>NET VIRTUAL BALANCE</span>
                    <span className="text-white font-bold">$42,910.45 USDT</span>
                  </div>
                  <div className="bg-black/50 p-3 rounded border border-[#222] flex justify-between font-mono text-[10px]">
                    <span>SIMULATED PAPER TRADES</span>
                    <span className="text-primary font-bold">2,108</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-[#050505]/80 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:bg-[#050505]/85">
                <div className="w-9 h-9 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 shadow-[0_0_15px_rgba(94,234,212,0.1)]">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="font-bold text-[11px] uppercase tracking-widest text-white">TRADING ANALYTICS TERMINAL</span>
                <span className="text-[9px] text-[#A1A1AA] uppercase tracking-wider max-w-xs mt-1 block">
                  Verify mock executions & balance graphs
                </span>
                <Link to="/pricing" className="mt-3.5 bg-primary text-black font-bold text-[9px] px-3.5 py-1.5 rounded uppercase tracking-widest hover:bg-primary/90 transition-all">
                  Unlock Terminal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION (Smooth scroll target) */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-l border-r border-[#141414]">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs text-primary font-bold tracking-widest uppercase font-mono">TERMINAL LICENSE</span>
          <h2 className="text-xl sm:text-3xl font-bold uppercase text-white font-mono">Access Subscription</h2>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider max-w-lg mx-auto">
            A single premium licensing plan to unlock all realtime monitor tools.
          </p>
        </div>

        {/* Central Pricing Card Preview */}
        <div className="max-w-md mx-auto">
          <div className="bg-[#0A0A0A] border-2 border-primary rounded p-6 shadow-[0_0_25px_rgba(94,234,212,0.08)] flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-2 border-b border-border pb-4 text-center">
                <span className="text-[10px] text-primary block uppercase font-bold tracking-widest">SINGLE TIER LICENSE</span>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">PRO TERMINAL ACCESS</h3>
                <div className="text-3xl font-black text-white">$49 <span className="text-[10px] text-muted-foreground font-normal lowercase">/ month</span></div>
              </div>

              <ul className="space-y-3 text-[10px] text-white uppercase tracking-wider">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 animate-pulse" /> Realtime Arbitrage Scanner
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Paper Trading Engine
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Live Portfolio Tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Execution Feed Logs
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Risk Monitoring Shields
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Realtime Analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Multi-Exchange Monitoring
                </li>
              </ul>
            </div>

            <Link 
              to="/pricing" 
              className="mt-8 block text-center w-full bg-primary hover:bg-primary/95 text-black font-bold text-[10px] py-3.5 rounded uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(94,234,212,0.2)]"
            >
              Unlock Terminal Access
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER & DISCLAIMER */}
      <footer className="bg-[#050505] border-t border-[#1A1A1A] py-12 text-muted-foreground font-mono text-[9px] uppercase tracking-widest leading-relaxed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#111] pb-6 gap-4">
            <div className="flex items-center gap-2">
              <Activity className="text-primary w-4 h-4" />
              <span className="text-white text-xs font-bold font-mono">ARBITRA MONITOR TERMINAL</span>
            </div>
            <div className="flex gap-6 text-[10px]">
              <button onClick={() => scrollToSection('features')} className="hover:text-primary transition-colors focus:outline-none">FEATURES</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-primary transition-colors focus:outline-none">HOW IT WORKS</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-primary transition-colors focus:outline-none">PRICING</button>
            </div>
          </div>

          {/* Legal Risk Disclaimers */}
          <div className="space-y-3 font-mono text-[#666] leading-relaxed max-w-4xl">
            <p>
              <strong className="text-yellow-600">IMPORTANT NOTICE:</strong> ARBITRA IS A CRYPTOCURRENCY PRICE-DIFFERENCE MONITOR, LIVE MARKET TERMINAL, AND SIMULATED PAPER TRADING PLATFORM. ARBITRA IS NOT A REGISTERED FINANCIAL ADVISOR OR BROKER-DEALER.
            </p>
            <p>
              ALL SYSTEMS IN THE DOCK AREA, THE EXECUTION FEED, AND BALANCE UPDATES REPRESENT PURELY MOCK PAPER RUNS. NO ACTUAL CRYPTOCURRENCY IS TRANSFERRED, SOLD, OR TRADED. ARBITRA DOES NOT ACCESS REAL COLD OR HOT EXCHANGE WALLETS, SECURE KEYS, OR TRADING PASSCODES.
            </p>
            <p>
              PAST PERFORMANCE METRICS DO NOT GUARANTEE FUTURE RESULTS. ARBITRA DOES NOT MARKET GUARANTEED PROFITS OR CLAIM INVESTMENT GAINS. MONITORING CRYPTOCURRENCY PRICE OPPORTUNITIES CARRIES RISK, AND OPERATORS ASSUME ALL ACCOUNTABILITY REGARDING PRIVATE OPTIONS.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#111] text-[8px] text-[#444]">
            <span>© 2026 ARBITRA GLOBAL CONSOLE, INC. ALL CODES SECURED.</span>
            <span>UPLINK CONNECTION SYNC STATUS: SECURE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Minimal Check Icon
function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
