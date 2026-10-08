import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
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
  Upload,
  Lock,
  Check,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { User as UserType, Salon, Appointment, ProductOrder } from '../types';
import { fetchAppointments, updateUser, changePassword } from '../lib/api';
import { processImageFile, PRESET_AVATARS } from '../utils/imageUploadHelper';
import { localStorage as safeLocalStorage } from '../lib/localStorage';

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

type SubTab = 'profile' | 'appointments' | 'favorites' | 'orders' | 'security' | 'permissions';

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
  const isAdmin = currentUser.user_type === 'admin';
  const isCustomer = currentUser.user_type === 'customer';

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('profile');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullname: currentUser.fullname || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    avatar: currentUser.avatar || '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Customer Preferences & Permissions state
  interface CustomerPreferences {
    smsReminders: boolean;
    emailConfirmations: boolean;
    pickupAlerts: boolean;
    promotionalAnnouncements: boolean;
    shareConsultationNotes: boolean;
    geolocationConsent: boolean;
  }

  const [customerPreferences, setCustomerPreferences] = useState<CustomerPreferences>(() => {
    const saved = safeLocalStorage.getJSON<CustomerPreferences>(`nailglamhub_prefs_${currentUser.id}`);
    return (
      saved || {
        smsReminders: true,
        emailConfirmations: true,
        pickupAlerts: true,
        promotionalAnnouncements: true,
        shareConsultationNotes: true,
        geolocationConsent: true,
      }
    );
  });

  const togglePreference = (key: keyof CustomerPreferences) => {
    setCustomerPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      safeLocalStorage.setJSON(`nailglamhub_prefs_${currentUser.id}`, updated);
      return updated;
    });
  };

  const [fetchedAppointments, setFetchedAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Sync state if currentUser changes
  useEffect(() => {
    setFormData({
      fullname: currentUser.fullname || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      avatar: currentUser.avatar || '',
    });
  }, [currentUser]);

  useEffect(() => {
    if (isCustomer && (!customerAppointments || customerAppointments.length === 0)) {
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

  const appointmentsToDisplay =
    customerAppointments && customerAppointments.length > 0
      ? customerAppointments
      : fetchedAppointments;

  const favoriteSalons = salons.filter((s) => favorites.includes(s.id));

  // Handle image file selection and client-side canvas compression
  const handleImageFile = async (file: File) => {
    setUploadingImage(true);
    setFeedback(null);
    try {
      const compressedDataUrl = await processImageFile(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.85,
      });
      setFormData((prev) => ({ ...prev, avatar: compressedDataUrl }));
      setIsEditing(true);
      setFeedback({
        type: 'success',
        message: 'New profile photo selected! Click "Save Changes" to apply.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to process image file.',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleSave = async () => {
    if (!formData.fullname.trim()) {
      setFeedback({ type: 'error', message: 'Full name is required.' });
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFeedback({ type: 'error', message: 'A valid email address is required.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const updatedUser = await updateUser(currentUser.id, {
        fullname: formData.fullname.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        avatar: formData.avatar,
      });
      onUpdateUser(updatedUser);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Profile details and photo updated successfully!' });
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
      fullname: currentUser.fullname || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      avatar: currentUser.avatar || '',
    });
    setIsEditing(false);
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!passwordData.currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordFeedback({
        type: 'error',
        message: 'New password must be at least 8 characters long.',
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'New password and confirmation do not match.',
      });
      return;
    }

    setChangingPassword(true);
    try {
      const result = await changePassword(currentUser.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordFeedback({
        type: 'success',
        message: result.message || 'Password changed successfully!',
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordFeedback(null), 5000);
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err.message || 'Failed to update password.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getUserRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Shield className="w-3.5 h-3.5 text-blue-700" />
          <span>Super Administrator</span>
        </span>
      );
    }
    if (currentUser.user_type === 'salon_owner') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <Store className="w-3.5 h-3.5 text-purple-700" />
          <span>Salon Partner</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-800 border border-pink-200">
        <Sparkles className="w-3.5 h-3.5 text-pink-700" />
        <span>Verified Client</span>
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Breadcrumbs & Back Bar */}
      <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button
            onClick={() => (onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard())}
            className="text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Salons</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-800">
            {isAdmin ? 'Admin Governance Profile' : isCustomer ? 'Client Portal' : 'My Profile'}
          </span>
          <span>/</span>
          <span className="text-gray-400">Settings &amp; Permissions</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="back-to-explore-btn"
            onClick={() => (onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard())}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Browse</span>
          </button>
          {isAdmin ? (
            <button
              onClick={onNavigateToDashboard}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          ) : isCustomer ? (
            <button
              onClick={onNavigateToDashboard}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bookings Hub</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Admin Specific Governance Banner */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4.5 text-white flex items-center justify-between gap-4 shadow-sm border border-blue-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span>Super Administrator Governance Access</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  Full Authority
                </span>
              </p>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Manage partner verification, platform security, announcements, and system health.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToDashboard}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-blue-50 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <span>Open Admin Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Customer Status Banner */}
      {isCustomer && (
        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 rounded-2xl p-4 border border-pink-100 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-600/10 text-pink-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Your Client Account Is Active &amp; Verified</p>
              <p className="text-[11px] text-gray-500">
                You have {appointmentsToDisplay.length} appointment{appointmentsToDisplay.length !== 1 ? 's' : ''} on record and {favorites.length} saved salon{favorites.length !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
          <button
            onClick={() => (onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard())}
            className="hidden md:flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 shrink-0 cursor-pointer"
          >
            <span>Browse Salons</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feedback Alert Banner */}
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

      {/* Profile Header with Functional Image Upload */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
        <div
          className={`h-32 bg-gradient-to-r ${
            isAdmin
              ? 'from-blue-900 via-indigo-900 to-slate-900'
              : 'from-pink-900 via-rose-900 to-purple-950'
          }`}
        />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            {/* Functional Avatar with Upload & Drag/Drop */}
            <div
              className={`relative group cursor-pointer ${
                isDragging ? 'ring-4 ring-pink-500 ring-offset-2' : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              title="Click or drop an image to upload a new profile photo"
            >
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.fullname || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${
                      isAdmin
                        ? 'from-blue-600 to-indigo-700'
                        : 'from-pink-500 to-rose-600'
                    } flex items-center justify-center text-white text-3xl font-serif font-bold`}
                  >
                    {formData.fullname ? formData.fullname.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                {/* Hover overlay indicating upload */}
                <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs font-semibold gap-1">
                  <Camera className="w-6 h-6" />
                  <span>{uploadingImage ? 'Processing...' : 'Upload Photo'}</span>
                </div>

                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Camera Trigger Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className={`absolute bottom-2 right-2 w-8 h-8 ${
                  isAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-600 hover:bg-pink-700'
                } text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer`}
                title="Upload image"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* User Info Header */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    placeholder="Full Name"
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-pink-300 focus:border-pink-500 outline-none max-w-sm"
                  />
                ) : (
                  <h1 className="text-2xl font-serif font-bold text-gray-900 truncate">
                    {currentUser.fullname}
                  </h1>
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
                    <span>Active Status</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{currentUser.email}</span>
                </div>
              </div>
            </div>

            {/* Profile Action Buttons */}
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
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading || uploadingImage}
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

      {/* Preset Avatars Bar (Shown when editing or changing photo) */}
      {isEditing && (
        <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-pink-600" />
              <span>Or choose from curated avatars:</span>
            </span>
            {formData.avatar && (
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Clear Avatar
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            {(isAdmin ? PRESET_AVATARS.admin : PRESET_AVATARS.customer).map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, avatar: url }))}
                className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  formData.avatar === url
                    ? 'border-pink-600 ring-2 ring-pink-300 scale-105'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Role-Specific Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'profile'
              ? 'bg-pink-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Account Details</span>
        </button>

        {isCustomer && (
          <>
            <button
              onClick={() => setActiveSubTab('appointments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'appointments'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bookings ({appointmentsToDisplay.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('favorites')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'favorites'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Saved Salons ({favorites.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'orders'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Pickups ({customerOrders.length})</span>
            </button>
          </>
        )}

        {isAdmin ? (
          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'permissions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Governance Permissions</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'permissions'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Permissions &amp; Privacy</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'security'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Password &amp; Security</span>
        </button>
      </div>

      {/* SUB-TAB 1: ACCOUNT DETAILS & CONTACT */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-500" />
              <span>Contact Information</span>
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
                  <div className="flex items-center gap-2 text-sm text-gray-700 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
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
                  <div className="flex items-center gap-2 text-sm text-gray-700 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{currentUser.phone || 'No phone provided'}</span>
                  </div>
                )}
              </div>

              {isEditing && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Profile Photo URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    You can paste a direct image URL or use the Camera button above to upload a file from your device.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Information & Permissions Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-500" />
                <span>Account &amp; Permissions Status</span>
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Account Type</span>
                  {getUserRoleBadge()}
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentUser.status || 'Active'}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Member Since</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {new Date(currentUser.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Account Security</span>
                  <span className="text-xs font-semibold text-emerald-700">Encrypted &amp; Protected</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={onLogout}
                className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BOOKINGS (Customer) */}
      {isCustomer && activeSubTab === 'appointments' && (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-600" />
                <span>My Appointments ({appointmentsToDisplay.length})</span>
              </h3>
              <p className="text-xs text-gray-500">
                All appointments synced in real-time with your partner salons.
              </p>
            </div>
            <button
              onClick={() => (onOpenBooking ? onOpenBooking() : onNavigateTab && onNavigateTab('explore'))}
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
                Explore our curated catalog of verified salons in Metro Manila and book your nail session.
              </p>
              <button
                onClick={() => (onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard())}
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
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : apt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
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
                        <span>{apt.appointment_date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{apt.appointment_time}</span>
                      </div>
                    </div>
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

      {/* SUB-TAB 3: FAVORITES (Customer) */}
      {isCustomer && activeSubTab === 'favorites' && (
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
                onClick={() => (onNavigateTab ? onNavigateTab('explore') : onNavigateToDashboard())}
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

      {/* SUB-TAB 4: ORDERS (Customer) */}
      {isCustomer && activeSubTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
          <div>
            <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Product Orders &amp; Pickups ({customerOrders.length})</span>
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
                onClick={() => (onNavigateTab ? onNavigateTab('products') : onNavigateToDashboard())}
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
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          order.status === 'ready_for_pickup'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Salon Branch: <span className="font-semibold text-gray-800">{order.salon_name || 'Partner Salon'}</span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Reserved on {new Date(order.created_at).toLocaleDateString()}
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

      {/* SUB-TAB: ADMIN GOVERNANCE PERMISSIONS (Admin Only) */}
      {isAdmin && activeSubTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Super Administrator System Permissions</span>
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Root-level capabilities authorized for this administrative account across Nail Glam Hub platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span>Salon Verification &amp; Auditing</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Authority
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Inspect and approve newly registered salon branches, verify business compliance, and suspend violating stores.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>User Account Compliance</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Authority
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Manage customer and salon owner accounts, update statuses (active/suspended), and monitor reliability strikes.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Live Announcements Broadcast</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Authority
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Dispatch persistent promotional and system alerts to top announcement banners across desktop and mobile.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>Financial Audits &amp; Mail Logs</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Authority
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  View aggregated appointment fulfillment, cancellation fee balances, and inspect email delivery logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: CUSTOMER ACCOUNT PERMISSIONS & PRIVACY (Customer Only) */}
      {!isAdmin && activeSubTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>Customer Account Privileges &amp; Permissions</span>
              </h2>
              <p className="text-xs text-gray-500">
                Verified entitlements, communication channels, and privacy controls authorized for your account.
              </p>
            </div>

            {/* Entitlements Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">Instant Salon Booking</p>
                  <p className="text-[11px] text-emerald-800">Direct online reservation with salons</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Authorized
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">Verified Reviews &amp; Ratings</p>
                  <p className="text-[11px] text-emerald-800">Submit feedback on completed treatments</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Authorized
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">Boutique In-Store Pickups</p>
                  <p className="text-[11px] text-emerald-800">Hold salon retail products for in-store pickup</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Authorized
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">Saved Favorites &amp; Collections</p>
                  <p className="text-[11px] text-emerald-800">Curate favorite salons and nail styling looks</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Authorized
                </span>
              </div>
            </div>

            {/* Notification & Communication Preferences */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Notification &amp; Alert Permissions</span>
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">SMS &amp; Email Appointment Reminders</p>
                    <p className="text-[11px] text-gray-500">Receive schedule confirmations and reminder notices</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference('smsReminders')}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      customerPreferences.smsReminders ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        customerPreferences.smsReminders ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Pickup Order Status Alerts</p>
                    <p className="text-[11px] text-gray-500">Notifies when reserved boutique products are ready for pickup</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference('pickupAlerts')}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      customerPreferences.pickupAlerts ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        customerPreferences.pickupAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Salon Special Broadcasts &amp; Deals</p>
                    <p className="text-[11px] text-gray-500">Display top banner announcements and discounts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePreference('promotionalAnnouncements')}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      customerPreferences.promotionalAnnouncements ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        customerPreferences.promotionalAnnouncements ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy & Location Consents */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>Privacy &amp; Data Access Consent</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Technician Consultation View</p>
                    <p className="text-[11px] text-gray-500">Shares appointment notes with assigned nail tech</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Enabled
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Geolocation Nearby Salons</p>
                    <p className="text-[11px] text-gray-500">Calculates distance to registered branches</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: SECURITY & PERMISSIONS (For all users: Customer & Admin) */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Permissions & Trust Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>Permissions &amp; Reliability Status</span>
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-purple-950">Reliability Rating</p>
                  <p className="text-[11px] text-purple-800">Booking fulfillment reliability</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                  100% (High Trust)
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Cancellation Strikes</p>
                  <p className="text-[11px] text-gray-500">Late cancellation policy enforcement</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  0 Strikes
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-gray-700">Account Access Entitlements</p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant Reservation &amp; Salon Booking: <strong>Active</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Boutique Product Hold &amp; Pickups: <strong>Active</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Salon Reviews &amp; Treatment Ratings: <strong>Active</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Direct Salon Inquiry &amp; Stylist Chat: <strong>Active</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-pink-600" />
              <span>Change Password</span>
            </h2>

            {passwordFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {passwordFeedback.message}
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new strong password"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full mt-2 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
