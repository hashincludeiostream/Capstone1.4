import React from 'react';
import { Check, X, ShieldCheck } from 'lucide-react';
import { getPasswordStrengthChecklist } from '../../lib/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showDetails = true,
}) => {
  if (!password) return null;

  const strength = getPasswordStrengthChecklist(password);

  const getColor = () => {
    if (strength.score <= 1) return 'bg-rose-500';
    if (strength.score <= 3) return 'bg-amber-500';
    if (strength.score === 4) return 'bg-blue-500';
    return 'bg-emerald-600';
  };

  const getTextColor = () => {
    if (strength.score <= 1) return 'text-rose-600';
    if (strength.score <= 3) return 'text-amber-600';
    if (strength.score === 4) return 'text-blue-600';
    return 'text-emerald-700';
  };

  return (
    <div className="mt-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs animate-in fade-in duration-200">
      {/* Strength Bar */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
          Password Security
        </span>
        <span className={`text-[11px] font-bold ${getTextColor()}`}>
          {strength.label} ({strength.score}/5)
        </span>
      </div>

      <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${Math.max(10, strength.percentage)}%` }}
        />
      </div>

      {showDetails && (
        <div className="mt-2.5 pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
          <div className={`flex items-center gap-1.5 ${strength.minLength ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
            {strength.minLength ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-stone-300" />}
            <span>At least 8 characters</span>
          </div>
          <div className={`flex items-center gap-1.5 ${strength.hasUppercase ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
            {strength.hasUppercase ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-stone-300" />}
            <span>Uppercase letter (A-Z)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${strength.hasLowercase ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
            {strength.hasLowercase ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-stone-300" />}
            <span>Lowercase letter (a-z)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${strength.hasNumber ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
            {strength.hasNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-stone-300" />}
            <span>At least one number (0-9)</span>
          </div>
          <div className={`flex items-center gap-1.5 sm:col-span-2 ${strength.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
            {strength.hasSpecial ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-stone-300" />}
            <span>Special character (!@#$%^&*...)</span>
          </div>
        </div>
      )}
    </div>
  );
};
