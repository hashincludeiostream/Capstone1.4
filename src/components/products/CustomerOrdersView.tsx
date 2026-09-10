import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { ProductOrder, ProductOrderStatus, User } from '../../types';
import { updateProductOrderStatus } from '../../lib/api';
import { scrollToElement } from '../../utils/scrollHelper';

interface CustomerOrdersViewProps {
  orders: ProductOrder[];
  currentUser: User | null;
  onRefreshOrders: () => void;
  onBrowseProducts: () => void;
  onOpenLogin: () => void;
  targetOrderId?: number | null;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  orders,
  currentUser,
  onRefreshOrders,
  onBrowseProducts,
  onOpenLogin,
  targetOrderId,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (targetOrderId) {
      setFilterStatus('all');
      scrollToElement(`customer-order-${targetOrderId}`);
    }
  }, [targetOrderId]);

  if (!currentUser) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl p-8 border border-stone-200 max-w-lg mx-auto shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-serif font-bold text-stone-900">Sign In to View Product Reservations</h3>
        <p className="text-xs text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Log in with your client account to track in-store package readiness, pickup times, and reservation receipts.
        </p>
        <button
          onClick={onOpenLogin}
          className="mt-6 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
        >
          Client Sign In
        </button>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this in-store pickup reservation? The reserved products will be returned to salon stock.')) {
      return;
    }

    setCancellingId(orderId);
    try {
      await updateProductOrderStatus(orderId, 'cancelled');
      onRefreshOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: ProductOrderStatus) => {
    switch (status) {
      case 'pending_pickup':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>Pending Pickup Preparation</span>
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready for In-Store Pickup!</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed & Settled in Store</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold flex items-center gap-1.5">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-pink-100 text-pink-700 text-[10px] font-bold uppercase tracking-wider">
              Client Portal
            </span>
            <span className="text-xs text-stone-400">• Physical Pickup Orders</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
            My Product Reservations
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track salon pickup preparation and view items to settle at physical counters.
          </p>
        </div>

        <button
          onClick={onBrowseProducts}
          className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop More Products</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Reservations' },
          { id: 'pending_pickup', label: 'Pending Pickup' },
          { id: 'ready_for_pickup', label: 'Ready for Collection' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-stone-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No reservations found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            You don't have any product reservations under this filter. Explore the salon store catalog to reserve items.
          </p>
          <button
            onClick={onBrowseProducts}
            className="mt-4 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
          >
            <span>Explore Salon Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'pending_pickup';
            const isReady = order.status === 'ready_for_pickup';

            return (
              <div
                key={order.id}
                id={`customer-order-${order.id}`}
                className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden transition-all hover:border-pink-200"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900">
                          #{order.order_number}
                        </span>
                        <span className="text-[11px] text-stone-400">• {new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-pink-700 font-semibold mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{order.salon_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Pickup Logistics Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs">
                    <div className="flex items-start gap-2 text-stone-700">
                      <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900 block">Collection Location</span>
                        <span className="text-stone-600 text-[11px]">{order.salon_address || 'Abreeza Mall, Davao City'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-stone-700">
                      <Calendar className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900 block">Pickup Schedule</span>
                        <span className="text-stone-600 text-[11px]">
                          {order.pickup_date} at {order.pickup_time || '14:00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ready alert if marked ready */}
                  {isReady && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Your package is ready!</span>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          The salon has prepared your items at the front reception. Bring your order reference <strong className="font-mono">#{order.order_number}</strong> to claim and settle at the counter.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Item List */}
                  <div className="divide-y divide-stone-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80'}
                            alt={item.product_name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-stone-900 truncate">
                              {item.product_name}
                            </h4>
                            <p className="text-[10px] text-stone-500">
                              Qty: {item.quantity} {item.volume_or_size ? `• ${item.volume_or_size}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-stone-900 shrink-0">
                          ₱{(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notes if any */}
                  {order.notes && (
                    <p className="text-[11px] text-stone-500 italic bg-stone-50 p-2 rounded-lg">
                      Note: "{order.notes}"
                    </p>
                  )}

                  {/* Card Footer: Settlement & Actions */}
                  <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="text-xs text-stone-600">
                        <span>Due at counter upon pickup: </span>
                        <strong className="text-sm font-black text-stone-900">
                          ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>

                    {isPending && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-xs text-stone-400 hover:text-red-600 font-semibold transition-colors cursor-pointer self-end sm:self-auto"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Reservation'}
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
  );
};
