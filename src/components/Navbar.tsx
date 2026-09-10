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
  Scissors,
  Flame,
  Store,
  BarChart3,
  ChevronDown,
  Menu,
  X,
  MapPin,
  ShoppingBag,
  Package,
  Compass,
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

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenBooking: () => void;
  onLogout: () => void;
  onOpenRegisterSalon: () => void;
  isAdminMode: boolean;
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
}) => {
  const handleNavigation = (tab: string, targetDomId?: string) => {
    if (onNavigate) {
      onNavigate(tab, targetDomId);
    } else {
      setActiveTab(tab);
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const isAdmin = currentUser?.user_type === 'admin';

  // Hide navbar in admin mode for non-admin users
  if (isAdminMode && !isAdmin) {
    return null;
  }

  // Hide navbar in non-admin mode for admin users
  if (!isAdminMode && isAdmin) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-lg border-b border-pink-100/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div
            id="brand-logo-btn"
            onClick={() => {
              if (currentUser?.user_type === 'salon_owner') {
                handleNavigation('owner-dashboard');
              } else if (currentUser?.user_type === 'admin') {
                handleNavigation('admin-dashboard');
              } else {
                handleNavigation('landing');
              }
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-300 flex items-center justify-center text-white shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-xl tracking-tight bg-gradient-to-r from-pink-700 via-rose-600 to-purple-800 bg-clip-text text-transparent">
                  Nail Glam Hub
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full ${
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
              <p className="text-[11px] text-gray-500 font-medium tracking-wide">
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
          <div className="flex items-center gap-2.5">
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
            />

            {/* User Account / Profile Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-pink-200 hover:border-pink-300 bg-pink-50/50 hover:bg-pink-100/60 transition-all cursor-pointer"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullname}
                      className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center border border-white shadow-xs">
                      <span className="text-white text-xs font-bold">
                        {currentUser.fullname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                      {currentUser.fullname.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-pink-600 capitalize font-medium">
                      {currentUser.user_type.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    id="user-menu-dropdown"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-pink-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {currentUser.fullname}
                      </p>
                      <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 capitalize">
                        Role: {currentUser.user_type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="py-1">
                      {currentUser.user_type === 'customer' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveTab('explore');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Compass className="w-4 h-4 text-pink-600" />
                            <span>Explore Salons</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('customer-dashboard');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Calendar className="w-4 h-4 text-pink-600" />
                            <span>My Bookings</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('favorites');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Heart className="w-4 h-4 text-rose-500" />
                            <span>Favorite Salons</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('customer-orders');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <ShoppingBag className="w-4 h-4 text-emerald-600" />
                            <span>Reserved Orders</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab('products');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Package className="w-4 h-4 text-pink-600" />
                            <span>Shop Products</span>
                          </button>

                          <div className="border-t border-gray-100 my-1"></div>

                          <button
                            onClick={() => {
                              setActiveTab('profile');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <UserIcon className="w-4 h-4 text-pink-600" />
                            <span>My Profile & Settings</span>
                          </button>
                        </>
                      )}

                      {currentUser.user_type === 'salon_owner' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveTab('owner-dashboard');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-purple-900 hover:bg-purple-50 flex items-center gap-2.5 cursor-pointer font-semibold"
                          >
                            <Store className="w-4 h-4 text-purple-600" />
                            <span>Salon Management Suite</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('owner-inventory');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-purple-900 hover:bg-purple-50 flex items-center gap-2.5 cursor-pointer font-semibold"
                          >
                            <Package className="w-4 h-4 text-emerald-600" />
                            <span>Products & Inventory</span>
                          </button>
                          <button
                            onClick={() => {
                              onOpenRegisterSalon();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Scissors className="w-4 h-4 text-purple-600" />
                            <span>+ Register Branch</span>
                          </button>
                        </>
                      )}

                      {currentUser.user_type === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveTab('admin-dashboard');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-900 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-semibold"
                          >
                            <Shield className="w-4 h-4 text-rose-600" />
                            <span>System Overview</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('admin-salons');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Store className="w-4 h-4 text-rose-600" />
                            <span>Salon Approvals & Directory</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('admin-users');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Users className="w-4 h-4 text-rose-600" />
                            <span>User Accounts Management</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('admin-content');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Flame className="w-4 h-4 text-rose-600" />
                            <span>Content Moderation</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('admin-announcements');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Radio className="w-4 h-4 text-rose-600" />
                            <span>Broadcast Announcements</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          onLogout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-nav-customer-login"
                  onClick={() => setActiveTab('login-customer')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-pink-300 text-pink-700 hover:bg-pink-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Client Login</span>
                </button>

                <button
                  id="btn-nav-partner-login"
                  onClick={() => setActiveTab('login-owner')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Partner Login</span>
                </button>

                {/* Portal Chooser Button */}
                <button
                  id="btn-nav-portals-more"
                  onClick={onOpenAuth}
                  className="px-2.5 py-2 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="More Login Options (Owner)"
                >
                  <span>Portals</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-pink-100 py-3 space-y-1 bg-white">
            {currentUser?.user_type === 'admin' ? (
              /* SUPER ADMIN ONLY MOBILE MENU */
              <div className="space-y-1">
                <p className="px-4 text-[10px] uppercase font-bold text-rose-800 tracking-wider">
                  Super Admin Governance
                </p>
                <button
                  onClick={() => {
                    setActiveTab('admin-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-950 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-rose-600" />
                  <span>System Overview & KPIs</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin-salons');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-950 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <Store className="w-4 h-4 text-rose-600" />
                  <span>Salon Approvals & Directory</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin-users');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-950 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-rose-600" />
                  <span>User Accounts Management</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin-content');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-950 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>Content Moderation</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin-announcements');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-950 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <Radio className="w-4 h-4 text-rose-600" />
                  <span>Broadcast Announcements</span>
                </button>

                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : currentUser?.user_type === 'salon_owner' ? (
              /* SALON OWNER ONLY MOBILE MENU */
              <div className="space-y-1">
                <p className="px-4 text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                  Partner Management
                </p>
                <button
                  onClick={() => {
                    setActiveTab('owner-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Store Reports & CRM</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('owner-appointments');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>Appointments & Schedule</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('owner-services');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <span>Services &amp; Treatments</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('owner-staff');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-purple-600" />
                  <span>Staff & Artists</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('owner-location');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span>Store Location & Map</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('owner-inventory');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Products & Stock Inventory</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('owner-settings');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-600" />
                  <span>Salon Settings & Hours</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('register-owner');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-2"
                >
                  <Store className="w-4 h-4 text-purple-600" />
                  <span>+ Register New Branch</span>
                </button>

                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              /* CUSTOMER & GUEST MOBILE MENU */
              <>
                <button
                  onClick={() => {
                    setActiveTab('explore');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-lg"
                >
                  Explore Salons
                </button>
                {currentUser?.user_type === 'customer' && (
                  <button
                    onClick={() => {
                      setActiveTab('favorites');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-lg flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4 text-pink-600" />
                    <span>Favorite Salons</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveTab('map');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-lg flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-pink-600" />
                  <span>Store Locations Map</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('services');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-lg"
                >
                  Services & Menu
                </button>
                <button
                  onClick={() => {
                    setActiveTab('products');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>Products & Care</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                    BOUTIQUE
                  </span>
                </button>
                {currentUser?.user_type === 'customer' && (
                  <button
                    onClick={() => {
                      setActiveTab('customer-orders');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-lg flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-pink-600" />
                    <span>My Reserved Orders</span>
                  </button>
                )}
                {onOpenCart && (
                  <button
                    onClick={() => {
                      onOpenCart();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-pink-700 bg-pink-50/70 hover:bg-pink-100 rounded-lg flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-pink-600" />
                      <span>In-Store Reservation Cart</span>
                    </span>
                    {cartItemCount > 0 && (
                      <span className="text-xs bg-pink-600 text-white font-bold px-2 py-0.5 rounded-full">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveTab('reels');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-lg flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-rose-500" />
                  Nail Reels & Inspiration
                </button>
                <button
                  onClick={() => {
                    setActiveTab('reviews');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-lg"
                >
                  Customer Reviews
                </button>

                {/* Auth portals for mobile */}
                {!currentUser && (
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <p className="px-4 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Authentication Portals
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('login-customer');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-pink-700 hover:bg-pink-50 rounded-lg flex items-center gap-2"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Client Login / Register
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('login-owner');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                    >
                      <Store className="w-3.5 h-3.5" />
                      Salon Owner Login / Register
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('login-admin');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Super Admin Console
                    </button>
                  </div>
                )}

                {currentUser && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setActiveTab(
                          currentUser.user_type === 'admin'
                            ? 'admin-dashboard'
                            : 'customer-dashboard'
                        );
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-pink-700 hover:bg-pink-50 rounded-lg"
                    >
                      My Dashboard ({currentUser.user_type.replace('_', ' ')})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
