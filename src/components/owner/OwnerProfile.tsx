import React, { useState, useEffect, useRef } from 'react';
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
  Store,
  Users,
  AlertCircle,
  Upload,
  Lock,
  Check,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import { User as UserType, Salon, Appointment, Technician, Service, Review } from '../../types';
import {
  fetchAppointments,
  fetchTechnicians,
  fetchServices,
  fetchReviews,
  fetchSalons,
  updateUser,
  updateSalon,
  changePassword,
} from '../../lib/api';
import { LoadingSpinner } from '../LoadingSpinner';
import { processImageFile, PRESET_AVATARS } from '../../utils/imageUploadHelper';

interface OwnerProfileProps {
  currentUser: UserType;
  salons?: Salon[];
  onUpdateUser: (userData: Partial<UserType>) => void;
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}

export const OwnerProfile: React.FC<OwnerProfileProps> = ({
  currentUser,
  salons = [],
  onUpdateUser,
  onLogout,
  onNavigateToDashboard,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  type OwnerTab = 'profile' | 'salon' | 'permissions' | 'security';
  const [activeTab, setActiveTab] = useState<OwnerTab>('profile');

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullname: currentUser?.fullname || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    avatar: currentUser?.avatar || '',
  });

  // Business stats & salons
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ownerSalons, setOwnerSalons] = useState<Salon[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Salon branding state
  const [salonBranding, setSalonBranding] = useState({
    logo: '',
    banner: '',
  });
  const [savingSalon, setSavingSalon] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update formData when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullname: currentUser.fullname || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        avatar: currentUser.avatar || '',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const loadBusinessStats = async () => {
      if (!currentUser?.id) return;

      setLoadingStats(true);
      try {
        const fetchedSalons = await fetchSalons({
          owner_id: Number(currentUser.id),
          includeUnpublished: true,
        });
        const ownerBranches =
          fetchedSalons.length > 0
            ? fetchedSalons
            : salons.filter((salon) => Number(salon.owner_id) === Number(currentUser.id));

        const branchData = await Promise.all(
          ownerBranches.map(async (salon) => {
            const [appts, techs, servs, revs] = await Promise.all([
              fetchAppointments({ salon_id: salon.id }).catch(() => []),
              fetchTechnicians(salon.id).catch(() => []),
              fetchServices(salon.id).catch(() => []),
              fetchReviews(salon.id).catch(() => []),
            ]);
            return { appts, techs, servs, revs };
          })
        );

        setOwnerSalons(ownerBranches);
        if (ownerBranches[0]) {
          setSalonBranding({
            logo: ownerBranches[0].logo || '',
            banner: ownerBranches[0].banner || '',
          });
        }
        setAppointments(branchData.flatMap((branch) => branch.appts));
        setTechnicians(branchData.flatMap((branch) => branch.techs));
        setServices(branchData.flatMap((branch) => branch.servs));
        setReviews(branchData.flatMap((branch) => branch.revs));
      } catch (error) {
        console.error('Error loading business stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadBusinessStats();
  }, [currentUser?.id]);

  const getUserSalon = (): Salon | null => {
    if (!currentUser?.id) return null;
    return (
      ownerSalons.find((s) => Number(s.owner_id) === Number(currentUser.id)) ||
      salons.find((s) => Number(s.owner_id) === Number(currentUser.id)) ||
      null
    );
  };

  const userSalon = getUserSalon();

  // Avatar Upload Handlers
  const handleAvatarFile = async (file: File) => {
    setUploadingAvatar(true);
    setFeedback(null);
    try {
      const dataUrl = await processImageFile(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.85,
      });
      setFormData((prev) => ({ ...prev, avatar: dataUrl }));
      setIsEditing(true);
      setFeedback({
        type: 'success',
        message: 'Owner profile picture selected. Click "Save Changes" to apply.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to upload photo.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Salon Logo Upload Handler
  const handleSalonLogoFile = async (file: File) => {
    if (!userSalon) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await processImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
      });
      setSalonBranding((prev) => ({ ...prev, logo: dataUrl }));
      setSavingSalon(true);
      await updateSalon(userSalon.id, { logo: dataUrl });
      setFeedback({ type: 'success', message: 'Salon branch logo updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update salon logo.' });
    } finally {
      setUploadingLogo(false);
      setSavingSalon(false);
    }
  };

  // Salon Cover Banner Upload Handler
  const handleSalonBannerFile = async (file: File) => {
    if (!userSalon) return;
    setUploadingBanner(true);
    setFeedback(null);
    try {
      const dataUrl = await processImageFile(file, {
        maxWidth: 1200,
        maxHeight: 600,
        quality: 0.85,
      });
      setSalonBranding((prev) => ({ ...prev, banner: dataUrl }));
      setSavingSalon(true);
      await updateSalon(userSalon.id, { banner: dataUrl });
      setFeedback({ type: 'success', message: 'Salon branch cover banner updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update salon cover banner.' });
    } finally {
      setUploadingBanner(false);
      setSavingSalon(false);
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

    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        setFeedback({ type: 'error', message: 'Phone number must have strictly 11 numbers (e.g. 09171234567).' });
        return;
      }
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
      setFeedback({ type: 'success', message: 'Owner profile updated successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (error: any) {
      console.error('Error updating owner profile:', error);
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
        message: result.message || 'Password updated successfully!',
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

  // Calculate business metrics
  const totalRevenue = appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + (Number(a.total_price || a.service_price) || 0), 0);

  const completedAppointments = appointments.filter((a) => a.status === 'completed').length;
  const pendingAppointments = appointments.filter((a) => a.status === 'pending').length;

  if (!currentUser) {
    return <LoadingSpinner text="Loading profile..." fullScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hidden File Inputs for Avatars and Logos */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAvatarFile(file);
        }}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSalonLogoFile(file);
        }}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSalonBannerFile(file);
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Top Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button
            onClick={onNavigateToDashboard}
            className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Salon Dashboard</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-gray-800">Owner Profile &amp; Governance</span>
        </div>

        <button
          onClick={onNavigateToDashboard}
          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Go to Salon Dashboard</span>
        </button>
      </div>

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

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-rose-950 h-32" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            {/* Functional Avatar Upload */}
            <div
              className="relative group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
              title="Click to upload owner profile picture"
            >
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.fullname || 'Owner'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-serif font-bold">
                    {formData.fullname ? formData.fullname.charAt(0).toUpperCase() : 'O'}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs font-semibold gap-1">
                  <Camera className="w-6 h-6" />
                  <span>{uploadingAvatar ? 'Processing...' : 'Upload Photo'}</span>
                </div>

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  avatarInputRef.current?.click();
                }}
                className="absolute bottom-2 right-2 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                title="Upload owner photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Owner Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    placeholder="Full Name"
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-purple-300 focus:border-purple-500 outline-none max-w-sm"
                  />
                ) : (
                  <h1 className="text-2xl font-serif font-bold text-gray-900 truncate">
                    {currentUser?.fullname || 'Salon Owner'}
                  </h1>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Salon Partner &amp; Store Owner
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Partner since{' '}
                    {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {currentUser?.status === 'active' && (
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Store Partner</span>
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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Change Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading || uploadingAvatar}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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

      {/* Preset Avatars for Salon Owners */}
      {isEditing && (
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              <span>Or choose from curated owner avatars:</span>
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
            {PRESET_AVATARS.salon_owner.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, avatar: url }))}
                className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  formData.avatar === url
                    ? 'border-purple-600 ring-2 ring-purple-300 scale-105'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Owner &amp; Salon Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('salon')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'salon'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Branding &amp; Visuals</span>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'permissions'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Operational Permissions</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security &amp; Password</span>
        </button>
      </div>

      {/* TAB 1: OWNER & BUSINESS OVERVIEW */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Business Performance Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-purple-600" />
                <span>Business Performance Metrics</span>
              </h2>

              {userSalon ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
                    {userSalon.logo ? (
                      <img
                        src={userSalon.logo}
                        alt={userSalon.salon_name}
                        className="w-16 h-16 rounded-xl object-cover border border-purple-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-xl shrink-0">
                        {userSalon.salon_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {userSalon.salon_name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            userSalon.verification_status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {userSalon.verification_status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{userSalon.address}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 font-semibold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{userSalon.avg_rating || '5.0'}</span>
                        </span>
                        <span className="text-gray-400">({userSalon.review_count || reviews.length} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center border border-purple-100/60">
                      <div className="text-xl font-bold text-purple-900">{appointments.length}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Total Bookings</div>
                    </div>
                    <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl text-center border border-emerald-100/60">
                      <div className="text-xl font-bold text-emerald-800">{completedAppointments}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Completed</div>
                    </div>
                    <div className="p-3.5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl text-center border border-amber-100/60">
                      <div className="text-xl font-bold text-amber-800">{pendingAppointments}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Pending</div>
                    </div>
                    <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-100/60">
                      <div className="text-xl font-bold text-blue-900">₱{totalRevenue.toLocaleString()}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Revenue</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Store className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">No salon registered yet.</p>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <span>Owner Contact Information</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-700 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{currentUser?.email || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Phone Number (11 Digits)</label>
                    {isEditing && (
                      <span
                        className={`text-[11px] font-semibold transition-colors ${
                          formData.phone.replace(/\D/g, '').length === 11
                            ? 'text-emerald-700'
                            : formData.phone.replace(/\D/g, '').length > 0
                            ? 'text-amber-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {formData.phone.replace(/\D/g, '').length}/11 digits {formData.phone.replace(/\D/g, '').length === 11 ? '✓' : ''}
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={11}
                        value={formData.phone}
                        onChange={(e) => {
                          const strictlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setFormData({ ...formData, phone: strictlyNumbers });
                        }}
                        placeholder="09171234567"
                        className={`w-full px-3 py-2 text-sm rounded-xl border font-mono tracking-wider outline-none transition-all ${
                          formData.phone && formData.phone.replace(/\D/g, '').length !== 11
                            ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500'
                            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                        }`}
                      />
                      {formData.phone && formData.phone.replace(/\D/g, '').length !== 11 && (
                        <p className="text-[11px] text-amber-700 mt-1 font-medium">
                          Phone number must have strictly 11 numbers (currently {formData.phone.replace(/\D/g, '').length}).
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-700 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{currentUser?.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Team & Quick Services */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Team &amp; Treatments</span>
              </h2>

              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-gray-900">Stylists &amp; Techs</span>
                  </div>
                  <span className="text-sm font-bold text-purple-900">{technicians.length} active</span>
                </div>

                <div className="p-3 bg-pink-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-pink-600" />
                    <span className="text-xs font-semibold text-gray-900">Active Services</span>
                  </div>
                  <span className="text-sm font-bold text-pink-900">{services.length} treatments</span>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-gray-900">Client Reviews</span>
                  </div>
                  <span className="text-sm font-bold text-amber-900">{reviews.length} total</span>
                </div>
              </div>

              <button
                onClick={onNavigateToDashboard}
                className="w-full mt-2 py-2.5 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Manage Staff &amp; Services</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
              <button
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Store Partner Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALON BRANDING & VISUAL ASSETS */}
      {activeTab === 'salon' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Salon Logo Upload & Branding */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Salon Logo &amp; Icon</span>
              </h2>
              <p className="text-xs text-gray-500">
                Square format logo displayed across salon cards, search results, and booking confirmations.
              </p>

              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-purple-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                  {salonBranding.logo ? (
                    <img
                      src={salonBranding.logo}
                      alt="Salon Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-8 h-8 text-purple-400" />
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">Branch Logo</p>
                  <p className="text-[11px] text-gray-500">
                    PNG, JPG, or WEBP (up to 8MB).
                  </p>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo || savingSalon}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Processing...' : 'Upload Logo'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Salon Cover Banner Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Salon Cover Banner</span>
              </h2>
              <p className="text-xs text-gray-500">
                Wide banner hero image featured atop your public salon storefront and customer booking modal.
              </p>

              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-3">
                <div className="w-full h-24 rounded-xl bg-gray-100 border border-purple-200 overflow-hidden relative shadow-xs flex items-center justify-center">
                  {salonBranding.banner ? (
                    <img
                      src={salonBranding.banner}
                      alt="Salon Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                      <span>No custom cover banner uploaded</span>
                    </div>
                  )}
                  {uploadingBanner && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Recommended 16:9 ratio (1200x675)
                  </span>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner || savingSalon}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingBanner ? 'Processing...' : 'Upload Cover Banner'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONAL PERMISSIONS & POLICIES */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>Salon Owner Operational Permissions &amp; Governance</span>
              </h2>
              <p className="text-xs text-gray-500">
                System privileges authorized for this registered salon business partner account.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-950">Appointment Scheduling</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Accept, confirm, decline, reschedule, and finalize client appointments.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-950">Service Menu &amp; Pricing</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Publish treatments, edit service duration, category classifications, and pricing.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-950">Technicians &amp; Specialists</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Add nail technicians, assign specialties, bio descriptions, and manage staff rosters.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-950">In-Store Boutique Holds</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Fulfill customer pickup reservations, mark orders ready, and record product sales.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-950">Revenue &amp; Settlement</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Access store revenue analytics, daily booking volume, and exportable financial reports.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-950">Client Reviews &amp; Replies</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Read verified client feedback, post official salon replies, and track satisfaction.
                </p>
              </div>
            </div>

            {/* Verification Status */}
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Store Partner Verification Status
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {userSalon?.verification_status === 'verified'
                      ? 'Officially verified and audited salon branch partner on Nail Glam Hub.'
                      : 'Pending review by platform administrator governance team.'}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  userSalon?.verification_status === 'verified'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {userSalon?.verification_status || 'verified'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-purple-100 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-600" />
            <span>Update Store Partner Password</span>
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

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
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
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
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
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
