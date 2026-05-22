import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Terminal, Key, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { register, login } from '@/services/endpoints';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const setToken = useAuthStore((state) => state.setToken);
  const setSubscriptionActive = useAuthStore((state) => state.setSubscriptionActive);
  const navigate = useNavigate();

  const loadingTexts = [
    'ESTABLISHING SECURE HANDSHAKE...',
    'GENERATING RSA-4096 PRIVATE KEYS...',
    'CONFIGURING TERMINAL TELEMETRY...',
    'PROVISIONING PAPER TRADING PROFILE...',
    'ACCESS REGISTERED SUCCESSFULLY.'
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    if (!name || !email || !password || !confirmPassword) {
      toast.error('ALL FIELDS REQUIRED');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('INVALID EMAIL FORMAT');
      return;
    }

    if (password.length < 6) {
      toast.error('PASSWORD MUST BE AT LEAST 6 CHARACTERS');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('PASSWORDS DO NOT MATCH');
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);

    // Simulate real-time secure registration and key generation steps for design feel
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 450);

    try {
      // 1. Backend Registration API Call
      await register({
        name,
        email,
        password,
        confirm_password: confirmPassword
      });

      // 2. Automatic login under-the-hood to obtain valid JWT token
      const loginRes = await login({ email, password });

      clearInterval(stepInterval);
      setLoadingStep(4);
      await new Promise((resolve) => setTimeout(resolve, 350));

      setToken(loginRes.token);
      setSubscriptionActive(loginRes.subscription_active === true);
      
      toast.success('SECURE TRADING PROFILE INSTANTIATED');
      navigate('/pricing');
    } catch (error) {
      clearInterval(stepInterval);
      if (isAxiosError(error)) {
        const backendError = error.response?.data?.error;
        if (backendError) {
          const errorMsg = String(backendError).toUpperCase();
          if (errorMsg === "INVALID INPUT") {
            toast.error("ALL FIELDS REQUIRED / INVALID FORMAT");
          } else {
            toast.error(errorMsg);
          }
        } else {
          toast.error("REGISTRATION UPLINK ERROR");
        }
      } else {
        toast.error("UNEXPECTEDHandshakeFailure: ACCESS REFUSED");
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
            <span className="font-bold tracking-widest text-[10px]">SECURE ONBOARDING UPLINK v3.0</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/40 animate-pulse" />
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-primary/10 border border-primary/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(94,234,212,0.1)]">
              <Shield className="text-primary w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">Register Workspace</h1>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center uppercase tracking-wider max-w-[280px]">
              Create your operator account to access the realtime trading workspace.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isLoading ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleRegister} 
                className="space-y-4"
              >
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                    <span>FULL NAME</span>
                    <span className="text-primary">REQUIRED</span>
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="ALEX MERCER"
                    className="w-full bg-[#151515] border border-border focus:border-primary/60 rounded px-4 py-2 text-xs text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                    <span>EMAIL ADDRESS</span>
                    <span className="text-primary">VALID EMAIL</span>
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="trader@arbitra.io"
                    className="w-full bg-[#151515] border border-border focus:border-primary/60 rounded px-4 py-2 text-xs text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                    <span>SECURE PASSWORD</span>
                    <span>MIN 6 CHARS</span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#151515] border border-border focus:border-primary/60 rounded pl-4 pr-10 py-2 text-xs text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-muted-foreground hover:text-white transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                    <span>CONFIRM PASSWORD</span>
                    <span>MUST MATCH</span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#151515] border border-border focus:border-primary/60 rounded pl-4 pr-10 py-2 text-xs text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-muted-foreground hover:text-white transition-colors"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-[10px] bg-red-500/5 border border-red-500/20 p-2.5 text-red-400 leading-relaxed uppercase">
                  <span className="font-bold">NOTICE:</span> Subscribed plans are required to unlock live scanner streams, multi-exchange paper orders, and backtesting metrics.
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs py-3 rounded uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(94,234,212,0.15)] flex items-center justify-center gap-2 mt-4 hover:shadow-[0_0_20px_rgba(94,234,212,0.3)] duration-300"
                >
                  <Key className="w-3.5 h-3.5" />
                  Create Pro Secure Profile
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
                    <Terminal className="text-primary w-5 h-5 animate-pulse" />
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
                  <div className="text-[9px] text-muted-foreground mt-2 font-mono uppercase tracking-widest">
                    SYSTEM SECURE • STATUS OK
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Already have credentials?{' '}
              <Link to="/login" className="text-primary hover:underline font-bold">
                Access Terminal
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
