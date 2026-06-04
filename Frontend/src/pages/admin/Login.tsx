import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { adminLogin } from '@/services/adminEndpoints';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path
  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate(from, { replace: true });
    }
  }, [token, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter all required fields.');
      return;
    }

    setLoading(true);
    const loginToast = toast.loading('Authenticating administrator credentials...');

    try {
      const res = await adminLogin({ email, password });
      setToken(res.token);
      setUser(res.user);
      
      toast.dismiss(loginToast);
      toast.success(`Welcome back, ${res.user.name}! Access granted.`);
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.dismiss(loginToast);
      toast.error(err.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-primary/20">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md border-border/80 bg-surface/50 backdrop-blur-lg relative overflow-hidden shadow-2xl">
        
        {/* Glow border decoration */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <CardHeader className="text-center pt-8 pb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-3 shadow-[0_0_15px_rgba(94,234,212,0.15)]">
            <ShieldCheck className="text-primary w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold text-white font-sans tracking-tight">
            Administrator Gateway
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-mono mt-1">
            Access secure trading platform diagnostics
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* EMAIL INPUT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  type="email"
                  placeholder="admin@arbitra.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 font-mono text-xs"
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                Security Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 font-mono text-xs"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              className="w-full mt-2 font-mono text-xs uppercase tracking-widest font-bold py-2.5 cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Authorizing...' : 'Authorize Login'}
            </Button>
          </form>

          {/* CRITICAL INFO FOR AUDITORS / TESTERS */}
          <div className="p-3.5 rounded-lg bg-black/40 border border-border/80 font-mono text-[10px] space-y-1">
            <p className="text-primary font-bold uppercase tracking-wider">Demo Access Credentials</p>
            <div className="text-muted-foreground flex justify-between">
              <span>Email:</span>
              <span className="text-white select-all">admin@arbitra.com</span>
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>Password:</span>
              <span className="text-white select-all">admin123</span>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
