import React, { useEffect, useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
  Database,
  BarChart3,
} from 'lucide-react';
import { User } from '../../types';
import { fetchRegistrationRateLimitStatus, updateRegistrationRateLimit } from '../../lib/api';
import { validateEmail, validatePassword, validateFullname } from '../../lib/validation';
import { login, register, formatAuthError } from '../../lib/auth';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface AdminAuthPageProps {
  initialMode?: 'signin' | 'register';
  onLoginSuccess: (user: User) => void;
  onNavigate: (tab: string) => void;
}

export const AdminAuthPage: React.FC<AdminAuthPageProps> = ({
  initialMode = 'signin',
  onLoginSuccess,
  onNavigate,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [registrationRateLimitEnabled, setRegistrationRateLimitEnabled] = useState(true);
  const [updatingRateLimit, setUpdatingRateLimit] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'register') return;

    fetchRegistrationRateLimitStatus()
      .then(setRegistrationRateLimitEnabled)
      .catch(() => setError('Unable to load registration protection status.'));
  }, [mode]);

  const handleToggleRateLimit = async () => {
    setUpdatingRateLimit(true);
    try {
      setRegistrationRateLimitEnabled(
        await updateRegistrationRateLimit(!registrationRateLimitEnabled)
      );
    } catch {
      setError('Unable to update registration protection.');
    } finally {
      setUpdatingRateLimit(false);
    }
  };

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
      const authResult = await login({ email, password, role: 'admin' });
      
      if (!authResult.success) {
        setError(formatAuthError(authResult.error || 'Login failed', authResult.details));
        return;
      }

      if (authResult.user) {
        onLoginSuccess(authResult.user);
        onNavigate('admin-dashboard');
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

    if (!adminCode) {
      setError('Administrative authorization code is mandatory for staff account creation.');
      return;
    }

    setLoading(true);

    try {
      const authResult = await register({
        fullname,
        email,
        password,
        phone,
        user_type: 'admin',
        admin_code: adminCode,
      });
      
      if (!authResult.success) {
        setError(formatAuthError(authResult.error || 'Registration failed', authResult.details));
        return;
      }

      if (authResult.user) {
        onLoginSuccess(authResult.user);
        onNavigate('admin-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-rose-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual Banner (Admin Theme: Dark Slate / Rose / Gold) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-gray-900 to-rose-950 p-8 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-rose-900/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide text-rose-200 border border-rose-500/30">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Super Admin Console</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
                {mode === 'signin'
                  ? 'Master platform operations & oversight.'
                  : 'Authorize staff & platform administrators.'}
              </h2>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Protected console for managing verified salons, user accounts, platform analytics, categories, and system-wide configurations.
              </p>
            </div>

            {/* Admin Capabilities */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <BarChart3 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">System KPI Metrics</h4>
                  <p className="text-[11px] text-rose-200/80">
                    Live tally of gross bookings, salon partners, and client engagements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <Database className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">User & Salon Directory</h4>
                  <p className="text-[11px] text-rose-200/80">
                    Audit registered salons, client accounts, and reviews.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <Key className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Role-Based Access Control</h4>
                  <p className="text-[11px] text-rose-200/80">
                    Secured environment with administrative passphrase verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Header Switcher */}
          <div className="flex items-center justify-between pb-6 border-b border-rose-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                System Administration
              </span>
              <h1 className="text-2xl font-serif font-bold text-gray-900 mt-0.5">
                {mode === 'signin' ? 'Admin Console Login' : 'Register Administrator'}
              </h1>
            </div>

            {/* Toggle Sign In / Register */}
            <div className="flex bg-rose-50 p-1 rounded-2xl border border-rose-200">
              <button
                id="admin-tab-signin-btn"
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-rose-700'
                }`}
              >
                Sign In
              </button>
              <button
                id="admin-tab-register-btn"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-rose-700'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in duration-150 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. ADMIN SIGN IN FORM */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              {/* Demo Account Quick-Fill Card */}
              <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-800">⚡ Pre-Configured Demo Super Admin</p>
                  <p className="text-[10px] text-gray-500 font-mono">admin@nailglamhub.com / Demo123!</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@nailglamhub.com');
                    setPassword('Demo123!');
                    setError('');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 text-[11px] font-bold rounded-lg border border-rose-300 transition-colors shadow-2xs cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@nailglamhub.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/20 text-sm text-gray-900 focus:outline-rose-600 focus:border-rose-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Admin Passcode / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-rose-200 bg-rose-50/20 text-sm text-gray-900 focus:outline-rose-600 focus:border-rose-600 transition-colors"
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

              <div className="p-3 bg-rose-50/60 rounded-xl text-[11px] text-gray-600 flex items-center gap-2 border border-rose-100">
                <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                <span>All administrative actions and logins are logged for compliance and security audit trails.</span>
              </div>

              <button
                id="admin-submit-signin-btn"
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-700 via-rose-800 to-gray-900 hover:from-rose-800 hover:to-black text-white font-semibold text-sm shadow-md shadow-rose-900/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Authorize & Launch Admin Panel'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 text-center">
                <p className="text-xs text-gray-500">
                  Need to authorize a new staff member?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    Register with security code
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* 2. ADMIN REGISTRATION FORM */
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Administrator Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-register-fullname"
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="e.g. Master Administrator"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/20 text-sm text-gray-900 focus:outline-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Official Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@nailglamhub.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/20 text-sm text-gray-900 focus:outline-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="admin-register-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912-xxx-xxxx"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-rose-200 bg-rose-50/20 text-xs text-gray-900 focus:outline-rose-600"
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
                      id="admin-register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                      required
                      className="w-full pl-10 pr-8 py-2 rounded-xl border border-rose-200 bg-rose-50/20 text-xs text-gray-900 focus:outline-rose-600"
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

              {/* Admin Authorization Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Administrator Security Passphrase *
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    Demo Code: ADMIN2025
                  </span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-register-security-code"
                    type="text"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter security authorization passphrase (ADMIN2025)"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50/30 text-sm font-mono text-gray-900 focus:outline-rose-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold text-gray-800">Registration Rate Protection</p>
                  <p className="text-[11px] text-gray-500">
                    {registrationRateLimitEnabled ? 'Limits repeated registrations.' : 'Disabled for development testing.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={registrationRateLimitEnabled}
                  aria-label="Toggle registration rate protection"
                  onClick={handleToggleRateLimit}
                  disabled={updatingRateLimit}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60 ${
                    registrationRateLimitEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      registrationRateLimitEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button
                id="admin-submit-register-btn"
                type="submit"
                disabled={loading || !fullname || !email || !adminCode}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-700 via-rose-800 to-gray-900 hover:from-rose-800 hover:to-black text-white font-semibold text-sm shadow-md shadow-rose-900/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Authorizing...' : 'Authorize & Register Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-gray-500">
                  Already have admin credentials?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-rose-700 font-bold hover:underline cursor-pointer"
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
