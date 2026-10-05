import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { loginWithGoogle } from '../../lib/auth';
import { ShieldCheck, Mail, ArrowRight, X, Loader2, Sparkles, KeyRound } from 'lucide-react';

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  adminCode?: string;
  onSuccess: (user: User) => void;
}

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  role,
  adminCode: initialAdminCode,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeAccount, setActiveAccount] = useState<'default' | 'custom'>('default');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState(initialAdminCode || (role === 'admin' ? 'ADMIN2025' : ''));

  if (!isOpen) return null;

  // Stored role-specific Google account or default role profile
  const storedRoleEmail =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(`last_google_${role}_email`)
      : null;

  // Strictly segregated primary Google account persona per role
  const roleAccounts: Record<
    UserRole,
    { email: string; name: string; avatar: string; roleDescription: string }
  > = {
    customer: {
      email: storedRoleEmail && !storedRoleEmail.toLowerCase().includes('admin') && storedRoleEmail !== 'hasincludeionull@gmail.com'
        ? storedRoleEmail
        : 'claire.delacruz@gmail.com',
      name: 'Claire Dela Cruz',
      avatar: 'https://ui-avatars.com/api/?name=Claire+Dela+Cruz&background=db2777&color=fff',
      roleDescription: 'Verified Client Profile',
    },
    salon_owner: {
      email: storedRoleEmail && !storedRoleEmail.toLowerCase().includes('admin') && storedRoleEmail !== 'hasincludeionull@gmail.com'
        ? storedRoleEmail
        : 'testowner@gmail.com',
      name: 'Test Owner',
      avatar: 'https://ui-avatars.com/api/?name=Test+Owner&background=7c3aed&color=fff',
      roleDescription: 'Verified Salon Partner & Manager',
    },
    admin: {
      email: storedRoleEmail || 'hasincludeionull@gmail.com',
      name: 'Hasinclude I. Null',
      avatar: 'https://ui-avatars.com/api/?name=Hasinclude+Null&background=e11d48&color=fff',
      roleDescription: 'Platform Executive Administrator',
    },
  };

  const currentPrimaryAccount = roleAccounts[role];

  const handleSignIn = async (emailToUse: string, nameToUse?: string) => {
    // Client-side guard: block admin accounts from being used in client or partner login
    const normalizedEmail = emailToUse.trim().toLowerCase();
    const isAdminAccount =
      normalizedEmail === 'hasincludeionull@gmail.com' ||
      normalizedEmail === 'admin@nailglamhub.com' ||
      (normalizedEmail.includes('admin') && !normalizedEmail.includes('customer'));

    if (role !== 'admin' && isAdminAccount) {
      setError(
        'This Google account has Administrator credentials. Please switch to the Administrator Portal to sign in.'
      );
      return;
    }

    setLoading(true);
    setError('');

    const effectiveAdminCode = role === 'admin' ? adminCodeInput || initialAdminCode || 'ADMIN2025' : undefined;

    try {
      const result = await loginWithGoogle(role, effectiveAdminCode, emailToUse.trim(), nameToUse?.trim());
      if (result.success && result.user) {
        if (role !== 'admin' && result.user.user_type === 'admin') {
          setError('Administrator session detected. This portal is strictly for ' + (role === 'customer' ? 'clients' : 'partners') + '.');
          return;
        }
        onSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'Failed to authenticate with Google account');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error encountered');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please provide a valid Gmail or Google Workspace email address');
      return;
    }
    handleSignIn(customEmail.trim(), customName.trim());
  };

  const roleLabels: Record<UserRole, { label: string; badgeColor: string; themeColor: string; buttonBg: string }> = {
    customer: {
      label: 'Client / Customer Account',
      badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
      themeColor: 'border-pink-200 hover:border-pink-500 hover:bg-pink-50/40 text-pink-600',
      buttonBg: 'bg-pink-600 hover:bg-pink-700',
    },
    salon_owner: {
      label: 'Salon Owner & Business Suite',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      themeColor: 'border-purple-200 hover:border-purple-500 hover:bg-purple-50/40 text-purple-600',
      buttonBg: 'bg-purple-600 hover:bg-purple-700',
    },
    admin: {
      label: 'Platform Executive Administrator',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      themeColor: 'border-rose-200 hover:border-rose-600 hover:bg-rose-50/40 text-rose-700',
      buttonBg: 'bg-rose-700 hover:bg-rose-800',
    },
  };

  const activeTheme = roleLabels[role];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100 relative bg-gradient-to-b from-gray-50/70 to-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2 pr-6">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-gray-200 flex items-center justify-center p-2 shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">Sign in with Google</h3>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">Choose an account to continue</p>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-3 flex items-center justify-between gap-2 flex-wrap">
            <span className={`text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border truncate ${activeTheme.badgeColor}`}>
              {activeTheme.label}
            </span>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 font-medium flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> Google Verification
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 pt-3 sm:pt-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Role-Specific Primary Google Identity */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSignIn(currentPrimaryAccount.email, currentPrimaryAccount.name)}
            className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-2 group cursor-pointer disabled:opacity-50 ${activeTheme.themeColor}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src={currentPrimaryAccount.avatar}
                alt={currentPrimaryAccount.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-200 shadow-2xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-gray-950 transition-colors truncate">
                    {currentPrimaryAccount.name}
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                    Active
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-gray-600 font-mono mt-0.5 truncate">
                  {currentPrimaryAccount.email}
                </div>
                <div className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                  {currentPrimaryAccount.roleDescription}
                </div>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-800 text-gray-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Admin Code Field if in Admin Mode */}
          {role === 'admin' && (
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1.5">
              <label className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-rose-700" />
                Administrator Security Passcode
              </label>
              <input
                type="password"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                placeholder="Enter ADMIN2025"
                className="w-full px-3 py-1.5 text-xs border border-rose-300 rounded-xl bg-white font-mono uppercase focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          )}

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 text-gray-400 font-medium">Or use another Google account</span>
            </div>
          </div>

          {/* Option 2: Custom Google Account Input */}
          {activeAccount !== 'custom' ? (
            <button
              type="button"
              onClick={() => setActiveAccount('custom')}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-gray-400" />
              <span>Use a different Gmail / Workspace address</span>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gmail / Google Account Email
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder={role === 'customer' ? 'client@gmail.com' : role === 'salon_owner' ? 'partner@gmail.com' : 'admin@gmail.com'}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAccount('default')}
                  className="px-3 py-2 border border-gray-300 text-gray-600 rounded-xl text-xs hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 px-3 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${activeTheme.buttonBg}`}
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Continue with this Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            Automatic monthly reports & receipts
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
