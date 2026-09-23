import React, { useState } from 'react';
import { X, Sparkles, LogIn, UserPlus, Shield, Store, User as UserIcon, Check } from 'lucide-react';
import { User, UserRole } from '../types';
import { login, register, loginWithGoogle } from '../lib/auth';
import { GoogleAccountChooserModal } from './auth/GoogleAccountChooserModal';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'signin' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLoginSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    if (email && email.includes('@')) {
      setGoogleLoading(true);
      setError('');
      try {
        const result = await loginWithGoogle(userType, undefined, email);
        if (result.success && result.user) {
          onLoginSuccess(result.user);
          onClose();
          return;
        } else {
          setError(result.error || 'Google verification failed');
        }
      } catch (err: any) {
        setError(err.message || 'Google account verification failed');
      } finally {
        setGoogleLoading(false);
      }
    } else {
      setShowGoogleChooser(true);
    }
  };

  const handleDemoLogin = (role: 'customer' | 'salon_owner' | 'admin') => {
    let demoEmail = 'customer@nailglamhub.com';
    if (role === 'salon_owner') demoEmail = 'salon@nailglamhub.com';
    if (role === 'admin') demoEmail = 'admin@nailglamhub.com';

    executeLogin(demoEmail, 'demo123', role);
  };

  const executeLogin = async (
    loginEmail: string,
    loginPassword = password,
    loginRole: UserRole = userType,
  ) => {
    setLoading(true);
    setError('');

    try {
      const result = await login({ email: loginEmail, password: loginPassword, role: loginRole });
      if (!result.success || !result.user) {
        setError(result.error || 'Invalid credentials');
        return;
      }

      onLoginSuccess(result.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !email) return;

    setLoading(true);
    setError('');

    try {
      const result = await register({
        fullname,
        email,
        password,
        phone,
        user_type: userType,
      });

      if (!result.success || !result.user) {
        setError(result.error || 'Registration failed');
        return;
      }

      onLoginSuccess(result.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-pink-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-gray-900">
                {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
              </h3>
              <p className="text-[11px] text-gray-500">Nail Glam Hub Access Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Fast Login Personas */}
        <div className="mt-4 p-3 bg-pink-50/70 rounded-2xl border border-pink-200">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 text-center">
            ⚡ Quick 1-Click Demo Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin('customer')}
              className="p-2 rounded-xl bg-white border border-pink-200 hover:border-pink-500 text-center shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <UserIcon className="w-4 h-4 text-pink-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-gray-900">Customer</p>
              <p className="text-[9px] text-gray-400">Sophia</p>
            </button>
            <button
              onClick={() => handleDemoLogin('salon_owner')}
              className="p-2 rounded-xl bg-white border border-pink-200 hover:border-purple-500 text-center shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <Store className="w-4 h-4 text-purple-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-gray-900">Salon Owner</p>
              <p className="text-[9px] text-gray-400">Camille</p>
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              className="p-2 rounded-xl bg-white border border-pink-200 hover:border-rose-500 text-center shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <Shield className="w-4 h-4 text-rose-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-gray-900">Super Admin</p>
              <p className="text-[9px] text-gray-400">Admin</p>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* Tab switch between Sign In and Register */}
        <div className="flex border-b border-pink-100 mt-4">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              mode === 'signin'
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Real Google Account Verification */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full py-2.5 px-3 bg-white hover:bg-pink-50/50 border-2 border-pink-200 hover:border-pink-300 text-gray-800 font-semibold rounded-xl text-xs shadow-2xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{googleLoading ? 'Verifying Account...' : 'Continue with Google / Gmail'}</span>
          </button>
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-gray-400 font-medium">Or email</span></div>
          </div>
        </div>

        {/* Form Body */}
        {mode === 'signin' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeLogin(email);
            }}
            className="mt-4 space-y-3"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@nailglamhub.com"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-pink-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('customer')}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    userType === 'customer'
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-white text-gray-700 border-pink-200'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" /> Client
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('salon_owner')}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    userType === 'salon_owner'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-pink-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> Salon Owner
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="e.g. Maria Clara"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@example.com"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0917-xxx-xxxx"
                className="w-full p-2.5 rounded-xl border border-pink-200 bg-pink-50/20 text-xs focus:outline-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !fullname || !email || !password}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-pink-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Account'}</span>
            </button>
          </form>
        )}

        {/* Interactive Google / Gmail Account Chooser */}
        <GoogleAccountChooserModal
          isOpen={showGoogleChooser}
          onClose={() => setShowGoogleChooser(false)}
          role={userType}
          onSuccess={(u) => {
            onLoginSuccess(u);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
