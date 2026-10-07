import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Scissors,
  Store,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Appointment } from '../../types';

export interface CancelBookingConfirmationModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  cancelledByRole: 'customer' | 'salon_owner' | 'admin';
  onClose: () => void;
  onConfirm: (reason: string, notes?: string) => Promise<void> | void;
}

export const CancelBookingConfirmationModal: React.FC<CancelBookingConfirmationModalProps> = ({
  isOpen,
  appointment,
  cancelledByRole,
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const defaultReasons =
    cancelledByRole === 'salon_owner'
      ? [
          'Specialist / Technician Unavailable',
          'Salon Emergency or Maintenance',
          'Schedule Conflict / Double-Booked',
          'Client Requested Cancellation via Phone',
          'Other reason',
        ]
      : [
          'Personal Emergency or Illness',
          'Work / Travel Schedule Conflict',
          'Booked by Mistake / Wrong Time',
          'Prefer to Reschedule Later',
          'Other reason',
        ];

  const handleConfirm = async () => {
    const finalReason = selectedReason || defaultReasons[0];
    try {
      setIsSubmitting(true);
      await onConfirm(finalReason, customNotes);
      onClose();
    } catch (err) {
      console.error('Cancellation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/40 border-b border-rose-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Cancel Booking Confirmation
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                {cancelledByRole === 'salon_owner'
                  ? 'Salon Owner Action'
                  : 'Client Action'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Main Question */}
          <div className="text-center sm:text-left">
            <p className="text-base sm:text-lg font-bold text-gray-900">
              Are you sure you want to cancel the booking?
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {cancelledByRole === 'salon_owner'
                ? 'The client will be automatically notified that your salon cancelled this appointment.'
                : 'The salon will be notified immediately and this slot will be released.'}
            </p>
          </div>

          {/* Appointment Summary Card */}
          <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-rose-100 pb-2">
              <span className="flex items-center gap-1.5 text-rose-900">
                <Scissors className="w-3.5 h-3.5 text-rose-600" />
                <span>{appointment.service_name || 'Nail Service'}</span>
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Booking #{appointment.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 pt-1">
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="truncate">{appointment.salon_name || 'Salon'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="truncate">{appointment.customer_name || 'Client'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>{appointment.appointment_date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>{appointment.appointment_time}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Reason Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Reason for Cancellation
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-900 focus:outline-rose-500 focus:border-rose-500"
            >
              <option value="">Select a reason...</option>
              {defaultReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Provide any additional explanation for the other party..."
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-900 focus:outline-rose-500 focus:border-rose-500"
            />
          </div>
        </div>

        {/* Modal Footer Controls: Clear Choices Yes or No */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition-colors cursor-pointer text-center"
          >
            No, Keep Booking
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Yes, Cancel Booking</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
