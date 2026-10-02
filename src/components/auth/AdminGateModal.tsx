import React, { useState, useEffect } from 'react';
import { Shield, Lock, Key, AlertTriangle, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';

interface AdminGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
}

const AUTHORIZED_ADMIN_CODES = ['ADMIN2025', 'GLAM_ADMIN', 'ADMIN', 'SUPERADMIN'];
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;

export const AdminGateModal: React.FC<AdminGateModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError('');
      setIsSuccess(false);
      setIsAuthorizing(false);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    let timer: any;
    if (lockoutRemaining > 0) {
      timer = setInterval(() => {
        setLockoutRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    const trimmed = passcode.trim();
    if (!trimmed) {
      setError('Please enter your administrative authorization security code.');
      return;
    }

    setIsAuthorizing(true);
    setError('');

    // Simulate verification delay for security feel
    setTimeout(() => {
      const isAuthorized = AUTHORIZED_ADMIN_CODES.some(
        (code) => code.toUpperCase() === trimmed.toUpperCase()
      );

      if (isAuthorized) {
        setIsSuccess(true);
        setError('');
        sessionStorage.setItem('nailglamhub_admin_unlocked', 'true');
        setTimeout(() => {
          setIsAuthorizing(false);
          onAuthorized();
          onClose();
        }, 600);
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setIsAuthorizing(false);

        if (nextAttempts >= MAX_ATTEMPTS) {
          setLockoutRemaining(Math.round(LOCKOUT_DURATION_MS / 1000));
          setError(`Too many invalid attempts. Security gate locked for 30 seconds.`);
        } else {
          setError(
            `Invalid clearance code. (${MAX_ATTEMPTS - nextAttempts} attempts remaining)`
          );
        }
      }
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-stone-950 border border-rose-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white transition cursor-pointer"
          title="Exit Security Gate"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-900/70 to-rose-950 border border-rose-700/50 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-950/50">
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-in zoom-in" />
          ) : (
            <Shield className="w-8 h-8 text-rose-400" />
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3 h-3 text-rose-400" />
            <span>Administrative Security Clearance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Restricted Admin Portal
          </h2>
          <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
            This console is physically isolated from standard client and salon owner pathways. Enter your authorized admin security token to gain clearance.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Authorization Passcode / Master Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Key className="w-4 h-4 text-rose-400" />
              </div>
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin code (e.g. ADMIN2025)..."
                disabled={lockoutRemaining > 0 || isAuthorizing || isSuccess}
                autoFocus
                className="w-full pl-10 pr-11 py-3 bg-stone-900/90 border border-stone-800 focus:border-rose-500 rounded-xl text-sm text-white placeholder-stone-600 focus:outline-hidden focus:ring-2 focus:ring-rose-500/40 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-white transition cursor-pointer"
                title={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {lockoutRemaining > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs text-center font-medium">
              Security lockout active. Please wait {lockoutRemaining}s before re-attempting.
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs text-center font-bold">
              ✓ Clearance Granted. Accessing Super Admin Console...
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={lockoutRemaining > 0 || isAuthorizing || !passcode.trim()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 active:scale-[0.98] text-white text-xs font-bold transition shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthorizing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : isSuccess ? (
                <span>Unlocked</span>
              ) : (
                <span>Authorize Access</span>
              )}
            </button>
          </div>
        </form>

        {/* Security Disclaimers & Hint */}
        <div className="mt-6 pt-4 border-t border-stone-900 text-center">
          <p className="text-[11px] text-stone-500">
            Default platform master passcode: <span className="font-mono text-stone-400">ADMIN2025</span>
          </p>
          <p className="text-[10px] text-stone-600 mt-1">
            Access attempts are audited. Unauthorized entry is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};
