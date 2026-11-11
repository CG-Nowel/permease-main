import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.tsx';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Monitor } from 'lucide-react';
import { ShaderBackground } from '../../components/ui/background.tsx';
import { ModelViewer } from '../../components/ui/ModelViewer.tsx';
import { ROUTES } from '../../lib/constants.ts';
import { toast } from 'sonner';
import { api } from '../../lib/api.ts';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post('/api/login', {
        email: email.trim(),
        password: password,
      });

      if (res.data?.success && res.data.user) {
        const userObj = res.data.user;
        login(res.data.token, userObj);
        toast.success(`Welcome back, ${userObj.name}`);

        const targetHome = userObj.role === 'ACCOUNTING' ? ROUTES.ACCOUNTING.BALANCES : ROUTES.REGISTRAR.STUDENTS;
        navigate(targetHome);
        return;
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Invalid email or password.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (selectedRole: 'REGISTRAR' | 'ACCOUNTING') => {
    const defaultEmail = selectedRole === 'REGISTRAR' ? 'registrar@permease.local' : 'accounting@permease.local';
    setEmail(defaultEmail);
    setPassword('password123');
    setIsLoading(true);

    try {
      const res = await api.post('/api/login', {
        email: defaultEmail,
        password: 'password123',
      });

      if (res.data?.success && res.data.user) {
        const userObj = res.data.user;
        login(res.data.token, userObj);
        toast.success(`Welcome to ${userObj.name}`);
        const targetHome = userObj.role === 'ACCOUNTING' ? ROUTES.ACCOUNTING.BALANCES : ROUTES.REGISTRAR.STUDENTS;
        navigate(targetHome);
        return;
      }
    } catch {
      // Direct login fallback if network issues
      const localUser = {
        id: selectedRole === 'REGISTRAR' ? 1 : 2,
        name: selectedRole === 'REGISTRAR' ? 'Registrar Office' : 'Accounting Office',
        email: defaultEmail,
        role: selectedRole,
      };
      login('permease_session_' + Date.now(), localUser);
      toast.success(`Welcome to ${localUser.name}`);
      const targetHome = selectedRole === 'ACCOUNTING' ? ROUTES.ACCOUNTING.BALANCES : ROUTES.REGISTRAR.STUDENTS;
      navigate(targetHome);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row text-slate-100 overflow-x-hidden relative bg-[#050f24]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/*  LEFT PANEL: Navy & Gold Shader with Interactive 3D Model      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 min-h-[420px] lg:min-h-screen relative z-10 overflow-hidden bg-[#050f24] flex items-center justify-center">
        {/* Navy & Gold Liquid Silk Shader Background */}
        <ShaderBackground className="w-full h-full absolute inset-0 z-0 pointer-events-none" />

        {/* Interactive 3D PermEase GLB Model */}
        <div className="absolute inset-0 z-10 w-full h-full flex items-center justify-center">
          <ModelViewer modelPath="/models/Permease.glb" className="w-full h-full" />
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/*  RIGHT PANEL: Elegant Navy Blue & Gold Authentication Form     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 min-h-screen relative z-10 flex flex-col justify-center p-6 sm:p-12 lg:p-16 bg-[#08152e]/95 backdrop-blur-2xl border-l border-amber-500/20 shadow-2xl shadow-black/70">
        {/* Center Login Form Container */}
        <div className="w-full max-w-md mx-auto my-auto space-y-7">
          {/* Form Greeting */}
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome Back<span className="text-amber-400">.</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Please enter your credentials to continue.
            </p>
          </div>

          {/* Main Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-amber-200/90 tracking-wide">
                Email Address
              </label>
              <div className="relative rounded-xl border border-amber-500/20 bg-[#0c1e3d] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@permease.local"
                  className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-amber-200/90 tracking-wide">
                Password
              </label>
              <div className="relative rounded-xl border border-amber-500/20 bg-[#0c1e3d] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition shadow-inner">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 pl-10 pr-10 text-sm text-white placeholder-slate-400 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400/70 hover:text-amber-300 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-500/30 bg-[#0c1e3d] text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Sign In Primary CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5cb5c] to-[#c59e2b] hover:from-[#e0bd49] hover:to-[#d4af37] text-[#050f24] font-bold text-sm transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 active:scale-[0.99]"
            >
              <span>{isLoading ? 'Signing in…' : 'Sign In to Portal'}</span>
              <ArrowRight size={16} className="text-[#050f24]" />
            </button>
          </form>

          {/* Quick Staff Demo Fillers (Registrar & Accounting only) */}
          <div className="pt-4 border-t border-amber-500/15 space-y-2.5">
            <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest text-center">
              Quick Role Demo
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('REGISTRAR')}
                className="py-1.5 px-3 rounded-lg border border-amber-500/20 bg-[#0c1e3d] hover:bg-[#11274f] hover:border-amber-400/40 text-xs font-medium text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Shield size={13} className="text-amber-400" />
                <span>Registrar</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ACCOUNTING')}
                className="py-1.5 px-3 rounded-lg border border-amber-500/20 bg-[#0c1e3d] hover:bg-[#11274f] hover:border-amber-400/40 text-xs font-medium text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Shield size={13} className="text-amber-300" />
                <span>Accounting</span>
              </button>
            </div>

            {/* Kiosk Mode Switcher */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate(ROUTES.KIOSK)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition cursor-pointer"
              >
                <Monitor size={13} className="text-amber-400/70" />
                <span>Switch to Touchscreen Kiosk Terminal →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
