import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BellRing,
  ShoppingBag,
  Calendar,
  Package,
  Store,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Check,
  X,
  ChevronRight,
  Shield,
  Heart,
  ArrowRight,
} from 'lucide-react';
import {
  User,
  CartItem,
  Appointment,
  ProductOrder,
  Announcement,
  Salon,
  Review,
} from '../types';

export interface NotificationMenuProps {
  currentUser: User | null;
  cartItems?: CartItem[];
  cartItemCount?: number;
  onOpenCart?: (targetProductId?: number) => void;
  customerAppointments?: Appointment[];
  customerOrders?: ProductOrder[];
  announcements?: Announcement[];
  salons?: Salon[];
  ownerSalons?: Salon[];
  ownerAppointments?: Appointment[];
  ownerProductOrders?: ProductOrder[];
  ownerReviews?: Review[];
  adminPendingSalons?: Salon[];
  adminTotalSalons?: number;
  adminTotalUsers?: number;
  adminTotalAppointments?: number;
  favoritesCount?: number;
  onNavigate?: (tab: string, targetDomId?: string) => void;
}

type NotificationCategory = 'all' | 'cart' | 'bookings' | 'alerts';

export const NotificationMenu: React.FC<NotificationMenuProps> = ({
  currentUser,
  cartItems = [],
  cartItemCount = 0,
  onOpenCart,
  customerAppointments = [],
  customerOrders = [],
  announcements = [],
  salons = [],
  ownerSalons = [],
  ownerAppointments = [],
  ownerProductOrders = [],
  ownerReviews = [],
  adminPendingSalons = [],
  adminTotalSalons = 0,
  adminTotalUsers = 0,
  adminTotalAppointments = 0,
  favoritesCount = 0,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [readItemIds, setReadItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nailglamhub_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Persist read notifications
  const markAsRead = (id: string) => {
    if (!readItemIds.includes(id)) {
      const next = [...readItemIds, id];
      setReadItemIds(next);
      try {
        localStorage.setItem('nailglamhub_read_notifications', JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  };

  const markAllAsRead = () => {
    const allIds: string[] = [];
    if (cartItemCount > 0) allIds.push('cart-active');
    customerOrders.forEach((o) => allIds.push(`cust-order-${o.id}`));
    ownerProductOrders.forEach((o) => allIds.push(`owner-order-${o.id}`));
    customerAppointments.forEach((a) => allIds.push(`cust-appt-${a.id}`));
    ownerAppointments.forEach((a) => allIds.push(`owner-appt-${a.id}`));
    adminPendingSalons.forEach((s) => allIds.push(`admin-salon-${s.id}`));
    ownerSalons
      .filter((s) => s.verification_status === 'pending')
      .forEach((s) => allIds.push(`owner-branch-${s.id}`));
    announcements.forEach((a) => allIds.push(`announcement-${a.id}`));
    if (favoritesCount > 0) allIds.push('favorites-summary');

    const merged = Array.from(new Set([...readItemIds, ...allIds]));
    setReadItemIds(merged);
    try {
      localStorage.setItem('nailglamhub_read_notifications', JSON.stringify(merged));
    } catch {
      // ignore
    }
  };

  const handleItemNavigation = (tab: string, targetDomId?: string, readId?: string) => {
    if (readId) markAsRead(readId);
    else if (targetDomId) markAsRead(targetDomId);
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(tab, targetDomId);
    }
  };

  const handleOpenCartDrawer = (readId?: string, targetProductId?: number) => {
    if (readId) markAsRead(readId);
    setIsOpen(false);
    if (onOpenCart) {
      onOpenCart(targetProductId);
    }
  };

  // Calculations for In-Store Cart & Orders
  const effectiveCartCount =
    cartItemCount > 0
      ? cartItemCount
      : cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotalValue = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const activeCustomerOrders = customerOrders.filter(
    (o) => o.status === 'pending_pickup' || o.status === 'ready_for_pickup'
  );

  const ownerPendingOrders = ownerProductOrders.filter(
    (o) => o.status === 'pending_pickup'
  );

  // Calculations for Bookings
  const activeCustomerBookings = customerAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );

  const ownerPendingAppointments = ownerAppointments.filter(
    (a) => a.status === 'pending'
  );

  const ownerConfirmedAppointments = ownerAppointments.filter(
    (a) => a.status === 'confirmed'
  );

  // Calculations for Alerts & System
  const activeAnnouncements = announcements.filter((a) => a.is_active);
  const ownerPendingSalons = ownerSalons.filter(
    (s) => s.verification_status === 'pending'
  );

  // Grouped Counts
  const cartAndOrdersCount =
    effectiveCartCount +
    (currentUser?.user_type === 'customer'
      ? activeCustomerOrders.length
      : currentUser?.user_type === 'salon_owner'
      ? ownerPendingOrders.length
      : 0);

  const bookingsCount =
    currentUser?.user_type === 'customer'
      ? activeCustomerBookings.length
      : currentUser?.user_type === 'salon_owner'
      ? ownerPendingAppointments.length + ownerConfirmedAppointments.length
      : 0;

  const alertsCount =
    (currentUser?.user_type === 'admin' ? adminPendingSalons.length : 0) +
    (currentUser?.user_type === 'salon_owner' ? ownerPendingSalons.length : 0) +
    activeAnnouncements.length;

  // Total arranged notifications count
  const totalNotificationsCount =
    (effectiveCartCount > 0 ? 1 : 0) +
    (currentUser?.user_type === 'customer'
      ? activeCustomerOrders.length + activeCustomerBookings.length
      : currentUser?.user_type === 'salon_owner'
      ? ownerPendingOrders.length +
        ownerPendingAppointments.length +
        ownerPendingSalons.length
      : currentUser?.user_type === 'admin'
      ? adminPendingSalons.length
      : 0) +
    activeAnnouncements.length;

  const unreadCount = Math.max(
    0,
    totalNotificationsCount -
      readItemIds.filter((id) => {
        if (id === 'cart-active' && effectiveCartCount > 0) return true;
        if (id.startsWith('cust-order-') && activeCustomerOrders.some((o) => id === `cust-order-${o.id}`))
          return true;
        if (id.startsWith('owner-order-') && ownerPendingOrders.some((o) => id === `owner-order-${o.id}`))
          return true;
        if (id.startsWith('cust-appt-') && activeCustomerBookings.some((a) => id === `cust-appt-${a.id}`))
          return true;
        if (
          id.startsWith('owner-appt-') &&
          (ownerPendingAppointments.some((a) => id === `owner-appt-${a.id}`) ||
            ownerConfirmedAppointments.some((a) => id === `owner-appt-${a.id}`))
        )
          return true;
        if (id.startsWith('admin-salon-') && adminPendingSalons.some((s) => id === `admin-salon-${s.id}`))
          return true;
        if (id.startsWith('announcement-') && activeAnnouncements.some((a) => id === `announcement-${a.id}`))
          return true;
        return false;
      }).length
  );

  return (
    <div className="relative" ref={menuRef}>
      {/* 
        Notification Bell Button
        Replaces the old 'view in store reservation cart' button.
        Equipped with both navbar-notifications-btn and navbar-cart-btn IDs for full compatibility!
      */}
      <button
        id="navbar-notifications-btn"
        data-testid="navbar-cart-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications and in-store reservation cart"
        className={`relative p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-2xs ${
          isOpen
            ? 'bg-pink-100 border-pink-400 text-pink-800 ring-2 ring-pink-200'
            : unreadCount > 0 || effectiveCartCount > 0
            ? 'border-pink-300 bg-pink-50/90 hover:bg-pink-100 text-pink-700'
            : 'border-pink-200 hover:border-pink-300 bg-pink-50/60 hover:bg-pink-100 text-pink-600'
        }`}
        title={
          effectiveCartCount > 0
            ? `Notifications • ${effectiveCartCount} item${effectiveCartCount !== 1 ? 's' : ''} in In-Store Cart`
            : totalNotificationsCount > 0
            ? `${totalNotificationsCount} arranged notification${totalNotificationsCount !== 1 ? 's' : ''}`
            : 'Notifications & In-Store Cart'
        }
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-pink-700 animate-in spin-in-12 duration-200" />
        ) : (
          <Bell className="w-4 h-4 text-pink-600" />
        )}

        {/* Counter Badge */}
        {(unreadCount > 0 || effectiveCartCount > 0) && (
          <span
            id="navbar-notification-badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50 duration-200 shadow-xs ring-1 ring-white"
          >
            {unreadCount > 0
              ? unreadCount > 9
                ? '9+'
                : unreadCount
              : effectiveCartCount > 9
              ? '9+'
              : effectiveCartCount}
          </span>
        )}
      </button>

      {/* Arranged Notifications Dropdown Panel */}
      {isOpen && (
        <div
          id="navbar-notifications-dropdown"
          className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-[440px] max-w-[440px] bg-white rounded-2xl shadow-2xl border border-pink-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[85vh] sm:max-h-[580px]"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-pink-50/80 via-white to-pink-50/40 border-b border-pink-100 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    Notifications
                  </h3>
                  {totalNotificationsCount > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-pink-100 text-pink-700">
                      {totalNotificationsCount} total
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  Reservations, schedule & store alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-pink-600 hover:text-pink-800 font-semibold px-2 py-1 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer flex items-center gap-1"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark Read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Arranged Category Navigation Tabs */}
          <div className="px-3 py-2 bg-gray-50/60 border-b border-gray-100 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'all'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <span>All</span>
              {totalNotificationsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCategory === 'all'
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {totalNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveCategory('cart')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'cart'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>In-Store Cart</span>
              {cartAndOrdersCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCategory === 'cart'
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-pink-100 text-pink-700'
                  }`}
                >
                  {cartAndOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveCategory('bookings')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'bookings'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Bookings</span>
              {bookingsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCategory === 'bookings'
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {bookingsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveCategory('alerts')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'alerts'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Alerts</span>
              {alertsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeCategory === 'alerts'
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {alertsCount}
                </span>
              )}
            </button>
          </div>

          {/* Arranged Notifications Body (Scrollable) */}
          <div className="overflow-y-auto flex-1 p-3 space-y-3 divide-y divide-gray-100/80">
            {/* 
              SECTION 1: IN-STORE RESERVATION CART 
              (Direct transform and spotlight for "view in store reservation cart")
            */}
            {(activeCategory === 'all' || activeCategory === 'cart') && (
              <div className="pt-2 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-pink-900">
                      In-Store Reservation Cart
                    </h4>
                  </div>
                  {effectiveCartCount > 0 && (
                    <span className="text-[10px] font-semibold text-pink-600">
                      {effectiveCartCount} item{effectiveCartCount !== 1 ? 's' : ''} queued
                    </span>
                  )}
                </div>

                {effectiveCartCount > 0 ? (
                  <div
                    id="notification-cart-card"
                    className={`p-3 rounded-xl border transition-all ${
                      readItemIds.includes('cart-active')
                        ? 'bg-pink-50/40 border-pink-200/80'
                        : 'bg-gradient-to-br from-pink-50 to-rose-50/60 border-pink-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-900 truncate">
                              Reservation Cart Active
                            </span>
                            {!readItemIds.includes('cart-active') && (
                              <span className="w-2 h-2 rounded-full bg-pink-600"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            {effectiveCartCount} product{effectiveCartCount !== 1 ? 's' : ''} ready for in-store pickup
                          </p>
                          <p className="text-xs font-bold text-pink-700 mt-1">
                            Est. Total: ₱{cartTotalValue.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200 shrink-0">
                        Pay in Salon
                      </span>
                    </div>

                    {/* Cart Items Preview List */}
                    {cartItems.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-pink-200/60 space-y-1.5">
                        {cartItems.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleOpenCartDrawer('cart-active', item.product.id)}
                            className="flex items-center justify-between text-xs text-gray-700 bg-white/70 hover:bg-pink-100/60 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                            title="Click to open cart and scroll to this product"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {item.product.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="w-5 h-5 rounded object-cover shrink-0"
                                />
                              ) : (
                                <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              )}
                              <span className="truncate text-[11px] font-medium text-gray-800">
                                {item.product.name}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-900 shrink-0 ml-2">
                              x{item.quantity} • ₱{(item.product.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {cartItems.length > 3 && (
                          <p className="text-[10px] text-gray-500 italic text-center">
                            +{cartItems.length - 3} more product{cartItems.length - 3 !== 1 ? 's' : ''} in cart
                          </p>
                        )}
                      </div>
                    )}

                    {/* Direct In-Store Cart Action Button */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        id="notification-open-cart-btn"
                        onClick={() => handleOpenCartDrawer('cart-active')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>View In-Store Cart &amp; Reserve</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
                    <p className="text-xs text-gray-500">
                      Your In-Store Reservation Cart is currently empty.
                    </p>
                    <button
                      onClick={() => handleItemNavigation('products')}
                      className="mt-1.5 text-xs text-pink-600 hover:text-pink-800 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Browse Nail Polish &amp; Care</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 
              SECTION 2: PLACED IN-STORE PICKUP ORDERS 
              (Customer orders & Owner fulfillment notifications)
            */}
            {(activeCategory === 'all' || activeCategory === 'cart') && (
              <>
                {currentUser?.user_type === 'customer' && activeCustomerOrders.length > 0 && (
                  <div className="pt-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                          Active In-Store Pickup Reservations
                        </h4>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {activeCustomerOrders.length} active
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {activeCustomerOrders.map((order) => {
                        const isReady = order.status === 'ready_for_pickup';
                        const isRead = readItemIds.includes(`cust-order-${order.id}`);

                        return (
                          <div
                            key={order.id}
                            onClick={() => handleItemNavigation('customer-orders', `customer-order-${order.id}`, `cust-order-${order.id}`)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group hover:border-emerald-300 hover:bg-emerald-50/40 ${
                              isRead
                                ? 'bg-white border-gray-200 text-gray-600'
                                : 'bg-emerald-50/30 border-emerald-200 text-gray-900 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isReady
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <Package className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    Order #{order.order_number || order.id}
                                  </p>
                                  <p className="text-[11px] text-gray-500 truncate">
                                    {order.salon_name || 'Salon pickup counter'}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  isReady
                                    ? 'bg-emerald-600 text-white animate-pulse'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isReady ? 'Ready for Pickup' : 'Pending Preparation'}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                              <span>
                                {order.total_items || order.items?.length || 1} items • ₱
                                {order.total_amount.toLocaleString()}
                              </span>
                              <span className="font-semibold text-emerald-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                <span>Track Order</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentUser?.user_type === 'salon_owner' && ownerPendingOrders.length > 0 && (
                  <div className="pt-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                          Store Pickup Orders Awaiting Fulfillment
                        </h4>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {ownerPendingOrders.length} pending
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {ownerPendingOrders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          onClick={() => handleItemNavigation('owner-inventory', `owner-order-${order.id}`, `owner-order-${order.id}`)}
                          className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/50 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-950">
                              Order #{order.order_number || order.id} • {order.customer_name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                              Fulfill
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            ₱{order.total_amount.toLocaleString()} • Pickup on {order.pickup_date}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 
              SECTION 3: APPOINTMENTS & BOOKINGS
            */}
            {(activeCategory === 'all' || activeCategory === 'bookings') && (
              <div className="pt-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                      Appointments &amp; Bookings
                    </h4>
                  </div>
                  {currentUser?.user_type === 'customer' && activeCustomerBookings.length > 0 && (
                    <span className="text-[10px] font-semibold text-purple-700">
                      {activeCustomerBookings.length} {activeCustomerBookings.length === 1 ? 'appointment' : 'appointments'} scheduled
                    </span>
                  )}
                  {currentUser?.user_type === 'salon_owner' && (
                    <>
                      {ownerPendingAppointments.length > 0 && ownerConfirmedAppointments.length > 0 ? (
                        <span className="text-[10px] font-semibold text-purple-700">
                          {ownerPendingAppointments.length} pending • {ownerConfirmedAppointments.length} confirmed
                        </span>
                      ) : ownerPendingAppointments.length > 0 ? (
                        <span className="text-[10px] font-semibold text-amber-700">
                          {ownerPendingAppointments.length} pending approval
                        </span>
                      ) : ownerConfirmedAppointments.length > 0 ? (
                        <span className="text-[10px] font-semibold text-purple-700">
                          {ownerConfirmedAppointments.length} scheduled
                        </span>
                      ) : null}
                    </>
                  )}
                </div>

                {/* Guest State */}
                {!currentUser && (
                  <div className="p-3.5 rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 text-center">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-gray-900">Track Your Salon Bookings</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto">
                      Sign in to your customer account to view your scheduled salon appointments and booking updates.
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleItemNavigation('login-customer')}
                        className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => handleItemNavigation('salons')}
                        className="text-xs font-semibold text-purple-700 hover:text-purple-900 px-3 py-1.5 rounded-xl hover:bg-purple-100/60 transition-colors cursor-pointer"
                      >
                        Explore Salons
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer Bookings */}
                {currentUser?.user_type === 'customer' && (
                  <>
                    {activeCustomerBookings.length > 0 ? (
                      <div className="space-y-1.5">
                        {activeCustomerBookings.slice(0, 3).map((appt) => {
                          const isConfirmed = appt.status === 'confirmed';
                          const isRead = readItemIds.includes(`cust-appt-${appt.id}`);

                          return (
                            <div
                              key={appt.id}
                              onClick={() => handleItemNavigation('customer-dashboard', `customer-appointment-${appt.id}`, `cust-appt-${appt.id}`)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer group hover:border-purple-300 hover:bg-purple-50/40 ${
                                isRead
                                  ? 'bg-white border-gray-200 text-gray-600'
                                  : 'bg-purple-50/40 border-purple-200 text-gray-900 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                      isConfirmed
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">
                                      {appt.service_name || 'Nail Treatment Service'}
                                    </p>
                                    <p className="text-[11px] text-gray-500 truncate">
                                      {appt.salon_name || 'Verified Salon'}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    isConfirmed
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {isConfirmed ? 'Confirmed' : 'Pending Salon'}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                                <span className="flex items-center gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-purple-600" />
                                  <span>
                                    {appt.appointment_date} at {appt.appointment_time}
                                  </span>
                                </span>
                                <span className="text-purple-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                  <span>View</span>
                                  <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
                        <p className="text-xs text-gray-500">
                          No upcoming appointments booked right now.
                        </p>
                        <button
                          onClick={() => handleItemNavigation('salons')}
                          className="mt-1.5 text-xs text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Explore Salons &amp; Book</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Salon Owner Appointments: Pending Requests & Confirmed Bookings */}
                {currentUser?.user_type === 'salon_owner' && (
                  <div className="space-y-2">
                    {/* Pending Requests Needing Approval */}
                    {ownerPendingAppointments.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending Booking Requests ({ownerPendingAppointments.length})</span>
                        </div>
                        {ownerPendingAppointments.slice(0, 3).map((appt) => {
                          const isRead = readItemIds.includes(`owner-appt-${appt.id}`);
                          return (
                            <div
                              key={appt.id}
                              onClick={() =>
                                handleItemNavigation(
                                  'owner-appointments',
                                  `owner-appointment-${appt.id}`,
                                  `owner-appt-${appt.id}`
                                )
                              }
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isRead
                                  ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-100/50'
                                  : 'border-amber-300 bg-amber-50/80 hover:bg-amber-100/70 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-950">
                                  Booking Request: {appt.customer_name || 'Client'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white animate-pulse">
                                  Pending Action
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-900 mt-0.5 font-medium">
                                {appt.service_name} {appt.salon_name ? `• ${appt.salon_name}` : ''}
                              </p>
                              <div className="mt-1 flex items-center justify-between text-[11px] text-amber-800/90 pt-1 border-t border-amber-200/50">
                                <span>{appt.appointment_date} at {appt.appointment_time}</span>
                                <span className="font-semibold text-amber-900 flex items-center gap-0.5 hover:underline">
                                  Review <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Upcoming Confirmed Bookings */}
                    {ownerConfirmedAppointments.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
                          <Calendar className="w-3 h-3 text-purple-600" />
                          <span>Confirmed Schedule ({ownerConfirmedAppointments.length})</span>
                        </div>
                        {ownerConfirmedAppointments.slice(0, 3).map((appt) => {
                          const isRead = readItemIds.includes(`owner-appt-${appt.id}`);
                          return (
                            <div
                              key={appt.id}
                              onClick={() =>
                                handleItemNavigation(
                                  'owner-appointments',
                                  `owner-appointment-${appt.id}`,
                                  `owner-appt-${appt.id}`
                                )
                              }
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isRead
                                  ? 'border-purple-200 bg-white hover:bg-purple-50/40'
                                  : 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                                  <span className="text-xs font-bold text-purple-950">
                                    {appt.customer_name || 'Client'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                  Confirmed
                                </span>
                              </div>
                              <p className="text-[11px] text-purple-900 mt-0.5">
                                {appt.service_name} {appt.salon_name ? `• ${appt.salon_name}` : ''}
                              </p>
                              <div className="mt-1 flex items-center justify-between text-[11px] text-purple-700/80 pt-1 border-t border-purple-100">
                                <span>{appt.appointment_date} at {appt.appointment_time}</span>
                                <span className="font-semibold text-purple-800 flex items-center gap-0.5 hover:underline">
                                  View <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty state when neither pending nor confirmed */}
                    {ownerPendingAppointments.length === 0 && ownerConfirmedAppointments.length === 0 && (
                      <p className="text-xs text-gray-500 italic p-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                        All appointment requests confirmed and up to date.
                      </p>
                    )}
                  </div>
                )}

                {/* Super Admin Appointment Velocity */}
                {currentUser?.user_type === 'admin' && (
                  <div
                    onClick={() => handleItemNavigation('admin-dashboard', 'admin-stats-appointments')}
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-purple-950">
                        Platform Booking Activity
                      </p>
                      <p className="text-[11px] text-purple-700">
                        {adminTotalAppointments || 6} appointments scheduled across all salons
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                  </div>
                )}
              </div>
            )}

            {/* 
              SECTION 4: GOVERNANCE, STORE APPROVALS & SYSTEM ALERTS
            */}
            {(activeCategory === 'all' || activeCategory === 'alerts') && (
              <div className="pt-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                      Store &amp; Platform Alerts
                    </h4>
                  </div>
                  {alertsCount > 0 && (
                    <span className="text-[10px] font-semibold text-amber-700">
                      {alertsCount} alert{alertsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Admin Pending Salon Approvals */}
                {currentUser?.user_type === 'admin' && adminPendingSalons.length > 0 && (
                  <div className="space-y-1.5">
                    {adminPendingSalons.map((salon) => (
                      <div
                        key={salon.id}
                        onClick={() => handleItemNavigation('admin-salons', `admin-salon-${salon.id}`, `admin-salon-${salon.id}`)}
                        className="p-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-rose-600" />
                            <p className="text-xs font-bold text-rose-950">
                              Branch Verification Pending
                            </p>
                          </div>
                          <p className="text-[11px] text-rose-800 mt-0.5">
                            {salon.salon_name} ({salon.city || 'Location'}) awaits your governance review
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shrink-0">
                          Review
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Salon Owner Branch Approval Status */}
                {currentUser?.user_type === 'salon_owner' && ownerPendingSalons.length > 0 && (
                  <div className="space-y-1.5">
                    {ownerPendingSalons.map((salon) => (
                      <div
                        key={salon.id}
                        onClick={() => handleItemNavigation('owner-branches', `owner-branch-${salon.id}`, `owner-branch-${salon.id}`)}
                        className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-amber-950">
                            Branch Status: Pending Admin Approval
                          </p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            {salon.salon_name} is currently under verification
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white shrink-0">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Site-wide Announcements / Promos */}
                {activeAnnouncements.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeAnnouncements.slice(0, 3).map((item) => {
                      const isAlert = item.type === 'alert';
                      const isPromo = item.type === 'promo';
                      const isRead = readItemIds.includes(`announcement-${item.id}`);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (currentUser?.user_type === 'admin') {
                              handleItemNavigation('admin-announcements', `admin-announcement-${item.id}`, `announcement-${item.id}`);
                            } else {
                              handleItemNavigation('explore', `site-announcement-${item.id}`, `announcement-${item.id}`);
                            }
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs ${
                            isAlert
                              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                              : isPromo
                              ? 'bg-gradient-to-r from-pink-50/80 to-purple-50/80 border-pink-200 text-gray-900'
                              : 'bg-gray-50 border-gray-200 text-gray-800'
                          } ${isRead ? 'opacity-70' : 'shadow-2xs'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isAlert ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : isPromo ? (
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ) : (
                                <Store className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              )}
                              <p className="text-xs font-bold truncate">{item.title}</p>
                            </div>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                                isAlert
                                  ? 'bg-rose-600 text-white'
                                  : isPromo
                                  ? 'bg-pink-600 text-white'
                                  : 'bg-gray-600 text-white'
                              }`}
                            >
                              {item.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                            {item.message || ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded-lg">
                    No active system or promotional alerts at this time.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Arranged Bottom Action Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
            {/* Direct access to In-Store Cart */}
            <button
              id="notification-footer-cart-btn"
              onClick={() => handleOpenCartDrawer('cart-active')}
              className="text-xs font-bold text-pink-700 hover:text-pink-900 px-3 py-1.5 rounded-xl bg-pink-100/70 hover:bg-pink-200/80 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                In-Store Cart {effectiveCartCount > 0 ? `(${effectiveCartCount})` : ''}
              </span>
            </button>

            {/* Quick role-based destination */}
            <button
              onClick={() => {
                if (currentUser?.user_type === 'salon_owner') {
                  handleItemNavigation('owner-dashboard');
                } else if (currentUser?.user_type === 'admin') {
                  handleItemNavigation('admin-dashboard');
                } else if (currentUser?.user_type === 'customer') {
                  handleItemNavigation('customer-dashboard');
                } else {
                  handleItemNavigation('salons');
                }
              }}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>
                {currentUser?.user_type === 'salon_owner'
                  ? 'Salon Dashboard'
                  : currentUser?.user_type === 'admin'
                  ? 'Admin Panel'
                  : currentUser?.user_type === 'customer'
                  ? 'My Account'
                  : 'Explore Salons'}
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
