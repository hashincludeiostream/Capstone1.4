import React, { useState } from 'react';
import {
  PackageX,
  AlertTriangle,
  X,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ProductOrder } from '../../types';
import { ORDER_CANCELLATION_REASONS } from '../../lib/cancellationPolicy';

interface OrderCancellationModalProps {
  isOpen: boolean;
  order: ProductOrder | null;
  onClose: () => void;
  onConfirmCancel: (
    orderId: number,
    data: { cancellation_reason: string; cancellation_notes: string }
  ) => Promise<void>;
}

export const OrderCancellationModal: React.FC<OrderCancellationModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirmCancel,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const items = Array.isArray(order.items)
    ? order.items
    : typeof order.items === 'string'
    ? JSON.parse(order.items)
    : [];

  const totalItemsCount = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
  const selectedReasonObj = ORDER_CANCELLATION_REASONS.find((r) => r.id === selectedReasonId);

  const handleNext = () => {
    setErrorMsg(null);
    if (!selectedReasonId) {
      setErrorMsg('Please select a cancellation reason before proceeding.');
      return;
    }
    if (selectedReasonObj?.requiresDetails && !notes.trim()) {
      setErrorMsg('Please provide a brief note explaining your cancellation.');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!agreed) {
      setErrorMsg('Please acknowledge the stock release notice to proceed.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onConfirmCancel(order.id, {
        cancellation_reason: selectedReasonObj?.label || 'Client cancelled pickup reservation',
        cancellation_notes: notes,
      });
      // reset
      setStep(1);
      setSelectedReasonId('');
      setNotes('');
      setAgreed(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to cancel order reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-amber-100 text-xs font-semibold tracking-wider uppercase mb-1">
            <PackageX className="w-4 h-4" />
            <span>Salon Retail Inventory</span>
          </div>

          <h3 className="text-xl font-bold">Cancel Product Pickup Reservation</h3>
          <p className="text-amber-100 text-sm mt-1">
            Step {step} of 2: {step === 1 ? 'Reason for Cancellation' : 'Release Reserved Inventory'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reserved Order Summary */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-amber-950 font-bold">
              <span>Order #{order.id} • {order.salon_name}</span>
              <span className="text-sm font-extrabold">₱{Number(order.total_amount || 0).toLocaleString()}</span>
            </div>
            <div className="text-gray-600 space-y-1 pt-1 border-t border-amber-200/80">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>
                    {item.product_name} <span className="text-gray-400">×{item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-800">
                    ₱{(Number(item.price) * Number(item.quantity)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: REASON SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Why are you cancelling this pickup reservation? <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {ORDER_CANCELLATION_REASONS.map((r) => {
                    const isSelected = selectedReasonId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReasonId(r.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-amber-950' : 'text-gray-900'}`}>
                            {r.label}
                          </span>
                          <input
                            type="radio"
                            name="order_cancellation_reason"
                            checked={isSelected}
                            onChange={() => setSelectedReasonId(r.id)}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-500"
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
                  Notes / Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context for the salon inventory manager..."
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: RESTOCKING & INVENTORY CONFIRMATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-gray-900 font-bold">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Inventory Restocking Impact</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Upon cancellation, all <strong>{totalItemsCount} reserved item(s)</strong> will be immediately returned to {order.salon_name}'s live store inventory and made available for other salon walk-ins and customers.
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-gray-700">
                  <span className="font-semibold block text-gray-900 mb-1">Cancellation Reason Logged:</span>
                  <span className="text-amber-800 font-medium">{selectedReasonObj?.label}</span>
                </div>
              </div>

              {/* Agreement */}
              <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                />
                <span className="text-xs text-gray-700 leading-normal">
                  I understand that this pickup reservation will be cancelled, reserved items released back to salon shelves, and I will need to place a new reservation if I decide to purchase in the future.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {step === 2 ? (
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
              Keep My Reservation
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!agreed || isSubmitting}
              onClick={handleSubmit}
              className={`py-2.5 px-5 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all ${
                !agreed || isSubmitting
                  ? 'bg-amber-300 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Releasing Items...</span>
                </>
              ) : (
                <>
                  <PackageX className="w-4 h-4" />
                  <span>Release Stock & Cancel</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
