import React from 'react';
import {
  Compass,
  Sparkles,
  CalendarCheck,
  Calendar,
  Flame,
  Heart,
  Store,
  Shield,
  Scissors,
  HelpCircle,
  PhoneCall,
  UserCheck,
  User as UserIcon,
  Users,
  LayoutDashboard,
  Clock,
  Award,
  Radio,
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  Lock,
  BarChart3,
  MapPin,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBooking: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  isAdminMode: boolean;
  onNavigate?: (tab: string) => void;
  bookingsCount?: number;
  activeBookingsCount?: number;
  totalBookingsCount?: number;
  ordersCount?: number;
  activeOrdersCount?: number;
  totalOrdersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenBooking,
  onOpenAbout,
  onOpenContact,
  isAdminMode,
  onNavigate,
  bookingsCount = 0,
  activeBookingsCount = 0,
  totalBookingsCount = 0,
  ordersCount = 0,
  activeOrdersCount = 0,
  totalOrdersCount = 0,
}) => {
  const handleNavigation = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };
  const isOwner = currentUser?.user_type === 'salon_owner';
  const isAdmin = currentUser?.user_type === 'admin';

  // ----------------------------------------------------
  // ADMIN MODE CHECK - Hide non-admin UI when in admin mode
  // ----------------------------------------------------
  if (isAdminMode && !isAdmin) {
    return null; // Hide sidebar completely in admin mode for non-admin users
  }

  // ----------------------------------------------------
  // NON-ADMIN MODE CHECK - Hide admin UI when not in admin mode
  // ----------------------------------------------------
  if (!isAdminMode && isAdmin) {
    return null; // Hide sidebar completely in non-admin mode for admin users
  }

  // ----------------------------------------------------
  // SUPER ADMIN SIDEBAR VIEW (Exclusive Admin Tools Only)
  // ----------------------------------------------------
  if (isAdmin) {
    return (
      <aside className="w-64 shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-3 space-y-5">
        {/* Admin Identity Card */}
        <div className="bg-gradient-to-br from-stone-950 via-rose-950 to-purple-950 rounded-2xl p-4 text-white shadow-md border border-rose-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/60 flex items-center justify-center text-rose-200">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Master Console</p>
              <p className="text-[10px] text-rose-200/80 font-medium">Super Admin Authority</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-900/60 flex items-center justify-between text-[11px]">
            <span className="text-rose-200/70">Clearance:</span>
            <span className="bg-rose-500/20 text-rose-200 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Full Access
            </span>
          </div>
        </div>

        {/* Central Platform Governance Menu */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-rose-100 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-900 px-3 py-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-rose-700" />
            Platform Governance
          </p>
          <div className="space-y-1 mt-1">
            <button
              id="sidebar-admin-overview-btn"
              onClick={() => handleNavigation('admin-dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'admin-dashboard'
                  ? 'bg-rose-900 text-white font-bold shadow-xs'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-rose-700" />
              <span>Overview & KPIs</span>
            </button>

            <button
              id="sidebar-admin-salons-btn"
              onClick={() => handleNavigation('admin-salons')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'admin-salons'
                  ? 'bg-rose-900 text-white font-bold shadow-xs'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
            >
              <Store className="w-4 h-4 text-rose-700" />
              <span>Salon Approvals</span>
            </button>

            <button
              id="sidebar-admin-users-btn"
              onClick={() => handleNavigation('admin-users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'admin-users'
                  ? 'bg-rose-900 text-white font-bold shadow-xs'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
            >
              <Users className="w-4 h-4 text-rose-700" />
              <span>User Accounts</span>
            </button>

            <button
              id="sidebar-admin-content-btn"
              onClick={() => setActiveTab('admin-content')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'admin-content'
                  ? 'bg-rose-900 text-white font-bold shadow-xs'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-rose-700" />
              <span>Content Moderation</span>
            </button>

            <button
              id="sidebar-admin-announcements-btn"
              onClick={() => setActiveTab('admin-announcements')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'admin-announcements'
                  ? 'bg-rose-900 text-white font-bold shadow-xs'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
            >
              <Radio className="w-4 h-4 text-rose-700" />
              <span>Site Broadcasts</span>
            </button>

            <button
              id="sidebar-admin-profile-btn"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-rose-900 text-white font-bold shadow-xs'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
            >
              <UserIcon className="w-4 h-4 text-rose-700" />
              <span>My Account Profile</span>
            </button>
          </div>
        </div>

        {/* Global Broadcast Action */}
        <div className="bg-gradient-to-br from-rose-50/90 to-pink-50/80 backdrop-blur-sm rounded-2xl p-3 border border-rose-100 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800 px-3 py-1.5 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            Quick Broadcast
          </p>
          <div className="space-y-1 mt-1">
            <button
              id="sidebar-admin-quick-broadcast-btn"
              onClick={() => setActiveTab('admin-announcements')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'admin-announcements'
                  ? 'bg-rose-900 text-white'
                  : 'text-rose-900 bg-white hover:bg-rose-100/70 border border-rose-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-600" />
              <span>+ Push Live Banner</span>
            </button>
          </div>
        </div>

        {/* Admin Support & Compliance Footer */}
        <div className="px-3 pt-2 text-xs text-gray-500 space-y-2 border-t border-rose-100">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Lock className="w-3 h-3 text-rose-600" />
            <span>Strict RBAC Security Enforcement</span>
          </div>
          <p className="text-[11px] text-gray-400">© 2025 Nail Glam Hub Security Guard.</p>
        </div>
      </aside>
    );
  }
  if (isOwner) {
    return (
      <aside className="w-64 shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-3 space-y-5">
        {/* Salon Partner Studio Card */}
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-4 text-white shadow-md border border-purple-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/60 flex items-center justify-center text-amber-300">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Partner Portal</p>
              <p className="text-[10px] text-purple-200 font-medium">Salon Business Suite</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-800/80 flex items-center justify-between text-[11px]">
            <span className="text-purple-200">Status:</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live & Taking Bookings
            </span>
          </div>
        </div>

        {/* Salon Operations Menu */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-purple-100 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800 px-3 py-1.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            Salon Management
          </p>
          <div className="space-y-1 mt-1">
            <button
              id="sidebar-owner-branches-btn"
              onClick={() => setActiveTab('owner-branches')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'owner-branches'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <Store className="w-4 h-4 text-purple-600" />
              <span>Branch Overview</span>
            </button>

            <button
              id="sidebar-owner-overview-btn"
              onClick={() => setActiveTab('owner-dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'owner-dashboard'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Store Reports & CRM</span>
            </button>

            <button
              id="sidebar-owner-appointments-btn"
              onClick={() => setActiveTab('owner-appointments')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'owner-appointments'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Bookings & Schedule</span>
            </button>

            <button
              id="sidebar-owner-services-btn"
              onClick={() => setActiveTab('owner-services')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'owner-services'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <Scissors className="w-4 h-4 text-purple-600" />
              <span>Services &amp; Treatments</span>
            </button>

            <button
              id="sidebar-owner-staff-btn"
              onClick={() => setActiveTab('owner-staff')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'owner-staff'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Staff & Artists Roster</span>
            </button>

            <button
              id="sidebar-owner-inventory-btn"
              onClick={() => setActiveTab('owner-inventory')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'owner-inventory'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <Package className="w-4 h-4 text-purple-600" />
              <span>Products & Stock</span>
            </button>

            <button
              id="sidebar-owner-location-btn"
              onClick={() => setActiveTab('owner-location')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'owner-location'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>Store Location & Map</span>
            </button>

            <button
              id="sidebar-owner-settings-btn"
              onClick={() => setActiveTab('owner-settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'owner-settings'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Salon Profile & Hours</span>
            </button>

            <button
              id="sidebar-owner-profile-btn"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <UserIcon className="w-4 h-4 text-purple-600" />
              <span>My Account Profile</span>
            </button>
          </div>
        </div>

        {/* Growth & Expansion */}
        <div className="bg-gradient-to-br from-purple-50/90 to-pink-50/80 backdrop-blur-sm rounded-2xl p-3 border border-purple-100 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700 px-3 py-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Branch Expansion
          </p>
          <div className="space-y-1 mt-1">
            <button
              id="sidebar-register-branch-btn"
              onClick={() => setActiveTab('owner-branches')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'owner-branches'
                  ? 'bg-purple-700 text-white font-bold'
                  : 'text-purple-900 bg-white hover:bg-purple-100/70 border border-purple-200'
              }`}
            >
              <Store className="w-4 h-4 text-purple-600" />
              <span>+ Register New Branch</span>
            </button>
          </div>
        </div>

        {/* Partner Support Links */}
        <div className="px-3 pt-2 text-xs text-gray-500 space-y-2 border-t border-purple-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAbout}
              className="hover:text-purple-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" /> Partner Guide
            </button>
            <span>•</span>
            <button
              onClick={onOpenContact}
              className="hover:text-purple-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3" /> Partner Desk
            </button>
          </div>
          <p className="text-[11px] text-gray-400">© 2025 Nail Glam Hub Partner Network.</p>
        </div>
      </aside>
    );
  }

  // ----------------------------------------------------
  // CLIENT & GUEST SIDEBAR VIEW
  // ----------------------------------------------------
  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-3 space-y-6">
      {/* Primary Discovery Menu */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-pink-100/80 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1.5">
          Discover & Book
        </p>
        <div className="space-y-1 mt-1">
          <button
            id="sidebar-explore-btn"
            onClick={() => setActiveTab('explore')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'explore'
                ? 'bg-pink-100 text-pink-900 font-semibold'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <Compass className="w-4 h-4 text-pink-600" />
            <span>Salons Directory</span>
          </button>

          <button
            id="sidebar-map-btn"
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'map'
                ? 'bg-pink-100 text-pink-900 font-semibold'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <MapPin className="w-4 h-4 text-pink-600" />
            <span>Store Locator Map</span>
          </button>

          <button
            id="sidebar-services-btn"
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'services'
                ? 'bg-pink-100 text-pink-900 font-semibold'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>Service Catalog</span>
          </button>

          <button
            id="sidebar-products-btn"
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'bg-pink-100 text-pink-900 font-semibold'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <div className="flex items-center justify-between flex-1">
              <span>Products & Care</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.2 rounded-full">
                BOUTIQUE
              </span>
            </div>
          </button>

          <button
            id="sidebar-reels-btn"
            onClick={() => setActiveTab('reels')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'reels'
                ? 'bg-pink-100 text-pink-900 font-semibold'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <div className="flex items-center justify-between flex-1">
              <span>Viral Nail Reels</span>
              <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                HOT
              </span>
            </div>
          </button>

          <button
            id="sidebar-reviews-btn"
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-pink-100 text-pink-900 font-semibold'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <Heart className="w-4 h-4 text-pink-600" />
            <span>Client Reviews</span>
          </button>
        </div>
      </div>

      {/* Customer Workspace / Auth Links */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-pink-100/80 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1.5">
          {currentUser ? 'My Account' : 'Client Access'}
        </p>
        <div className="space-y-1 mt-1">
          {currentUser ? (
            <>
              {/* My Bookings with notification signal and numbering */}
              {(() => {
                const hasActiveBookings = activeBookingsCount > 0;
                return (
                  <button
                    id="sidebar-appointments-btn"
                    onClick={() => setActiveTab('customer-dashboard')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                      activeTab === 'customer-dashboard'
                        ? 'bg-pink-100 text-pink-900 font-semibold shadow-xs'
                        : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
                    }`}
                    title={
                      bookingsCount > 0
                        ? `${activeBookingsCount} active upcoming • ${totalBookingsCount} total booking${totalBookingsCount > 1 ? 's' : ''}`
                        : 'My Bookings'
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex items-center justify-center shrink-0">
                        <CalendarCheck className="w-4 h-4 text-pink-600 shrink-0" />
                        {hasActiveBookings && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-1 ring-white"></span>
                          </span>
                        )}
                      </div>
                      <span className="truncate">My Bookings</span>
                    </div>

                    {bookingsCount > 0 && (
                      <span
                        id="sidebar-bookings-badge"
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                          hasActiveBookings
                            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-pink-500/25 ring-1 ring-pink-400/30'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {hasActiveBookings && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></span>
                        )}
                        <span>{bookingsCount}</span>
                      </span>
                    )}
                  </button>
                );
              })()}

              {/* Reserved Orders with notification signal and numbering */}
              {(() => {
                const hasActiveOrders = activeOrdersCount > 0;
                return (
                  <button
                    id="sidebar-orders-btn"
                    onClick={() => setActiveTab('customer-orders')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                      activeTab === 'customer-orders'
                        ? 'bg-pink-100 text-pink-900 font-semibold shadow-xs'
                        : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
                    }`}
                    title={
                      ordersCount > 0
                        ? `${activeOrdersCount} ready for pickup / pending • ${totalOrdersCount} total reservation${totalOrdersCount > 1 ? 's' : ''}`
                        : 'Reserved Orders'
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                        {hasActiveOrders && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-1 ring-white"></span>
                          </span>
                        )}
                      </div>
                      <span className="truncate">Reserved Orders</span>
                    </div>

                    {ordersCount > 0 && (
                      <span
                        id="sidebar-orders-badge"
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                          hasActiveOrders
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/25 ring-1 ring-emerald-400/30'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {hasActiveOrders && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0"></span>
                        )}
                        <span>{ordersCount}</span>
                      </span>
                    )}
                  </button>
                );
              })()}

              <button
                id="sidebar-favorites-btn"
                onClick={() => setActiveTab('favorites')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'favorites'
                    ? 'bg-pink-100 text-pink-900 font-semibold'
                    : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
                }`}
              >
                <Heart className="w-4 h-4 text-pink-600" />
                <span>Favorite Salons</span>
              </button>

              <button
                id="sidebar-profile-btn"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-pink-100 text-pink-900 font-semibold'
                    : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
                }`}
              >
                <UserIcon className="w-4 h-4 text-pink-600" />
                <span>My Profile</span>
              </button>

              <button
                id="sidebar-book-now-btn"
                onClick={onOpenBooking}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-pink-700 bg-pink-50/80 hover:bg-pink-100 transition-colors cursor-pointer"
              >
                <Scissors className="w-4 h-4 text-pink-600" />
                <span>Book Appointment</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="sidebar-login-customer-btn"
                onClick={() => setActiveTab('login-customer')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'login-customer'
                    ? 'bg-pink-100 text-pink-900 font-bold'
                    : 'text-pink-700 hover:bg-pink-50'
                }`}
              >
                <Heart className="w-4 h-4 text-pink-600" />
                <span>Client Login</span>
              </button>
              <button
                id="sidebar-register-customer-btn"
                onClick={() => setActiveTab('register-customer')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'register-customer'
                    ? 'bg-pink-100 text-pink-900 font-bold'
                    : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-pink-600" />
                <span>New Client Sign Up</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Salon Management (Unauthenticated Owner Link or Admin) */}
      {!currentUser && (
        <div className="bg-gradient-to-br from-purple-50/90 to-pink-50/80 backdrop-blur-sm rounded-2xl p-3 border border-purple-100 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700 px-3 py-1.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            Salon Partner Portal
          </p>
          <div className="space-y-1 mt-1">
            <button
              id="sidebar-owner-login-btn"
              onClick={() => setActiveTab('login-owner')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'login-owner'
                  ? 'bg-purple-700 text-white font-bold'
                  : 'text-purple-800 hover:bg-purple-100/70'
              }`}
            >
              <Store className="w-4 h-4 text-purple-600" />
              <span>Partner Login</span>
            </button>
            <button
              id="sidebar-owner-register-btn"
              onClick={() => setActiveTab('register-owner')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'register-owner'
                  ? 'bg-purple-700 text-white font-bold'
                  : 'text-purple-900 hover:bg-purple-100/70'
              }`}
            >
              <Scissors className="w-4 h-4 text-purple-600" />
              <span>Register Salon</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Panel Link - Only for logged-in admins */}
      {isAdmin && (
        <div className="bg-gradient-to-br from-rose-50/90 to-amber-50/80 backdrop-blur-sm rounded-2xl p-3 border border-rose-100 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 px-3 py-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Super Admin
          </p>
          <div className="space-y-1 mt-1">
            <button
              id="sidebar-admin-portal-btn"
              onClick={() => setActiveTab('admin-dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'admin-dashboard'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'text-rose-900 hover:bg-rose-100/70'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Administration</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Info Links */}
      <div className="px-3 pt-2 text-xs text-gray-500 space-y-2 border-t border-pink-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAbout}
            className="hover:text-pink-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3" /> About Us
          </button>
          <span>•</span>
          <button
            onClick={onOpenContact}
            className="hover:text-pink-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <PhoneCall className="w-3 h-3" /> Support
          </button>
        </div>
        <p className="text-[11px] text-gray-400">© 2025 Nail Glam Hub. All rights reserved.</p>
      </div>
    </aside>
  );
};
