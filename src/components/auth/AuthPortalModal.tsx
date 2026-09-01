import React from 'react';
import {
  X,
  Sparkles,
  Heart,
  Store,
  Shield,
  ArrowRight,
  User as UserIcon,
  CheckCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface AuthPortalModalProps {
  onClose: () => void;
  onSelectPortal: (portal: 'login-customer' | 'register-customer' | 'login-owner' | 'register-owner') => void;
}

export const AuthPortalModal: React.FC<AuthPortalModalProps> = ({
  onClose,
  onSelectPortal,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-pink-100 p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-300 text-white flex items-center justify-center mx-auto shadow-md shadow-pink-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-2xl text-gray-900">
            Choose Your Access Portal
          </h3>
          <p className="text-xs text-gray-500">
            Dedicated authentication gateways tailored to your role in Nail Glam Hub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* 1. Customer Card */}
          <div className="bg-gradient-to-b from-pink-50/80 to-rose-50/40 rounded-2xl p-5 border border-pink-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center mb-3 shadow-xs">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-base text-gray-900">
                Client & Customer
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Discover salons, book nail appointments, save reels & leave verified reviews.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <button
                id="portal-modal-customer-login-btn"
                onClick={() => {
                  onSelectPortal('login-customer');
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Customer Login</span>
              </button>
              <button
                id="portal-modal-customer-register-btn"
                onClick={() => {
                  onSelectPortal('register-customer');
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-pink-100/60 text-pink-700 border border-pink-300 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register as Client</span>
              </button>
            </div>
          </div>

          {/* 2. Salon Owner Card */}
          <div className="bg-gradient-to-b from-purple-50/80 to-indigo-50/40 rounded-2xl p-5 border border-purple-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center mb-3 shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-base text-gray-900">
                Salon Partner
              </h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Manage appointment calendar, staff roster, pricing menu & promotions.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <button
                id="portal-modal-owner-login-btn"
                onClick={() => {
                  onSelectPortal('login-owner');
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Partner Login</span>
              </button>
              <button
                id="portal-modal-owner-register-btn"
                onClick={() => {
                  onSelectPortal('register-owner');
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-purple-100/60 text-purple-800 border border-purple-300 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Salon</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-pink-100 flex items-center justify-between text-xs text-gray-500">
          <span>Need help choosing? Contact customer support</span>
          <button
            onClick={onClose}
            className="text-pink-600 font-semibold hover:underline cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
