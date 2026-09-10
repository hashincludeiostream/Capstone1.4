import React, { useState } from 'react';
import {
  Store,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Heart,
  Briefcase,
  TrendingUp,
  Users,
  CalendarCheck,
  Eye,
  EyeOff,
  ChevronLeft,
} from 'lucide-react';
import { User } from '../../types';
import { validateEmail, validatePassword, validateFullname, validatePhone } from '../../lib/validation';
import { login, register, formatAuthError } from '../../lib/auth';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface OwnerAuthPageProps {
  initialMode?: 'signin' | 'register';
  onLoginSuccess: (user: User) => void;
  onNavigate: (tab: string) => void;
}

export const OwnerAuthPage: React.FC<OwnerAuthPageProps> = ({
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
      const authResult = await login({ email, password, role: 'salon_owner' });
      
      if (!authResult.success) {
        setError(formatAuthError(authResult.error || 'Login failed', authResult.details));
        return;
      }

      if (authResult.user) {
        onLoginSuccess(authResult.user);
        onNavigate('owner-dashboard');
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
        user_type: 'salon_owner',
      });
      
      if (!authResult.success) {
        setError(formatAuthError(authResult.error || 'Registration failed', authResult.details));
        return;
      }

      if (authResult.user) {
        onLoginSuccess(authResult.user);
        onNavigate('owner-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Banner (Owner Theme: Royal Purple / Velvet) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <button
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Directory</span>
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-purple-700/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide text-purple-200 border border-purple-400/30">
                <Store className="w-3.5 h-3.5 text-purple-300" />
                <span>Salon Owner & Partner Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
                {mode === 'signin'
                  ? 'Grow your beauty business on Nail Glam Hub.'
                  : 'Register your salon & get instant bookings.'}
              </h2>
              <p className="text-xs text-purple-200/90 leading-relaxed">
                Connect directly with thousands of beauty clients in Manila. Manage appointments, showcase nail reels, and configure technicians.
              </p>
            </div>

            {/* Business Features */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <CalendarCheck className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Live Booking Engine</h4>
                  <p className="text-[11px] text-purple-200/80">
                    Accept, confirm, or reschedule appointments with real-time sync.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <Users className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Technician & Roster Manager</h4>
                  <p className="text-[11px] text-purple-200/80">
                    Assign specialists, track experience, and organize daily shifts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <TrendingUp className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Promotions & Marketing</h4>
                  <p className="text-[11px] text-purple-200/80">
                    Publish seasonal discount codes and feature viral nail portfolio reels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Header Switcher */}
          <div className="flex items-center justify-between pb-6 border-b border-purple-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                Salon Partner Account
              </span>
              <h1 className="text-2xl font-serif font-bold text-gray-900 mt-0.5">
                {mode === 'signin' ? 'Partner Login' : 'Register New Salon'}
              </h1>
            </div>

            {/* Toggle Sign In / Register */}
            <div className="flex bg-purple-50 p-1 rounded-2xl border border-purple-200">
              <button
                id="owner-tab-signin-btn"
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-purple-700'
                }`}
              >
                Sign In
              </button>
              <button
                id="owner-tab-register-btn"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-purple-700'
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

          {/* 1. OWNER SIGN IN FORM */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              {/* Demo Account Quick-Fill Card */}
              <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-800">⚡ Pre-Configured Demo Salon Owner</p>
                  <p className="text-[10px] text-gray-500 font-mono">salon@nailglamhub.com / Demo123!</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('salon@nailglamhub.com');
                    setPassword('Demo123!');
                    setError('');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-300 transition-colors shadow-2xs cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Registered Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="owner-signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. salon@nailglamhub.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-sm text-gray-900 focus:outline-purple-600 focus:border-purple-600 transition-colors"
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
                    id="owner-signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-purple-200 bg-purple-50/20 text-sm text-gray-900 focus:outline-purple-600 focus:border-purple-600 transition-colors"
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

              <button
                id="owner-submit-signin-btn"
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-semibold text-sm shadow-md shadow-purple-900/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Authenticating Partner...' : 'Enter Salon Owner Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 text-center">
                <p className="text-xs text-gray-500">
                  Want to register a new salon?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-purple-700 font-bold hover:underline cursor-pointer"
                  >
                    Create partner account & salon
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* 2. OWNER & SALON REGISTRATION FORM */
            <form onSubmit={handleRegister} className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 text-xs text-purple-900">
                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Briefcase className="w-4 h-4 text-purple-700" />
                  Owner & Business Registration
                </p>
                <p className="text-[11px] text-gray-600">
                  Fill in your personal credentials and your salon profile to receive instant bookings.
                </p>
              </div>

              {/* Owner Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Owner Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="owner-register-fullname"
                      type="text"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="e.g. Elena Vance"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 bg-purple-50/20 text-xs text-gray-900 focus:outline-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Business Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="owner-register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@salon.com"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 bg-purple-50/20 text-xs text-gray-900 focus:outline-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Direct Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="owner-register-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0917-xxx-xxxx"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 bg-purple-50/20 text-xs text-gray-900 focus:outline-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="owner-register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                      required
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-purple-200 bg-purple-50/20 text-xs text-gray-900 focus:outline-purple-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength checklist */}
              <PasswordStrengthIndicator password={password} />

              <div className="rounded-xl border border-purple-200 bg-purple-50/60 px-3 py-2.5 text-xs text-purple-900">
                Your owner account will be created without a branch. After signing in, use Register New Branch to submit your first salon location for admin approval.
              </div>

              <button
                id="owner-submit-register-btn"
                type="submit"
                disabled={loading || !fullname || !email}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-semibold text-sm shadow-md shadow-purple-900/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Creating Partner Account...' : 'Create Owner Account & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-gray-500">
                  Already have a registered salon?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-purple-700 font-bold hover:underline cursor-pointer"
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
