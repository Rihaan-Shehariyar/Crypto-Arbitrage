import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Activity, Shield, Terminal, Key } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { login } from '@/services/endpoints';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const setToken = useAuthStore((state) => state.setToken);
  const setSubscriptionActive = useAuthStore((state) => state.setSubscriptionActive);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const queryRedirect = searchParams.get('redirect');
  const redirectPath = queryRedirect || (location.state as any)?.from?.pathname;

  const loadingTexts = [
    'ESTABLISHING SECURE CONNECTION...',
    'VALIDATING WORKSPACE CREDENTIALS...',
    'DECRYPTING ACCESS TOKEN...',
    'SYNCING TELEMETRY STATE...',
    'AUTHORIZATION APPROVED.'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStep(0);

    // Simulate real-time secure logging-in steps for styling
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 450);

    try {
      const res = await login({ email, password });
      
      clearInterval(stepInterval);
      setLoadingStep(4);
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      setToken(res.token);
      const isSubscribed = res.subscription_active === true;
      setSubscriptionActive(isSubscribed);

      toast.success('Access terminal unlocked.');
      if (isSubscribed) {
        navigate('/dashboard');
      } else {
        navigate(redirectPath || '/pricing');
      }
    } catch (error) {
      clearInterval(stepInterval);
      if (isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Invalid credentials. Check email and password.');
        } else {
          toast.error(error.response?.data?.message || 'Connection timeout. Using terminal failback.');
          
          // Fallback to local session if developer backend is offline/unstarted
          const mockToken = `mock_jwt_session_${Math.random().toString(36).substr(2, 9)}`;
          setToken(mockToken);
          setSubscriptionActive(false);
          toast.info('Terminal initialized in OFFLINE DEMO mode.');
          navigate(redirectPath || '/pricing');
        }
      } else {
        toast.error('Unexpected handshake error.');
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] text-foreground p-4 select-none relative overflow-hidden font-mono">
      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#111111]/90 border border-border/80 rounded shadow-2xl relative z-10 overflow-hidden"
      >
        {/* Decorative Top Bar */}
        <div className="bg-[#161616] border-b border-border/60 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold tracking-widest text-[10px]">SECURE INTERFACE PORT v2.4</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/40 animate-pulse" />
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-primary/10 border border-primary/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(94,234,212,0.1)]">
              <Activity className="text-primary w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">Access Terminal</h1>
            <p className="text-[10px] text-muted-foreground mt-1 text-center uppercase tracking-wider">
              Enter secure credentials to establish trading console uplink
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isLoading ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                    <span>SECURITY EMAIL</span>
                    <span className="text-primary">SECURE</span>
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="operator@arbitra.io"
                    className="w-full bg-[#151515] border border-border focus:border-primary/60 rounded px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground/45 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                    <span>PASSWORD CODE</span>
                    <span>ENCRYPTED</span>
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#151515] border border-border focus:border-primary/60 rounded px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground/45 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <div className="text-[9px] text-muted-foreground/80 flex items-center gap-1.5 py-1">
                  <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>TRANSMISSION ENCRYPTED VIA END-TO-END QUANTUM INTERFACE.</span>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs py-3 rounded uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(94,234,212,0.15)] flex items-center justify-center gap-2 mt-4 hover:shadow-[0_0_20px_rgba(94,234,212,0.3)] duration-300"
                >
                  <Key className="w-3.5 h-3.5" />
                  Unlock Console
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 font-mono"
              >
                <div className="relative w-16 h-16 mb-6">
                  {/* Outer pulse circle */}
                  <div className="absolute inset-0 rounded-full border border-primary/25 animate-ping" />
                  {/* Inner rotating frame */}
                  <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-2 bg-primary/10 border border-primary/25 rounded-full flex items-center justify-center">
                    <Activity className="text-primary w-5 h-5 animate-pulse" />
                  </div>
                </div>
                
                <div className="text-center w-full max-w-xs">
                  <div className="text-primary font-bold text-xs uppercase tracking-widest animate-pulse h-6">
                    {loadingTexts[loadingStep]}
                  </div>
                  <div className="w-full bg-[#1A1A1A] border border-border h-1.5 rounded-full overflow-hidden mt-3">
                    <motion.div 
                      className="bg-primary h-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(loadingStep / 4) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-2 font-mono uppercase tracking-widest font-semibold">
                    TLS 1.3 CONNECTION ENABLED
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-border/50 text-center flex flex-col gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Need secure credentials?{' '}
              <Link to="/register" className="text-primary hover:underline font-bold">
                Register Profile
              </Link>
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              <Link to="/" className="text-muted-foreground hover:text-white underline">
                Back to Public Landing
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
