import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Settings,
  Save,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { Salon, Appointment, SalonCancellationPolicyConfig } from '../../types';
import { updateAppointmentLateFee, updateSalonCancellationPolicy } from '../../lib/api';
import { evaluateGracePeriod } from '../../lib/cancellationPolicy';

interface LateCancellationFeesManagerProps {
  salon: Salon | null;
  salons?: Salon[];
  appointments: Appointment[];
  onRefresh: () => void;
  onSelectSalon?: (salonId: number) => void;
}

export const LateCancellationFeesManager: React.FC<LateCancellationFeesManagerProps> = ({
  salon,
  salons = [],
  appointments,
  onRefresh,
  onSelectSalon,
}) => {
  // Tabs for list view
  const [activeFilter, setActiveFilter] = useState<'all_late' | 'pending' | 'collected' | 'waived' | 'grace_free' | 'all_cancelled'>('all_late');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Policy configuration state for the current salon
  const [policyConfig, setPolicyConfig] = useState<SalonCancellationPolicyConfig>(() => {
    const existing = salon?.cancellation_policy_config;
    return {
      grace_period_minutes: existing?.grace_period_minutes ?? 30,
      late_fee_type: existing?.late_fee_type ?? 'percentage',
      late_fee_percentage: existing?.late_fee_percentage ?? 25,
      critical_fee_percentage: existing?.critical_fee_percentage ?? 50,
      min_late_fee: existing?.min_late_fee ?? 150,
      min_critical_fee: existing?.min_critical_fee ?? 250,
      allow_owner_waiver: existing?.allow_owner_waiver ?? true,
      enable_grace_period: existing?.enable_grace_period ?? true,
      auto_charge_deposit: existing?.auto_charge_deposit ?? true,
      unclaimed_order_grace_hours: existing?.unclaimed_order_grace_hours ?? 48,
    };
  });

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configToast, setConfigToast] = useState<string | null>(null);

  // Fee waiver action modal
  const [waiveTargetAppt, setWaiveTargetAppt] = useState<Appointment | null>(null);
  const [waiverReason, setWaiverReason] = useState('First-time courtesy exception');
  const [customWaiverNote, setCustomWaiverNote] = useState('');
  const [isProcessingWaiver, setIsProcessingWaiver] = useState(false);

  // Mark as collected loading state
  const [collectingId, setCollectingId] = useState<number | null>(null);

  // Filter appointments for this salon
  const salonAppointments = useMemo(() => {
    if (!salon) return appointments;
    return appointments.filter((a) => a.salon_id === salon.id);
  }, [appointments, salon]);

  // Cancelled appointments with grace period evaluations
  const cancelledAppointmentsWithMeta = useMemo(() => {
    return salonAppointments
      .filter((a) => a.status === 'cancelled')
      .map((appt) => {
        const graceMinutes = appt.grace_period_minutes || policyConfig.grace_period_minutes || 30;
        const graceEval = evaluateGracePeriod(appt.created_at, appt.cancelled_at, graceMinutes);
        
        // Determine whether this cancellation was outside the 30-minute grace period
        // Use explicitly recorded flag if available, otherwise check elapsed minutes
        const isOutsideGrace = appt.outside_grace_period !== undefined
          ? Boolean(appt.outside_grace_period)
          : graceEval.outside;

        const feeAmount = Number(appt.cancellation_fee || 0);
        const feeStatus = appt.cancellation_fee_status || (feeAmount > 0 ? 'assessed' : 'waived');

        return {
          ...appt,
          graceEval,
          isOutsideGrace,
          effectiveFee: feeAmount,
          feeStatus,
        };
      });
  }, [salonAppointments, policyConfig.grace_period_minutes]);

  // KPI Metrics Calculations
  const metrics = useMemo(() => {
    let totalAssessedFees = 0;
    let totalCollectedFees = 0;
    let totalPendingFees = 0;
    let countOutsideGrace = 0;
    let countWithinGrace = 0;
    let countWaived = 0;

    cancelledAppointmentsWithMeta.forEach((item) => {
      const fee = item.effectiveFee;
      if (item.isOutsideGrace) {
        countOutsideGrace++;
        totalAssessedFees += fee;

        if (item.feeStatus === 'collected') {
          totalCollectedFees += fee;
        } else if (item.feeStatus === 'waived') {
          countWaived++;
        } else {
          totalPendingFees += fee;
        }
      } else {
        countWithinGrace++;
      }
    });

    return {
      totalAssessedFees,
      totalCollectedFees,
      totalPendingFees,
      countOutsideGrace,
      countWithinGrace,
      countWaived,
      totalCancelled: cancelledAppointmentsWithMeta.length,
    };
  }, [cancelledAppointmentsWithMeta]);

  // Filtered List based on active tab and search query
  const filteredList = useMemo(() => {
    return cancelledAppointmentsWithMeta.filter((item) => {
      // Tab filter
      if (activeFilter === 'all_late') {
        if (!item.isOutsideGrace) return false;
      } else if (activeFilter === 'pending') {
        if (!item.isOutsideGrace || item.feeStatus !== 'assessed') return false;
      } else if (activeFilter === 'collected') {
        if (!item.isOutsideGrace || item.feeStatus !== 'collected') return false;
      } else if (activeFilter === 'waived') {
        if (!item.isOutsideGrace || item.feeStatus !== 'waived') return false;
      } else if (activeFilter === 'grace_free') {
        if (item.isOutsideGrace) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const custName = (item.customer_name || '').toLowerCase();
        const custPhone = (item.customer_phone || '').toLowerCase();
        const sName = (item.service_name || '').toLowerCase();
        const reason = (item.cancellation_reason || '').toLowerCase();
        const apptId = String(item.id);

        if (!custName.includes(q) && !custPhone.includes(q) && !sName.includes(q) && !reason.includes(q) && !apptId.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [cancelledAppointmentsWithMeta, activeFilter, searchQuery]);

  // Handle Save Policy Configuration
  const handleSavePolicy = async () => {
    if (!salon) return;
    try {
      setIsSavingConfig(true);
      setConfigToast(null);
      await updateSalonCancellationPolicy(salon.id, policyConfig);
      setConfigToast('Cancellation policy & 30-minute grace window updated successfully!');
      setTimeout(() => setConfigToast(null), 4000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save cancellation policy');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handle Waive Fee
  const handleConfirmWaive = async () => {
    if (!waiveTargetAppt) return;
    try {
      setIsProcessingWaiver(true);
      const combinedReason = `${waiverReason}${customWaiverNote.trim() ? ` - ${customWaiverNote.trim()}` : ''}`;
      await updateAppointmentLateFee(waiveTargetAppt.id, {
        status: 'waived',
        waived_reason: combinedReason,
        notes: `Fee waived by salon owner on ${new Date().toLocaleDateString()}: ${combinedReason}`,
      });
      setWaiveTargetAppt(null);
      setCustomWaiverNote('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to waive cancellation fee');
    } finally {
      setIsProcessingWaiver(false);
    }
  };

  // Handle Mark Collected
  const handleMarkCollected = async (appointmentId: number) => {
    try {
      setCollectingId(appointmentId);
      await updateAppointmentLateFee(appointmentId, {
        status: 'collected',
        notes: `Late cancellation fee settled/collected at salon desk on ${new Date().toLocaleDateString()}`,
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update fee status');
    } finally {
      setCollectingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation Card */}
      <div className="bg-gradient-to-r from-stone-900 via-purple-950 to-rose-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-purple-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>30-Minute Grace Window & Late Notice Protection</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
              Late Cancellation Fees Manager
            </h2>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Configure grace periods and enforce salon late fees for appointments cancelled outside the 30-minute booking grace period. Track assessed penalties, collect settled fees, or grant owner courtesy waivers.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Settings className="w-4 h-4 text-purple-300" />
              <span>{isConfigOpen ? 'Hide Policy Settings' : 'Configure Salon Policy'}</span>
              {isConfigOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onRefresh}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh Cancellation Fees"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Assessed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Total Late Fees Assessed
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
            ₱{metrics.totalAssessedFees.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            {metrics.countOutsideGrace} cancelled outside grace period
          </span>
        </div>

        {/* Collected */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Collected / Settled
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            ₱{metrics.totalCollectedFees.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
            Recovered salon technician revenue
          </span>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Pending Collection
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-2">
            ₱{metrics.totalPendingFees.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
            Pay-at-salon balance or next visit
          </span>
        </div>

        {/* Outside Grace Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Outside 30m Grace
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-2">
            {metrics.countOutsideGrace}
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">
            Penalties assessed to protect chairs
          </span>
        </div>

        {/* Within Grace Window (Free) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Within 30m Grace (Free)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-2">
            {metrics.countWithinGrace}
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">
            Instant remorse (₱0 fee waived)
          </span>
        </div>
      </div>

      {/* Salon Policy Configuration Panel */}
      {isConfigOpen && (
        <div className="bg-white rounded-3xl border border-purple-200 shadow-md p-6 sm:p-7 space-y-6 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Salon Cancellation Fee &amp; Grace Period Policy Configuration
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Tailor notice thresholds, fee percentages, and instant-booking grace period for {salon?.salon_name || 'your salon branch'}.
              </p>
            </div>
            {configToast && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                {configToast}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Grace Period Settings */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Booking Grace Period
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policyConfig.enable_grace_period}
                    onChange={(e) =>
                      setPolicyConfig({ ...policyConfig, enable_grace_period: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                If enabled, clients who cancel within this window after booking creation are charged <strong>₱0 penalty</strong> with 0 strikes.
              </p>

              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">
                  Grace Period Duration (Minutes):
                </label>
                <div className="flex items-center gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() =>
                        setPolicyConfig({ ...policyConfig, grace_period_minutes: mins })
                      }
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        policyConfig.grace_period_minutes === mins
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Late Notice Window (4h to 24h) */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3.5">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Late Notice Fee (4h to 24h Advance)
              </span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Applied when cancelled outside the grace period between 4 and 24 hours before the booked slot.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fee Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={policyConfig.late_fee_percentage}
                      onChange={(e) =>
                        setPolicyConfig({
                          ...policyConfig,
                          late_fee_percentage: Number(e.target.value) || 25,
                        })
                      }
                      className="w-full p-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-900"
                    />
                    <span className="absolute right-3 top-2 text-stone-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Minimum (₱)</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={policyConfig.min_late_fee}
                    onChange={(e) =>
                      setPolicyConfig({
                        ...policyConfig,
                        min_late_fee: Number(e.target.value) || 150,
                      })
                    }
                    className="w-full p-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Critical Lockout (< 4h Notice) */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3.5">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Critical Lockout (&lt; 4h Notice)
              </span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Applied for last-minute cancellations or same-day no-shows where technician tools were sterilized.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fee Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="20"
                      max="100"
                      value={policyConfig.critical_fee_percentage}
                      onChange={(e) =>
                        setPolicyConfig({
                          ...policyConfig,
                          critical_fee_percentage: Number(e.target.value) || 50,
                        })
                      }
                      className="w-full p-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-900"
                    />
                    <span className="absolute right-3 top-2 text-stone-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Minimum (₱)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={policyConfig.min_critical_fee}
                    onChange={(e) =>
                      setPolicyConfig({
                        ...policyConfig,
                        min_critical_fee: Number(e.target.value) || 250,
                      })
                    }
                    className="w-full p-2 rounded-xl border border-stone-300 font-bold bg-white text-stone-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-100 flex-wrap gap-3">
            <div className="flex items-center gap-4 text-stone-600">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyConfig.allow_owner_waiver}
                  onChange={(e) =>
                    setPolicyConfig({ ...policyConfig, allow_owner_waiver: e.target.checked })
                  }
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-semibold">
                  Allow Salon Owner to waive fee for verified medical or VIP emergencies
                </span>
              </label>
            </div>

            <button
              onClick={handleSavePolicy}
              disabled={isSavingConfig}
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingConfig ? 'Saving Policy...' : 'Save Salon Policy Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main List Section */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* Filter Bar & Search */}
        <div className="p-4 sm:p-5 border-b border-stone-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by client name, phone, booking #, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setActiveFilter('all_late')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'all_late'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Outside 30m Grace ({metrics.countOutsideGrace})
              </button>

              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Pending Collection (₱{metrics.totalPendingFees.toLocaleString()})
              </button>

              <button
                onClick={() => setActiveFilter('collected')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'collected'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Collected (₱{metrics.totalCollectedFees.toLocaleString()})
              </button>

              <button
                onClick={() => setActiveFilter('waived')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'waived'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Waived ({metrics.countWaived})
              </button>

              <button
                onClick={() => setActiveFilter('grace_free')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'grace_free'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Within 30m Grace ({metrics.countWithinGrace})
              </button>

              <button
                onClick={() => setActiveFilter('all_cancelled')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === 'all_cancelled'
                    ? 'bg-stone-800 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Cancelled ({metrics.totalCancelled})
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        {filteredList.length === 0 ? (
          <div className="py-20 text-center p-8">
            <ShieldAlert className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-stone-800">
              No cancellation fee records found
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No cancelled appointments matched your search query. Try clearing the filter.'
                : 'Appointments cancelled outside the 30-minute grace period will appear here with calculated late fees.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredList.map((item) => {
              const isWaived = item.feeStatus === 'waived';
              const isCollected = item.feeStatus === 'collected';
              const isAssessed = item.feeStatus === 'assessed';
              const isProcessingThis = collectingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 hover:bg-stone-50/70 transition-colors space-y-4"
                >
                  {/* Top Bar: Reference, Grace Status, Fee */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.isOutsideGrace
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.isOutsideGrace ? <Clock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            #APT-{item.id}
                          </span>

                          {/* 30-Minute Grace Period Badge */}
                          {item.isOutsideGrace ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-1 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Outside 30m Grace Period ({item.graceEval?.formattedElapsed || 'Over 30m'})
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Within 30m Grace Period ({item.graceEval?.formattedElapsed || '< 30m'})
                            </span>
                          )}

                          {/* Tier Badge */}
                          {item.cancellation_tier && (
                            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold uppercase tracking-wider">
                              {item.cancellation_tier} Notice
                            </span>
                          )}
                        </div>

                        {/* Customer line */}
                        <div className="flex items-center gap-3 text-xs text-stone-600 mt-1 flex-wrap">
                          <span className="font-semibold text-stone-900 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-stone-400" />
                            {item.customer_name || 'Client'}
                          </span>
                          {item.customer_phone && (
                            <a
                              href={`tel:${item.customer_phone}`}
                              className="text-stone-500 hover:text-stone-900 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-stone-400" />
                              {item.customer_phone}
                            </a>
                          )}
                          {item.customer_email && (
                            <a
                              href={`mailto:${item.customer_email}`}
                              className="text-stone-500 hover:text-stone-900 flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3 text-stone-400" />
                              {item.customer_email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fee Badge & Value */}
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-stone-400">
                          Assessed Late Fee
                        </div>
                        <div className="text-base sm:text-lg font-black text-stone-900">
                          {item.effectiveFee > 0 ? `₱${item.effectiveFee.toLocaleString()}` : '₱0 (Waived)'}
                        </div>
                      </div>

                      {/* Status Tag */}
                      {isWaived ? (
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200">
                          Waived by Owner
                        </span>
                      ) : isCollected ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Collected
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Pending Collection
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Details: Schedule, Reason, Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/70">
                    {/* Service & Slot */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Service &amp; Scheduled Slot
                      </span>
                      <div className="font-semibold text-stone-900">{item.service_name || 'Nail Service'}</div>
                      <div className="text-stone-500 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>
                          {item.appointment_date} at {item.appointment_time}
                        </span>
                      </div>
                      <div className="text-stone-500">
                        Service Price: ₱{Number(item.total_price || item.service_price || 0).toLocaleString()}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Timeline &amp; Notice
                      </span>
                      <div className="text-stone-600">
                        Booked: {new Date(item.created_at).toLocaleString()}
                      </div>
                      <div className="text-stone-600">
                        Cancelled:{' '}
                        {item.cancelled_at
                          ? new Date(item.cancelled_at).toLocaleString()
                          : 'Recent'}
                      </div>
                      <div className="text-stone-500">
                        Elapsed since booking:{' '}
                        <strong className={item.isOutsideGrace ? 'text-rose-700' : 'text-emerald-700'}>
                          {item.graceEval?.formattedElapsed || 'N/A'}
                        </strong>
                      </div>
                    </div>

                    {/* Reason & Waiver Explanation */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Cancellation Reason &amp; Notes
                      </span>
                      <div className="font-semibold text-stone-800">
                        {item.cancellation_reason || 'Client requested cancellation'}
                      </div>
                      {item.cancellation_notes && (
                        <div className="text-stone-500 italic">"{item.cancellation_notes}"</div>
                      )}
                      {item.cancellation_fee_waived_reason && (
                        <div className="text-purple-700 bg-purple-50 p-1.5 rounded-lg border border-purple-200 mt-1 font-medium text-[11px]">
                          Waiver reason: {item.cancellation_fee_waived_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for Salon Owner */}
                  {item.isOutsideGrace && item.effectiveFee > 0 && (
                    <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
                      {!isWaived && isAssessed && (
                        <button
                          onClick={() => setWaiveTargetAppt(item)}
                          className="px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>Waive Late Fee</span>
                        </button>
                      )}

                      {!isCollected && (
                        <button
                          onClick={() => handleMarkCollected(item.id)}
                          disabled={isProcessingThis}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isProcessingThis ? 'Updating...' : 'Mark as Collected'}</span>
                        </button>
                      )}

                      {isWaived && (
                        <button
                          onClick={() => handleMarkCollected(item.id)}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold cursor-pointer"
                        >
                          Re-assess / Mark Collected
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Waive Late Fee Modal Dialog */}
      {waiveTargetAppt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-base">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Waive Late Cancellation Fee</span>
              </div>
              <button
                onClick={() => setWaiveTargetAppt(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              You are about to waive the late cancellation fee of{' '}
              <strong className="text-stone-900">
                ₱{Number(waiveTargetAppt.cancellation_fee || 0).toLocaleString()}
              </strong>{' '}
              for <strong className="text-stone-900">{waiveTargetAppt.customer_name}</strong> (Booking #APT-{waiveTargetAppt.id}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Select Waiver Reason:
                </label>
                <select
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-medium bg-white text-stone-900"
                >
                  <option value="First-time courtesy exception">First-time courtesy exception</option>
                  <option value="Verified client medical emergency">Verified client medical emergency</option>
                  <option value="Loyal VIP regular client privilege">Loyal VIP regular client privilege</option>
                  <option value="Severe weather / transport disruption">Severe weather / transport disruption</option>
                  <option value="Salon scheduling conflict / rescheduled slot">Salon scheduling conflict / rescheduled slot</option>
                  <option value="Other special circumstance">Other special circumstance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Optional Internal Note for Salon Records:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Client phoned and confirmed doctor consultation, approved by salon manager."
                  value={customWaiverNote}
                  onChange={(e) => setCustomWaiverNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-medium text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWaiveTargetAppt(null)}
                disabled={isProcessingWaiver}
                className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWaive}
                disabled={isProcessingWaiver}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessingWaiver ? 'Waiving...' : 'Confirm Fee Waiver'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
