import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  Cpu, 
  Wallet,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { activateSubscription } from '@/api/subscription';

export default function Pricing() {
  const token = useAuthStore((state) => state.token);
  const subscriptionActive = useAuthStore((state) => state.subscriptionActive);
  const setSubscriptionActive = useAuthStore((state) => state.setSubscriptionActive);
  
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [isPaying, setIsPaying] = useState(false);
  const [payStep, setPayStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (token && subscriptionActive) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, subscriptionActive, navigate]);

  const paymentSteps = [
    'CONTACTING PAYMENT GATEWAY...',
    'PROCESSING PAYMENT...',
    'VERIFYING TERMINAL ACCESS...',
    'ACTIVATING LICENSE...',
    'TERMINAL ACCESS ACTIVATED.'
  ];

  const handleSubscribeClick = () => {
    if (!token) {
      toast.info('Authentication required to subscribe. Routing to login portal.');
      navigate('/login?redirect=/pricing');
      return;
    }

    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    setPayStep(0);
    setShowSuccess(false);

    // Loop through simulated high-tech loading stages visually
    const stepInterval = setInterval(() => {
      setPayStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await activateSubscription();
      
      clearInterval(stepInterval);

      if (res.success) {
        setPayStep(4);
        setShowSuccess(true);
        setSubscriptionActive(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsModalOpen(false);
        toast.success('Pro Terminal Access provisioned successfully!');
        navigate('/dashboard');
      } else {
        toast.error('Subscription activation failed. Payment gateway declined request.');
      }
    } catch (error) {
      clearInterval(stepInterval);
      toast.error('Payment gateway handshake rejected or offline. Please retry.');
      console.error(error);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="bg-[#050505] text-[#F3F4F6] min-h-screen font-mono p-4 sm:p-8 select-none relative overflow-x-hidden">
      {/* Background Matrix lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F0F_1px,transparent_1px),linear-gradient(to_bottom,#0F0F0F_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute top-0 left-1/3 w-[35rem] h-[35rem] bg-primary/5 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Top bar back links */}
        <div className="flex justify-between items-center text-xs border-b border-[#1A1A1A] pb-4">
          <Link to="/" className="text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors uppercase font-bold">
            <ArrowLeft className="w-4 h-4 text-primary" /> Back To Landing Page
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground uppercase">GATEWAY CONNECTED</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-3 py-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded font-mono text-[9px] text-primary uppercase tracking-widest font-semibold">
            TERMINAL LICENSE
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight uppercase text-white font-mono">
            Licensing & Subscription
          </h1>
          <p className="text-[11px] text-muted-foreground max-w-xl mx-auto uppercase tracking-wide leading-relaxed font-mono">
            Unlock your realtime monitoring and paper trading workspace to track cross-exchange price differences instantly.
          </p>
        </div>

        {/* Centered Pricing Card */}
        <div className="max-w-md mx-auto pt-4">
          <div className="bg-[#0A0A0A] border-2 border-primary rounded p-6 shadow-[0_0_25px_rgba(94,234,212,0.08)] flex flex-col justify-between relative overflow-hidden">
            
            <div className="space-y-6">
              <div className="space-y-2 border-b border-[#1A1A1A] pb-4 text-center">
                <span className="text-[10px] text-primary block uppercase font-bold tracking-widest">SINGLE PLATFORM ACCESS</span>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">PRO TERMINAL ACCESS</h3>
                <div className="text-3xl font-black text-white">$49 <span className="text-[10px] text-muted-foreground font-normal lowercase">/ month</span></div>
              </div>

              <ul className="space-y-3.5 text-[10px] text-white uppercase tracking-wider">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0 animate-pulse" /> Realtime Arbitrage Scanner
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Paper Trading Engine
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Live Portfolio Tracking
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Execution Feed
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Risk Monitoring
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Realtime Analytics
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" /> Multi-Exchange Monitoring
                </li>
              </ul>
            </div>

            <button 
              onClick={handleSubscribeClick}
              className="mt-8 w-full bg-primary hover:bg-primary/95 text-black font-bold text-[10px] py-3.5 rounded uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(94,234,212,0.2)] hover:shadow-[0_0_25px_rgba(94,234,212,0.4)] focus:outline-none"
            >
              Unlock Terminal Access
            </button>
          </div>
        </div>

        {/* Feature Specifications Matrix */}
        <div className="max-w-2xl mx-auto border border-[#1A1A1A] rounded overflow-hidden pt-4 bg-[#0A0A0A]">
          <div className="bg-[#111] px-4 py-2 text-xs font-bold text-white uppercase tracking-wider border-b border-[#1A1A1A]">
            📑 PLATFORM FEATURES SPECIFICATION MATRIX
          </div>
          <div className="overflow-x-auto text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/30 border-b border-[#1A1A1A] text-white">
                  <th className="py-2.5 px-4">WORKSPACE PARAMETER</th>
                  <th className="py-2.5 px-4 text-center text-primary font-bold">PRO TERMINAL ACCESS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181818]">
                <tr>
                  <td className="py-2 px-4 text-white font-semibold">FEED DURATION</td>
                  <td className="py-2 px-4 text-center text-primary font-semibold">REALTIME MONITORING FEED</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-white font-semibold">PAPER EXECUTIONS</td>
                  <td className="py-2 px-4 text-center text-primary font-semibold">ENABLED (UNLIMITED RUNS)</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-white font-semibold">EXCHANGE CONNECTIONS</td>
                  <td className="py-2 px-4 text-center text-white">14 CONNECTED CORE EXCHANGES</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-white font-semibold">SLIPPAGE ADJUSTMENT</td>
                  <td className="py-2 px-4 text-center text-white">INTEGRATED EXPOSURE PROTECTIONS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAYMENT SIMULATOR MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPaying && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-[#111] border border-[#1A1A1A] rounded shadow-2xl w-full max-w-lg relative overflow-hidden z-10 font-mono"
            >
              {/* Header bar */}
              <div className="bg-[#161616] px-4 py-2 border-b border-[#1A1A1A] flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="font-bold tracking-wider">GATEWAY: SIMULATED_CHECKOUT</span>
                </div>
                {!isPaying && (
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-muted-foreground hover:text-white font-bold"
                  >
                    [X]
                  </button>
                )}
              </div>

              <div className="p-6">
                {!isPaying ? (
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="flex justify-between items-center border-b border-[#222] pb-3">
                      <div>
                        <h4 className="text-white text-xs font-bold uppercase tracking-wider">PRO TERMINAL ACCESS LICENSE</h4>
                        <span className="text-[9px] text-muted-foreground uppercase">1-MONTH LICENSING ROUTE</span>
                      </div>
                      <span className="text-primary font-black text-sm">$49.00 USD</span>
                    </div>

                    {/* Method selector */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-2 font-bold">Select Billing Gateway</span>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-3 rounded border text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-black/40 text-muted-foreground'}`}
                        >
                          <CreditCard className="w-4 h-4" /> Credit / Debit Card
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('crypto')}
                          className={`p-3 rounded border text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all ${paymentMethod === 'crypto' ? 'border-primary bg-primary/5 text-primary' : 'border-[#1A1A1A] bg-black/40 text-muted-foreground'}`}
                        >
                          <Wallet className="w-4 h-4" /> Cryptopay (USDT)
                        </button>
                      </div>
                    </div>

                    {/* Form Inputs based on payment method */}
                    <AnimatePresence mode="wait">
                      {paymentMethod === 'card' ? (
                        <motion.div 
                          key="card"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-3"
                        >
                          <div>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">MOCK NAME ON CARD</span>
                            <input 
                              type="text" 
                              required
                              placeholder="SIMULATED TRADER"
                              className="w-full bg-[#151515] border border-[#222] focus:border-primary/50 rounded px-3 py-2 text-xs text-white uppercase focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">MOCK CARD NUMBER</span>
                              <input 
                                type="text" 
                                required
                                placeholder="4242 4242 4242 4242"
                                className="w-full bg-[#151515] border border-[#222] focus:border-primary/50 rounded px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">CVV</span>
                              <input 
                                type="text" 
                                required
                                placeholder="000"
                                className="w-full bg-[#151515] border border-[#222] focus:border-primary/50 rounded px-3 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="crypto"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-3 font-mono text-[9px] leading-relaxed uppercase border border-dashed border-[#333] p-3.5 bg-black/40 text-muted-foreground text-center"
                        >
                          <span className="text-primary font-bold block mb-1 text-[10px]">USDT-ERC20 BLOCKCHAIN DEPOSIT</span>
                          <span>Send exactly <strong className="text-white">49.00 USDT</strong> to the simulated wallet address:</span>
                          <div className="bg-[#151515] text-white p-2 border border-[#222] rounded font-bold text-center select-all my-2">
                            0x7B9C4dE8652Ac3682910F4D086A3919c629B49F3
                          </div>
                          <span>Confirming this will automatically verify and approve simulated transactions.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Notice */}
                    <div className="text-[9px] p-2 bg-primary/5 border border-primary/20 text-[#8A8A8A] leading-relaxed uppercase">
                      <span className="font-bold text-primary">DEVELOPER DISCLAIMER:</span> THIS IS A COMPLETELY SIMULATED DEPOSIT GATEWAY FOR TESTING PERSISTED WEB TERMINAL PRIVILEGES. NO REAL CASH OR TOKENS WILL BE TRANSFERRED.
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/95 text-black font-bold text-xs py-3 rounded uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(94,234,212,0.15)] flex items-center justify-center gap-1.5 duration-300 focus:outline-none"
                    >
                      <ShieldCheck className="w-4 h-4 text-black" /> Confirm System Provisioning
                    </button>
                  </form>
                ) : showSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 font-mono text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce">
                      <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-emerald-400 font-bold text-sm tracking-widest uppercase">
                        TERMINAL ACCESS ACTIVATED
                      </h4>
                      <p className="text-[10px] text-white uppercase tracking-wider">
                        TRANSACTION VERIFIED & COMPLETED
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest animate-pulse">
                        REDIRECTING TO TRADING WORKSPACE...
                      </p>
                    </div>

                    <div className="w-full max-w-xs bg-black/40 border border-[#222] p-3 text-[9px] text-[#A1A1AA] uppercase leading-relaxed text-left">
                      <span className="text-emerald-500 font-bold block mb-1">PROVISIONING DEED DECK</span>
                      <span>Uplink Sync: Secure</span><br />
                      <span>Licensing Server: Active</span><br />
                      <span>Session Ref: {token?.substring(0, 15)}...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 font-mono">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 rounded-full border border-primary/25 animate-ping" />
                      <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                      <div className="absolute inset-2 bg-primary/10 border border-primary/25 rounded-full flex items-center justify-center">
                        <Cpu className="text-primary w-5 h-5 animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="text-center w-full max-w-xs">
                      <div className="text-primary font-bold text-xs uppercase tracking-widest animate-pulse h-6">
                        {paymentSteps[payStep]}
                      </div>
                      <div className="w-full bg-[#1A1A1A] border border-[#1A1A1A] h-1.5 rounded-full overflow-hidden mt-3">
                        <motion.div 
                          className="bg-primary h-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${(payStep / 4) * 100}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-2 uppercase tracking-wider">
                        SECURE PAY GATEWAY • SSL SYNC
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
