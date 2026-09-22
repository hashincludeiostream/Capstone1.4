import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, HelpCircle, X } from 'lucide-react';
import { getAccountReliabilityInfo, AccountSanctionInfo } from '../../lib/cancellationPolicy';
import { fetchUserReliability } from '../../lib/api';

interface AccountReliabilityBadgeProps {
  userId: number;
  cancellationStrikes?: number;
  reliabilityScore?: number;
  compact?: boolean;
}

export const AccountReliabilityBadge: React.FC<AccountReliabilityBadgeProps> = ({
  userId,
  cancellationStrikes = 0,
  reliabilityScore,
  compact = false,
}) => {
  const [info, setInfo] = useState<AccountSanctionInfo>(
    getAccountReliabilityInfo(cancellationStrikes, reliabilityScore)
  );
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [stats, setStats] = useState<{ total: number; completed: number; cancelled: number } | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserReliability(userId)
        .then((res) => {
          if (res?.info) {
            setInfo(res.info);
            setStats({
              total: res.total_bookings,
              completed: res.completed_bookings,
              cancelled: res.cancelled_bookings,
            });
          }
        })
        .catch(() => {
          setInfo(getAccountReliabilityInfo(cancellationStrikes, reliabilityScore));
        });
    }
  }, [userId, cancellationStrikes, reliabilityScore]);

  return (
    <>
      <div
        onClick={() => setShowDetailModal(true)}
        className={`inline-flex items-center space-x-1.5 cursor-pointer rounded-full transition-all hover:opacity-90 ${
          compact ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs font-medium'
        } ${info.badgeClasses}`}
        title="Click to view store cancellation policy and account standing"
      >
        {info.tier === 'excellent' ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        ) : info.tier === 'good' ? (
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
        )}
        <span>{info.title}</span>
        <HelpCircle className="w-3 h-3 opacity-60 ml-0.5" />
      </div>

      {/* Policy Details Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-pink-600" />
                <h4 className="font-bold text-gray-900 text-base">Booking Reliability Standing</h4>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Standing Card */}
            <div className={`p-4 rounded-xl border ${info.badgeClasses} space-y-2`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{info.title}</span>
                <span className="font-extrabold text-sm">{info.score}% Score</span>
              </div>
              <p className="text-xs leading-relaxed">{info.description}</p>
              <div className="text-[11px] font-medium pt-1 border-t border-black/10">
                Strikes Recorded: <strong>{info.strikes} / 3</strong>
              </div>
            </div>

            {/* If stats are loaded */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">Total</span>
                  <span className="font-bold text-gray-900 text-sm">{stats.total}</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 text-emerald-900">
                  <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Attended</span>
                  <span className="font-bold text-sm">{stats.completed}</span>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100 text-rose-900">
                  <span className="text-rose-700 block text-[10px] uppercase font-semibold">Cancelled</span>
                  <span className="font-bold text-sm">{stats.cancelled}</span>
                </div>
              </div>
            )}

            {/* Cancellation Sanctions Overview */}
            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider">
                Store Schedule Protection Rules
              </h5>
              <div className="space-y-1.5 text-gray-600 text-[11px] leading-relaxed">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <strong className="text-gray-900">24h+ Notice (Flexible):</strong> Free cancellation, zero fees, 0 strikes.
                </div>
                <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100">
                  <strong className="text-amber-950">4h to 24h Notice (Late):</strong> 25% late fee (min ₱150) to compensate reserved specialist, 1 reliability strike.
                </div>
                <div className="p-2 bg-rose-50/60 rounded-lg border border-rose-100">
                  <strong className="text-rose-950">&lt; 4h Notice (Critical Lockout):</strong> 50% penalty fee (min ₱250), 2 reliability strikes.
                </div>
                <div className="p-2 bg-purple-50/60 rounded-lg border border-purple-100">
                  <strong className="text-purple-950">Free Reschedule:</strong> Move to another date or time slot at ₱0 fee and 0 strikes!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
