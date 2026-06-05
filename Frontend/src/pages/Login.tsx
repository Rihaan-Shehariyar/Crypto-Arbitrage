import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { login } from '@/services/endpoints';
import { toast } from 'sonner';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/config/api';
import {
  GoogleLogin,
} from "@react-oauth/google"

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const loadingTexts = [
    'ESTABLISHING SECURE CONNECTION...',
    'VALIDATING CREDENTIALS...',
    'SYNCING TELEMETRY STATE...',
    'AUTHORIZATION APPROVED.',
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStep(0);
    const step = setInterval(() => {
      setLoadingStep((p) => (p < 3 ? p + 1 : p));
    }, 450);
    try {
      const res = await login({ email, password });
      clearInterval(step);
      setLoadingStep(3);
      setToken(res.token);
      setUser(res.user);
      toast.success('Access terminal unlocked');
      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.user.subscription_active) {
        navigate('/dashboard');
      } else {
        navigate('/pricing');
      }
    } catch (err) {
      clearInterval(step);
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f4f6f9] text-[#1f2937] min-h-screen flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-[#e5e7eb] rounded-xl shadow-xl p-8"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#143b63' }}>
            <Activity className="w-5 h-5 text-[#f4a622]" />
          </div>
          <span className="ml-2 text-xl font-bold text-[#143b63]">Arbitra</span>
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f4a622]/10 text-[#f4a622] border border-[#f4a622]/25 uppercase tracking-wider">
            Pro
          </span>
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
              <input
                type="email"
                required
                placeholder="Email"
                className="w-full bg-[#f4f6f9] border border-[#e5e7eb] rounded px-4 py-2.5 text-sm text-[#1f2937] focus:outline-none focus:border-[#f4a622]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full bg-[#f4f6f9] border border-[#e5e7eb] rounded px-4 py-2.5 text-sm text-[#1f2937] focus:outline-none focus:border-[#f4a622]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-[#f4a622] text-white font-bold py-2.5 rounded hover:opacity-90 transition-colors"
              >
                Unlock Console
              </button>
              {/* Google Login */}
              <div className="flex justify-center mt-4">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const token = credentialResponse?.credential;
                      const res = await axios.post(`${API_URL}/auth/google`, { token });
                      setToken(res.data.token);
                      setUser(res.data.user);
                      toast.success('Google authentication success');
                      if (res.data.user.role === 'admin') {
                        navigate('/admin/dashboard');
                      } else if (res.data.user.subscription_active) {
                        navigate('/dashboard');
                      } else {
                        navigate('/pricing');
                      }
                    } catch (e) {
                      console.error(e);
                      toast.error('Google authentication failed');
                    }
                  }}
                  onError={() => toast.error('Google authentication failed')}
                />
              </div>
            </motion.form>
          ) : (
            <div className="text-center py-10 text-[#1f2937]">
              {loadingTexts[loadingStep]}
            </div>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-[#e5e7eb] text-center text-sm text-[#6b7280]">
          <Link to="/register" className="text-[#f4a622] hover:underline font-medium">
            No account? Register now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}