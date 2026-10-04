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
import { NotificationBadge } from './common/NotificationBadge';
import { useNotifications } from '../context/NotificationContext';

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
  dismissedAnnouncements?: number[];
  onDismissAnnouncement?: (id: number) => void;
  onDismissAllAnnouncements?: () => void;
}

type NotificationCategory = 'bookings' | 'cart' | 'alerts';

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
  dismissedAnnouncements = [],
  onDismissAnnouncement,
  onDismissAllAnnouncements,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('bookings');
  const {
    readItemIds,
    isRead: globalIsRead,
    markAsRead: globalMarkAsRead,
    markAllAsRead: globalMarkAllAsRead,
    unreadCount: globalUnreadCount,
    urgentCount: globalUrgentCount,
    categoryUnread,
    isAnnouncementViewed,
    markAnnouncementViewed,
  } = useNotifications();

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

  // Persist read notifications & sync announcement dismissals
  const markAsRead = (id: string) => {
    globalMarkAsRead(id);
    // If it's an announcement, also mark as viewed/dismissed so top banner never persists
    if (id.startsWith('announcement-')) {
      const numId = Number(id.replace('announcement-', ''));
      if (!isNaN(numId)) {
        markAnnouncementViewed(numId);
        onDismissAnnouncement?.(numId);
      }
    }
  };

  const markAllAsRead = () => {
    globalMarkAllAsRead();
    // Dismiss and mark all active announcements viewed so banners do not persist once viewed
    announcements.forEach((a) => markAnnouncementViewed(a.id));
    onDismissAllAnnouncements?.();
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

  // Calculations for Alerts & System - Only show unviewed announcements (persistent UNLESS viewed)
  const activeAnnouncements = announcements.filter(
    (a) => a.is_active && !isAnnouncementViewed(a.id) && !dismissedAnnouncements.includes(a.id)
  );
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

  // Unread status per category derived from global notification context
  const hasUnreadCart = categoryUnread.cart;
  const hasUnreadBookings = categoryUnread.bookings;
  const hasUnreadAlerts = categoryUnread.alerts;
  const unreadCount = globalUnreadCount;
  const urgentCount = globalUrgentCount;

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

  return (
    <div className="relative" ref={menuRef}>
      {/* 
        Notification Bell Button
        Replaces the old 'view in store reservation cart' button.
        Equipped with clean blinking notification badge when unread!
      */}
      <button
        id="navbar-notifications-btn"
        data-testid="navbar-cart-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications and in-store reservation cart"
        className={`relative p-2.5 rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-2xs ${
          isOpen
            ? 'bg-pink-100 border-pink-400 text-pink-800 ring-2 ring-pink-200'
            : unreadCount > 0
            ? 'border-pink-300 bg-pink-50/95 hover:bg-pink-100 text-pink-700 shadow-xs'
            : effectiveCartCount > 0
            ? 'border-pink-200 bg-pink-50/70 hover:bg-pink-100 text-pink-700'
            : 'border-pink-200 hover:border-pink-300 bg-white hover:bg-pink-50 text-pink-600'
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
          <BellRing className="w-4 h-4 text-pink-700" />
        ) : (
          <Bell className="w-4 h-4 text-pink-600" />
        )}

        {/* Clean Blinking Counter Badge */}
        {(unreadCount > 0 || effectiveCartCount > 0) && (
          <NotificationBadge
            id="navbar-notification-badge"
            count={
              unreadCount > 0
                ? unreadCount > 9
                  ? '9+'
                  : unreadCount
                : effectiveCartCount > 9
                ? '9+'
                : effectiveCartCount
            }
            variant="rose"
            priority={urgentCount > 0 ? 'urgent' : 'normal'}
            isUnread={unreadCount > 0}
            showPing={false}
            size="badge-overlay"
            className="absolute -top-1 -right-1"
          />
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

          {/* Arranged Category Navigation Tabs - Clean, without "All" tab */}
          <div className="px-3 py-2 bg-gray-50/70 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory('bookings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'bookings'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bookings</span>
              {bookingsCount > 0 && (
                <NotificationBadge
                  count={bookingsCount}
                  variant={activeCategory === 'bookings' ? 'white' : 'purple'}
                  priority="normal"
                  isUnread={hasUnreadBookings}
                  showPing={true}
                  size="sm"
                />
              )}
            </button>

            <button
              onClick={() => setActiveCategory('cart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'cart'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>In-Store Cart</span>
              {cartAndOrdersCount > 0 && (
                <NotificationBadge
                  count={cartAndOrdersCount}
                  variant={activeCategory === 'cart' ? 'white' : 'pink'}
                  priority="normal"
                  isUnread={hasUnreadCart}
                  showPing={true}
                  size="sm"
                />
              )}
            </button>

            <button
              onClick={() => setActiveCategory('alerts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'alerts'
                  ? 'bg-pink-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {alertsCount > 0 && (
                <NotificationBadge
                  count={alertsCount}
                  variant={activeCategory === 'alerts' ? 'white' : 'amber'}
                  priority={urgentCount > 0 ? 'urgent' : 'normal'}
                  isUnread={hasUnreadAlerts}
                  showPing={true}
                  size="sm"
                />
              )}
            </button>
          </div>

          {/* Arranged Notifications Body (Scrollable) */}
          <div className="overflow-y-auto flex-1 p-3 space-y-2.5">
            {/* 
              SECTION 1: APPOINTMENTS & BOOKINGS
              Shows ALL appointments without arbitrary slicing
            */}
            {activeCategory === 'bookings' && (
              <div className="space-y-2">
                {/* Customer Bookings */}
                {currentUser?.user_type === 'customer' && (
                  <>
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                        My Bookings
                      </span>
                      <span className="text-[10px] font-semibold text-purple-700">
                        {activeCustomerBookings.length} scheduled
                      </span>
                    </div>

                    {activeCustomerBookings.length > 0 ? (
                      <div className="space-y-1.5">
                        {activeCustomerBookings.map((appt) => {
                          const isConfirmed = appt.status === 'confirmed';
                          const isItemRead = globalIsRead(`cust-appt-${appt.id}`);

                          return (
                            <div
                              key={appt.id}
                              onClick={() =>
                                handleItemNavigation(
                                  'customer-dashboard',
                                  `customer-appointment-${appt.id}`,
                                  `cust-appt-${appt.id}`
                                )
                              }
                              className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                isItemRead
                                  ? 'bg-white border-gray-100 hover:border-gray-200 text-gray-600'
                                  : 'bg-purple-50/40 border-purple-200/80 hover:bg-purple-50/70 text-gray-900 shadow-2xs'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {appt.service_name || 'Nail Treatment'}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                  {appt.salon_name ? `${appt.salon_name} • ` : ''}
                                  {appt.appointment_date} at {appt.appointment_time}
                                </p>
                              </div>
                              <NotificationBadge
                                label={isConfirmed ? 'Confirmed' : 'Pending'}
                                variant={isConfirmed ? 'purple' : 'amber'}
                                priority={!isConfirmed ? 'urgent' : 'normal'}
                                isUnread={!isItemRead}
                                showPing={!isItemRead}
                                size="sm"
                                className="shrink-0"
                              />
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

                {/* Salon Owner Appointments: All Pending Requests & Confirmed Bookings */}
                {currentUser?.user_type === 'salon_owner' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                        Salon Appointments
                      </span>
                      <span className="text-[10px] font-semibold text-purple-700">
                        {ownerPendingAppointments.length + ownerConfirmedAppointments.length} total
                      </span>
                    </div>

                    {/* Pending Requests */}
                    {ownerPendingAppointments.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending Requests ({ownerPendingAppointments.length})</span>
                        </div>
                        {ownerPendingAppointments.map((appt) => {
                          const isItemRead = globalIsRead(`owner-appt-${appt.id}`);
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
                              className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                isItemRead
                                  ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-100/40 text-amber-900'
                                  : 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/60 text-amber-950 shadow-2xs'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-amber-950 truncate">
                                  {appt.customer_name || 'Client'} • {appt.service_name}
                                </p>
                                <p className="text-[11px] text-amber-800 truncate mt-0.5">
                                  {appt.salon_name ? `${appt.salon_name} • ` : ''}
                                  {appt.appointment_date} at {appt.appointment_time}
                                </p>
                              </div>
                              <NotificationBadge
                                label="Pending"
                                variant="amber"
                                priority="urgent"
                                isUnread={!isItemRead}
                                showPing={true}
                                size="sm"
                                className="shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Confirmed Schedule */}
                    {ownerConfirmedAppointments.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
                          <Calendar className="w-3 h-3 text-purple-600" />
                          <span>Confirmed Bookings ({ownerConfirmedAppointments.length})</span>
                        </div>
                        {ownerConfirmedAppointments.map((appt) => {
                          const isItemRead = globalIsRead(`owner-appt-${appt.id}`);
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
                              className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                isItemRead
                                  ? 'border-gray-100 bg-white hover:bg-purple-50/30 text-gray-700'
                                  : 'border-purple-200 bg-purple-50/40 hover:bg-purple-100/50 text-purple-950 shadow-2xs'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {appt.customer_name || 'Client'} • {appt.service_name}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                  {appt.salon_name ? `${appt.salon_name} • ` : ''}
                                  {appt.appointment_date} at {appt.appointment_time}
                                </p>
                              </div>
                              <NotificationBadge
                                label="Confirmed"
                                variant="purple"
                                priority="normal"
                                isUnread={!isItemRead}
                                showPing={false}
                                size="sm"
                                className="shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {ownerPendingAppointments.length === 0 && ownerConfirmedAppointments.length === 0 && (
                      <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                        All appointment requests confirmed and up to date.
                      </p>
                    )}
                  </div>
                )}

                {/* Super Admin Booking Overview */}
                {currentUser?.user_type === 'admin' && (
                  <div
                    onClick={() => handleItemNavigation('admin-dashboard', 'admin-stats-appointments')}
                    className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-purple-950">
                        Platform Booking Activity
                      </p>
                      <p className="text-[11px] text-purple-700 mt-0.5">
                        {adminTotalAppointments || 6} appointments scheduled across all salons
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-600 shrink-0" />
                  </div>
                )}

                {/* Guest State */}
                {!currentUser && (
                  <div className="p-3.5 rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 text-center">
                    <p className="text-xs font-bold text-gray-900">Track Your Salon Bookings</p>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                      Sign in to your customer account to view your scheduled salon appointments.
                    </p>
                    <button
                      onClick={() => handleItemNavigation('login-customer')}
                      className="mt-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 
              SECTION 2: IN-STORE CART & PICKUP ORDERS 
            */}
            {activeCategory === 'cart' && (
              <div className="space-y-2.5">
                {/* Active Cart Quick Summary */}
                {effectiveCartCount > 0 ? (
                  <div
                    id="notification-cart-card"
                    onClick={() => handleOpenCartDrawer('cart-active')}
                    className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      globalIsRead('cart-active')
                        ? 'bg-pink-50/30 border-pink-100 hover:bg-pink-50/50'
                        : 'bg-pink-50/70 border-pink-200 hover:bg-pink-100/60 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          In-Store Cart ({effectiveCartCount} items)
                        </p>
                        <p className="text-[11px] text-pink-700 font-semibold truncate mt-0.5">
                          Est. Total: ₱{cartTotalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-white bg-pink-600 hover:bg-pink-700 px-2.5 py-1 rounded-lg shadow-2xs shrink-0">
                      View Cart
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
                    <p className="text-xs text-gray-500">
                      Your In-Store Reservation Cart is empty.
                    </p>
                    <button
                      onClick={() => handleItemNavigation('products')}
                      className="mt-1 text-xs text-pink-600 hover:text-pink-800 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Browse Products</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Customer Placed Pickup Orders */}
                {currentUser?.user_type === 'customer' && activeCustomerOrders.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                        Pickup Reservations
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {activeCustomerOrders.length} active
                      </span>
                    </div>

                    {activeCustomerOrders.map((order) => {
                      const isReady = order.status === 'ready_for_pickup';
                      const isItemRead = globalIsRead(`cust-order-${order.id}`);

                      return (
                        <div
                          key={order.id}
                          onClick={() =>
                            handleItemNavigation(
                              'customer-orders',
                              `customer-order-${order.id}`,
                              `cust-order-${order.id}`
                            )
                          }
                          className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            isItemRead
                              ? 'bg-white border-gray-100 hover:border-gray-200 text-gray-600'
                              : 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/70 text-gray-900 shadow-2xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              Order #{order.order_number || order.id} • {order.salon_name || 'Salon pickup'}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              ₱{order.total_amount.toLocaleString()} • Pickup on {order.pickup_date}
                            </p>
                          </div>
                          <NotificationBadge
                            label={isReady ? 'Ready' : 'Pending'}
                            variant={isReady ? 'emerald' : 'amber'}
                            priority={order.is_overdue_unclaimed ? 'urgent' : 'normal'}
                            isUnread={!isItemRead}
                            showPing={!isItemRead}
                            size="sm"
                            className="shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Salon Owner Fulfillment Orders */}
                {currentUser?.user_type === 'salon_owner' && ownerPendingOrders.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                        Orders to Fulfill
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {ownerPendingOrders.length} pending
                      </span>
                    </div>

                    {ownerPendingOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() =>
                          handleItemNavigation(
                            'owner-inventory',
                            `owner-order-${order.id}`,
                            `owner-order-${order.id}`
                          )
                        }
                        className="p-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/50 transition-all cursor-pointer flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-emerald-950 truncate">
                            Order #{order.order_number || order.id} • {order.customer_name}
                          </p>
                          <p className="text-[11px] text-emerald-800 truncate mt-0.5">
                            ₱{order.total_amount.toLocaleString()} • Pickup on {order.pickup_date}
                          </p>
                        </div>
                        <NotificationBadge
                          label="Fulfill"
                          variant="emerald"
                          priority="normal"
                          size="sm"
                          className="shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 
              SECTION 3: GOVERNANCE, STORE APPROVALS & SYSTEM ALERTS
            */}
            {activeCategory === 'alerts' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Store &amp; Platform Alerts
                  </span>
                  {alertsCount > 0 && (
                    <span className="text-[10px] font-semibold text-amber-700">
                      {alertsCount} total
                    </span>
                  )}
                </div>

                {/* Admin Pending Salon Approvals */}
                {currentUser?.user_type === 'admin' && adminPendingSalons.length > 0 && (
                  <div className="space-y-1.5">
                    {adminPendingSalons.map((salon) => (
                      <div
                        key={salon.id}
                        onClick={() =>
                          handleItemNavigation(
                            'admin-salons',
                            `admin-salon-${salon.id}`,
                            `admin-salon-${salon.id}`
                          )
                        }
                        className="p-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 transition-all cursor-pointer flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-rose-950 truncate">
                            Verify: {salon.salon_name}
                          </p>
                          <p className="text-[11px] text-rose-800 truncate mt-0.5">
                            {salon.city || 'Location'} • Awaits admin governance review
                          </p>
                        </div>
                        <NotificationBadge
                          label="Review"
                          variant="rose"
                          priority="urgent"
                          isUnread={!globalIsRead(`admin-salon-${salon.id}`)}
                          showPing={true}
                          size="sm"
                          className="shrink-0"
                        />
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
                        onClick={() =>
                          handleItemNavigation(
                            'owner-branches',
                            `owner-branch-${salon.id}`,
                            `owner-branch-${salon.id}`
                          )
                        }
                        className="p-2.5 px-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 transition-all cursor-pointer flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-amber-950 truncate">
                            Branch: {salon.salon_name}
                          </p>
                          <p className="text-[11px] text-amber-800 truncate mt-0.5">
                            Under admin verification
                          </p>
                        </div>
                        <NotificationBadge
                          label="Pending"
                          variant="amber"
                          priority="urgent"
                          isUnread={!globalIsRead(`owner-branch-${salon.id}`)}
                          showPing={true}
                          size="sm"
                          className="shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Site-wide Announcements / Promos */}
                {activeAnnouncements.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeAnnouncements.map((item) => {
                      const isAlert = item.type === 'alert';
                      const isPromo = item.type === 'promo';
                      const isItemRead = globalIsRead(`announcement-${item.id}`);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            onDismissAnnouncement?.(item.id);
                            if (currentUser?.user_type === 'admin') {
                              handleItemNavigation(
                                'admin-announcements',
                                `admin-announcement-${item.id}`,
                                `announcement-${item.id}`
                              );
                            } else {
                              handleItemNavigation(
                                'explore',
                                `site-announcement-${item.id}`,
                                `announcement-${item.id}`
                              );
                            }
                          }}
                          className={`p-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            isItemRead
                              ? 'bg-white border-gray-100 text-gray-600 opacity-75'
                              : isAlert
                              ? 'bg-rose-50/60 border-rose-200 text-rose-950 shadow-2xs'
                              : isPromo
                              ? 'bg-gradient-to-r from-pink-50/70 to-purple-50/70 border-pink-200 text-gray-900 shadow-2xs'
                              : 'bg-gray-50 border-gray-200 text-gray-800 shadow-2xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {item.message || ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <NotificationBadge
                              label={item.type.toUpperCase()}
                              variant={isAlert ? 'rose' : isPromo ? 'pink' : 'neutral'}
                              priority={isAlert ? 'urgent' : 'normal'}
                              isUnread={!isItemRead}
                              showPing={!isItemRead}
                              size="sm"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(`announcement-${item.id}`);
                                onDismissAnnouncement?.(item.id);
                              }}
                              className="p-1 rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Mark as viewed"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl text-center">
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
