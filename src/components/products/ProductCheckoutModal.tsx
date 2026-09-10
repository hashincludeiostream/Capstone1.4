import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Building2,
  MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Store,
  Sparkles,
} from 'lucide-react';
import { CartItem, ProductOrder, Salon, User } from '../../types';
import { createProductOrder } from '../../lib/api';

interface ProductCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser: User | null;
  salons: Salon[];
  onOrderSuccess: (order: ProductOrder) => void;
  onViewMyOrders: () => void;
}

export const ProductCheckoutModal: React.FC<ProductCheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  salons,
  onOrderSuccess,
  onViewMyOrders,
}) => {
  if (!isOpen) return null;

  // Determine primary salon from cart items
  const primarySalonId = cartItems[0]?.product.salon_id || (salons[0]?.id ?? 1);
  const primarySalon = salons.find((s) => s.id === primarySalonId) || salons[0];

  const [customerName, setCustomerName] = useState(currentUser?.fullname || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  
  // Date default to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [pickupDate, setPickupDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('14:00');
  const [notes, setNotes] = useState('');
  const [acknowledgedTerms, setAcknowledgedTerms] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ProductOrder | null>(null);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Please provide your full name and valid phone number for pickup verification.');
      return;
    }

    if (!acknowledgedTerms) {
      setErrorMsg('Please confirm the in-store physical settlement agreement.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const orderPayload = {
        salon_id: primarySalon?.id || primarySalonId,
        customer_id: currentUser?.id || 0,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        notes: notes.trim(),
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image_url: item.product.image_url,
          volume_or_size: item.product.volume_or_size,
        })),
      };

      const res = await createProductOrder(orderPayload);
      if (res.success && res.order) {
        setConfirmedOrder(res.order);
        onOrderSuccess(res.order);
      } else {
        throw new Error(res.message || 'Failed to complete reservation');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4 text-center sm:py-8 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Invisible backdrop click area */}
      <div className="fixed inset-0 -z-10 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 my-auto relative text-left"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {confirmedOrder ? 'Reservation Confirmed' : 'Reserve In-Store Pickup'}
              </h2>
              <p className="text-xs text-stone-500">
                {confirmedOrder
                  ? `Order #${confirmedOrder.order_number}`
                  : 'Physical store settlement with zero upfront fees'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {confirmedOrder ? (
          /* Confirmation / Receipt View */
          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce duration-1000">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                In-Store Reservation Booked!
              </h3>
              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                Your products have been securely reserved at the salon counter. Please present your Order Reference Number upon arrival.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="text-xs text-stone-500">Order Reference</span>
                <span className="font-mono text-sm font-bold text-pink-700">
                  {confirmedOrder.order_number}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Pickup Studio:</span>
                <span className="font-bold text-stone-900">{confirmedOrder.salon_name}</span>
              </div>

              {confirmedOrder.salon_address && (
                <div className="text-[11px] text-stone-500 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400 mt-0.5" />
                  <span>{confirmedOrder.salon_address}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Target Pickup Date:</span>
                <span className="font-bold text-stone-900">
                  {confirmedOrder.pickup_date} at {confirmedOrder.pickup_time || '14:00'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Reserved Items:</span>
                <span className="font-bold text-stone-900">
                  {confirmedOrder.total_items} item(s)
                </span>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Total Due at Counter</span>
                  <span className="text-[10px] text-stone-500">Pay via Cash, Card, or GCash in store</span>
                </div>
                <span className="text-lg font-black text-pink-700">
                  ₱{confirmedOrder.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* In-Store Settlement Reminder */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">No Digital Payment Charged</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Your reservation is stored in the system. The salon team will prepare your package for physical inspection and settlement.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onViewMyOrders();
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
              >
                View My Product Reservations
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Reservation Form */
          <form onSubmit={handleSubmit} className="p-6 md:p-7 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Pickup Studio Branch Indicator */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  Collection Studio
                </span>
                <h4 className="text-xs font-bold text-stone-900 truncate">
                  {primarySalon?.salon_name || 'Verified Salon'}
                </h4>
                {primarySalon?.address && (
                  <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                    {primarySalon.address}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Recipient Contact Info
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>Mobile Phone *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0917 123 4567"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>Email (Optional for pickup notification)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. maria@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                />
              </div>
            </div>

            {/* Pickup Schedule */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Pickup Schedule
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Target Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Preferred Time Slot *</span>
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                  >
                    <option value="10:00">Morning (10:00 AM)</option>
                    <option value="12:00">Noon (12:00 PM)</option>
                    <option value="14:00">Afternoon (02:00 PM)</option>
                    <option value="16:00">Late Afternoon (04:00 PM)</option>
                    <option value="18:00">Evening (06:00 PM)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>Special Pickup Notes / Instructions</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please pack together with my 2pm manicure session"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-stone-50/50"
                />
              </div>
            </div>

            {/* Itemized Stock & Reservation Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Items to Reserve ({cartItems.length})
                </h3>
                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  Salon Stock Confirmed
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.image_url || 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80'}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover bg-stone-200 shrink-0 border border-stone-200"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-stone-900 truncate text-xs">{item.product.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500">
                          <span>Reserve: <strong className="text-stone-800">{item.quantity}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">Available stock: {item.product.stock_quantity} units</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-stone-900">
                        ₱{(item.product.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary & In-Store Agreement */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Reserved Items ({totalCount})</span>
                <span>₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Reservation & Handling Fee</span>
                <span className="text-emerald-600 font-bold">₱0.00 (FREE)</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Total Due at Salon Counter</span>
                  <span className="text-[10px] text-stone-400">Cash, Card, or GCash accepted in-store</span>
                </div>
                <span className="text-lg font-black text-stone-900">
                  ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* In-Store Settlement Acknowledgment */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-pink-50/60 border border-pink-100 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={acknowledgedTerms}
                onChange={(e) => setAcknowledgedTerms(e.target.checked)}
                className="rounded border-stone-300 text-pink-600 focus:ring-pink-500 cursor-pointer mt-0.5"
              />
              <div className="text-[11px] text-stone-700 leading-relaxed">
                <span className="font-bold text-stone-900 block">
                  Physical In-Store Settlement Acknowledgment
                </span>
                I acknowledge that no payment is transacted online. I will pick up and settle the total of ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} in person at the salon counter.
              </div>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reserving...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm In-Store Reservation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
