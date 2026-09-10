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
} from 'lucide-react';
import { User as UserType, Salon, Appointment } from '../types';
import { fetchAppointments, updateUser } from '../lib/api';

interface UserProfileProps {
  currentUser: UserType;
  salons?: Salon[];
  onUpdateUser: (userData: Partial<UserType>) => void;
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  salons = [],
  onUpdateUser,
  onLogout,
  onNavigateToDashboard,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    fullname: currentUser.fullname,
    email: currentUser.email,
    phone: currentUser.phone || '',
    avatar: currentUser.avatar || '',
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    if (currentUser.user_type === 'customer') {
      loadAppointments();
    }
  }, [currentUser.id, currentUser.user_type]);

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const list = await fetchAppointments({ customer_id: currentUser.id });
      setAppointments(list);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

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
      customer: 'Customer',
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
      return salons.find(s => s.owner_id === currentUser.id);
    }
    return null;
  };

  const userSalon = getUserSalon();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                  <User className="w-16 h-16 text-pink-400" />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-2 right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-pink-600 hover:to-rose-700 transition-all">
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
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-pink-300 focus:border-pink-500 outline-none"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{currentUser.fullname}</h1>
                )}
                {getUserRoleBadge()}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(currentUser.created_at).toLocaleDateString()}</span>
                </div>
                {currentUser.status === 'active' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Active</span>
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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold shadow-md shadow-pink-500/20 transition-all flex items-center gap-2"
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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold shadow-md shadow-pink-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
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

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-pink-500" />
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
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{currentUser.email}</span>
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
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{currentUser.phone || 'Not provided'}</span>
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
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-pink-500" />
            Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Account Type</span>
              {getUserRoleBadge()}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Account Status</span>
              <span className={`text-sm font-semibold ${currentUser.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {currentUser.status || 'Active'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="text-sm font-semibold text-gray-900">
                {new Date(currentUser.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="mt-6 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold shadow-md shadow-pink-500/20 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Salon Owner Specific Section */}
      {currentUser.user_type === 'salon_owner' && userSalon && (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-pink-500" />
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
              <h3 className="text-xl font-bold text-gray-900">{userSalon.salon_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{userSalon.address}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold">{userSalon.avg_rating}</span>
                  <span className="text-xs text-gray-500">({userSalon.review_count} reviews)</span>
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
        </div>
      )}

      {/* Customer Recent Activity */}
      {currentUser.user_type === 'customer' && (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-pink-500" />
            Recent Appointments
          </h2>
          {loadingAppointments ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No appointments yet. Book your first appointment to see it here!
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-gray-900">{appointment.service_name || 'Service'}</h4>
                    <p className="text-sm text-gray-500">{appointment.salon_name || 'Salon'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">{appointment.appointment_time}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};