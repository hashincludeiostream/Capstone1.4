import React, { useState } from 'react';
import {
  Heart,
  Calendar,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Store,
  CheckCircle2,
  Eye,
  EyeOff,
  Star,
  ChevronLeft,
} from 'lucide-react';
import { User } from '../../types';
import { API_BASE } from '../../lib/api';
import { validateEmail, validatePassword, validateFullname, validatePhone } from '../../lib/validation';
import { login, register, formatAuthError } from '../../lib/auth';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface CustomerAuthPageProps {
  initialMode?: 'signin' | 'register';
  onLoginSuccess: (user: User) => void;
  onNavigate: (tab: string) => void;
}

export const CustomerAuthPage: React.FC<CustomerAuthPageProps> = ({
  initialMode = 'signin',
  onLoginSuccess,
  onNavigate,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email');
      return;
    }

    // Ensure password is provided for sign in
    if (!password || password.trim() === '') {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const authResult = await login({ email, password, role: 'customer' });
      
      if (!authResult.success) {
        setError(formatAuthError(authResult.error || 'Login failed', authResult.details));
        return;
      }

      if (authResult.user) {
        onLoginSuccess(authResult.user);
        onNavigate('customer-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate fullname
    const fullnameValidation = validateFullname(fullname);
    if (!fullnameValidation.isValid) {
      setError(fullnameValidation.error || 'Invalid full name');
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Invalid password');
      return;
    }

    // Validate phone (optional but provided)
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.isValid) {
        setError(phoneValidation.error || 'Invalid phone number');
        return;
      }
    }

    setLoading(true);

    try {
      const authResult = await register({
        fullname,
        email,
        password,
        phone,
        user_type: 'customer',
      });
      
      if (!authResult.success) {
        setError(formatAuthError(authResult.error || 'Registration failed', authResult.details));
        return;
      }

      if (authResult.user) {
        onLoginSuccess(authResult.user);
        onNavigate('customer-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Banner (Customer theme) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-pink-600 via-rose-500 to-purple-700 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-900/30 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <button
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Directory</span>
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide text-pink-100">
                <Heart className="w-3.5 h-3.5 fill-pink-300 text-pink-300" />
                <span>Client & Customer Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
                {mode === 'signin'
                  ? 'Your personal beauty escape awaits.'
                  : 'Join Manila’s curated beauty community.'}
              </h2>
              <p className="text-xs text-pink-100/90 leading-relaxed">
                Discover top-rated nail artists, book instant salon appointments, and save trending manicure styles in one seamless hub.
              </p>
            </div>

            {/* Perks checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <Calendar className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Instant 24/7 Booking</h4>
                  <p className="text-[11px] text-pink-100/80">
                    Real-time slot reservation with accredited nail salons.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <Star className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Exclusive Promo Codes</h4>
                  <p className="text-[11px] text-pink-100/80">
                    Save up to 35% on manicures, spa pedicures, and nail art.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <Heart className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Favorites & Moodboards</h4>
                  <p className="text-[11px] text-pink-100/80">
                    Like viral nail reels and showcase your inspo directly to technicians.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Header Switcher */}
          <div className="flex items-center justify-between pb-6 border-b border-pink-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600">
                Customer Account
              </span>
              <h1 className="text-2xl font-serif font-bold text-gray-900 mt-0.5">
                {mode === 'signin' ? 'Sign In as Client' : 'Create Customer Account'}
              </h1>
            </div>

            {/* Toggle Sign In / Register */}
            <div className="flex bg-pink-50 p-1 rounded-2xl border border-pink-200">
              <button
                id="customer-tab-signin-btn"
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-pink-700 shadow-xs'
                    : 'text-gray-600 hover:text-pink-600'
                }`}
              >
                Sign In
              </button>
              <button
                id="customer-tab-register-btn"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-pink-700 shadow-xs'
                    : 'text-gray-600 hover:text-pink-600'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* 1. CUSTOMER SIGN IN FORM */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              {/* Demo Account Quick-Fill Card */}
              <div className="p-3 bg-pink-50/80 rounded-2xl border border-pink-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-800">⚡ Pre-Configured Demo Client</p>
                  <p className="text-[10px] text-gray-500 font-mono">customer@nailglamhub.com / Demo123!</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@nailglamhub.com');
                    setPassword('Demo123!');
                    setError('');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-pink-100 text-pink-700 text-[11px] font-bold rounded-lg border border-pink-300 transition-colors shadow-2xs cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="customer-signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. customer@nailglamhub.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-gray-900 focus:outline-pink-500 focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="customer-signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-gray-900 focus:outline-pink-500 focus:border-pink-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-pink-600 focus:ring-pink-500 border-pink-300"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              <button
                id="customer-submit-signin-btn"
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-pink-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Authenticating Client...' : 'Sign In to Customer Hub'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 text-center">
                <p className="text-xs text-gray-500">
                  New to Nail Glam Hub?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-pink-600 font-bold hover:underline cursor-pointer"
                  >
                    Create a free client profile
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* 2. CUSTOMER REGISTRATION FORM */
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="customer-register-fullname"
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="e.g. Maria Clara Santos"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-gray-900 focus:outline-pink-500 focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="customer-register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. maria.clara@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-gray-900 focus:outline-pink-500 focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Mobile Number (For SMS reminders)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="customer-register-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-gray-900 focus:outline-pink-500 focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="customer-register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-sm text-gray-900 focus:outline-pink-500 focus:border-pink-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="p-3 bg-pink-50/60 rounded-xl text-[11px] text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                <span>By joining, you receive instant booking notifications and booking history tracking.</span>
              </div>

              <button
                id="customer-submit-register-btn"
                type="submit"
                disabled={loading || !fullname || !email}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-pink-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Client Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 text-center">
                <p className="text-xs text-gray-500">
                  Already registered as a customer?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-pink-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
