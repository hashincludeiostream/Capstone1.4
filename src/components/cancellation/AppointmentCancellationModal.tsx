import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  CalendarClock,
  Sparkles,
  Info,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Appointment } from '../../types';
import {
  calculateAppointmentCancellationTier,
  APPOINTMENT_CANCELLATION_REASONS,
  CancellationTierCalculation,
} from '../../lib/cancellationPolicy';

interface AppointmentCancellationModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onConfirmCancel: (
    appointmentId: number,
    data: {
      cancellation_reason: string;
      cancellation_notes: string;
      tier: string;
      fee: number;
    }
  ) => Promise<void>;
  onOpenReschedule: (appointment: Appointment) => void;
}

export const AppointmentCancellationModal: React.FC<AppointmentCancellationModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onConfirmCancel,
  onOpenReschedule,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [reasonNotes, setReasonNotes] = useState<string>('');
  const [acknowledgedPolicy, setAcknowledgedPolicy] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const price = Number(appointment.total_price || appointment.service_price || 0);
  const policy: CancellationTierCalculation = calculateAppointmentCancellationTier(
    appointment.appointment_date,
    appointment.appointment_time,
    price
  );

  const selectedReasonObj = APPOINTMENT_CANCELLATION_REASONS.find(
    (r) => r.id === selectedReasonId
  );

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!selectedReasonId) {
        setErrorMsg('Please select a primary cancellation reason to proceed.');
        return;
      }
      if (selectedReasonObj?.requiresDetails && !reasonNotes.trim()) {
        setErrorMsg('Please provide a brief explanation for other reasons.');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleCancelSubmit = async () => {
    if (!acknowledgedPolicy) {
      setErrorMsg('You must check the agreement acknowledging the store policy & sanctions.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onConfirmCancel(appointment.id, {
        cancellation_reason: selectedReasonObj?.label || 'Client requested cancellation',
        cancellation_notes: reasonNotes,
        tier: policy.tier,
        fee: policy.fee,
      });
      // reset
      setStep(1);
      setSelectedReasonId('');
      setReasonNotes('');
      setAcknowledgedPolicy(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to cancel appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-pink-700 p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-rose-100 text-xs font-semibold tracking-wider uppercase mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Store Schedule Protection & Cancellation</span>
          </div>

          <h3 className="text-xl font-bold">Cancel Salon Appointment</h3>
          <p className="text-rose-100 text-sm mt-1">
            Step {step} of 3: {step === 1 ? 'Schedule Impact & Policy' : step === 2 ? 'Reason for Cancellation' : 'Final Review & Sanctions'}
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center space-x-2 mt-4">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: IMPACT ASSESSMENT & POLICY */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Appointment summary card */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{appointment.service_name}</h4>
                    <p className="text-sm text-pink-600 font-medium">{appointment.salon_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase font-semibold text-gray-500">Service Fee</span>
                    <p className="text-base font-bold text-gray-900">₱{price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{appointment.appointment_date}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{appointment.appointment_time}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 col-span-2">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span>
                      Technician:{' '}
                      <strong className="text-gray-700">
                        {appointment.technician_name || 'Assigned Specialist'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy Tier Assessment */}
              <div className={`p-4 rounded-xl border ${policy.badgeBg} ${policy.badgeBorder}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className={`w-5 h-5 ${policy.badgeText}`} />
                    <h5 className={`font-bold text-sm ${policy.badgeText}`}>{policy.title}</h5>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full bg-white shadow-xs ${policy.badgeText}`}>
                    {policy.hoursRemaining} hrs until slot
                  </span>
                </div>
                <p className="text-xs text-gray-700 mt-2 leading-relaxed">{policy.description}</p>

                {/* Financial breakdown */}
                <div className="mt-3 pt-3 border-t border-gray-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block">Cancellation Fee</span>
                    <span className="text-sm font-bold text-gray-900">
                      {policy.fee > 0 ? `₱${policy.fee.toLocaleString()}` : '₱0 (No Fee)'}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block">Reliability Strikes</span>
                    <span className={`text-sm font-bold ${policy.strike ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {policy.strike ? `+${policy.strikeCount} Strike(s)` : '0 Strikes (Clean)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* RETENTION HOOK: Reschedule instead for free */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 text-purple-900">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-sm text-purple-950">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Prefer to Reschedule Instead?</span>
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      Need a different time? Rescheduling incurs <strong>₱0 cancellation fee</strong>, protects your booking deposit, and adds <strong>0 account strikes</strong>!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReschedule(appointment);
                  }}
                  className="mt-3 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>Choose Another Date / Time for Free</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REASON SELECTION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Why do you need to cancel this appointment? <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {APPOINTMENT_CANCELLATION_REASONS.map((r) => {
                    const isSelected = selectedReasonId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReasonId(r.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-rose-950' : 'text-gray-900'}`}>
                            {r.label}
                          </span>
                          <input
                            type="radio"
                            name="cancellation_reason"
                            checked={isSelected}
                            onChange={() => setSelectedReasonId(r.id)}
                            className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                          />
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{r.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Notes / Explanation for Salon Manager {selectedReasonObj?.requiresDetails && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={2}
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  placeholder="Optional details or context to help salon staff understand..."
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-[11px] text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Salon Policy Reminder:</strong> Cancellations within 24 hours disrupt specialist shifts and hold up waiting clients. Your reason is saved in our system for salon audit reviews.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: FINAL SANCTIONS & CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                  Cancellation Confirmation Summary
                </h5>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-semibold text-gray-900">{appointment.service_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Reserved Slot:</span>
                    <span className="font-semibold text-gray-900">
                      {appointment.appointment_date} @ {appointment.appointment_time}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Assigned Technician:</span>
                    <span className="font-semibold text-gray-900">
                      {appointment.technician_name || 'Assigned Specialist'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Selected Reason:</span>
                    <span className="font-semibold text-rose-700">{selectedReasonObj?.label}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-600">Cancellation Penalty Fee:</span>
                    <span className={`font-bold ${policy.fee > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {policy.fee > 0 ? `₱${policy.fee.toLocaleString()}` : '₱0 (Grace Period)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Account Sanction:</span>
                    <span className={`font-bold ${policy.strike ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {policy.strike ? `+${policy.strikeCount} Strike(s) Applied` : 'Zero Strikes'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sanction explanation */}
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl space-y-2 text-xs text-rose-900">
                <div className="flex items-center space-x-2 font-bold text-rose-950">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Account Reliability Impact</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  Users accumulating 3 or more late cancellation strikes are placed on a probationary tier. Probationary accounts cannot use Pay-in-Salon for peak weekend slots and require mandatory advance pre-payments.
                </p>
              </div>

              {/* Mandatory Agreement Checkbox */}
              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedPolicy}
                  onChange={(e) => setAcknowledgedPolicy(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                />
                <span className="text-xs text-gray-700 leading-normal">
                  I confirm that I want to cancel this appointment. I acknowledge that the technician station will be vacated, that applicable cancellation fees (<strong>₱{policy.fee.toLocaleString()}</strong>) apply, and that this cancellation is permanently recorded on my profile.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleBack}
              className="py-2 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors"
            >
              Keep My Booking
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <span>Continue to Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!acknowledgedPolicy || isSubmitting}
              onClick={handleCancelSubmit}
              className={`py-2.5 px-5 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all ${
                !acknowledgedPolicy || isSubmitting
                  ? 'bg-rose-300 cursor-not-allowed'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Cancellation...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Cancellation & Impose Sanctions</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
