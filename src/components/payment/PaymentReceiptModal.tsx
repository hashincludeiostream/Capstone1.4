import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Store,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Appointment, PaymentTransaction, Salon } from '../../types';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  transaction?: PaymentTransaction | null;
  salon?: Salon | null;
  onViewAppointments?: () => void;
  onBookAnother?: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  appointment,
  transaction,
  salon,
  onViewAppointments,
  onBookAnother,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen || (!appointment && !transaction)) return null;

  const apptId = appointment?.id ? `#NGH-${appointment.id}` : '#NGH-BOOKING';
  const txRef =
    transaction?.transaction_reference ||
    appointment?.transaction_reference ||
    `TX-PM-${Date.now().toString(36).toUpperCase()}`;
  const receiptNo =
    transaction?.receipt_number ||
    `REC-PM-${Math.floor(100000 + Math.random() * 900000)}`;

  const salonName =
    salon?.salon_name ||
    appointment?.salon_name ||
    transaction?.salon_name ||
    'Nail Glam Hub Studio';
  const salonAddress =
    salon?.address || 'Metro Manila, Philippines';
  const salonPhone = salon?.phone || '';

  const customerName =
    appointment?.customer_name || transaction?.customer_name || 'Valued Client';
  const customerPhone =
    appointment?.customer_phone || transaction?.customer_phone || '';
  const customerEmail =
    appointment?.customer_email || transaction?.customer_email || '';

  const serviceName =
    appointment?.service_name || 'Salon Beauty Service';
  const serviceDuration = appointment?.service_duration || 45;
  const specialist =
    appointment?.staff_name || appointment?.technician_name || 'Any Specialist';
  const apptDate = appointment?.appointment_date || new Date().toISOString().split('T')[0];
  const apptTime = appointment?.appointment_time || '10:00 AM';

  const amountPaid = Number(
    transaction?.amount ?? appointment?.paid_amount ?? 0
  );
  const totalServicePrice = Number(
    transaction?.total_service_price ??
    appointment?.total_price ??
    amountPaid
  );
  const remainingBalance = Number(
    transaction?.remaining_balance ?? appointment?.remaining_balance ?? 0
  );

  const paymentMethod =
    transaction?.payment_method || appointment?.payment_method || 'paymongo_gcash';
  const paymentType =
    transaction?.payment_type || appointment?.payment_type || (remainingBalance > 0 ? 'deposit' : 'full_payment');

  const formattedPaymentMethod = paymentMethod
    .replace('paymongo_', 'PayMongo ')
    .replace('pay_in_salon', 'Cash In-Salon')
    .toUpperCase();

  const handleCopyReference = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(txRef);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[calc(100vw-1rem)] sm:max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-pink-100 max-h-[92vh]">
        {/* Top Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-xs sm:text-base leading-tight truncate">
                Official Booking &amp; Payment Receipt
              </h3>
              <p className="text-[10px] text-pink-100 truncate">
                Verified via PayMongo Philippines Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1.5"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 text-gray-800 max-w-full">
          {/* Success Banner */}
          <div className="text-center py-2 space-y-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <h4 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mt-2">
              Payment &amp; Slot Confirmed!
            </h4>
            <p className="text-xs text-emerald-700 font-medium">
              Your appointment reservation is active and locked with the salon.
            </p>
          </div>

          {/* Receipt Paper Card */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-[#FFFBFD] border-2 border-dashed border-pink-200 text-xs space-y-3 relative max-w-full overflow-hidden">
            {/* Top Store Info */}
            <div className="text-center pb-3 border-b border-pink-100 space-y-1">
              <div className="inline-flex items-center gap-1.5 font-serif font-bold text-base text-pink-900">
                <Store className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="break-words">{salonName}</span>
              </div>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto break-words">
                {salonAddress}
                {salonPhone ? ` • ${salonPhone}` : ''}
              </p>
            </div>

            {/* Reference Numbers & Timestamp */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-pink-50/60 p-2.5 rounded-xl border border-pink-100/80 max-w-full">
              <div className="min-w-0">
                <span className="text-gray-500 block text-[10px]">Appointment ID</span>
                <span className="font-bold text-pink-800 truncate block">{apptId}</span>
              </div>
              <div className="min-w-0">
                <span className="text-gray-500 block text-[10px]">Receipt Number</span>
                <span className="font-mono font-semibold text-gray-700 break-all block">{receiptNo}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-pink-100/60 flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="text-gray-500 text-[10px] block">PayMongo Reference</span>
                  <span className="font-mono font-bold text-[11px] text-gray-800 break-all block">{txRef}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="px-2 py-1 rounded bg-white hover:bg-pink-100/80 text-[10px] font-semibold text-pink-700 border border-pink-200 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  title="Copy reference code"
                >
                  {copiedRef ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Service & Specialist Details */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 shrink-0">Service:</span>
                <span className="font-bold text-gray-900 text-right min-w-0 break-words">{serviceName}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 shrink-0">Specialist:</span>
                <span className="font-medium text-gray-800 text-right min-w-0 break-words">{specialist}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 shrink-0">Scheduled Date &amp; Time:</span>
                <span className="font-bold text-pink-700 text-right min-w-0">
                  {apptDate} at {apptTime} ({serviceDuration}m)
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-gray-500 shrink-0">Client Name:</span>
                <span className="font-medium text-gray-800 text-right min-w-0 break-words">{customerName}</span>
              </div>
              {customerPhone && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 shrink-0">Contact:</span>
                  <span className="text-gray-700 text-right min-w-0">{customerPhone}</span>
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-pink-200/80 pt-2.5 space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 shrink-0">Total Service Price:</span>
                <span className="font-semibold text-gray-900 text-right">₱{totalServicePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 shrink-0">Payment Channel:</span>
                <span className="font-semibold text-emerald-800 text-right min-w-0 break-words">{formattedPaymentMethod}</span>
              </div>
              <div className="flex justify-between items-center gap-2 text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <span className="font-bold shrink-0">Amount Paid Online:</span>
                <span className="font-bold text-sm whitespace-nowrap">₱{amountPaid.toLocaleString()}</span>
              </div>
              {remainingBalance > 0 && (
                <div className="flex justify-between items-center gap-2 text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                  <span className="font-medium shrink-0">Remaining Balance Due In-Salon:</span>
                  <span className="font-bold whitespace-nowrap">₱{remainingBalance.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center gap-2 pt-1">
                <span className="text-gray-500 shrink-0">Payment Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                  remainingBalance === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {remainingBalance === 0 ? 'Fully Paid' : 'Slot Deposit Paid (20%)'}
                </span>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="pt-2 border-t border-pink-100 text-[10px] text-gray-400 flex items-center justify-between">
              <span>PayMongo PCI-DSS Certified</span>
              <span>Nail Glam Hub System</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            A confirmation copy has been linked to your account. You can view or present this receipt anytime at the salon counter.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            <span>Print Receipt</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {onViewAppointments && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewAppointments();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                View in My Bookings
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-pink-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
