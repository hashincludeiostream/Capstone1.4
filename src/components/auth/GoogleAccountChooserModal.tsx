import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { loginWithGoogle } from '../../lib/auth';
import { Check, ShieldCheck, Mail, ArrowRight, X, Loader2, Sparkles } from 'lucide-react';

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
  adminCode,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeAccount, setActiveAccount] = useState<'default' | 'custom'>('default');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const primaryGoogleAccount = {
    email: 'hasincludeionull@gmail.com',
    name: 'Hasinclude I. Null',
    avatar: 'https://ui-avatars.com/api/?name=Hasinclude+Null&background=db2777&color=fff',
  };

  const handleSignIn = async (emailToUse: string, nameToUse?: string) => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle(role, adminCode, emailToUse, nameToUse);
      if (result.success && result.user) {
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

  const roleLabels: Record<UserRole, { label: string; badgeColor: string }> = {
    customer: { label: 'Client / Customer Account', badgeColor: 'bg-pink-100 text-pink-700 border-pink-200' },
    salon_owner: { label: 'Salon Owner & Business Suite', badgeColor: 'bg-purple-100 text-purple-700 border-purple-200' },
    admin: { label: 'Platform Executive Administrator', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 relative bg-gradient-to-b from-gray-50/70 to-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-gray-200 flex items-center justify-center p-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Sign in with Google</h3>
              <p className="text-xs text-gray-500">Choose an account to continue to Nail Glam Hub</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleLabels[role].badgeColor}`}>
              {roleLabels[role].label}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Google Verification
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Account 1: Active Google Identity */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSignIn(primaryGoogleAccount.email, primaryGoogleAccount.name)}
            className="w-full text-left p-3.5 rounded-2xl border-2 border-pink-200 hover:border-pink-500 hover:bg-pink-50/40 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <img
                src={primaryGoogleAccount.avatar}
                alt={primaryGoogleAccount.name}
                className="w-11 h-11 rounded-full border border-pink-300 shadow-2xs"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900 group-hover:text-pink-700 transition-colors">
                    {primaryGoogleAccount.name}
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    Active
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-mono mt-0.5">
                  {primaryGoogleAccount.email}
                </div>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-pink-100 group-hover:bg-pink-600 text-pink-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
          </button>

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
                  placeholder="yourname@gmail.com"
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
                  className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
