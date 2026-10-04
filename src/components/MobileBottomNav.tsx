import React from 'react';
import {
  Compass,
  MapPin,
  Sparkles,
  ShoppingBag,
  Calendar,
  User as UserIcon,
  Store,
  Shield,
  BarChart3,
  Package,
  Layers,
} from 'lucide-react';
import { User } from '../types';
import { NotificationBadge } from './common/NotificationBadge';
import { useNotifications } from '../context/NotificationContext';

interface MobileBottomNavProps {
  currentUser: User | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenBooking: () => void;
  cartItemCount?: number;
  onOpenCart?: (targetProductId?: number) => void;
  bookingsCount?: number;
  ordersCount?: number;
  ownerPendingAppointmentsCount?: number;
  adminPendingSalonsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentUser,
  activeTab,
  onNavigate,
  onOpenAuth,
  cartItemCount = 0,
  onOpenCart,
  bookingsCount = 0,
  ordersCount = 0,
  ownerPendingAppointmentsCount = 0,
  adminPendingSalonsCount = 0,
}) => {
  const isCustomer = currentUser?.user_type === 'customer';
  const isOwner = currentUser?.user_type === 'salon_owner';
  const isAdmin = currentUser?.user_type === 'admin';
  const { categoryUnread, unreadBookingsCount, unreadOrdersCount } = useNotifications();

  // 1. ADMIN BOTTOM NAVIGATION
  if (isAdmin) {
    return (
      <nav
        aria-label="Mobile Admin Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-lg border-t border-rose-900/40 shadow-2xl px-2 py-1.5 safe-bottom"
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin-dashboard'
                ? 'text-rose-400 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate">Overview</span>
          </button>

          <button
            onClick={() => onNavigate('admin-salons')}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin-salons'
                ? 'text-rose-400 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Store className="w-5 h-5" />
            {adminPendingSalonsCount > 0 && (
              <NotificationBadge
                count={adminPendingSalonsCount}
                variant="amber"
                priority={adminPendingSalonsCount > 0 ? 'urgent' : 'normal'}
                isUnread={adminPendingSalonsCount > 0 && categoryUnread.alerts}
                showPing={false}
                size="badge-overlay"
                className="absolute top-1 right-2.5"
              />
            )}
            <span className="text-[10px] mt-0.5 truncate">Salons</span>
          </button>

          <button
            onClick={() => onNavigate('admin-users')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin-users'
                ? 'text-rose-400 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate">Users</span>
          </button>

          <button
            onClick={() => onNavigate('admin-content')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin-content'
                ? 'text-rose-400 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate">Content</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-rose-400 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate">Account</span>
          </button>
        </div>
      </nav>
    );
  }

  // 2. SALON OWNER BOTTOM NAVIGATION
  if (isOwner) {
    return (
      <nav
        aria-label="Mobile Partner Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-purple-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 safe-bottom"
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => onNavigate('owner-dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'owner-dashboard'
                ? 'text-purple-700 font-bold scale-105'
                : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate">Reports</span>
          </button>

          <button
            onClick={() => onNavigate('owner-appointments')}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'owner-appointments'
                ? 'text-purple-700 font-bold scale-105'
                : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            {ownerPendingAppointmentsCount > 0 && (
              <NotificationBadge
                count={ownerPendingAppointmentsCount}
                variant="amber"
                priority={ownerPendingAppointmentsCount > 0 ? 'urgent' : 'normal'}
                isUnread={ownerPendingAppointmentsCount > 0 && categoryUnread.bookings}
                showPing={false}
                size="badge-overlay"
                className="absolute top-1 right-2.5"
              />
            )}
            <span className="text-[10px] mt-0.5 truncate">Bookings</span>
          </button>

          <button
            onClick={() => onNavigate('owner-inventory')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'owner-inventory'
                ? 'text-purple-700 font-bold scale-105'
                : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate">Stock</span>
          </button>

          <button
            onClick={() => onNavigate('owner-branches')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'owner-branches'
                ? 'text-purple-700 font-bold scale-105'
                : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate">Branches</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-purple-700 font-bold scale-105'
                : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate">Profile</span>
          </button>
        </div>
      </nav>
    );
  }

  // 3. CUSTOMER & GUEST MOBILE BOTTOM NAVIGATION
  return (
    <nav
      aria-label="Mobile Customer Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-pink-100 shadow-[0_-4px_25px_rgba(236,72,153,0.08)] px-2 py-1.5 safe-bottom"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {/* Explore / Home */}
        <button
          id="mobile-bottom-nav-explore"
          onClick={() => onNavigate(currentUser ? 'explore' : 'landing')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'explore' || activeTab === 'landing'
              ? 'text-pink-600 font-bold scale-105'
              : 'text-gray-500 hover:text-pink-600'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate font-medium">Explore</span>
        </button>

        {/* Map */}
        <button
          id="mobile-bottom-nav-map"
          onClick={() => onNavigate('map')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'text-pink-600 font-bold scale-105'
              : 'text-gray-500 hover:text-pink-600'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate font-medium">Map</span>
        </button>

        {/* Services Menu */}
        <button
          id="mobile-bottom-nav-services"
          onClick={() => onNavigate('services')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'services'
              ? 'text-pink-600 font-bold scale-105'
              : 'text-gray-500 hover:text-pink-600'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate font-medium">Services</span>
        </button>

        {/* Shop / Products (or In-Store Cart) */}
        <button
          id="mobile-bottom-nav-products"
          onClick={() => {
            if (cartItemCount > 0 && onOpenCart) {
              onOpenCart();
            } else {
              onNavigate('products');
            }
          }}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'text-pink-600 font-bold scale-105'
              : 'text-gray-500 hover:text-pink-600'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {cartItemCount > 0 && (
            <NotificationBadge
              count={cartItemCount}
              variant="pink"
              priority="normal"
              isUnread={categoryUnread.cart}
              showPing={false}
              size="badge-overlay"
              className="absolute top-1 right-2.5"
            />
          )}
          <span className="text-[10px] mt-0.5 truncate font-medium">
            {cartItemCount > 0 ? 'Cart' : 'Shop'}
          </span>
        </button>

        {/* Bookings or Account */}
        {isCustomer ? (
          <button
            id="mobile-bottom-nav-dashboard"
            onClick={() => onNavigate('customer-dashboard')}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'customer-dashboard' || activeTab === 'profile'
                ? 'text-pink-600 font-bold scale-105'
                : 'text-gray-500 hover:text-pink-600'
            }`}
          >
            <Calendar className="w-5 h-5" />
            {bookingsCount + ordersCount > 0 && (
              <NotificationBadge
                count={bookingsCount + ordersCount}
                variant="pink"
                priority="normal"
                isUnread={unreadBookingsCount + unreadOrdersCount > 0}
                showPing={false}
                size="badge-overlay"
                className="absolute top-1 right-2.5"
              />
            )}
            <span className="text-[10px] mt-0.5 truncate font-medium">Bookings</span>
          </button>
        ) : (
          <button
            id="mobile-bottom-nav-login"
            onClick={onOpenAuth}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab.startsWith('login')
                ? 'text-pink-600 font-bold scale-105'
                : 'text-gray-500 hover:text-pink-600'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 truncate font-medium">Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
};
