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
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { User } from '../types';
import { NotificationBadge } from './common/NotificationBadge';
import { useNotifications } from '../context/NotificationContext';

interface SidebarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBooking: () => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  isAdminMode: boolean;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
  // Client notifications
  bookingsCount?: number;
  activeBookingsCount?: number;
  totalBookingsCount?: number;
  ordersCount?: number;
  activeOrdersCount?: number;
  totalOrdersCount?: number;
  favoritesCount?: number;
  // Salon Owner notifications
  ownerSalonsCount?: number;
  ownerPendingSalonsCount?: number;
  ownerAppointmentsCount?: number;
  ownerPendingAppointmentsCount?: number;
  ownerActiveAppointmentsCount?: number;
  ownerTotalAppointmentsCount?: number;
  ownerServicesCount?: number;
  ownerStaffCount?: number;
  ownerInventoryCount?: number;
  ownerPendingOrdersCount?: number;
  ownerReviewsCount?: number;
  // Admin notifications
  adminPendingSalonsCount?: number;
  adminTotalSalonsCount?: number;
  adminTotalUsersCount?: number;
  adminContentCount?: number;
  adminActiveAnnouncementsCount?: number;
  adminTotalAppointmentsCount?: number;
  onAdminSecretTrigger?: () => void;
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
  onLogout,
  onAdminSecretTrigger,
  bookingsCount = 0,
  activeBookingsCount = 0,
  totalBookingsCount = 0,
  ordersCount = 0,
  activeOrdersCount = 0,
  totalOrdersCount = 0,
  favoritesCount = 0,
  ownerSalonsCount = 0,
  ownerPendingSalonsCount = 0,
  ownerAppointmentsCount = 0,
  ownerPendingAppointmentsCount = 0,
  ownerActiveAppointmentsCount = 0,
  ownerTotalAppointmentsCount = 0,
  ownerServicesCount = 0,
  ownerStaffCount = 0,
  ownerInventoryCount = 0,
  ownerPendingOrdersCount = 0,
  ownerReviewsCount = 0,
  adminPendingSalonsCount = 0,
  adminTotalSalonsCount = 0,
  adminTotalUsersCount = 0,
  adminContentCount = 0,
  adminActiveAnnouncementsCount = 0,
  adminTotalAppointmentsCount = 0,
}) => {
  // Reactive browser URL hash tracking for accurate path detection
  const [currentHash, setCurrentHash] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    }
    return '';
  });

  React.useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
        setCurrentHash(hash);
      }
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Centralized navigation handler that keeps state and URL in lockstep
  const handleNavigation = (tab: string) => {
    if (typeof window !== 'undefined') {
      const currentTargetHash = `#${tab}`;
      if (window.location.hash !== currentTargetHash) {
        window.history.replaceState(null, '', currentTargetHash);
        setCurrentHash(tab.toLowerCase().trim());
      }
    }
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };

  // Robust path detection that accurately matches active tab, URL context, and subviews
  const isPathActive = (targetKey: string): boolean => {
    const normActive = (activeTab || '').toLowerCase().trim();
    const normTarget = (targetKey || '').toLowerCase().trim();
    const normHash = (currentHash || '').toLowerCase().trim();

    // 1. Direct match on activeTab or URL hash
    if (normActive === normTarget || (normHash && normHash === normTarget)) {
      return true;
    }

    // 2. Explore / Salons Directory synonyms & sub-views
    if (normTarget === 'explore' || normTarget === 'salons') {
      return normActive === 'explore' || normActive === 'salons' || normActive.startsWith('salon') || normHash === 'explore' || normHash === 'salons';
    }

    // 3. Products / Boutique synonyms & sub-views
    if (normTarget === 'products') {
      return normActive === 'products' || normActive.startsWith('product') || normHash === 'products';
    }

    // 4. Customer Bookings / Dashboard synonyms & sub-views
    if (normTarget === 'customer-dashboard') {
      return (
        normActive === 'customer-dashboard' ||
        normActive === 'bookings' ||
        normActive.startsWith('customer-appointment') ||
        normHash === 'customer-dashboard' ||
        normHash === 'bookings'
      );
    }

    // 5. Customer Orders synonyms & sub-views
    if (normTarget === 'customer-orders') {
      return (
        normActive === 'customer-orders' ||
        normActive === 'orders' ||
        normActive.startsWith('order') ||
        normHash === 'customer-orders' ||
        normHash === 'orders'
      );
    }

    // 6. Favorites
    if (normTarget === 'favorites') {
      return normActive === 'favorites' || normHash === 'favorites';
    }

    // 7. Profile
    if (normTarget === 'profile') {
      return normActive === 'profile' || normActive === 'user-profile' || normHash === 'profile';
    }

    // 8. Salon Owner Overview / Dashboard synonyms
    if (normTarget === 'owner-dashboard') {
      return (
        normActive === 'owner-dashboard' ||
        normActive === 'owner-overview' ||
        normActive === 'owner-reports' ||
        normHash === 'owner-dashboard' ||
        normHash === 'owner'
      );
    }

    // 9. Admin Overview / Dashboard synonyms
    if (normTarget === 'admin-dashboard') {
      return (
        normActive === 'admin-dashboard' ||
        normActive === 'admin-overview' ||
        normActive === 'admin' ||
        normHash === 'admin' ||
        normHash === 'admin-dashboard'
      );
    }

    return false;
  };

  const tapCountRef = React.useRef(0);
  const lastTapTimeRef = React.useRef(0);

  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 1500) {
      tapCountRef.current += 1;
      if (tapCountRef.current >= 5) {
        tapCountRef.current = 0;
        if (onAdminSecretTrigger) {
          onAdminSecretTrigger();
        }
      }
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;
  };

  const isOwner = currentUser?.user_type === 'salon_owner';
  const isAdmin = currentUser?.user_type === 'admin';
  const { categoryUnread, unreadBookingsCount, unreadOrdersCount, unreadAlertsCount } = useNotifications();

  // ----------------------------------------------------
  // SUPER ADMIN SIDEBAR VIEW (Exclusive Admin Tools Only)
  // ----------------------------------------------------
  if (isAdmin) {
    return (
      <aside className="w-60 xl:w-64 2xl:w-72 shrink-0 hidden lg:block sticky top-[84px] self-start max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain pr-2 space-y-3.5 z-30">
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
            {/* Overview & KPIs */}
            <button
              id="sidebar-admin-overview-btn"
              onClick={() => handleNavigation('admin-dashboard')}
              aria-current={isPathActive('admin-dashboard') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                isPathActive('admin-dashboard')
                  ? 'bg-rose-900 text-white font-bold shadow-xs ring-1 ring-rose-800'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
              title={
                adminTotalAppointmentsCount > 0
                  ? `${adminTotalAppointmentsCount} platform bookings • Comprehensive system analytics`
                  : 'Platform Overview & KPIs'
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <TrendingUp className={`w-4 h-4 shrink-0 ${isPathActive('admin-dashboard') ? 'text-white' : 'text-rose-700'}`} />
                </div>
                <span className="truncate">Overview & KPIs</span>
              </div>
              {adminTotalAppointmentsCount > 0 && (
                <NotificationBadge
                  id="sidebar-admin-overview-badge"
                  count={adminTotalAppointmentsCount}
                  variant={isPathActive('admin-dashboard') ? 'white' : 'rose'}
                  size="sm"
                />
              )}
            </button>

            {/* Salon Approvals with pending alert notification & numbering */}
            {(() => {
              const hasPending = adminPendingSalonsCount > 0;
              const countToShow = hasPending ? adminPendingSalonsCount : adminTotalSalonsCount;
              const isActive = isPathActive('admin-salons');
              return (
                <button
                  id="sidebar-admin-salons-btn"
                  onClick={() => handleNavigation('admin-salons')}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                    isActive
                      ? 'bg-rose-900 text-white font-bold shadow-xs ring-1 ring-rose-800'
                      : 'text-rose-950 hover:bg-rose-50'
                  }`}
                  title={
                    hasPending
                      ? `${adminPendingSalonsCount} salon branch${adminPendingSalonsCount !== 1 ? 'es' : ''} awaiting approval • ${adminTotalSalonsCount} total`
                      : `${adminTotalSalonsCount} registered salon branches`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <Store className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-rose-700'}`} />
                    </div>
                    <span className="truncate">Salon Approvals</span>
                  </div>
                  {countToShow > 0 && (
                    <NotificationBadge
                      id="sidebar-admin-salons-badge"
                      count={hasPending ? `${countToShow} pending` : countToShow}
                      variant={isActive ? 'white' : 'rose'}
                      priority={hasPending ? 'urgent' : 'normal'}
                      isUnread={hasPending && unreadAlertsCount > 0}
                      showPing={true}
                      size="sm"
                    />
                  )}
                </button>
              );
            })()}

            {/* User Accounts */}
            <button
              id="sidebar-admin-users-btn"
              onClick={() => handleNavigation('admin-users')}
              aria-current={isPathActive('admin-users') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                isPathActive('admin-users')
                  ? 'bg-rose-900 text-white font-bold shadow-xs ring-1 ring-rose-800'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
              title={`${adminTotalUsersCount} registered user accounts across clients, owners & admins`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <Users className={`w-4 h-4 shrink-0 ${isPathActive('admin-users') ? 'text-white' : 'text-rose-700'}`} />
                </div>
                <span className="truncate">User Accounts</span>
              </div>
              {adminTotalUsersCount > 0 && (
                <NotificationBadge
                  id="sidebar-admin-users-badge"
                  count={adminTotalUsersCount}
                  variant={isPathActive('admin-users') ? 'white' : 'rose'}
                  size="sm"
                />
              )}
            </button>

            {/* Content Moderation */}
            <button
              id="sidebar-admin-content-btn"
              onClick={() => handleNavigation('admin-content')}
              aria-current={isPathActive('admin-content') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                isPathActive('admin-content')
                  ? 'bg-rose-900 text-white font-bold shadow-xs ring-1 ring-rose-800'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
              title={`${adminContentCount} community reviews & viral reels`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <SlidersHorizontal className={`w-4 h-4 shrink-0 ${isPathActive('admin-content') ? 'text-white' : 'text-rose-700'}`} />
                </div>
                <span className="truncate">Content Moderation</span>
              </div>
              {adminContentCount > 0 && (
                <NotificationBadge
                  id="sidebar-admin-content-badge"
                  count={adminContentCount}
                  variant={isPathActive('admin-content') ? 'white' : 'rose'}
                  size="sm"
                />
              )}
            </button>

            {/* Site Broadcasts */}
            {(() => {
              const hasActiveBroadcasts = adminActiveAnnouncementsCount > 0;
              const isActive = isPathActive('admin-announcements');
              return (
                <button
                  id="sidebar-admin-announcements-btn"
                  onClick={() => handleNavigation('admin-announcements')}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                    isActive
                      ? 'bg-rose-900 text-white font-bold shadow-xs ring-1 ring-rose-800'
                      : 'text-rose-950 hover:bg-rose-50'
                  }`}
                  title={`${adminActiveAnnouncementsCount} active broadcast banner${adminActiveAnnouncementsCount !== 1 ? 's' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <Radio className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-rose-700'}`} />
                    </div>
                    <span className="truncate">Site Broadcasts</span>
                  </div>
                  {adminActiveAnnouncementsCount > 0 && (
                    <NotificationBadge
                      id="sidebar-admin-announcements-badge"
                      count={adminActiveAnnouncementsCount}
                      variant={isActive ? 'white' : 'rose'}
                      priority="normal"
                      isUnread={hasActiveBroadcasts && unreadAlertsCount > 0}
                      showPing={true}
                      size="sm"
                    />
                  )}
                </button>
              );
            })()}

            {/* My Account Profile */}
            <button
              id="sidebar-admin-profile-btn"
              onClick={() => handleNavigation('profile')}
              aria-current={isPathActive('profile') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                isPathActive('profile')
                  ? 'bg-rose-900 text-white font-bold shadow-xs ring-1 ring-rose-800'
                  : 'text-rose-950 hover:bg-rose-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <UserIcon className={`w-4 h-4 shrink-0 ${isPathActive('profile') ? 'text-white' : 'text-rose-700'}`} />
                </div>
                <span className="truncate">My Account Profile</span>
              </div>
              <NotificationBadge
                id="sidebar-admin-profile-badge"
                label="ADMIN"
                variant={isPathActive('profile') ? 'white' : 'rose'}
                size="sm"
              />
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
              onClick={() => handleNavigation('admin-announcements')}
              aria-current={isPathActive('admin-announcements') ? 'page' : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isPathActive('admin-announcements')
                  ? 'bg-rose-900 text-white'
                  : 'text-rose-900 bg-white hover:bg-rose-100/70 border border-rose-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-600" />
              <span>+ Push Live Banner</span>
            </button>
          </div>
        </div>

        {/* Live Platform Exploration */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-pink-100 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 px-3 py-1.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-pink-600" />
            Explore Platform
          </p>
          <div className="space-y-1 mt-1">
            <button
              id="sidebar-admin-explore-salons-btn"
              onClick={() => handleNavigation('salons')}
              aria-current={isPathActive('salons') ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isPathActive('salons')
                  ? 'bg-pink-100 text-pink-900 font-bold'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              <Store className="w-4 h-4 text-pink-600" />
              <span>Browse Salons</span>
            </button>
            <button
              id="sidebar-admin-explore-products-btn"
              onClick={() => handleNavigation('products')}
              aria-current={isPathActive('products') ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isPathActive('products')
                  ? 'bg-pink-100 text-pink-900 font-bold'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              <Package className="w-4 h-4 text-pink-600" />
              <span>Marketplace Products</span>
            </button>
            <button
              id="sidebar-admin-explore-map-btn"
              onClick={() => handleNavigation('map')}
              aria-current={isPathActive('map') ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isPathActive('map')
                  ? 'bg-pink-100 text-pink-900 font-bold'
                  : 'text-gray-700 hover:bg-pink-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-pink-600" />
              <span>Interactive Salon Map</span>
            </button>
          </div>
        </div>

        {/* Admin Sign Out Button */}
        {onLogout && (
          <div className="pt-1">
            <button
              id="sidebar-admin-signout-btn"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Master Console</span>
            </button>
          </div>
        )}

        {/* Admin Support & Compliance Footer */}
        <div className="px-3 pt-2 text-xs text-gray-500 space-y-2 border-t border-rose-100">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <Lock className="w-3 h-3 text-rose-600" />
            <span>Strict RBAC Security Enforcement</span>
          </div>
          <p className="text-[11px] text-gray-400">© 2026 Nail Glam Hub Security Guard.</p>
        </div>
      </aside>
    );
  }

  // ----------------------------------------------------
  // SALON OWNER SIDEBAR VIEW
  // ----------------------------------------------------
  if (isOwner) {
    return (
      <aside className="w-60 xl:w-64 2xl:w-72 shrink-0 hidden lg:block sticky top-[84px] self-start max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain pr-2 space-y-3.5 z-30">
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
            {/* Branch Overview */}
            <button
              id="sidebar-owner-branches-btn"
              onClick={() => handleNavigation('owner-branches')}
              aria-current={isPathActive('owner-branches') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isPathActive('owner-branches')
                  ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
              title={`${ownerSalonsCount} branch${ownerSalonsCount !== 1 ? 'es' : ''}${ownerPendingSalonsCount > 0 ? ` • ${ownerPendingSalonsCount} pending approval` : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <Store className={`w-4 h-4 shrink-0 ${isPathActive('owner-branches') ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <span className="truncate">Branch Overview</span>
              </div>
              {ownerSalonsCount > 0 && (
                <NotificationBadge
                  id="sidebar-owner-branches-badge"
                  count={ownerSalonsCount}
                  variant={isPathActive('owner-branches') ? 'white' : 'amber'}
                  priority={ownerPendingSalonsCount > 0 ? 'urgent' : 'normal'}
                  isUnread={ownerPendingSalonsCount > 0 && categoryUnread.alerts}
                  showPing={true}
                  size="sm"
                />
              )}
            </button>

            {/* Store Reports & CRM */}
            <button
              id="sidebar-owner-overview-btn"
              onClick={() => handleNavigation('owner-dashboard')}
              aria-current={isPathActive('owner-dashboard') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isPathActive('owner-dashboard')
                  ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
              title={`${ownerReviewsCount} client review${ownerReviewsCount !== 1 ? 's' : ''} & store analytics`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <BarChart3 className={`w-4 h-4 shrink-0 ${isPathActive('owner-dashboard') ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <span className="truncate">Store Reports & CRM</span>
              </div>
              {ownerReviewsCount > 0 && (
                <NotificationBadge
                  id="sidebar-owner-crm-badge"
                  count={ownerReviewsCount}
                  variant={isPathActive('owner-dashboard') ? 'white' : 'purple'}
                  size="sm"
                />
              )}
            </button>

            {/* Bookings & Schedule with pulsing pending notification */}
            {(() => {
              const hasPendingAppts = ownerPendingAppointmentsCount > 0;
              const countToShow = hasPendingAppts
                ? ownerPendingAppointmentsCount
                : ownerActiveAppointmentsCount || ownerAppointmentsCount;
              const isActive = isPathActive('owner-appointments');
              return (
                <button
                  id="sidebar-owner-appointments-btn"
                  onClick={() => handleNavigation('owner-appointments')}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                    isActive
                      ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                      : 'text-purple-950 hover:bg-purple-50'
                  }`}
                  title={
                    countToShow > 0
                      ? `${ownerPendingAppointmentsCount} pending approval • ${ownerActiveAppointmentsCount} scheduled bookings`
                      : 'Bookings & Schedule'
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    </div>
                    <span className="truncate">Bookings & Schedule</span>
                  </div>
                  {countToShow > 0 && (
                    <NotificationBadge
                      id="sidebar-owner-appointments-badge"
                      count={hasPendingAppts ? `${countToShow} new` : countToShow}
                      variant={isActive ? 'white' : 'purple'}
                      priority={hasPendingAppts ? 'urgent' : 'normal'}
                      isUnread={hasPendingAppts && categoryUnread.bookings}
                      showPing={true}
                      size="sm"
                    />
                  )}
                </button>
              );
            })()}

            {/* Services & Treatments */}
            <button
              id="sidebar-owner-services-btn"
              onClick={() => handleNavigation('owner-services')}
              aria-current={isPathActive('owner-services') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isPathActive('owner-services')
                  ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
              title={`${ownerServicesCount} specialty nail service${ownerServicesCount !== 1 ? 's' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <Scissors className={`w-4 h-4 shrink-0 ${isPathActive('owner-services') ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <span className="truncate">Services &amp; Treatments</span>
              </div>
              {ownerServicesCount > 0 && (
                <NotificationBadge
                  id="sidebar-owner-services-badge"
                  count={ownerServicesCount}
                  variant={isPathActive('owner-services') ? 'white' : 'purple'}
                  size="sm"
                />
              )}
            </button>

            {/* Staff & Artists Roster */}
            <button
              id="sidebar-owner-staff-btn"
              onClick={() => handleNavigation('owner-staff')}
              aria-current={isPathActive('owner-staff') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isPathActive('owner-staff')
                  ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
              title={`${ownerStaffCount} nail artist${ownerStaffCount !== 1 ? 's' : ''} & technicians`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <Users className={`w-4 h-4 shrink-0 ${isPathActive('owner-staff') ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <span className="truncate">Staff & Artists Roster</span>
              </div>
              {ownerStaffCount > 0 && (
                <NotificationBadge
                  id="sidebar-owner-staff-badge"
                  count={ownerStaffCount}
                  variant={isPathActive('owner-staff') ? 'white' : 'purple'}
                  size="sm"
                />
              )}
            </button>

            {/* Products & Stock */}
            {(() => {
              const hasPendingOrders = ownerPendingOrdersCount > 0;
              const countToShow = hasPendingOrders
                ? ownerPendingOrdersCount
                : ownerInventoryCount;
              const isActive = isPathActive('owner-inventory');
              return (
                <button
                  id="sidebar-owner-inventory-btn"
                  onClick={() => handleNavigation('owner-inventory')}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                    isActive
                      ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                      : 'text-purple-950 hover:bg-purple-50'
                  }`}
                  title={
                    hasPendingOrders
                      ? `${ownerPendingOrdersCount} client pickup reservation${ownerPendingOrdersCount !== 1 ? 's' : ''} awaiting fulfillment • ${ownerInventoryCount} products in catalog`
                      : `${ownerInventoryCount} retail product${ownerInventoryCount !== 1 ? 's' : ''}`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <Package className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    </div>
                    <span className="truncate">Products & Stock</span>
                  </div>
                  {countToShow > 0 && (
                    <NotificationBadge
                      id="sidebar-owner-inventory-badge"
                      count={hasPendingOrders ? `${countToShow} orders` : countToShow}
                      variant={isActive ? 'white' : 'emerald'}
                      priority={hasPendingOrders ? 'urgent' : 'normal'}
                      isUnread={hasPendingOrders && categoryUnread.cart}
                      showPing={true}
                      size="sm"
                    />
                  )}
                </button>
              );
            })()}

            {/* Store Location & Map */}
            <button
              id="sidebar-owner-location-btn"
              onClick={() => handleNavigation('owner-location')}
              aria-current={isPathActive('owner-location') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isPathActive('owner-location')
                  ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
              title="Store Location & GPS Map"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <MapPin className={`w-4 h-4 shrink-0 ${isPathActive('owner-location') ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <span className="truncate">Store Location & Map</span>
              </div>
              {ownerSalonsCount > 0 && (
                <NotificationBadge
                  id="sidebar-owner-location-badge"
                  label="GPS"
                  variant={isPathActive('owner-location') ? 'white' : 'purple'}
                  size="sm"
                />
              )}
            </button>

            {/* Salon Profile & Hours */}
            <button
              id="sidebar-owner-settings-btn"
              onClick={() => handleNavigation('owner-settings')}
              aria-current={isPathActive('owner-settings') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isPathActive('owner-settings')
                  ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
              title="Salon Profile & Operating Hours"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <Clock className={`w-4 h-4 shrink-0 ${isPathActive('owner-settings') ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <span className="truncate">Salon Profile & Hours</span>
              </div>
              <NotificationBadge
                id="sidebar-owner-hours-badge"
                label="7D"
                variant={isPathActive('owner-settings') ? 'white' : 'emerald'}
                size="sm"
              />
            </button>

            {/* My Account Profile */}
            <button
              id="sidebar-owner-profile-btn"
              onClick={() => handleNavigation('profile')}
              aria-current={isPathActive('profile') ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                isPathActive('profile')
                  ? 'bg-purple-700 text-white font-bold shadow-xs ring-1 ring-purple-600'
                  : 'text-purple-950 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <UserIcon className={`w-4 h-4 shrink-0 ${isPathActive('profile') ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <span className="truncate">My Account Profile</span>
              </div>
              <NotificationBadge
                id="sidebar-owner-profile-badge"
                label="OWNER"
                variant={isPathActive('profile') ? 'white' : 'purple'}
                size="sm"
              />
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
              onClick={() => handleNavigation('owner-branches')}
              aria-current={isPathActive('owner-branches') ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isPathActive('owner-branches')
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
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
          <p className="text-[11px] text-gray-400">© 2026 Nail Glam Hub Partner Network.</p>
        </div>
      </aside>
    );
  }

  // ----------------------------------------------------
  // CLIENT & GUEST SIDEBAR VIEW
  // ----------------------------------------------------
  return (
    <aside className="w-60 xl:w-64 2xl:w-72 shrink-0 hidden lg:block sticky top-[84px] self-start max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain pr-2 space-y-3.5 z-30">
      {/* Primary Discovery Menu */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-pink-100/80 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1.5">
          Discover & Book
        </p>
        <div className="space-y-1 mt-1">
          <button
            id="sidebar-explore-btn"
            onClick={() => handleNavigation('explore')}
            aria-current={isPathActive('explore') ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              isPathActive('explore')
                ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <Compass className={`w-4 h-4 shrink-0 ${isPathActive('explore') ? 'text-pink-700' : 'text-pink-600'}`} />
            <span>Salons Directory</span>
          </button>

          <button
            id="sidebar-map-btn"
            onClick={() => handleNavigation('map')}
            aria-current={isPathActive('map') ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              isPathActive('map')
                ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <MapPin className={`w-4 h-4 shrink-0 ${isPathActive('map') ? 'text-pink-700' : 'text-pink-600'}`} />
            <span>Store Locator Map</span>
          </button>

          <button
            id="sidebar-services-btn"
            onClick={() => handleNavigation('services')}
            aria-current={isPathActive('services') ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              isPathActive('services')
                ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <Sparkles className={`w-4 h-4 shrink-0 ${isPathActive('services') ? 'text-rose-700' : 'text-rose-500'}`} />
            <span>Service Catalog</span>
          </button>

          <button
            id="sidebar-products-btn"
            onClick={() => handleNavigation('products')}
            aria-current={isPathActive('products') ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              isPathActive('products')
                ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <ShoppingBag className={`w-4 h-4 shrink-0 ${isPathActive('products') ? 'text-emerald-700' : 'text-emerald-600'}`} />
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">Products & Care</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                BOUTIQUE
              </span>
            </div>
          </button>

          <button
            id="sidebar-reels-btn"
            onClick={() => handleNavigation('reels')}
            aria-current={isPathActive('reels') ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              isPathActive('reels')
                ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <Flame className={`w-4 h-4 shrink-0 ${isPathActive('reels') ? 'text-amber-600' : 'text-amber-500'}`} />
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate">Viral Nail Reels</span>
              <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">
                HOT
              </span>
            </div>
          </button>

          <button
            id="sidebar-reviews-btn"
            onClick={() => handleNavigation('reviews')}
            aria-current={isPathActive('reviews') ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              isPathActive('reviews')
                ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
                : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
            }`}
          >
            <Heart className={`w-4 h-4 shrink-0 ${isPathActive('reviews') ? 'text-pink-700' : 'text-pink-600'}`} />
            <span>Client Reviews</span>
          </button>
        </div>
      </div>

      {/* Customer Workspace / Auth Links */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-pink-100/80 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1.5">
          {currentUser ? 'My Account' : 'Client Access'}
        </p>
        <div className="space-y-1 mt-1">
          {currentUser ? (
            <>
              {/* My Bookings with notification signal and numbering */}
              {(() => {
                const isActive = isPathActive('customer-dashboard');
                return (
                  <button
                    id="sidebar-appointments-btn"
                    onClick={() => handleNavigation('customer-dashboard')}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                      isActive
                        ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
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
                        <CalendarCheck className={`w-4 h-4 shrink-0 ${isActive ? 'text-pink-700' : 'text-pink-600'}`} />
                      </div>
                      <span className="truncate">My Bookings</span>
                    </div>

                    {bookingsCount > 0 && (
                      <NotificationBadge
                        id="sidebar-bookings-badge"
                        count={bookingsCount}
                        variant={isActive ? 'white' : 'pink'}
                        priority="normal"
                        isUnread={unreadBookingsCount > 0}
                        showPing={true}
                        size="sm"
                      />
                    )}
                  </button>
                );
              })()}

              {/* Reserved Orders with notification signal and numbering */}
              {(() => {
                const isActive = isPathActive('customer-orders');
                return (
                  <button
                    id="sidebar-orders-btn"
                    onClick={() => handleNavigation('customer-orders')}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                      isActive
                        ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
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
                        <ShoppingBag className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-emerald-600'}`} />
                      </div>
                      <span className="truncate">Reserved Orders</span>
                    </div>

                    {ordersCount > 0 && (
                      <NotificationBadge
                        id="sidebar-orders-badge"
                        count={ordersCount}
                        variant={isActive ? 'white' : 'emerald'}
                        priority="normal"
                        isUnread={unreadOrdersCount > 0}
                        showPing={true}
                        size="sm"
                      />
                    )}
                  </button>
                );
              })()}

              <button
                id="sidebar-favorites-btn"
                onClick={() => handleNavigation('favorites')}
                aria-current={isPathActive('favorites') ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  isPathActive('favorites')
                    ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
                    : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
                }`}
                title={favoritesCount > 0 ? `${favoritesCount} saved favorite salon${favoritesCount !== 1 ? 's' : ''}` : 'Favorite Salons'}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex items-center justify-center shrink-0">
                    <Heart className={`w-4 h-4 shrink-0 ${isPathActive('favorites') ? 'text-pink-700' : 'text-pink-600'}`} />
                  </div>
                  <span className="truncate">Favorite Salons</span>
                </div>
                {favoritesCount > 0 && (
                  <NotificationBadge
                    id="sidebar-favorites-badge"
                    count={favoritesCount}
                    variant={isPathActive('favorites') ? 'white' : 'pink'}
                    size="sm"
                  />
                )}
              </button>

              <button
                id="sidebar-profile-btn"
                onClick={() => handleNavigation('profile')}
                aria-current={isPathActive('profile') ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                  isPathActive('profile')
                    ? 'bg-pink-100 text-pink-900 font-bold shadow-xs ring-1 ring-pink-300'
                    : 'text-gray-700 hover:bg-pink-50/70 hover:text-pink-700'
                }`}
              >
                <UserIcon className={`w-4 h-4 shrink-0 ${isPathActive('profile') ? 'text-pink-700' : 'text-pink-600'}`} />
                <span>My Profile</span>
              </button>

              <button
                id="sidebar-book-now-btn"
                onClick={onOpenBooking}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-pink-700 bg-pink-50/80 hover:bg-pink-100 transition-colors cursor-pointer"
              >
                <Scissors className="w-4 h-4 text-pink-600 shrink-0" />
                <span>Book Appointment</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="sidebar-login-customer-btn"
                onClick={() => handleNavigation('login-customer')}
                aria-current={isPathActive('login-customer') ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isPathActive('login-customer')
                    ? 'bg-pink-100 text-pink-900 font-bold shadow-xs'
                    : 'text-pink-700 hover:bg-pink-50'
                }`}
              >
                <Heart className="w-4 h-4 text-pink-600 shrink-0" />
                <span>Client Login</span>
              </button>
              <button
                id="sidebar-register-customer-btn"
                onClick={() => handleNavigation('register-customer')}
                aria-current={isPathActive('register-customer') ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isPathActive('register-customer')
                    ? 'bg-pink-100 text-pink-900 font-bold shadow-xs'
                    : 'text-gray-700 hover:bg-pink-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-pink-600 shrink-0" />
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
              onClick={() => handleNavigation('login-owner')}
              aria-current={isPathActive('login-owner') ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isPathActive('login-owner')
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-800 hover:bg-purple-100/70'
              }`}
            >
              <Store className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Partner Login</span>
            </button>
            <button
              id="sidebar-owner-register-btn"
              onClick={() => handleNavigation('register-owner')}
              aria-current={isPathActive('register-owner') ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isPathActive('register-owner')
                  ? 'bg-purple-700 text-white font-bold shadow-xs'
                  : 'text-purple-900 hover:bg-purple-100/70'
              }`}
            >
              <Scissors className="w-4 h-4 text-purple-600 shrink-0" />
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
              onClick={() => handleNavigation('admin-dashboard')}
              aria-current={isPathActive('admin-dashboard') ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isPathActive('admin-dashboard')
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'text-rose-900 hover:bg-rose-100/70'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
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
        <div
          onClick={handleSecretTap}
          className="cursor-default select-none group inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-500 transition-colors"
          title="Nail Glam Hub Platform"
        >
          <span>© 2026 Nail Glam Hub. All rights reserved.</span>
          <span className="opacity-0 group-hover:opacity-40 transition-opacity text-[10px]">🔒</span>
        </div>
      </div>
    </aside>
  );
};
