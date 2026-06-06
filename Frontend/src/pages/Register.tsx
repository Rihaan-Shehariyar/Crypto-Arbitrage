import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { register, login } from '@/services/endpoints';
import { toast } from 'sonner';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { API_URL } from '@/config/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const loadingTexts = [
    'ESTABLISHING SECURE HANDSHAKE...',
    'GENERATING RSA-4096 PRIVATE KEYS...',
    'CONFIGURING TERMINAL TELEMETRY...',
    'PROVISIONING PAPER TRADING PROFILE...',
    'ACCESS REGISTERED SUCCESSFULLY.',
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('ALL FIELDS REQUIRED');
      return;
    }
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
    const stepInterval = setInterval(() => {
      setLoadingStep((p) => (p < 3 ? p + 1 : p));
    }, 450);
    try {
      await register({ name, email, password, confirm_password: confirmPassword });
      const loginRes = await login({ email, password });
      clearInterval(stepInterval);
      setLoadingStep(4);
      await new Promise((r) => setTimeout(r, 350));
      setToken(loginRes.token);
      setUser(loginRes.user);
      toast.success('SECURE TRADING PROFILE INSTANTIATED');
      if (loginRes.user.subscription_active) {
        navigate('/dashboard');
      } else {
        navigate('/pricing');
      }
    } catch (err) {
      clearInterval(stepInterval);
      toast.error('REGISTRATION FAILED');
      console.error(err);
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
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <input
                type="text"
                required
                placeholder="Full Name"
                className="w-full bg-[#f4f6f9] border border-[#e5e7eb] rounded px-4 py-2.5 text-sm text-[#1f2937] focus:outline-none focus:border-[#f4a622]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                required
                placeholder="Email"
                className="w-full bg-[#f4f6f9] border border-[#e5e7eb] rounded px-4 py-2.5 text-sm text-[#1f2937] focus:outline-none focus:border-[#f4a622]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  className="w-full bg-[#f4f6f9] border border-[#e5e7eb] rounded px-4 py-2.5 pr-10 text-sm text-[#1f2937] focus:outline-none focus:border-[#f4a622]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1f2937]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm Password"
                  className="w-full bg-[#f4f6f9] border border-[#e5e7eb] rounded px-4 py-2.5 pr-10 text-sm text-[#1f2937] focus:outline-none focus:border-[#f4a622]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1f2937]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-[#f4a622] text-white font-bold py-2.5 rounded hover:opacity-90 transition-colors"
              >
                Create Pro Account
              </button>
              {/* Google Login */}
              <div className="flex justify-center mt-4">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const token = credentialResponse?.credential;
                      const res = await axios.post(`${API_URL}/register/google`, { token });
                      setToken(res.data.token);
                      setUser(res.data.user);
                      toast.success('Google registration success');
                      if (res.data.user.subscription_active) {
                        navigate('/dashboard');
                      } else {
                        navigate('/pricing');
                      }
                    } catch (e) {
                      console.error(e);
                      toast.error('Google registration failed');
                    }
                  }}
                  onError={() => toast.error('Google registration failed')}
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
          <Link to="/login" className="text-[#f4a622] hover:underline font-medium">
            Already have an account? Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
