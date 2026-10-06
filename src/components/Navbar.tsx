import React from 'react';
import {
  Sparkles,
  Search,
  Calendar,
  Heart,
  User as UserIcon,
  Users,
  Radio,
  LogIn,
  LogOut,
  LayoutDashboard,
  Shield,
  Lock,
  Scissors,
  Flame,
  Store,
  BarChart3,
  ChevronDown,
  Star,
  MapPin,
  ShoppingBag,
  Package,
  Compass,
  Mail,
  ExternalLink,
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
import { NotificationMenu } from './NotificationMenu';
import { NotificationBadge } from './common/NotificationBadge';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenBooking: () => void;
  onLogout: () => void;
  onOpenRegisterSalon: () => void;
  isAdminMode: boolean;
  onLockAdminPortal?: () => void;
  onOpenAdminGate?: () => void;
  onNavigate?: (tab: string, targetDomId?: string) => void;
  cartItemCount?: number;
  onOpenCart?: (targetProductId?: number) => void;
  // Notification system props
  cartItems?: CartItem[];
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
  onOpenEmailHistory?: () => void;
  dismissedAnnouncements?: number[];
  onDismissAnnouncement?: (id: number) => void;
  onDismissAllAnnouncements?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenBooking,
  onLogout,
  onOpenRegisterSalon,
  isAdminMode,
  onLockAdminPortal,
  onOpenAdminGate,
  onNavigate,
  cartItemCount = 0,
  onOpenCart,
  cartItems = [],
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
  onOpenEmailHistory,
  dismissedAnnouncements = [],
  onDismissAnnouncement,
  onDismissAllAnnouncements,
}) => {
  const { categoryUnread } = useNotifications();
  const handleNavigation = (tab: string, targetDomId?: string) => {
    if (onNavigate) {
      onNavigate(tab, targetDomId);
    } else {
      setActiveTab(tab);
    }
  };
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userDropdownOpen]);

  const logoTapCountRef = React.useRef(0);
  const logoLastTapRef = React.useRef(0);

  const handleBrandLogoClick = () => {
    const now = Date.now();
    if (now - logoLastTapRef.current < 1500) {
      logoTapCountRef.current += 1;
      if (logoTapCountRef.current >= 5) {
        logoTapCountRef.current = 0;
        if (onOpenAdminGate) {
          onOpenAdminGate();
          return;
        }
      }
    } else {
      logoTapCountRef.current = 1;
    }
    logoLastTapRef.current = now;

    if (currentUser?.user_type === 'salon_owner') {
      handleNavigation('owner-dashboard');
    } else if (currentUser?.user_type === 'admin') {
      handleNavigation('admin-dashboard');
    } else {
      handleNavigation('landing');
    }
  };

  const isAdmin = currentUser?.user_type === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 border-b border-pink-100/70 shadow-xs transition-colors duration-200">
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div
            id="brand-logo-btn"
            onClick={handleBrandLogoClick}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0 shrink"
            title="Nail Glam Hub (Tap 5x for Admin Gate)"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-300 flex items-center justify-center text-white shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-pink-700 via-rose-600 to-purple-800 bg-clip-text text-transparent truncate">
                  Nail Glam Hub
                </span>
                <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline-block ${
                  currentUser?.user_type === 'salon_owner'
                    ? 'bg-purple-100 text-purple-800'
                    : currentUser?.user_type === 'admin'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-pink-100 text-pink-700'
                }`}>
                  {currentUser?.user_type === 'salon_owner'
                    ? 'Partner Portal'
                    : currentUser?.user_type === 'admin'
                    ? 'Admin Guard'
                    : 'Luxe'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium tracking-wide truncate hidden xl:block max-w-[260px]">
                {currentUser?.user_type === 'salon_owner'
                  ? 'Salon Business Management'
                  : currentUser?.user_type === 'admin'
                  ? 'Super Admin Governance Console'
                  : 'Bespoke Salons & Booking Portal'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links - Removed per user request */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {/* Navigation removed - only profile dropdown remains */}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
            {/* Quick Admin Navigation Toggle */}
            {currentUser?.user_type === 'admin' && (
              activeTab.startsWith('admin') ? (
                <button
                  id="navbar-admin-browse-btn"
                  onClick={() => handleNavigation('salons')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-semibold border border-rose-200 transition-colors shadow-2xs cursor-pointer"
                  title="Leave Admin Console to browse public salons & marketplace"
                >
                  <Store className="w-3.5 h-3.5 text-rose-700" />
                  <span>Browse Salons</span>
                </button>
              ) : (
                <button
                  id="navbar-admin-console-btn"
                  onClick={() => handleNavigation('admin-dashboard')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Return to Super Admin Governance Console"
                >
                  <Shield className="w-3.5 h-3.5 text-rose-200" />
                  <span>Admin Console</span>
                </button>
              )
            )}

            {/* Notification Button (Arranged In-Store Cart & System Notifications) */}
            <NotificationMenu
              currentUser={currentUser}
              cartItems={cartItems}
              cartItemCount={cartItemCount}
              onOpenCart={onOpenCart}
              customerAppointments={customerAppointments}
              customerOrders={customerOrders}
              announcements={announcements}
              salons={salons}
              ownerSalons={ownerSalons}
              ownerAppointments={ownerAppointments}
              ownerProductOrders={ownerProductOrders}
              ownerReviews={ownerReviews}
              adminPendingSalons={adminPendingSalons}
              adminTotalSalons={adminTotalSalons}
              adminTotalUsers={adminTotalUsers}
              adminTotalAppointments={adminTotalAppointments}
              favoritesCount={favoritesCount}
              onNavigate={handleNavigation}
              dismissedAnnouncements={dismissedAnnouncements}
              onDismissAnnouncement={onDismissAnnouncement}
              onDismissAllAnnouncements={onDismissAllAnnouncements}
            />

            {/* Email Notifications & PDF Reports Inbox Button (hidden on < sm to prevent mobile header crowding) */}
            {currentUser && onOpenEmailHistory && (
              <button
                id="navbar-email-logs-btn"
                onClick={onOpenEmailHistory}
                title="Email Notifications & PDF Reports"
                className="relative p-2 rounded-full text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer hidden sm:inline-flex"
              >
                <Mail className="w-5 h-5" />
                <span className="sr-only">Delivered Email Notifications</span>
              </button>
            )}

            {/* User Account / Consolidated Navigation Menu */}
            <div ref={userMenuRef} className="relative shrink-0">
              {currentUser ? (
                /* Authenticated User Trigger */
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 pr-2 sm:pr-3 rounded-full border border-pink-200 hover:border-pink-300 bg-pink-50/50 hover:bg-pink-100/60 transition-all cursor-pointer shrink-0"
                  aria-expanded={userDropdownOpen}
                  aria-label="User account and navigation menu"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullname}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center border border-white shadow-xs shrink-0">
                      <span className="text-white text-xs font-bold">
                        {currentUser.fullname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[120px]">
                      {currentUser.fullname.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-pink-600 capitalize font-medium">
                      {currentUser.user_type.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                </button>
              ) : (
                /* Guest / Visitor Trigger */
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Desktop Direct Portal Buttons (>= lg) */}
                  <div className="hidden lg:flex items-center gap-1.5">
                    <button
                      id="btn-nav-customer-login"
                      onClick={() => setActiveTab('login-customer')}
                      className="inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-full border border-pink-300 text-pink-700 hover:bg-pink-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Client Login</span>
                    </button>

                    <button
                      id="btn-nav-partner-login"
                      onClick={() => setActiveTab('login-owner')}
                      className="inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-full border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Partner Login</span>
                    </button>

                    {/* Discrete Admin Gate Clearance Indicator (Only visible when unlocked) */}
                    {isAdminMode && (
                      <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-rose-200">
                        <button
                          onClick={() => setActiveTab('login-admin')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-950 text-rose-200 border border-rose-800 text-[11px] font-bold hover:bg-rose-900 transition shadow-2xs cursor-pointer whitespace-nowrap"
                          title="Administrative Console Active"
                        >
                          <Shield className="w-3 h-3 text-rose-400" />
                          <span className="hidden xl:inline">Admin Mode</span>
                        </button>
                        {onLockAdminPortal && (
                          <button
                            onClick={onLockAdminPortal}
                            className="p-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 transition cursor-pointer"
                            title="Lock Administrative Portal"
                          >
                            <Lock className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Universal Profile / Sign In Dropdown Button */}
                  <button
                    id="guest-menu-btn"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-pink-200 hover:border-pink-300 bg-pink-50/70 hover:bg-pink-100 text-pink-700 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                    aria-expanded={userDropdownOpen}
                    aria-label="Account and navigation menu"
                  >
                    <div className="w-5 h-5 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center shrink-0">
                      <UserIcon className="w-3 h-3" />
                    </div>
                    <span>Sign In</span>
                    <ChevronDown className="w-3 h-3 text-pink-500" />
                  </button>
                </div>
              )}

              {/* Unified Dropdown Menu (Available on all viewports, replacing the triple line menu) */}
              {userDropdownOpen && (
                <div
                  id="user-menu-dropdown"
                  className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5.5rem)] overflow-y-auto bg-white rounded-2xl shadow-xl border border-pink-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-gray-100"
                >
                  {/* 1. HEADER */}
                  {currentUser ? (
                    <div className="px-4 py-3 bg-gradient-to-r from-pink-50/60 to-rose-50/30">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signed in</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          currentUser.user_type === 'salon_owner'
                            ? 'bg-purple-100 text-purple-800'
                            : currentUser.user_type === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {currentUser.user_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate mt-1">
                        {currentUser.fullname}
                      </p>
                      {currentUser.email && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-gradient-to-r from-pink-50/60 to-rose-50/30">
                      <p className="text-sm font-bold text-gray-900">Welcome to Nail Glam Hub</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Sign in to reserve services and in-store products
                      </p>
                    </div>
                  )}

                  {/* 2. BODY ITEMS ACCORDING TO ROLE / VISITOR */}
                  {currentUser?.user_type === 'customer' && (
                    <>
                      {/* Customer Bookings & Personal Activity */}
                      <div className="py-1.5">
                        <p className="px-4 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          My Activity
                        </p>
                        <button
                          onClick={() => {
                            handleNavigation('customer-dashboard');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-pink-600" />
                            <span>My Bookings</span>
                          </span>
                          {customerAppointments.length > 0 && (
                            <span className="text-[11px] font-semibold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                              {customerAppointments.length}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('favorites');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Heart className="w-4 h-4 text-rose-500" />
                            <span>Favorite Salons</span>
                          </span>
                          {favoritesCount > 0 && (
                            <span className="text-[11px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                              {favoritesCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('customer-orders');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                            <span>Reserved Orders</span>
                          </span>
                          {customerOrders.length > 0 && (
                            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                              {customerOrders.length}
                            </span>
                          )}
                        </button>

                        {onOpenCart && (
                          <button
                            onClick={() => {
                              onOpenCart();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-pink-700 bg-pink-50/50 hover:bg-pink-100 flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2.5 font-medium">
                              <ShoppingBag className="w-4 h-4 text-pink-600" />
                              <span>In-Store Reservation Cart</span>
                            </span>
                            {cartItemCount > 0 && (
                              <NotificationBadge
                                count={cartItemCount}
                                variant="pink"
                                size="sm"
                                isUnread={categoryUnread.cart}
                                showPing={false}
                              />
                            )}
                          </button>
                        )}

                        {onOpenEmailHistory && (
                          <button
                            onClick={() => {
                              onOpenEmailHistory();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Mail className="w-4 h-4 text-pink-600" />
                            <span>Email Receipts & Notifications</span>
                          </button>
                        )}
                      </div>

                      {/* Customer Discovery & Platform Exploration */}
                      <div className="py-1.5">
                        <p className="px-4 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          Explore & Boutique
                        </p>
                        <button
                          onClick={() => {
                            handleNavigation('explore');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Compass className="w-4 h-4 text-pink-600" />
                          <span>Explore Salons</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('map');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-pink-600" />
                          <span>Store Locations Map</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('services');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-pink-600" />
                          <span>Services & Treatments</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('products');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Package className="w-4 h-4 text-pink-600" />
                            <span>Products & Care</span>
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                            BOUTIQUE
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('reels');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Flame className="w-4 h-4 text-rose-500" />
                          <span>Nail Reels & Inspiration</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('reviews');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Star className="w-4 h-4 text-amber-500" />
                          <span>Customer Reviews</span>
                        </button>
                      </div>
                    </>
                  )}

                  {currentUser?.user_type === 'salon_owner' && (
                    <>
                      {/* Salon Owner Management Suite */}
                      <div className="py-1.5">
                        <p className="px-4 py-1 text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                          Partner Suite
                        </p>
                        <button
                          onClick={() => {
                            handleNavigation('owner-dashboard');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-semibold text-purple-900 hover:bg-purple-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <BarChart3 className="w-4 h-4 text-purple-600" />
                          <span>Store Reports & CRM</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('owner-appointments');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>Appointments & Schedule</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('owner-services');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Scissors className="w-4 h-4 text-purple-600" />
                          <span>Services & Treatments</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('owner-staff');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-purple-600" />
                          <span>Staff & Artists</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('owner-inventory');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span>Products & Inventory</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('owner-location');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <span>Store Location & Map</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('owner-settings');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          <span>Salon Settings & Hours</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenRegisterSalon();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50/70 hover:bg-purple-100 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-purple-600" />
                          <span>+ Register New Branch</span>
                        </button>

                        {onOpenEmailHistory && (
                          <button
                            onClick={() => {
                              onOpenEmailHistory();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Mail className="w-4 h-4 text-purple-600" />
                            <span>Email Reports & PDF Dossiers</span>
                          </button>
                        )}
                      </div>

                      {/* Explore Platform */}
                      <div className="py-1.5">
                        <p className="px-4 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          Explore Platform
                        </p>
                        <button
                          onClick={() => {
                            handleNavigation('salons');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-purple-600" />
                          <span>Browse Salons Directory</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation('products');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-purple-600" />
                          <span>Explore Marketplace</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation('map');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <span>Store Locations Map</span>
                        </button>
                      </div>
                    </>
                  )}

                  {currentUser?.user_type === 'admin' && (
                    <>
                      {/* Super Admin Governance */}
                      <div className="py-1.5">
                        <p className="px-4 py-1 text-[10px] uppercase font-bold text-rose-800 tracking-wider">
                          Super Admin Governance
                        </p>
                        <button
                          onClick={() => {
                            handleNavigation('admin-dashboard');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-semibold text-rose-950 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-rose-600" />
                          <span>System Overview & KPIs</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('admin-salons');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-950 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-rose-600" />
                          <span>Salon Approvals & Directory</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('admin-users');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-950 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-rose-600" />
                          <span>User Accounts Management</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('admin-content');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-950 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Flame className="w-4 h-4 text-rose-600" />
                          <span>Content Moderation</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('admin-announcements');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-950 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Radio className="w-4 h-4 text-rose-600" />
                          <span>Broadcast Announcements</span>
                        </button>

                        {onOpenEmailHistory && (
                          <button
                            onClick={() => {
                              onOpenEmailHistory();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-950 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Mail className="w-4 h-4 text-rose-600" />
                            <span>Email Logs & System Reports</span>
                          </button>
                        )}
                      </div>

                      {/* Admin Explore Public Site */}
                      <div className="py-1.5">
                        <p className="px-4 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          Explore Public Site
                        </p>
                        <button
                          onClick={() => {
                            handleNavigation('salons');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-rose-600" />
                          <span>Browse Salons Directory</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation('products');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-rose-600" />
                          <span>Explore Marketplace</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation('map');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-rose-600" />
                          <span>Store Locations Map</span>
                        </button>
                      </div>
                    </>
                  )}

                  {!currentUser && (
                    <>
                      {/* Guest Authentication Portals */}
                      <div className="py-1.5">
                        <p className="px-4 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          Sign In / Register
                        </p>
                        <button
                          onClick={() => {
                            setActiveTab('login-customer');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-semibold text-pink-700 hover:bg-pink-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <LogIn className="w-4 h-4 text-pink-600" />
                          <span>Client Login / Register</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('login-owner');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-purple-600" />
                          <span>Salon Owner Partner Login</span>
                        </button>

                        {onOpenAdminGate && (
                          <button
                            onClick={() => {
                              onOpenAdminGate();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-rose-50 hover:text-rose-900 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Shield className="w-4 h-4 text-rose-600" />
                            <span>Administrative Access Gate</span>
                          </button>
                        )}
                      </div>

                      {/* Guest Platform Exploration */}
                      <div className="py-1.5">
                        <p className="px-4 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          Explore Platform
                        </p>
                        <button
                          onClick={() => {
                            handleNavigation('explore');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Compass className="w-4 h-4 text-pink-600" />
                          <span>Explore Salons</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('map');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-pink-600" />
                          <span>Store Locations Map</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('services');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-pink-600" />
                          <span>Services & Treatments</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('products');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <Package className="w-4 h-4 text-pink-600" />
                            <span>Products & Care</span>
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                            BOUTIQUE
                          </span>
                        </button>

                        {onOpenCart && (
                          <button
                            onClick={() => {
                              onOpenCart();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-pink-700 bg-pink-50/50 hover:bg-pink-100 flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2.5 font-medium">
                              <ShoppingBag className="w-4 h-4 text-pink-600" />
                              <span>In-Store Reservation Cart</span>
                            </span>
                            {cartItemCount > 0 && (
                              <NotificationBadge
                                count={cartItemCount}
                                variant="pink"
                                size="sm"
                                isUnread={categoryUnread.cart}
                                showPing={false}
                              />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            handleNavigation('reels');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Flame className="w-4 h-4 text-rose-500" />
                          <span>Nail Reels & Inspiration</span>
                        </button>

                        <button
                          onClick={() => {
                            handleNavigation('reviews');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Star className="w-4 h-4 text-amber-500" />
                          <span>Customer Reviews</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* 3. UNIVERSAL FOOTER */}
                  {currentUser && (
                    <div className="py-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          handleNavigation('profile');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <span>Profile & Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          onLogout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
