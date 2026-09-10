import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Scissors,
  Camera,
  Save,
  Edit2,
  X,
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  Settings,
  LogOut,
  AlertCircle,
  ArrowLeft,
  Heart,
  ShoppingBag,
  Sparkles,
  Compass,
  ExternalLink,
  ChevronRight,
  Store,
} from 'lucide-react';
import { User as UserType, Salon, Appointment, ProductOrder } from '../types';
import { fetchAppointments, updateUser } from '../lib/api';

interface UserProfileProps {
  currentUser: UserType;
  salons?: Salon[];
  customerAppointments?: Appointment[];
  customerOrders?: ProductOrder[];
  favorites?: number[];
  onToggleFavorite?: (salonId: number) => void;
  onUpdateUser: (userData: Partial<UserType>) => void;
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenBooking?: (salon?: Salon) => void;
  onSelectSalon?: (salon: Salon) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  salons = [],
  customerAppointments = [],
  customerOrders = [],
  favorites = [],
  onToggleFavorite,
  onUpdateUser,
  onLogout,
  onNavigateToDashboard,
  onNavigateTab,
  onOpenBooking,
  onSelectSalon,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'appointments' | 'favorites' | 'orders'>('profile');
  const [formData, setFormData] = useState({
    fullname: currentUser.fullname,
    email: currentUser.email,
    phone: currentUser.phone || '',
    avatar: currentUser.avatar || '',
  });
  const [fetchedAppointments, setFetchedAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Sync state if currentUser changes
  useEffect(() => {
    setFormData({
      fullname: currentUser.fullname,
      email: currentUser.email,
      phone: currentUser.phone || '',
      avatar: currentUser.avatar || '',
    });
  }, [currentUser]);

  useEffect(() => {
    if (currentUser.user_type === 'customer' && (!customerAppointments || customerAppointments.length === 0)) {
      loadAppointments();
    }
  }, [currentUser.id, currentUser.user_type, customerAppointments.length]);

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const list = await fetchAppointments({ customer_id: currentUser.id });
      setFetchedAppointments(list);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Combine live customerAppointments with fetched appointments fallback
  const appointmentsToDisplay =
    customerAppointments && customerAppointments.length > 0
      ? customerAppointments
      : fetchedAppointments;

  const favoriteSalons = salons.filter((s) => favorites.includes(s.id));

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const updatedUser = await updateUser(currentUser.id, formData);
      onUpdateUser(updatedUser);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setFeedback({ type: 'error', message: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullname: currentUser.fullname,
      email: currentUser.email,
      phone: currentUser.phone || '',
      avatar: currentUser.avatar || '',
    });
    setIsEditing(false);
  };

  const getUserRoleBadge = () => {
    const roleColors = {
      customer: 'bg-pink-100 text-pink-700',
      salon_owner: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
    };
    const roleLabels = {
      customer: 'Client Account',
      salon_owner: 'Salon Owner',
      admin: 'Administrator',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[currentUser.user_type]}`}>
        {roleLabels[currentUser.user_type]}
      </span>
    );
  };

  const getUserSalon = () => {
    if (currentUser.user_type === 'salon_owner') {
      return salons.find((s) => s.owner_id === currentUser.id);
    }
    return null;
  };

  const userSalon = getUserSalon();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumbs & Back Bar */}
      <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button
            onClick={() => onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard()}
            className="text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Salons</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-800">
            {currentUser.user_type === 'customer' ? 'Client Portal' : 'My Profile'}
          </span>
          <span>/</span>
          <span className="text-gray-400">Settings</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="back-to-explore-btn"
            onClick={() => onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard()}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explore Salons</span>
          </button>
          {currentUser.user_type === 'customer' && (
            <button
              onClick={onNavigateToDashboard}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Full Bookings Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Reassurance Notification for Customer */}
      {currentUser.user_type === 'customer' && (
        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 rounded-2xl p-4 border border-pink-100 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-600/10 text-pink-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Your Client Data Is Active & Connected</p>
              <p className="text-[11px] text-gray-500">
                You have {appointmentsToDisplay.length} appointment{appointmentsToDisplay.length !== 1 ? 's' : ''} on record and {favorites.length} saved salon{favorites.length !== 1 ? 's' : ''}. Switch tabs below or click "Back to Explore Salons" at any time.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard()}
            className="hidden md:flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 shrink-0 cursor-pointer"
          >
            <span>Browse Salons</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-900 via-rose-900 to-purple-950 h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-3xl font-serif font-bold">
                    {currentUser.fullname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                  <Camera className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-pink-300 focus:border-pink-500 outline-none max-w-sm"
                  />
                ) : (
                  <h1 className="text-2xl font-serif font-bold text-gray-900 truncate">{currentUser.fullname}</h1>
                )}
                {getUserRoleBadge()}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(currentUser.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
                {currentUser.status === 'active' && (
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Client</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{currentUser.email}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-end">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={onNavigateToDashboard}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Quick Stats Strip */}
      {currentUser.user_type === 'customer' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveSubTab('appointments')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeSubTab === 'appointments'
                ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-400/20'
                : 'bg-white border-pink-100 hover:border-pink-200 shadow-xs'
            }`}
          >
            <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-pink-500" /> Bookings
            </p>
            <p className="text-xl font-bold font-serif text-pink-900 mt-1">{appointmentsToDisplay.length}</p>
            <p className="text-[10px] text-pink-600 font-semibold mt-0.5">
              {appointmentsToDisplay.filter((a) => a.status === 'confirmed' || a.status === 'pending').length} Active
            </p>
          </button>

          <button
            onClick={() => setActiveSubTab('favorites')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeSubTab === 'favorites'
                ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-400/20'
                : 'bg-white border-pink-100 hover:border-pink-200 shadow-xs'
            }`}
          >
            <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-pink-500" /> Saved Salons
            </p>
            <p className="text-xl font-bold font-serif text-pink-900 mt-1">{favorites.length}</p>
            <p className="text-[10px] text-pink-600 font-semibold mt-0.5">Bookmarks</p>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-400/20'
                : 'bg-white border-pink-100 hover:border-pink-200 shadow-xs'
            }`}
          >
            <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Boutique Pickups
            </p>
            <p className="text-xl font-bold font-serif text-emerald-900 mt-1">{customerOrders.length}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Reserved</p>
          </button>

          <button
            onClick={() => setActiveSubTab('profile')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-400/20'
                : 'bg-white border-pink-100 hover:border-pink-200 shadow-xs'
            }`}
          >
            <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-600" /> Account Status
            </p>
            <p className="text-xl font-bold font-serif text-purple-900 mt-1 capitalize">{currentUser.status || 'Active'}</p>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Verified Client</p>
          </button>
        </div>
      )}

      {/* Customer Navigation Sub-Tabs */}
      {currentUser.user_type === 'customer' && (
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'profile'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Account Details & Contact
          </button>
          <button
            onClick={() => setActiveSubTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'appointments'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>My Bookings & Schedule</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {appointmentsToDisplay.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('favorites')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'favorites'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>Favorite Salons</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {favorites.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'orders'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>Product Pickups</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {customerOrders.length}
            </span>
          </button>
        </div>
      )}

      {/* SUB-TAB 1: PROFILE & PERSONAL DETAILS */}
      {(activeSubTab === 'profile' || currentUser.user_type !== 'customer') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-500" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{currentUser.email}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912 345 6789"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{currentUser.phone || 'No phone provided'}</span>
                  </div>
                )}
              </div>
              {isEditing && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Profile Image URL</label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-500" />
                Account Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Account Type</span>
                  {getUserRoleBadge()}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className={`text-xs font-semibold ${currentUser.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {currentUser.status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Member Since</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {new Date(currentUser.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={onLogout}
                className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Nail Glam Hub</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MY APPOINTMENTS & SCHEDULE */}
      {currentUser.user_type === 'customer' && activeSubTab === 'appointments' && (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-600" />
                <span>My Appointments Schedule ({appointmentsToDisplay.length})</span>
              </h3>
              <p className="text-xs text-gray-500">
                All appointments synced in real-time with your partner salons.
              </p>
            </div>
            <button
              onClick={() => onOpenBooking ? onOpenBooking() : (onNavigateTab && onNavigateTab('explore'))}
              className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          </div>

          {loadingAppointments ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading your schedule...</p>
            </div>
          ) : appointmentsToDisplay.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl p-6">
              <Calendar className="w-8 h-8 text-pink-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No appointments scheduled</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Explore our curated catalog of verified salons in Metro Manila and book your first nail session.
              </p>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard()}
                className="mt-4 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Salons Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointmentsToDisplay.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-pink-200 bg-gray-50/60 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        apt.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : apt.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : apt.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status}
                      </span>
                      <span className="text-xs font-bold text-pink-700">
                        ₱{Number(apt.total_price || apt.service_price || 0).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900">{apt.service_name || 'Nail Service'}</h4>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                      <span className="font-semibold text-gray-800">{apt.salon_name || 'Partner Salon'}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{apt.appointment_time}</span>
                      </div>
                    </div>
                    {apt.technician_name && (
                      <p className="text-[11px] text-gray-500">
                        Stylist: <span className="font-medium text-gray-700">{apt.technician_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const s = salons.find((item) => item.id === apt.salon_id);
                        if (s && onSelectSalon) onSelectSalon(s);
                        else if (onNavigateTab) onNavigateTab('explore');
                      }}
                      className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Salon Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        const s = salons.find((item) => item.id === apt.salon_id);
                        if (onOpenBooking) onOpenBooking(s);
                      }}
                      className="px-3 py-1 rounded-lg bg-pink-100 text-pink-800 hover:bg-pink-200 text-xs font-semibold cursor-pointer"
                    >
                      Book Again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: FAVORITE SALONS */}
      {currentUser.user_type === 'customer' && activeSubTab === 'favorites' && (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
          <div>
            <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span>Favorite Salons ({favoriteSalons.length})</span>
            </h3>
            <p className="text-xs text-gray-500">Your bookmarked nail care spaces and preferred studios.</p>
          </div>

          {favoriteSalons.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl p-6">
              <Heart className="w-8 h-8 text-pink-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No favorite salons saved yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Tap the heart icon on any salon in the Explore catalog to add them to your favorites.
              </p>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard()}
                className="mt-4 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Salons</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoriteSalons.map((salon) => (
                <div
                  key={salon.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-pink-200 bg-gray-50/60 flex items-start gap-3.5 shadow-2xs"
                >
                  <img
                    src={salon.banner || salon.logo || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'}
                    alt={salon.salon_name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{salon.salon_name}</h4>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{salon.city || salon.address}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{salon.avg_rating || '5.0'}</span>
                      <span className="text-gray-400 font-normal">({salon.review_count || 12} reviews)</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => {
                          if (onSelectSalon) onSelectSalon(salon);
                          else if (onNavigateTab) onNavigateTab('explore');
                        }}
                        className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          if (onOpenBooking) onOpenBooking(salon);
                        }}
                        className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                      >
                        Book
                      </button>
                      {onToggleFavorite && (
                        <button
                          onClick={() => onToggleFavorite(salon.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 ml-auto cursor-pointer"
                          title="Remove from favorites"
                        >
                          <Heart className="w-4 h-4 fill-rose-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: RESERVED PRODUCT ORDERS */}
      {currentUser.user_type === 'customer' && activeSubTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
          <div>
            <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Product Orders & In-Store Pickups ({customerOrders.length})</span>
            </h3>
            <p className="text-xs text-gray-500">Reserved physical beauty items held at partner salons.</p>
          </div>

          {customerOrders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl p-6">
              <ShoppingBag className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No reserved orders found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Explore nail polishes, cuticle oils, and press-on sets in our boutique catalog.
              </p>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('products') : onNavigateToDashboard()}
                className="mt-4 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop Boutique Products</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {customerOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-pink-200 bg-gray-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">
                        Order #{order.order_number || order.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        order.status === 'ready_for_pickup'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Salon Branch: <span className="font-semibold text-gray-800">{order.salon_name || 'Partner Salon'}</span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Reserved on {new Date(order.created_at).toLocaleDateString()} • Order Ref: <span className="font-mono font-bold text-pink-700">{order.order_number || ('GLAM-' + order.id)}</span>
                    </p>
                  </div>

                  <div className="text-right self-stretch sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                    <p className="text-sm font-bold text-pink-700">₱{Number(order.total_amount).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">{order.items?.length || 1} items</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Salon Owner Specific Section */}
      {currentUser.user_type === 'salon_owner' && userSalon && (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-pink-500" />
            My Salon
          </h2>
          <div className="flex items-start gap-4">
            {userSalon.logo && (
              <img
                src={userSalon.logo}
                alt={userSalon.salon_name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{userSalon.salon_name}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{userSalon.address}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold">{userSalon.avg_rating}</span>
                  <span className="text-[11px] text-gray-500">({userSalon.review_count} reviews)</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  userSalon.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                  userSalon.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {userSalon.verification_status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
