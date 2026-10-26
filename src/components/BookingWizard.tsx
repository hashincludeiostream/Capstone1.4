import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  CreditCard,
  Smartphone,
  Store,
  ShieldCheck,
  ExternalLink,
  Lock,
  Loader2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Salon, Service, Technician, User, Appointment, WorkingHour, PaymentMethod, PaymentType, PaymentTransaction } from '../types';
import { fetchServices, fetchTechnicians, fetchAppointments, fetchSalonDetails, createAppointment } from '../lib/api';
import { calculatePaymentBreakdown, initiatePayment, checkPaymentGatewayStatus, fetchReceiptByReference } from '../lib/paymentService';
import { createFirestoreTransaction } from '../lib/firestoreService';
import { localStorage as safeLocalStorage } from '../lib/localStorage';
import { useNotifications } from '../context/NotificationContext';

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
  const { addNotification } = useNotifications();
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
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [designImageName, setDesignImageName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [confirmedTx, setConfirmedTx] = useState<PaymentTransaction | null>(null);
  const [livePaymongoCheckoutUrl, setLivePaymongoCheckoutUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Payment Options & Gateway State
  const [paymentType, setPaymentType] = useState<PaymentType>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paymongo_gcash');
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(true);
  const [gatewayStatus, setGatewayStatus] = useState<{ liveAvailable: boolean; gatewayName: string }>({
    liveAvailable: false,
    gatewayName: 'PayMongo Philippines',
  });

  // PayMongo Automatic Checkout States
  const [checkoutStage, setCheckoutStage] = useState<'idle' | 'redirecting' | 'interactive_checkout'>('idle');
  const [redirectCountdown, setRedirectCountdown] = useState<number>(2);
  const [activePaymentSession, setActivePaymentSession] = useState<{
    appointment: Appointment;
    transaction: PaymentTransaction;
    amountDue: number;
    checkoutUrl?: string;
    salonName: string;
    appointmentId: number;
  } | null>(null);

  // PayMongo Interactive Simulation Form States
  const [paymongoMethodTab, setPaymongoMethodTab] = useState<'gcash' | 'maya' | 'card'>('gcash');
  const [gcashPhone, setGcashPhone] = useState<string>('');
  const [gcashOtp, setGcashOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(true);
  const [mayaAccount, setMayaAccount] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [isAuthorizingPayment, setIsAuthorizingPayment] = useState<boolean>(false);
  const [authorizationStepMsg, setAuthorizationStepMsg] = useState<string>('');
  const [paymongoCountdown, setPaymongoCountdown] = useState<number>(899); // 14:59

  // PayMongo Countdown Timer
  useEffect(() => {
    if (checkoutStage !== 'interactive_checkout' || paymongoCountdown <= 0) return;
    const interval = setInterval(() => {
      setPaymongoCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [checkoutStage, paymongoCountdown]);

  // Live Mode Automatic Redirect Effect
  useEffect(() => {
    if (checkoutStage !== 'redirecting' || !livePaymongoCheckoutUrl) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          try {
            window.location.href = livePaymongoCheckoutUrl;
          } catch (e) {
            console.warn('Direct location navigation fallback:', e);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [checkoutStage, livePaymongoCheckoutUrl]);

  // Check backend payment gateway status on mount
  useEffect(() => {
    checkPaymentGatewayStatus().then((status) => {
      setGatewayStatus(status);
      if (status.liveAvailable) {
        setIsSandboxMode(false);
      } else {
        setIsSandboxMode(true);
      }
    });
  }, []);

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
      const branchServs = servs.filter((s) => Number(s.salon_id) === Number(selectedSalonId));
      const branchTechs = techs.filter((t) => Number(t.salon_id) === Number(selectedSalonId));
      setServices(branchServs);
      setTechnicians(branchTechs);
      setWorkingHours(salonDetails?.working_hours || []);
      setBookedAppointments(appts);

      // Auto-select first service if not already set or invalid for this branch
      if (!selectedServiceId || !branchServs.find((s) => s.id === selectedServiceId)) {
        if (branchServs.length > 0) setSelectedServiceId(branchServs[0].id);
      }
      // Reset technician if previously selected specialist does not belong to this branch
      if (selectedStaffId && !branchTechs.some((t) => t.id === selectedStaffId)) {
        setSelectedStaffId(null);
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

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationError('Please select a valid image file (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setValidationError('Image size exceeds 12MB. Please upload a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setDesignImage(compressed);
          setDesignImageName(file.name);
          setValidationError(null);
        } else {
          setDesignImage(dataUrl);
          setDesignImageName(file.name);
          setValidationError(null);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setDesignImage(null);
    setDesignImageName(null);
  };

  const paymentBreakdown = React.useMemo(() => {
    return calculatePaymentBreakdown(Number(currentService?.price) || 0, paymentType);
  }, [currentService?.price, paymentType]);

  const handleSubmitBooking = async () => {
    if (!currentService) return;
    setValidationError(null);

    // Basic validation
    if (!fullName.trim()) {
      setValidationError('Please enter your full name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      setValidationError('Please enter your contact phone number');
      return;
    }
    if (cleanPhone.length !== 11) {
      setValidationError('Phone number must have strictly 11 numbers (e.g. 09171234567). It cannot be less or more.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!appointmentDate) {
      setValidationError('Please select an appointment date');
      return;
    }
    if (!appointmentTime) {
      setValidationError('Please select an appointment time');
      return;
    }

    setSubmitting(true);

    try {
      const breakdown = calculatePaymentBreakdown(Number(currentService.price) || 0, paymentType);
      const isOnlinePaymongo = paymentType !== 'pay_at_salon' && paymentMethod !== 'pay_in_salon';

      // 1. If physical in-salon counter payment, create appointment directly and confirm
      if (!isOnlinePaymongo) {
        const res = await createAppointment({
          customer_id: currentUser?.id || 0,
          customer_name: fullName || 'Guest Client',
          customer_phone: cleanPhone,
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
          design_image: designImage || undefined,
          payment_method: 'pay_in_salon',
          payment_type: 'pay_at_salon',
          payment_status: 'unpaid',
          paid_amount: 0,
          remaining_balance: Number(currentService.price) || 0,
        });

        if (res.success && res.appointment) {
          setConfirmedAppt(res.appointment);
          setStep(6);
          onSuccess(res.appointment);

          addNotification({
            recipient_role: 'customer',
            recipient_user_id: currentUser?.id,
            category: 'bookings',
            title: 'Booking Confirmed! 🎉',
            message: `Your appointment for ${currentService.service_name} at ${currentSalon?.salon_name || 'the salon'} on ${appointmentDate} at ${appointmentTime} is confirmed. Settle at salon counter.`,
            type: 'booking_confirmed',
            priority: 'normal',
            linkTab: 'customer-dashboard',
            metadata: { appointmentId: res.appointment.id },
          });

          addNotification({
            recipient_role: 'salon_owner',
            recipient_salon_id: selectedSalonId,
            category: 'bookings',
            title: 'New Customer Booking 📅',
            message: `${fullName || 'Client'} booked ${currentService.service_name} for ${appointmentDate} at ${appointmentTime} (Pay In-Store).`,
            type: 'booking_new',
            priority: 'urgent',
            linkTab: 'owner-appointments',
            metadata: { appointmentId: res.appointment.id },
          });
        }
        return;
      }

      // 2. PayMongo Online Checkout Flow
      // Step A: Initiate charge session on backend
      const paymentResult = await initiatePayment(
        {
          entityType: 'appointment',
          customerId: currentUser?.id || 0,
          customerName: fullName || 'Valued Client',
          customerPhone: cleanPhone,
          customerEmail: email || '',
          salonId: selectedSalonId,
          salonName: currentSalon?.salon_name,
          totalServicePrice: Number(currentService.price) || 0,
          paymentType,
          paymentMethod,
        },
        isSandboxMode
      );

      const chargedAmount = paymentResult.transaction?.amount || breakdown.dueNow;

      // Step B: Create appointment with 'pending' payment status until checkout completes
      const res = await createAppointment({
        customer_id: currentUser?.id || 0,
        customer_name: fullName || 'Guest Client',
        customer_phone: cleanPhone,
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
        design_image: designImage || undefined,
        payment_method: paymentMethod,
        payment_type: paymentType,
        payment_status: 'unpaid',
        paid_amount: 0,
        remaining_balance: Number(currentService.price) || 0,
        transaction_reference: paymentResult.transaction?.transaction_reference,
      });

      if (!res.success || !res.appointment) {
        throw new Error('Failed to register appointment. Please try again.');
      }

      const activeSession = {
        appointment: res.appointment,
        transaction: {
          ...paymentResult.transaction,
          entity_id: res.appointment.id,
        },
        amountDue: chargedAmount,
        checkoutUrl: paymentResult.checkoutUrl,
        salonName: currentSalon?.salon_name || 'Nail Glam Hub',
        appointmentId: res.appointment.id,
      };

      setActivePaymentSession(activeSession);

      // Pre-fill PayMongo simulator fields
      setGcashPhone(cleanPhone.startsWith('09') ? cleanPhone : '09171234567');
      setMayaAccount(cleanPhone.startsWith('09') ? cleanPhone : '09181234567');
      setCardHolder(fullName || 'Valued Client');
      if (paymentMethod === 'paymongo_maya') {
        setPaymongoMethodTab('maya');
      } else if (paymentMethod === 'paymongo_card') {
        setPaymongoMethodTab('card');
      } else {
        setPaymongoMethodTab('gcash');
      }

      // Step C: Trigger automatic checkout!
      if (paymentResult.checkoutUrl && !isSandboxMode) {
        // Real Live PayMongo Checkout: Automatic Redirect Screen
        setCheckoutStage('redirecting');
        setLivePaymongoCheckoutUrl(paymentResult.checkoutUrl);
        const receiptPayload = {
          appointment: res.appointment,
          transaction: activeSession.transaction,
          salon: currentSalon,
          checkoutUrl: paymentResult.checkoutUrl,
          timestamp: new Date().toISOString(),
        };
        safeLocalStorage.setJSON('nailglamhub_active_receipt', receiptPayload);
        if (activeSession.transaction.transaction_reference) {
          safeLocalStorage.setJSON(
            `nailglamhub_receipt_${activeSession.transaction.transaction_reference}`,
            receiptPayload
          );
        }
        // Seamless automatic navigation to PayMongo (without popup blocking)
        setTimeout(() => {
          try {
            window.location.href = paymentResult.checkoutUrl!;
          } catch (e) {
            console.warn('Direct location navigation fallback:', e);
          }
        }, 1200);
      } else {
        // Interactive PayMongo Automatic Checkout Interface
        setCheckoutStage('interactive_checkout');
        setPaymongoCountdown(899);
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setValidationError(
        err instanceof Error ? err.message : 'Failed to submit booking. Please check connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteInteractivePayment = async (_chosenMethod?: 'gcash' | 'maya' | 'card') => {
    if (!activePaymentSession) return;
    setIsAuthorizingPayment(true);
    setAuthorizationStepMsg('Connecting to PayMongo Philippines gateway...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setAuthorizationStepMsg('Authorizing payment with issuer...');

      const txRef = activePaymentSession.transaction.transaction_reference;
      // Finalize transaction and appointment on backend
      const verifyRes = await fetchReceiptByReference(txRef, 'success');

      await new Promise((r) => setTimeout(r, 400));
      setAuthorizationStepMsg('Payment verified & approved!');

      const updatedAppt: Appointment = verifyRes.data?.appointment || {
        ...activePaymentSession.appointment,
        payment_status: paymentType === 'full_payment' ? 'fully_paid' : 'deposit_paid',
        paid_amount: activePaymentSession.amountDue,
        remaining_balance: Math.max(0, Number(currentService?.price || 0) - activePaymentSession.amountDue),
      };

      const updatedTx: PaymentTransaction = verifyRes.data?.transaction || {
        ...activePaymentSession.transaction,
        payment_status: 'succeeded',
        amount: activePaymentSession.amountDue,
      };

      setConfirmedAppt(updatedAppt);
      setConfirmedTx(updatedTx);

      // Persist verified receipt
      const receiptPayload = {
        appointment: updatedAppt,
        transaction: updatedTx,
        salon: currentSalon,
        timestamp: new Date().toISOString(),
      };
      safeLocalStorage.setJSON('nailglamhub_active_receipt', receiptPayload);
      if (txRef) {
        safeLocalStorage.setJSON(`nailglamhub_receipt_${txRef}`, receiptPayload);
      }

      createFirestoreTransaction(updatedTx).catch((err) =>
        console.warn('Firestore transaction sync warning:', err)
      );

      // Add instant notification for client & salon owner
      addNotification({
        recipient_role: 'customer',
        recipient_user_id: currentUser?.id,
        category: 'bookings',
        title: 'Payment Verified & Booking Confirmed! 🎉',
        message: `Your payment of ₱${activePaymentSession.amountDue.toLocaleString()} via PayMongo is verified. Appointment with ${currentSalon?.salon_name} is confirmed!`,
        type: 'booking_confirmed',
        priority: 'normal',
        linkTab: 'customer-dashboard',
        metadata: { appointmentId: updatedAppt.id },
      });

      addNotification({
        recipient_role: 'salon_owner',
        recipient_salon_id: selectedSalonId,
        category: 'bookings',
        title: 'New Paid Booking 💳',
        message: `${fullName || 'Client'} paid ₱${activePaymentSession.amountDue.toLocaleString()} via PayMongo for ${currentService?.service_name}.`,
        type: 'booking_new',
        priority: 'urgent',
        linkTab: 'owner-appointments',
        metadata: { appointmentId: updatedAppt.id },
      });

      setCheckoutStage('idle');
      setStep(6);
      onSuccess(updatedAppt);
    } catch (err: any) {
      console.error('Interactive payment authorization error:', err);
      setValidationError('Payment authorization failed. Please try again or choose another payment method.');
    } finally {
      setIsAuthorizingPayment(false);
      setAuthorizationStepMsg('');
    }
  };

  const handleCancelInteractivePayment = async () => {
    if (activePaymentSession?.transaction?.transaction_reference) {
      await fetchReceiptByReference(activePaymentSession.transaction.transaction_reference, 'cancelled').catch(() => {});
    }
    setCheckoutStage('idle');
    setValidationError('PayMongo checkout was cancelled. You can retry paying with PayMongo or choose Pay in Salon.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[calc(100vw-1rem)] sm:max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-pink-100 max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className={`px-3.5 sm:px-6 py-3 sm:py-4 text-white flex items-center justify-between shrink-0 transition-colors ${
          checkoutStage === 'interactive_checkout' || checkoutStage === 'redirecting'
            ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900'
            : 'bg-gradient-to-r from-pink-600 to-rose-600'
        }`}>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {checkoutStage === 'interactive_checkout' || checkoutStage === 'redirecting' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
              ) : (
                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-xs sm:text-lg truncate">
                {checkoutStage === 'interactive_checkout'
                  ? 'PayMongo Philippines — Secure Checkout'
                  : checkoutStage === 'redirecting'
                  ? 'Transferring to PayMongo...'
                  : 'Book Your Nail Appointment'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-pink-100 truncate">
                {checkoutStage === 'interactive_checkout'
                  ? `PCI-DSS Level 1 • Ref: ${activePaymentSession?.transaction.transaction_reference || 'Online'}`
                  : checkoutStage === 'redirecting'
                  ? 'Connecting to secure payment portal...'
                  : `Step ${step} of 5 — ${currentSalon?.salon_name}`}
              </p>
            </div>
          </div>
          <button
            onClick={checkoutStage === 'interactive_checkout' ? handleCancelInteractivePayment : onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1.5"
            title={checkoutStage === 'interactive_checkout' ? 'Cancel checkout' : 'Close'}
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {step < 6 && checkoutStage === 'idle' && (
          <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-pink-50/70 border-b border-pink-100 shrink-0">
            {/* Mobile Stepper Header (< sm) */}
            <div className="sm:hidden flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-pink-700 truncate">
                Step {step} of 5: {step === 1 ? 'Service' : step === 2 ? 'Date & Time' : step === 3 ? 'Specialist' : step === 4 ? 'Your Info' : 'Payment'}
              </span>
              <span className="text-[11px] font-semibold text-gray-500 shrink-0 ml-2">{Math.round((step / 5) * 100)}%</span>
            </div>
            <div className="sm:hidden w-full bg-pink-200/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-pink-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>

            {/* Desktop / Tablet Stepper (>= sm) */}
            <div className="hidden sm:grid grid-cols-5 gap-1.5 text-center text-[11px] font-medium">
              <div className={`py-1 px-1 rounded-md transition-all truncate ${step >= 1 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'}`}>
                1. Service
              </div>
              <div className={`py-1 px-1 rounded-md transition-all truncate ${step >= 2 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'}`}>
                2. Date/Time
              </div>
              <div className={`py-1 px-1 rounded-md transition-all truncate ${step >= 3 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'}`}>
                3. Specialist
              </div>
              <div className={`py-1 px-1 rounded-md transition-all truncate ${step >= 4 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'}`}>
                4. Contact
              </div>
              <div className={`py-1 px-1 rounded-md transition-all truncate ${step >= 5 ? 'bg-pink-600 text-white font-semibold' : 'text-gray-400 bg-white'}`}>
                5. Payment
              </div>
            </div>
          </div>
        )}

        {/* Inline Validation Alert */}
        {validationError && (
          <div className="mx-4 sm:mx-6 mt-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="flex-1 font-medium">{validationError}</span>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-rose-400 hover:text-rose-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-white max-w-full">
          {/* STEP 1: SELECT SALON & SERVICE */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-5">
              {/* Salon Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Choose Salon
                </label>
                <select
                  value={selectedSalonId}
                  onChange={(e) => setSelectedSalonId(Number(e.target.value))}
                  className="w-full p-2.5 sm:p-3 rounded-xl border border-pink-200 bg-pink-50/30 text-xs sm:text-sm font-medium text-gray-900 focus:outline-pink-500"
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
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 min-w-0 max-w-full ${
                          selectedServiceId === service.id
                            ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20'
                            : 'border-pink-100 hover:border-pink-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              selectedServiceId === service.id
                                ? 'border-pink-600 bg-pink-600 text-white'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedServiceId === service.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                                {service.service_name}
                              </p>
                              <span className="text-[9px] sm:text-[10px] font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded-md shrink-0">
                                {service.category}
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-1 mt-0.5 break-words">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block text-xs sm:text-sm font-bold text-pink-700 whitespace-nowrap">
                            ₱{Number(service.price).toLocaleString()}
                          </span>
                          <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">{service.duration} mins</p>
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
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Select Appointment Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full p-2.5 sm:p-3 rounded-xl border border-pink-200 bg-pink-50/30 text-xs sm:text-sm font-medium text-gray-900 focus:outline-pink-500"
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                    {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setAppointmentTime(time)}
                      className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        appointmentTime === time
                          ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                          : 'bg-white text-gray-700 border-pink-100 hover:border-pink-300 hover:bg-pink-50/50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{time}</span>
                    </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-pink-50 border border-pink-100 text-xs text-pink-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="min-w-0">
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
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    selectedStaffId === null
                      ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20'
                      : 'border-pink-100 hover:border-pink-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">Any Available Specialist</p>
                      <p className="text-[11px] sm:text-xs text-gray-500 truncate">First available certified technician</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
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
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      selectedStaffId === tech.id
                        ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20'
                        : 'border-pink-100 hover:border-pink-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {tech.avatar ? (
                        <img
                          src={tech.avatar}
                          alt={tech.name}
                          className="w-10 h-10 rounded-full object-cover border border-pink-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center border border-pink-200 shrink-0">
                          <span className="text-white text-xs font-bold">
                            {tech.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{tech.name}</p>
                        <p className="text-[11px] sm:text-xs text-pink-700 font-medium truncate">{tech.specialties}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Phone Number (11 Digits)
                    </label>
                    <span
                      className={`text-[11px] font-semibold transition-colors ${
                        phone.replace(/\D/g, '').length === 11
                          ? 'text-emerald-700'
                          : phone.replace(/\D/g, '').length > 0
                          ? 'text-amber-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {phone.replace(/\D/g, '').length}/11 digits {phone.replace(/\D/g, '').length === 11 ? '✓' : ''}
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => {
                      const strictlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setPhone(strictlyNumbers);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="09171234567"
                    className={`w-full p-3 rounded-xl border bg-pink-50/20 text-sm focus:outline-pink-500 font-mono tracking-wider ${
                      phone && phone.replace(/\D/g, '').length !== 11
                        ? 'border-amber-400 focus:border-amber-500 bg-amber-50/20'
                        : 'border-pink-200 focus:border-pink-500'
                    }`}
                    required
                  />
                  {phone && phone.replace(/\D/g, '').length !== 11 && (
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                      Phone number must have strictly 11 numbers (currently {phone.replace(/\D/g, '').length}).
                    </p>
                  )}
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

              {/* Upload Inspiration / Design Reference Image */}
              <div id="booking-design-image-upload-section" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Design Inspiration Photo (Optional)
                  </label>
                  {designImage && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Photo attached
                    </span>
                  )}
                </div>

                {!designImage ? (
                  <div
                    id="booking-design-image-dropzone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        handleImageFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      const fileInput = document.getElementById('booking-design-image-file-input') as HTMLInputElement;
                      fileInput?.click();
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-pink-500 bg-pink-100/60 scale-[0.99]'
                        : 'border-pink-200 hover:border-pink-400 bg-pink-50/30 hover:bg-pink-50/60'
                    }`}
                  >
                    <input
                      type="file"
                      id="booking-design-image-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                      <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold text-pink-700">Click to upload</span> or drag & drop inspo image
                      </div>
                      <p className="text-[11px] text-gray-400">
                        PNG, JPG, or WebP (e.g. nail art sample, color swatch, or reference photo)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    id="booking-design-image-preview"
                    className="p-3 rounded-2xl border border-pink-200 bg-pink-50/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={designImage}
                        alt="Design Reference"
                        className="w-14 h-14 object-cover rounded-xl border border-pink-200 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 truncate">
                          <ImageIcon className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                          <span className="truncate">{designImageName || 'Inspo_Reference.jpg'}</span>
                        </div>
                        <p className="text-[11px] text-pink-800/80 font-medium mt-0.5">
                          Attached to this appointment for your nail specialist
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        id="booking-replace-design-image-button"
                        onClick={() => {
                          const fileInput = document.getElementById('booking-design-image-file-input') as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white hover:bg-pink-50 text-[11px] font-semibold text-pink-700 cursor-pointer transition-colors"
                      >
                        Change
                      </button>
                      <input
                        type="file"
                        id="booking-design-image-file-input"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageFile(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        id="booking-remove-design-image-button"
                        onClick={handleRemoveImage}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4 Summary Preview */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-pink-50 border border-pink-200 space-y-2 text-xs text-gray-800 max-w-full">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Salon:</span>
                  <span className="text-pink-900 font-semibold break-words text-right min-w-0">{currentSalon?.salon_name}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Treatment:</span>
                  <span className="font-semibold text-gray-900 break-words text-right min-w-0">
                    {currentService?.service_name} (₱{Number(currentService?.price || 0).toLocaleString()})
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Date &amp; Time:</span>
                  <span className="font-semibold text-gray-900 text-right min-w-0">
                    {appointmentDate} at {appointmentTime}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Specialist:</span>
                  <span className="font-semibold text-gray-900 break-words text-right min-w-0">
                    {currentTech?.fullname || 'Any Available Specialist'}
                  </span>
                </div>
                <div className="pt-2 border-t border-pink-200/80 flex items-center justify-between gap-3 text-xs font-semibold text-pink-900">
                  <span className="shrink-0">Estimated Total Service:</span>
                  <span className="text-base font-bold text-pink-700 whitespace-nowrap">₱{Number(currentService?.price || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PAYMENT SELECTION (DUAL-MODE PAYMONGO) */}
          {step === 5 && checkoutStage === 'idle' && (
            <div className="space-y-5 sm:space-y-6 max-w-full">
              <div>
                <h4 className="font-serif font-bold text-base sm:text-lg text-gray-900">
                  Payment Preference
                </h4>
                <p className="text-xs text-gray-500">
                  Choose your payment option and channel for this appointment
                </p>
              </div>

              {/* Dual-Mode Simulator / Production Gateway Banner */}
              <div className="p-3 rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs max-w-full overflow-hidden">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSandboxMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isSandboxMode ? 'DEMO' : 'LIVE'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 flex flex-wrap items-center gap-1.5">
                      <span className="break-words">Gateway: {gatewayStatus.gatewayName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        isSandboxMode ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isSandboxMode ? 'Interactive Sandbox Mode' : 'Live Production Mode'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 break-words mt-0.5">
                      {isSandboxMode
                        ? 'Simulates GCash / Maya / Card transactions with authentic checkout receipts'
                        : 'Processes actual online charges via registered PayMongo secret key'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  {gatewayStatus.liveAvailable ? (
                    <button
                      type="button"
                      onClick={() => setIsSandboxMode(!isSandboxMode)}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-pink-300 bg-white hover:bg-pink-50 text-[11px] font-semibold text-pink-700 transition-colors cursor-pointer shadow-2xs text-center"
                    >
                      Switch to {isSandboxMode ? 'Live Gateway' : 'Sandbox Simulator'}
                    </button>
                  ) : (
                    <span className="w-full sm:w-auto px-2.5 py-1 rounded-lg bg-white/80 border border-amber-200 text-[10px] font-semibold text-amber-800 text-center">
                      Add PAYMONGO_SECRET_KEY in Settings to enable Live
                    </span>
                  )}
                </div>
              </div>

              {/* Payment Type Selection (Slot Deposit vs Full Payment vs Pay at Salon) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payment Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setPaymentType('deposit')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentType === 'deposit'
                        ? 'border-pink-600 bg-pink-50/70 ring-2 ring-pink-500/20'
                        : 'border-gray-200 hover:border-pink-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-gray-900">Slot Deposit</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-100 text-pink-700">
                        Most Popular
                      </span>
                    </div>
                    <div className="text-lg font-bold text-pink-600">₱{paymentBreakdown.dueNow.toLocaleString()}</div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Lock your specialist time-slot now with a 20% deposit. Balance settled in salon.
                    </p>
                  </div>

                  <div
                    onClick={() => setPaymentType('full_payment')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentType === 'full_payment'
                        ? 'border-pink-600 bg-pink-50/70 ring-2 ring-pink-500/20'
                        : 'border-gray-200 hover:border-pink-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-gray-900">Full Payment</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                        Hassle-Free
                      </span>
                    </div>
                    <div className="text-lg font-bold text-pink-600">₱{Number(currentService?.price || 0).toLocaleString()}</div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Pay 100% online in advance. Walk in and enjoy your manicure without hassle.
                    </p>
                  </div>

                  <div
                    onClick={() => setPaymentType('pay_at_salon')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentType === 'pay_at_salon'
                        ? 'border-pink-600 bg-pink-50/70 ring-2 ring-pink-500/20'
                        : 'border-gray-200 hover:border-pink-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-gray-900">Pay at Salon</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-600">
                        In-Store
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-700">₱0.00 Now</div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Pay directly at the cashier desk upon completion of your nail treatment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Channel Selection */}
              {paymentType !== 'pay_at_salon' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paymongo_gcash')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        paymentMethod === 'paymongo_gcash'
                          ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        GCash
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">GCash via PayMongo</div>
                        <p className="text-[10px] text-gray-500">Fast Philippines e-wallet checkout</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paymongo_maya')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        paymentMethod === 'paymongo_maya'
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        Maya
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Maya / PayMaya</div>
                        <p className="text-[10px] text-gray-500">Digital wallet QR / direct checkout</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paymongo_card')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        paymentMethod === 'paymongo_card'
                          ? 'border-pink-500 bg-pink-50/60 ring-2 ring-pink-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Credit / Debit Card</div>
                        <p className="text-[10px] text-gray-500">Visa, Mastercard, JCB</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3 text-xs text-gray-700">
                  <Store className="w-5 h-5 text-gray-500 shrink-0" />
                  <span>
                    No advance online transaction needed. You can settle in cash or physical POS terminal at <strong>{currentSalon?.salon_name}</strong>.
                  </span>
                </div>
              )}

              {/* Price Breakdown Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-pink-50 border border-pink-200 space-y-2 text-xs text-gray-800 max-w-full">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Service Fee:</span>
                  <span className="font-semibold text-gray-900 text-right min-w-0">₱{Number(currentService?.price || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Payment Option:</span>
                  <span className="font-semibold capitalize text-pink-800 text-right min-w-0">
                    {paymentType === 'deposit'
                      ? 'Slot Deposit (20%)'
                      : paymentType === 'full_payment'
                      ? 'Full Online Payment (100%)'
                      : 'Pay at Salon Cashier'}
                  </span>
                </div>
                {paymentType === 'deposit' && (
                  <div className="flex items-start justify-between gap-3 text-gray-600">
                    <span className="shrink-0">Remaining Balance Due In-Salon:</span>
                    <span className="font-bold text-amber-700 text-right min-w-0">₱{paymentBreakdown.remainingBalance.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2.5 border-t border-pink-200 flex items-center justify-between gap-3 text-sm font-bold text-pink-900">
                  <span className="shrink-0">Due Today:</span>
                  <span className="text-lg text-pink-700 whitespace-nowrap">₱{paymentBreakdown.dueNow.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Encrypted & secured via PayMongo Philippines PCI-DSS compliant checkout architecture.
                </span>
              </div>
            </div>
          )}

          {/* PAYMONGO AUTOMATIC REDIRECT SCREEN (LIVE GATEWAY MODE) */}
          {checkoutStage === 'redirecting' && (
            <div className="py-8 sm:py-12 text-center space-y-5 max-w-lg mx-auto">
              <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-inner">
                  <ExternalLink className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Live PayMongo Gateway
                </span>
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                  Redirecting to PayMongo Checkout...
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-sm mx-auto">
                  Automatically transferring you to the secure PayMongo Philippine payment portal in{' '}
                  <strong className="text-emerald-700">{redirectCountdown}s</strong>.
                </p>
              </div>

              {activePaymentSession && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Payee Merchant:</span>
                    <strong className="text-gray-900">{activePaymentSession.salonName}</strong>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Transaction Reference:</span>
                    <strong className="font-mono text-emerald-800 break-all">{activePaymentSession.transaction.transaction_reference}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200/80 font-bold text-sm">
                    <span className="text-gray-900">Amount Due:</span>
                    <span className="text-emerald-800 text-base">₱{activePaymentSession.amountDue.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                {livePaymongoCheckoutUrl && (
                  <a
                    href={livePaymongoCheckoutUrl}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Click Here if Not Redirected</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleCancelInteractivePayment}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel & Return
                </button>
              </div>

              <p className="text-[11px] text-gray-400">
                🔒 256-bit SSL encrypted connection directly to PayMongo Philippines
              </p>
            </div>
          )}

          {/* PAYMONGO AUTOMATIC INTERACTIVE CHECKOUT (SANDBOX / SIMULATION MODE) */}
          {checkoutStage === 'interactive_checkout' && activePaymentSession && (
            <div className="space-y-4 sm:space-y-5 max-w-full">
              {/* PayMongo Header Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
                        PayMongo Philippines
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-semibold">
                        Sandbox / Test Gateway
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base sm:text-lg text-white truncate">
                      {activePaymentSession.salonName}
                    </h4>
                    <p className="text-xs text-emerald-200/80 truncate">
                      Booking #{activePaymentSession.appointmentId} • Ref: {activePaymentSession.transaction.transaction_reference}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0 bg-white/10 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                    <span className="text-[11px] text-emerald-200 block">Total Due Now</span>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">
                      ₱{activePaymentSession.amountDue.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-gray-300">
                      {paymentType === 'deposit' ? '20% Slot Deposit' : 'Full 100% Service Fee'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-200/80">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-Bit Bank-Grade PCI-DSS Encrypted</span>
                  </div>
                  <div className="font-mono text-amber-200 font-semibold">
                    Expires: {Math.floor(paymongoCountdown / 60)}:{(paymongoCountdown % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Method Selection Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymongoMethodTab('gcash')}
                  disabled={isAuthorizingPayment}
                  className={`py-2 px-2 sm:px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymongoMethodTab === 'gcash'
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-500/20 font-bold'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>GCash</span>
                  </div>
                  <span className="text-[10px] text-gray-500 hidden sm:block">Instant E-Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymongoMethodTab('maya')}
                  disabled={isAuthorizingPayment}
                  className={`py-2 px-2 sm:px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymongoMethodTab === 'maya'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-600/20 font-bold'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Maya</span>
                  </div>
                  <span className="text-[10px] text-gray-500 hidden sm:block">Maya Wallet / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymongoMethodTab('card')}
                  disabled={isAuthorizingPayment}
                  className={`py-2 px-2 sm:px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymongoMethodTab === 'card'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm ring-2 ring-indigo-600/20 font-bold'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold flex items-center justify-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Credit / Debit</span>
                  </div>
                  <span className="text-[10px] text-gray-500 hidden sm:block">Visa • Mastercard</span>
                </button>
              </div>

              {/* Method Form Contents */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-4">
                {paymongoMethodTab === 'gcash' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          G
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">GCash Mobile Number</div>
                          <div className="text-[10px] text-gray-500">Philippine mobile wallet verification</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        Simulated OTP
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        GCash Mobile (11-digit)
                      </label>
                      <input
                        type="text"
                        value={gcashPhone}
                        onChange={(e) => setGcashPhone(e.target.value)}
                        placeholder="09171234567"
                        maxLength={11}
                        disabled={isAuthorizingPayment}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-gray-700">
                          One-Time PIN (OTP)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setGcashOtp('123456');
                            setOtpSent(true);
                          }}
                          disabled={isAuthorizingPayment}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline"
                        >
                          Auto-fill Test OTP (123456)
                        </button>
                      </div>
                      <input
                        type="text"
                        value={gcashOtp}
                        onChange={(e) => setGcashOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP (e.g. 123456)"
                        maxLength={6}
                        disabled={isAuthorizingPayment}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tracking-widest text-center text-sm font-bold"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        In sandbox mode, any 6-digit OTP is accepted. Click the button above to autofill.
                      </p>
                    </div>
                  </div>
                )}

                {paymongoMethodTab === 'maya' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          M
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">Maya Mobile / Account</div>
                          <div className="text-[10px] text-gray-500">Maya 1-Click checkout simulator</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        Instant Approval
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Maya Registered Mobile
                      </label>
                      <input
                        type="text"
                        value={mayaAccount}
                        onChange={(e) => setMayaAccount(e.target.value)}
                        placeholder="09181234567"
                        maxLength={11}
                        disabled={isAuthorizingPayment}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Maya Wallet balance pre-authenticated for this sandbox session.</span>
                    </div>
                  </div>
                )}

                {paymongoMethodTab === 'card' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        <div>
                          <div className="text-xs font-bold text-gray-900">Credit or Debit Card</div>
                          <div className="text-[10px] text-gray-500">PayMongo 3D-Secure 2.0 Card Simulator</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCardNumber('4111 2222 3333 4444');
                            setCardExpiry('12/28');
                            setCardCvv('123');
                          }}
                          disabled={isAuthorizingPayment}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold cursor-pointer"
                        >
                          Use Test Visa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCardNumber('5555 5555 5555 4444');
                            setCardExpiry('10/27');
                            setCardCvv('888');
                          }}
                          disabled={isAuthorizingPayment}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold cursor-pointer"
                        >
                          Use Test MC
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 2222 3333 4444"
                        maxLength={19}
                        disabled={isAuthorizingPayment}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          maxLength={5}
                          disabled={isAuthorizingPayment}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          disabled={isAuthorizingPayment}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Valued Client"
                        disabled={isAuthorizingPayment}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* In-Flight Processing Banner */}
              {isAuthorizingPayment && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-emerald-900">
                      Processing PayMongo Payment...
                    </div>
                    <div className="text-[11px] text-emerald-700 truncate">
                      {authorizationStepMsg || 'Contacting acquiring bank...'}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isAuthorizingPayment}
                  onClick={() => handleCompleteInteractivePayment(paymongoMethodTab)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isAuthorizingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Authorize & Pay ₱{activePaymentSession.amountDue.toLocaleString()} via{' '}
                        {paymongoMethodTab === 'gcash'
                          ? 'GCash'
                          : paymongoMethodTab === 'maya'
                          ? 'Maya'
                          : 'Card'}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={isAuthorizingPayment}
                    onClick={handleCancelInteractivePayment}
                    className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Cancel Checkout & Change Method</span>
                  </button>
                  <span className="text-[11px] text-gray-400">
                    Appointment will remain pending until payment
                  </span>
                </div>
              </div>

              {/* PayMongo Footer Badge */}
              <div className="pt-2 text-center text-[10px] text-gray-400 space-y-0.5">
                <p>Secured by PayMongo Payments, Inc. • BSP Registered Operator of Payment System</p>
                <p>PCI-DSS Level 1 Compliant • 256-bit SSL Bank Security</p>
              </div>
            </div>
          )}

          {/* STEP 6: BOOKING CONFIRMED & PAYMENT RECEIPT */}
          {step === 6 && confirmedAppt && (
            <div className="py-4 sm:py-6 text-center space-y-4 max-w-full overflow-hidden">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                  Appointment Confirmed!
                </h4>
                <p className="text-xs text-gray-500 mt-1 break-words">
                  Appointment ID: <strong className="text-pink-700">#NGH-{confirmedAppt.id}</strong>
                  {confirmedAppt.transaction_reference && (
                    <span className="ml-1 sm:ml-2 font-mono text-gray-400 break-all inline-block">
                      (Ref: {confirmedAppt.transaction_reference})
                    </span>
                  )}
                </p>
              </div>

              <div className="max-w-md mx-auto p-3.5 sm:p-4 rounded-2xl bg-pink-50 border border-pink-200 text-left text-xs space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-500 shrink-0">Salon:</span>
                  <span className="font-bold text-gray-900 text-right min-w-0 break-words">{confirmedAppt.salon_name}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-500 shrink-0">Service:</span>
                  <span className="font-bold text-gray-900 text-right min-w-0 break-words">{confirmedAppt.service_name}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-500 shrink-0">Schedule:</span>
                  <span className="font-bold text-pink-700 text-right min-w-0">
                    {confirmedAppt.appointment_date} at {confirmedAppt.appointment_time}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-500 shrink-0">Specialist:</span>
                  <span className="font-bold text-gray-900 text-right min-w-0 break-words">{confirmedAppt.staff_name}</span>
                </div>

                {/* Payment Breakdown Info */}
                <div className="border-t border-pink-200/80 pt-2 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-500 shrink-0">Payment Channel:</span>
                    <span className="font-semibold text-gray-900 capitalize text-right min-w-0">
                      {confirmedAppt.payment_method?.replace('paymongo_', 'PayMongo ').toUpperCase() || 'In-Store'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-500 shrink-0">Amount Paid Online:</span>
                    <span className="font-bold text-emerald-700 text-right whitespace-nowrap">₱{Number(confirmedAppt.paid_amount || 0).toLocaleString()}</span>
                  </div>
                  {Number(confirmedAppt.remaining_balance || 0) > 0 && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-500 shrink-0">Balance Due in Salon:</span>
                      <span className="font-bold text-amber-700 text-right whitespace-nowrap">₱{Number(confirmedAppt.remaining_balance).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-gray-500 shrink-0">Payment Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      confirmedAppt.payment_status === 'fully_paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : confirmedAppt.payment_status === 'deposit_paid'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {confirmedAppt.payment_status?.replace('_', ' ') || 'Unpaid'}
                    </span>
                  </div>
                </div>

                {confirmedAppt.design_image && (
                  <div className="flex items-center justify-between border-t border-pink-200/60 pt-2">
                    <span className="text-gray-500 shrink-0">Design Inspo:</span>
                    <div className="flex items-center gap-2">
                      <img
                        src={confirmedAppt.design_image}
                        alt="Attached design inspo"
                        className="w-9 h-9 rounded-lg object-cover border border-pink-200 shadow-xs shrink-0"
                      />
                      <span className="text-[11px] font-semibold text-pink-900">Photo Attached</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                We've sent your request to {confirmedAppt.salon_name}. Your appointment slot has been locked with payment confirmation.
              </p>

              {livePaymongoCheckoutUrl && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 max-w-md mx-auto text-center space-y-2">
                  <div className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>PayMongo Live Checkout Ready</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    If your PayMongo checkout page didn't open automatically, click below to pay via GCash, Maya, or Card:
                  </p>
                  <a
                    href={livePaymongoCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>Proceed to PayMongo Checkout</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold shadow-md shadow-pink-500/20 cursor-pointer"
                >
                  Done & View My Bookings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {step < 6 && checkoutStage === 'idle' && (
          <div className="p-3 sm:p-4 bg-gray-50 border-t border-pink-100 flex items-center justify-between gap-2 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setStep(step - 1);
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                disabled={
                  (step === 1 && !selectedServiceId) ||
                  (step === 4 && (!fullName.trim() || phone.replace(/\D/g, '').length !== 11 || !email.trim()))
                }
                onClick={() => {
                  setValidationError(null);
                  if (step === 4) {
                    if (!fullName.trim()) {
                      setValidationError('Please enter your full name');
                      return;
                    }
                    const cleanPhone = phone.replace(/\D/g, '');
                    if (!cleanPhone) {
                      setValidationError('Please enter your contact phone number');
                      return;
                    }
                    if (cleanPhone.length !== 11) {
                      setValidationError('Phone number must have strictly 11 numbers (e.g. 09171234567). It cannot be less or more.');
                      return;
                    }
                    if (!email.trim() || !email.includes('@')) {
                      setValidationError('Please enter a valid email address');
                      return;
                    }
                  }
                  setStep(step + 1);
                }}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitBooking}
                className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-pink-500/20 flex items-center gap-1.5 sm:gap-2 cursor-pointer min-w-0"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" />
                    <span>Preparing Checkout...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="sm:hidden truncate">
                      {paymentType === 'pay_at_salon'
                        ? 'Confirm In-Salon'
                        : `Pay ₱${paymentBreakdown.dueNow.toLocaleString()}`}
                    </span>
                    <span className="hidden sm:inline">
                      {paymentType === 'pay_at_salon'
                        ? 'Confirm Booking (Pay In-Salon)'
                        : `Proceed to PayMongo Checkout (₱${paymentBreakdown.dueNow.toLocaleString()})`}
                    </span>
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
