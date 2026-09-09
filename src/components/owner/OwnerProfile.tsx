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
  Store,
  BarChart3,
  Users,
  TrendingUp,
  Award,
  CreditCard,
  Bell,
  Key,
  FileText,
  Zap,
} from 'lucide-react';
import { User as UserType, Salon, Appointment, Technician, Service, Review } from '../../types';
import { fetchAppointments, fetchTechnicians, fetchServices, fetchReviews, fetchSalons } from '../../lib/api';
import { LoadingSpinner } from '../LoadingSpinner';

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
  const [formData, setFormData] = useState({
    fullname: currentUser?.fullname || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    avatar: currentUser?.avatar || '',
  });

  // Update formData when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullname: currentUser.fullname,
        email: currentUser.email,
        phone: currentUser.phone || '',
        avatar: currentUser.avatar || '',
      });
    }
  }, [currentUser]);
  
  // Business stats
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ownerSalons, setOwnerSalons] = useState<Salon[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const loadBusinessStats = async () => {
      if (!currentUser?.id) return;
      
      setLoadingStats(true);
      try {
        const fetchedSalons = await fetchSalons({
          owner_id: Number(currentUser.id),
          includeUnpublished: true,
        });
        const ownerBranches = fetchedSalons.length > 0
          ? fetchedSalons
          : salons.filter((salon) => Number(salon.owner_id) === Number(currentUser.id));

        const branchData = await Promise.all(ownerBranches.map(async (salon) => {
          const [appts, techs, servs, revs] = await Promise.all([
            fetchAppointments({ salon_id: salon.id }),
            fetchTechnicians(salon.id),
            fetchServices(salon.id),
            fetchReviews(salon.id),
          ]);
          return { appts, techs, servs, revs };
        }));

        setOwnerSalons(ownerBranches);
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

  const handleSave = async () => {
    setLoading(true);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001';
      const res = await fetch(`${apiBase}/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        onUpdateUser(updatedUser);
        setIsEditing(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
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

  const getUserSalon = () => {
    if (!currentUser?.id || !salons || salons.length === 0) return null;
    return ownerSalons.find(s => Number(s.owner_id) === Number(currentUser.id))
      || salons.find(s => Number(s.owner_id) === Number(currentUser.id));
  };

  const userSalon = getUserSalon();

  // Calculate business metrics
  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.total_price || a.service_price || 0), 0);
  
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (!currentUser) {
    return <LoadingSpinner text="Loading profile..." fullScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-rose-950 h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-purple-400" />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-2 right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-purple-600 hover:to-pink-700 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-purple-300 focus:border-purple-500 outline-none"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{currentUser?.fullname || 'Owner'}</h1>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  Salon Owner
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                {currentUser?.status === 'active' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Active Business Partner</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={onNavigateToDashboard}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Dashboard
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Overview Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-500" />
              Business Overview
            </h2>
            
            {userSalon ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
                  {userSalon.logo && (
                    <img
                      src={userSalon.logo}
                      alt={userSalon.salon_name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{userSalon.salon_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{userSalon.address}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold">{userSalon.review_count ? Number(userSalon.avg_rating).toFixed(1) : 'Not rated'}</span>
                        <span className="text-xs text-gray-500">({userSalon.review_count || 0} reviews)</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        userSalon.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                        userSalon.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {userSalon.verification_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-900">{appointments.length}</div>
                    <div className="text-xs text-gray-600">Total Bookings</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-700">{completedAppointments}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-amber-700">{pendingAppointments}</div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-700">₱{totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Store className="w-12 h-12 mx-auto mb-2" />
                <p>No salon registered yet. Complete your salon registration to view business metrics.</p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-500" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{currentUser?.email || 'Not provided'}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Add phone number"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{currentUser?.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>
              {isEditing && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Image URL</label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://example.com/your-photo.jpg"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Team & Services Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Team & Services
            </h2>
            {loadingStats ? (
              <div className="text-center py-8">
                <LoadingSpinner text="Loading business data..." />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">Team Members</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{technicians.length}</div>
                  <div className="text-xs text-gray-600">Active specialists</div>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Scissors className="w-5 h-5 text-pink-600" />
                    <span className="font-semibold text-gray-900">Services</span>
                  </div>
                  <div className="text-2xl font-bold text-pink-900">{services.length}</div>
                  <div className="text-xs text-gray-600">Available treatments</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-gray-900">Rating</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-900">{averageRating}</div>
                  <div className="text-xs text-gray-600">Average customer rating</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Reviews</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{reviews.length}</div>
                  <div className="text-xs text-gray-600">Total customer reviews</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              Account Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Account Type</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                  Salon Owner
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Account Status</span>
                <span className={`text-sm font-semibold ${currentUser?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {currentUser?.status || 'Active'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-semibold text-gray-900">
                  {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold transition-colors flex items-center gap-3 text-left">
                <BarChart3 className="w-5 h-5" />
                <span>View Analytics</span>
              </button>
              <button className="w-full px-4 py-3 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold transition-colors flex items-center gap-3 text-left">
                <Users className="w-5 h-5" />
                <span>Manage Team</span>
              </button>
              <button className="w-full px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold transition-colors flex items-center gap-3 text-left">
                <Scissors className="w-5 h-5" />
                <span>Edit Services</span>
              </button>
              <button className="w-full px-4 py-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-semibold transition-colors flex items-center gap-3 text-left">
                <CreditCard className="w-5 h-5" />
                <span>Payment Settings</span>
              </button>
              <button className="w-full px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors flex items-center gap-3 text-left">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
              <button className="w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold transition-colors flex items-center gap-3 text-left">
                <Key className="w-5 h-5" />
                <span>Change Password</span>
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};