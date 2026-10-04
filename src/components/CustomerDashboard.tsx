import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Heart,
  Plus,
  MessageSquare,
  Sparkles,
  Image as ImageIcon,
  X,
  CalendarClock,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Appointment, Salon, User } from '../types';
import { fetchAppointments, cancelAppointment, rescheduleAppointment } from '../lib/api';
import { scrollToElement } from '../utils/scrollHelper';
import { AppointmentCancellationModal } from './cancellation/AppointmentCancellationModal';
import { RescheduleAppointmentModal } from './cancellation/RescheduleAppointmentModal';
import { AccountReliabilityBadge } from './cancellation/AccountReliabilityBadge';

interface CustomerDashboardProps {
  currentUser: User;
  salons: Salon[];
  onOpenBooking: () => void;
  onOpenLeaveReview: (salon: Salon, technicianId?: number | null, technicianName?: string) => void;
  onSelectSalon: (salon: Salon) => void;
  onRefreshAppointments?: () => void;
  targetAppointmentId?: number | null;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  salons,
  onOpenBooking,
  onOpenLeaveReview,
  onSelectSalon,
  onRefreshAppointments,
  targetAppointmentId,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    if (targetAppointmentId) {
      setFilterStatus('all');
      scrollToElement(`customer-appointment-${targetAppointmentId}`);
    }
  }, [targetAppointmentId]);

  const reloadAppointments = async () => {
    const list = await fetchAppointments({ customer_id: currentUser.id });
    setAppointments(list);
    onRefreshAppointments?.();
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await fetchAppointments({ customer_id: currentUser.id });
      setAppointments(list);
      setLoading(false);
      onRefreshAppointments?.();
    }
    load();
  }, [currentUser.id]);

  const handleConfirmCancel = async (
    appointmentId: number,
    data: {
      cancellation_reason: string;
      cancellation_notes: string;
      tier: string;
      fee: number;
    }
  ) => {
    await cancelAppointment(appointmentId, {
      cancellation_reason: data.cancellation_reason,
      cancellation_notes: data.cancellation_notes,
      cancelled_by: 'customer',
    });
    await reloadAppointments();
  };

  const handleConfirmReschedule = async (
    appointmentId: number,
    data: { new_date: string; new_time: string; notes?: string }
  ) => {
    await rescheduleAppointment(appointmentId, data);
    await reloadAppointments();
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'upcoming') return a.status === 'pending' || a.status === 'confirmed';
    if (filterStatus === 'past') return a.status === 'completed' || a.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Confirmation
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-pink-900 via-rose-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.fullname}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-pink-300 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center border-2 border-pink-300 shadow-md">
              <span className="text-white text-xl font-bold">
                {currentUser.fullname.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-pink-200 text-[11px] font-semibold mb-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Client Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">
              Welcome, {currentUser.fullname}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-pink-100/80">
                Manage your upcoming nail appointments, beauty history, and saved pins.
              </p>
              <span className="hidden sm:inline text-pink-300">•</span>
              <AccountReliabilityBadge
                userId={currentUser.id}
                cancellationStrikes={currentUser.cancellation_strikes}
                reliabilityScore={currentUser.reliability_score}
                compact
              />
            </div>
          </div>
        </div>

        <button
          onClick={onOpenBooking}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-pink-500/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Total Bookings</p>
          <p className="text-xl sm:text-2xl font-bold font-serif text-pink-900 mt-1">
            {appointments.length}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Upcoming</p>
          <p className="text-xl sm:text-2xl font-bold font-serif text-pink-600 mt-1">
            {appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Completed</p>
          <p className="text-xl sm:text-2xl font-bold font-serif text-emerald-700 mt-1">
            {appointments.filter((a) => a.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-pink-100 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-medium text-gray-500">Reliability</p>
          <div className="mt-1">
            <AccountReliabilityBadge
              userId={currentUser.id}
              cancellationStrikes={currentUser.cancellation_strikes}
              reliabilityScore={currentUser.reliability_score}
            />
          </div>
        </div>
      </div>

      {/* Bookings Pipeline Section */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-pink-50">
          <div>
            <h3 className="text-lg font-serif font-bold text-gray-900">
              Appointment History & Schedule
            </h3>
            <p className="text-xs text-gray-500">Track real-time status of your reservations.</p>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: `All (${appointments.length})` },
              {
                id: 'upcoming',
                label: `Upcoming (${appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length})`,
              },
              {
                id: 'past',
                label: `Past (${appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-pink-50 text-gray-700 hover:bg-pink-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Loading your bookings...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-10 h-10 text-pink-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No appointments found</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Ready to treat yourself? Discover premier salons and book your first slot.
            </p>
            <button
              onClick={onOpenBooking}
              className="mt-4 px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-semibold cursor-pointer"
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredAppointments.map((appt) => {
              const salon = salons.find((s) => s.id === appt.salon_id);
              return (
                <div
                  key={appt.id}
                  id={`customer-appointment-${appt.id}`}
                  className="p-4 sm:p-5 rounded-2xl border border-pink-100 hover:border-pink-300 bg-pink-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[10px] uppercase font-bold">
                        {new Date(appt.appointment_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-base font-bold leading-none">
                        {new Date(appt.appointment_date).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-900">
                          {appt.salon_name}
                        </span>
                        {getStatusBadge(appt.status)}
                      </div>

                      <h4 className="text-sm font-semibold text-pink-900">
                        {appt.service_name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-pink-500" />
                          {appt.appointment_time} ({appt.service_duration || 60} mins)
                        </span>
                        <span>•</span>
                        <span>Specialist: <strong>{appt.staff_name || 'Any'}</strong></span>
                        {appt.payment_method ? (
                          <>
                            <span>•</span>
                            <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {appt.payment_method.replace('paymongo_', 'PayMongo ').toUpperCase()}
                              {appt.paid_amount ? ` (₱${Number(appt.paid_amount).toLocaleString()} Paid)` : ''}
                            </span>
                            {Number(appt.remaining_balance || 0) > 0 && (
                              <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                ₱{Number(appt.remaining_balance).toLocaleString()} Due in Salon
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span>•</span>
                            <span className="text-pink-800 font-semibold bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                              In-Store Settlement
                            </span>
                          </>
                        )}
                      </div>

                      {appt.notes && (
                        <p className="text-[11px] text-gray-500 mt-2 italic bg-white p-2 rounded-lg border border-pink-100 inline-block">
                          Note: "{appt.notes}"
                        </p>
                      )}

                      {appt.design_image && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(appt.design_image || null)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100/80 border border-pink-200 text-[11px] font-semibold text-pink-800 cursor-pointer transition-colors group"
                            title="Click to view full image"
                          >
                            <img
                              src={appt.design_image}
                              alt="Design Reference"
                              className="w-5 h-5 rounded object-cover border border-pink-300"
                            />
                            <span>View Design Inspo</span>
                          </button>
                        </div>
                      )}

                      {/* Cancellation Sanctions & Audit Banner if cancelled */}
                      {appt.status === 'cancelled' && (
                        <div className="mt-3 p-3 bg-red-50/80 border border-red-200 rounded-xl text-xs space-y-1 text-red-900">
                          <div className="flex items-center gap-1.5 font-bold text-red-950">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>Cancellation: {appt.cancellation_reason || 'Client requested cancellation'}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-red-800 font-medium pl-5.5">
                            {appt.cancellation_tier && (
                              <span className="bg-red-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">
                                {appt.cancellation_tier} tier
                              </span>
                            )}
                            {Number(appt.cancellation_fee || 0) > 0 ? (
                              <span className="bg-rose-200 text-rose-950 px-2 py-0.5 rounded-md font-bold">
                                ₱{Number(appt.cancellation_fee).toLocaleString()} Late Fee Applied
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                ₱0 Fee (Standard Notice)
                              </span>
                            )}
                            <span>• Specialist schedule released</span>
                          </div>
                          {appt.cancellation_notes && (
                            <p className="text-[11px] text-red-700 italic pl-5.5">
                              "{appt.cancellation_notes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-pink-100">
                    <span className="text-[11px] font-mono text-gray-400">#NGH-{appt.id}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {salon && (
                        <button
                          onClick={() => onSelectSalon(salon)}
                          className="px-3 py-1.5 rounded-xl border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-semibold cursor-pointer"
                        >
                          Salon Info
                        </button>
                      )}

                      {/* Active Appointment Actions: Reschedule & Cancel */}
                      {(appt.status === 'pending' || appt.status === 'confirmed') && (
                        <>
                          <button
                            onClick={() => setReschedulingAppt(appt)}
                            className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                            title="Reschedule to a new date with zero penalty fee"
                          >
                            <CalendarClock className="w-3.5 h-3.5 text-purple-600" />
                            <span>Reschedule</span>
                          </button>
                          <button
                            onClick={() => setCancellingAppt(appt)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                            title="Cancel appointment (subject to store cancellation policy)"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}

                      {appt.status === 'completed' && salon && (
                        <button
                          onClick={() => onOpenLeaveReview(salon, appt.technician_id, appt.technician_name)}
                          className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lightbox Modal for Inspiration Photo */}
        {previewImage && (
          <div
            id="customer-inspo-lightbox-modal"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-lg w-full bg-white rounded-2xl p-4 shadow-2xl border border-pink-200 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-pink-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-pink-600" />
                  <h4 className="text-sm font-bold text-gray-900">Design Inspiration Reference</h4>
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center max-h-[70vh]">
                <img
                  src={previewImage}
                  alt="Full Inspiration Reference"
                  className="w-full h-auto max-h-[68vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Structured Multi-Step Appointment Cancellation Modal */}
        <AppointmentCancellationModal
          isOpen={Boolean(cancellingAppt)}
          appointment={cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          onConfirmCancel={handleConfirmCancel}
          onOpenReschedule={(appt) => {
            setCancellingAppt(null);
            setReschedulingAppt(appt);
          }}
        />

        {/* Zero-Penalty Reschedule Appointment Modal */}
        <RescheduleAppointmentModal
          isOpen={Boolean(reschedulingAppt)}
          appointment={reschedulingAppt}
          onClose={() => setReschedulingAppt(null)}
          onConfirmReschedule={handleConfirmReschedule}
        />
      </div>
    </div>
  );
};
