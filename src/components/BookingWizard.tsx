import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { Salon, Service, Technician, User, Appointment, WorkingHour } from '../types';
import { fetchServices, fetchTechnicians, fetchAppointments, fetchSalonDetails, createAppointment } from '../lib/api';

interface BookingWizardProps {
  salons: Salon[];
  initialSalon?: Salon | null;
  initialService?: Service | null;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  salons,
  initialSalon,
  initialService,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedSalonId, setSelectedSalonId] = useState<number>(
    initialSalon?.id || salons[0]?.id || 1
  );
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    initialService?.id || null
  );
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  // Date & Time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [appointmentDate, setAppointmentDate] = useState<string>(defaultDate);
  const [appointmentTime, setAppointmentTime] = useState<string>('14:00');

  // Customer Contact Info
  const [fullName, setFullName] = useState<string>(currentUser?.fullname || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [phone, setPhone] = useState<string>(currentUser?.phone || '');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  // Load services & technicians when salon changes
  useEffect(() => {
    async function loadData() {
      if (!selectedSalonId) return;
      setLoading(true);
      const [servs, techs, salonDetails, appts] = await Promise.all([
        fetchServices(selectedSalonId),
        fetchTechnicians(selectedSalonId),
        fetchSalonDetails(selectedSalonId),
        fetchAppointments({ salon_id: selectedSalonId }),
      ]);
      setServices(servs);
      setTechnicians(techs);
      setWorkingHours(salonDetails?.working_hours || []);
      setBookedAppointments(appts);

      // Auto-select first service if not already set or invalid
      if (!selectedServiceId || !servs.find((s) => s.id === selectedServiceId)) {
        if (servs.length > 0) setSelectedServiceId(servs[0].id);
      }
      setLoading(false);
    }
    loadData();
  }, [selectedSalonId]);

  const currentSalon = salons.find((s) => s.id === selectedSalonId) || salons[0];
  const currentService = services.find((s) => s.id === selectedServiceId);
  const currentTech = technicians.find((t) => t.id === selectedStaffId);

  const availableTimeSlots = React.useMemo(() => {
    const selectedDate = new Date(`${appointmentDate}T00:00:00`);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const hours = workingHours.find((item) => item.day_of_week.toLowerCase() === dayName.toLowerCase());
    if (!hours || hours.is_closed) return [];

    const toMinutes = (value: string) => {
      const [hour, minute] = value.split(':').map(Number);
      return hour * 60 + minute;
    };
    const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const opening = toMinutes(hours.opening_time);
    const closing = toMinutes(hours.closing_time);
    const bookedTimes = new Set(
      bookedAppointments
        .filter((appointment) => appointment.appointment_date === appointmentDate && ['pending', 'confirmed'].includes(appointment.status))
        .map((appointment) => appointment.appointment_time)
    );

    return Array.from({ length: Math.max(0, Math.floor((closing - opening) / 60)) }, (_, index) => toTime(opening + index * 60))
      .filter((time) => !bookedTimes.has(time));
  }, [appointmentDate, bookedAppointments, workingHours]);

  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(appointmentTime)) {
      setAppointmentTime(availableTimeSlots[0]);
    }
  }, [appointmentTime, availableTimeSlots]);

  const handleSubmitBooking = async () => {
    if (!currentService) return;

    // Basic validation
    if (!fullName.trim()) {
      alert('Please enter your full name');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter your phone number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    if (!appointmentDate) {
      alert('Please select an appointment date');
      return;
    }
    if (!appointmentTime) {
      alert('Please select an appointment time');
      return;
    }

    setSubmitting(true);

    try {
      const res = await createAppointment({
        customer_id: currentUser?.id || 3,
        customer_name: fullName || 'Guest Client',
        customer_phone: phone || '',
        customer_email: email || '',
        salon_id: selectedSalonId,
        salon_name: currentSalon?.salon_name,
        service_id: currentService.id,
        service_name: currentService.service_name,
        service_duration: currentService.duration,
        technician_id: selectedStaffId,
        staff_name: currentTech?.fullname || 'Any Available Specialist',
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: 'pending',
        notes,
      });

      if (res.success && res.appointment) {
        setConfirmedAppt(res.appointment);
        setStep(5); // Show confirmation step
        onSuccess(res.appointment);
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-pink-100 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">
                Book Your Nail Appointment
              </h3>
              <p className="text-[11px] text-pink-100">Step {step} of 4 — {currentSalon?.salon_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {step < 5 && (
          <div className="px-6 py-3 bg-pink-50/70 border-b border-pink-100 grid grid-cols-4 gap-2 text-center text-xs font-medium shrink-0">
            <div
              className={`py-1 rounded-md transition-all ${
                step >= 1 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'
              }`}
            >
              1. Service
            </div>
            <div
              className={`py-1 rounded-md transition-all ${
                step >= 2 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'
              }`}
            >
              2. Date & Time
            </div>
            <div
              className={`py-1 rounded-md transition-all ${
                step >= 3 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'
              }`}
            >
              3. Specialist
            </div>
            <div
              className={`py-1 rounded-md transition-all ${
                step >= 4 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'
              }`}
            >
              4. Contact
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {/* STEP 1: SELECT SALON & SERVICE */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Salon Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Choose Salon
                </label>
                <select
                  value={selectedSalonId}
                  onChange={(e) => setSelectedSalonId(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/30 text-sm font-medium text-gray-900 focus:outline-pink-500"
                >
                  {salons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.salon_name} ({s.address.split(',')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Select Nail Service / Treatment
                </label>

                {loading ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    Loading salon services...
                  </div>
                ) : services.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No active services found for this salon.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedServiceId(service.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          selectedServiceId === service.id
                            ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20'
                            : 'border-pink-100 hover:border-pink-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              selectedServiceId === service.id
                                ? 'border-pink-600 bg-pink-600 text-white'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedServiceId === service.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {service.service_name}
                              </p>
                              <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-1.5 py-0.2 rounded-md">
                                {service.category}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-pink-100/80 text-pink-800 text-[11px] font-semibold">
                            Pay In-Store
                          </span>
                          <p className="text-[11px] text-gray-400 mt-1">{service.duration} mins</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Select Appointment Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/30 text-sm font-medium text-gray-900 focus:outline-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Select Available Time Slot
                </label>
                {availableTimeSlots.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    No available slots for this date. Choose another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setAppointmentTime(time)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        appointmentTime === time
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                          : 'bg-white text-gray-700 border-pink-100 hover:border-pink-300 hover:bg-pink-50/50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{time}</span>
                    </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-pink-50 border border-pink-100 text-xs text-pink-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-600 shrink-0" />
                <span>
                  Estimated duration for {currentService?.service_name}:{' '}
                  <strong>{currentService?.duration} minutes</strong>
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT TECHNICIAN */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Choose Preferred Nail Artist
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select a specific artist or choose any available technician for flexible scheduling.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Any Available Option */}
                <div
                  onClick={() => setSelectedStaffId(null)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedStaffId === null
                      ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20'
                      : 'border-pink-100 hover:border-pink-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Any Available Specialist</p>
                      <p className="text-xs text-gray-500">First available certified technician</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedStaffId === null
                        ? 'border-pink-600 bg-pink-600 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedStaffId === null && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>

                {/* Specific Technicians */}
                {technicians.map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedStaffId(tech.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedStaffId === tech.id
                        ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20'
                        : 'border-pink-100 hover:border-pink-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {tech.avatar ? (
                        <img
                          src={tech.avatar}
                          alt={tech.name}
                          className="w-10 h-10 rounded-full object-cover border border-pink-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center border border-pink-200">
                          <span className="text-white text-xs font-bold">
                            {tech.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">{tech.name}</p>
                        <p className="text-xs text-pink-700 font-medium">{tech.specialties}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedStaffId === tech.id
                          ? 'border-pink-600 bg-pink-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedStaffId === tech.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: CONTACT & NOTES */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sophia Rodriguez"
                  className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/20 text-sm focus:outline-pink-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/20 text-sm focus:outline-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sophia@example.com"
                    className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/20 text-sm focus:outline-pink-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Design Notes / Inspo Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Almond shape, French tip with micro chrome hearts..."
                  className="w-full p-3 rounded-xl border border-pink-200 bg-pink-50/20 text-sm focus:outline-pink-500"
                />
              </div>

              {/* Order Summary Recap */}
              <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 space-y-2 text-xs text-gray-800">
                <div className="flex justify-between font-semibold">
                  <span>Salon:</span>
                  <span className="text-pink-900">{currentSalon?.salon_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Treatment:</span>
                  <span className="font-semibold">{currentService?.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-semibold">
                    {appointmentDate} at {appointmentTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Specialist:</span>
                  <span className="font-semibold">
                    {currentTech?.name || 'Any Available Specialist'}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-pink-200 flex flex-col sm:flex-row justify-between sm:items-center text-xs font-semibold gap-1.5 bg-pink-100/50 p-2.5 rounded-xl">
                  <span className="text-pink-900 font-bold flex items-center gap-1.5">
                    📍 Physical Salon Appointment:
                  </span>
                  <span className="text-pink-800 font-bold bg-white px-2.5 py-1 rounded-md border border-pink-200">
                    Payment Settled In-Store Upon Physical Service
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: BOOKING CONFIRMED */}
          {step === 5 && confirmedAppt && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-2xl font-serif font-bold text-gray-900">
                  Appointment Requested!
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Reference ID: <strong className="text-pink-700">#NGH-{confirmedAppt.id}</strong>
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-2xl bg-pink-50 border border-pink-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Salon:</span>
                  <span className="font-bold text-gray-900">{confirmedAppt.salon_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-bold text-gray-900">{confirmedAppt.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Schedule:</span>
                  <span className="font-bold text-pink-700">
                    {confirmedAppt.appointment_date} at {confirmedAppt.appointment_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Technician:</span>
                  <span className="font-bold text-gray-900">{confirmedAppt.staff_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    Pending Salon Confirmation
                  </span>
                </div>
                <div className="flex justify-between border-t border-pink-200/60 pt-2 text-[11px]">
                  <span className="text-gray-500">Settlement:</span>
                  <span className="font-semibold text-pink-900">Direct In-Salon Payment upon service</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                We've sent your request to {confirmedAppt.salon_name}. Services and consultations will be conducted at the physical salon location where any payment is settled in person.
              </p>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold shadow-md shadow-pink-500/20 cursor-pointer"
                >
                  Done & View My Bookings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {step < 5 && (
          <div className="p-4 bg-gray-50 border-t border-pink-100 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={!selectedServiceId}
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !fullName || !phone}
                onClick={handleSubmitBooking}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-pink-500/20 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Securing Appointment...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
