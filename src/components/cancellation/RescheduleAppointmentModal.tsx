import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CalendarClock,
  X,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Appointment } from '../../types';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onConfirmReschedule: (
    appointmentId: number,
    data: { new_date: string; new_time: string; notes?: string }
  ) => Promise<void>;
}

const AVAILABLE_TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
];

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onConfirmReschedule,
}) => {
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('10:00 AM');
  const [rescheduleNotes, setRescheduleNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  // Minimum date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      setErrorMsg('Please select a new appointment date.');
      return;
    }
    if (!newTime) {
      setErrorMsg('Please select a preferred time slot.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onConfirmReschedule(appointment.id, {
        new_date: newDate,
        new_time: newTime,
        notes: rescheduleNotes,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to reschedule appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-purple-200 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Zero-Penalty Reschedule</span>
          </div>

          <h3 className="text-xl font-bold">Reschedule Appointment</h3>
          <p className="text-purple-100 text-sm mt-1">
            Move your reserved salon service to a new date with <strong>₱0 cancellation fee</strong> and <strong>zero account strikes</strong>.
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleReschedule} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current booking recap */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-xs space-y-1.5 text-purple-900">
            <span className="font-bold block text-purple-950">Current Reservation:</span>
            <div className="flex justify-between">
              <span>Service:</span>
              <strong className="text-purple-950">{appointment.service_name}</strong>
            </div>
            <div className="flex justify-between">
              <span>Salon & Specialist:</span>
              <span>{appointment.salon_name} • {appointment.technician_name || 'Assigned Specialist'}</span>
            </div>
            <div className="flex justify-between">
              <span>Originally Scheduled:</span>
              <span className="line-through text-purple-700">{appointment.appointment_date} @ {appointment.appointment_time}</span>
            </div>
          </div>

          {/* New Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Select New Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                min={minDateStr}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full text-sm py-2.5 px-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* New Time Slot Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Select Preferred Time Slot <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_TIME_SLOTS.map((slot) => {
                const isSelected = newTime === slot;
                return (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setNewTime(slot)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional reason / note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Note for Salon Technician (Optional)
            </label>
            <textarea
              rows={2}
              value={rescheduleNotes}
              onChange={(e) => setRescheduleNotes(e.target.value)}
              placeholder="e.g., Requested weekend morning slot due to work shift change."
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Policy assurance */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Rescheduling retains your reservation deposit with <strong>zero penalty fees</strong>.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newDate}
              className={`py-2.5 px-5 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-2 transition-all ${
                isSubmitting || !newDate
                  ? 'bg-purple-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Rescheduling Slot...</span>
                </>
              ) : (
                <>
                  <CalendarClock className="w-4 h-4" />
                  <span>Confirm Reschedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
