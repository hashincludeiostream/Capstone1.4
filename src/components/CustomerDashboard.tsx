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
} from 'lucide-react';
import { Appointment, Salon, User } from '../types';
import { fetchAppointments } from '../lib/api';

interface CustomerDashboardProps {
  currentUser: User;
  salons: Salon[];
  onOpenBooking: () => void;
  onOpenLeaveReview: (salon: Salon, technicianId?: number | null, technicianName?: string) => void;
  onSelectSalon: (salon: Salon) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  salons,
  onOpenBooking,
  onOpenLeaveReview,
  onSelectSalon,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await fetchAppointments({ customer_id: currentUser.id });
      setAppointments(list);
      setLoading(false);
    }
    load();
  }, [currentUser.id]);

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
            <p className="text-xs text-pink-100/80 mt-0.5">
              Manage your upcoming nail appointments, beauty history, and saved pins.
            </p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Total Bookings</p>
          <p className="text-2xl font-bold font-serif text-pink-900 mt-1">
            {appointments.length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Upcoming Sessions</p>
          <p className="text-2xl font-bold font-serif text-pink-600 mt-1">
            {appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Partner Salons</p>
          <p className="text-2xl font-bold font-serif text-purple-900 mt-1">{salons.length}</p>
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
            {['all', 'upcoming', 'past'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-pink-50 text-gray-700 hover:bg-pink-100'
                }`}
              >
                {st}
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
                        <span>•</span>
                        <span className="text-pink-800 font-semibold bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                          In-Store Settlement
                        </span>
                      </div>

                      {appt.notes && (
                        <p className="text-[11px] text-gray-500 mt-2 italic bg-white p-2 rounded-lg border border-pink-100 inline-block">
                          Note: "{appt.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-pink-100">
                    <span className="text-[11px] font-mono text-gray-400">#NGH-{appt.id}</span>
                    <div className="flex items-center gap-2">
                      {salon && (
                        <button
                          onClick={() => onSelectSalon(salon)}
                          className="px-3 py-1.5 rounded-xl border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-semibold cursor-pointer"
                        >
                          Salon Info
                        </button>
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
      </div>
    </div>
  );
};
