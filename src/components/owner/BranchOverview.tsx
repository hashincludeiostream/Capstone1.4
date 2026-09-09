import React, { useState, useEffect } from 'react';
import {
  Store,
  TrendingUp,
  Users,
  Calendar,
  Star,
  DollarSign,
  MapPin,
  Plus,
  Settings,
  Eye,
  Edit3,
  BarChart3,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from 'lucide-react';
import { Salon, Appointment, Service, Technician, Review } from '../../types';
import { fetchAppointments, fetchServices, fetchTechnicians, fetchReviews, updateSalon } from '../../lib/api';

interface BranchOverviewProps {
  salons: Salon[];
  currentUser: any;
  onNavigateToBranch: (salonId: number) => void;
  onOpenRegisterSalon: () => void;
  onShowToast: (message: string) => void;
}

interface BranchMetrics {
  salon: Salon;
  appointments: Appointment[];
  services: Service[];
  technicians: Technician[];
  reviews: Review[];
  totalRevenue: number;
  completedBookings: number;
  pendingBookings: number;
  averageRating: number;
  activeStaff: number;
}

export const BranchOverview: React.FC<BranchOverviewProps> = ({
  salons,
  currentUser,
  onNavigateToBranch,
  onOpenRegisterSalon,
  onShowToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [branchMetrics, setBranchMetrics] = useState<BranchMetrics[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'revenue' | 'bookings' | 'rating' | 'name'>('revenue');
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [settingsName, setSettingsName] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsLogo, setSettingsLogo] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadBranchMetrics();
  }, [salons]);

  const loadBranchMetrics = async () => {
    setLoading(true);
    try {
      const metricsPromises = salons.map(async (salon) => {
        const [appts, servs, techs, revs] = await Promise.all([
          fetchAppointments({ salon_id: salon.id }),
          fetchServices(salon.id),
          fetchTechnicians(salon.id),
          fetchReviews(salon.id),
        ]);

        const completedBookings = appts.filter(a => a.status === 'completed').length;
        const pendingBookings = appts.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
        const totalRevenue = appts
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + (a.total_price || 0), 0);
        const averageRating = revs.length > 0
          ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
          : 0;

        return {
          salon,
          appointments: appts,
          services: servs,
          technicians: techs,
          reviews: revs,
          totalRevenue,
          completedBookings,
          pendingBookings,
          averageRating,
          activeStaff: techs.length,
        };
      });

      const metrics = await Promise.all(metricsPromises);
      setBranchMetrics(metrics);
    } catch (error) {
      console.error('Error loading branch metrics:', error);
      onShowToast('Failed to load branch data');
    } finally {
      setLoading(false);
    }
  };

  const getAggregatedMetrics = () => {
    return {
      totalBranches: salons.length,
      totalRevenue: branchMetrics.reduce((sum, b) => sum + b.totalRevenue, 0),
      totalBookings: branchMetrics.reduce((sum, b) => sum + b.appointments.length, 0),
      totalCompleted: branchMetrics.reduce((sum, b) => sum + b.completedBookings, 0),
      totalPending: branchMetrics.reduce((sum, b) => sum + b.pendingBookings, 0),
      totalStaff: branchMetrics.reduce((sum, b) => sum + b.activeStaff, 0),
      overallRating: branchMetrics.length > 0
        ? branchMetrics.reduce((sum, b) => sum + b.averageRating, 0) / branchMetrics.length
        : 0,
    };
  };

  const sortBranches = (branches: BranchMetrics[]) => {
    return [...branches].sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'bookings':
          return b.appointments.length - a.appointments.length;
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'name':
          return a.salon.salon_name.localeCompare(b.salon.salon_name);
        default:
          return 0;
      }
    });
  };

  const openSettings = (salon: Salon) => {
    setEditingSalon(salon);
    setSettingsName(salon.salon_name);
    setSettingsAddress(salon.address);
    setSettingsPhone(salon.phone || '');
    setSettingsEmail(salon.email || '');
    setSettingsDescription(salon.description || '');
    setSettingsLogo(salon.logo || '');
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSalon || !settingsName.trim() || !settingsAddress.trim()) return;

    setSavingSettings(true);
    try {
      const updatedSalon = await updateSalon(editingSalon.id, {
        salon_name: settingsName.trim(),
        address: settingsAddress.trim(),
        phone: settingsPhone.trim(),
        email: settingsEmail.trim(),
        description: settingsDescription.trim(),
        logo: settingsLogo || null,
      });
      setBranchMetrics((previous) => previous.map((metric) => (
        metric.salon.id === updatedSalon.id ? { ...metric, salon: updatedSalon } : metric
      )));
      setEditingSalon(null);
      onShowToast(`${updatedSalon.salon_name} settings saved`);
    } catch (error) {
      console.error('Update branch settings error:', error);
      onShowToast('Unable to save branch settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const aggregated = getAggregatedMetrics();
  const sortedBranches = sortBranches(branchMetrics);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading branch data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Branch Overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage all your salon branches in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Table
          </button>
          <button
            onClick={onOpenRegisterSalon}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        </div>
      </div>

      {/* Aggregated Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700">Total Branches</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{aggregated.totalBranches}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-green-900">₱{aggregated.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Total Bookings</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{aggregated.totalBookings}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">Total Staff</span>
          </div>
          <div className="text-2xl font-bold text-amber-900">{aggregated.totalStaff}</div>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 border border-pink-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-pink-600" />
            <span className="text-xs font-semibold text-pink-700">Avg Rating</span>
          </div>
          <div className="text-2xl font-bold text-pink-900">{aggregated.overallRating.toFixed(1)}</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">Completed</span>
          </div>
          <div className="text-2xl font-bold text-indigo-900">{aggregated.totalCompleted}</div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium bg-white"
        >
          <option value="revenue">Revenue</option>
          <option value="bookings">Bookings</option>
          <option value="rating">Rating</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Empty State */}
      {salons.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-purple-100">
          <Store className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Branches Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Register your first salon branch to start monitoring your business
          </p>
          <button
            onClick={onOpenRegisterSalon}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Register First Branch
          </button>
        </div>
      )}

      {/* Branch Cards View */}
      {viewMode === 'cards' && sortedBranches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBranches.map((branch) => (
            <div
              key={branch.salon.id}
              className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Branch Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white p-1 overflow-hidden">
                      {branch.salon.logo ? (
                        <img
                          src={branch.salon.logo}
                          alt={branch.salon.salon_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : null}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{branch.salon.salon_name}</h3>
                      <p className="text-xs text-purple-100">{branch.salon.category_name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    branch.salon.verification_status === 'verified' ? 'bg-green-500' :
                    branch.salon.verification_status === 'pending' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {branch.salon.verification_status}
                  </span>
                </div>
              </div>

              {/* Branch Metrics */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-green-700">₱{branch.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-blue-700">{branch.appointments.length}</div>
                    <div className="text-xs text-gray-600">Bookings</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-amber-700">{branch.averageRating.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-purple-700">{branch.activeStaff}</div>
                    <div className="text-xs text-gray-600">Staff</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{branch.salon.address}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onNavigateToBranch(branch.salon.id)}
                    className="flex-1 px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => openSettings(branch.salon)}
                    className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Branch Table View */}
      {viewMode === 'table' && sortedBranches.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-50 border-b border-purple-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-700">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-700">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-700">Bookings</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-700">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-700">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedBranches.map((branch, index) => (
                  <tr key={branch.salon.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white p-0.5 overflow-hidden border border-gray-200">
                          {branch.salon.logo ? (
                            <img
                              src={branch.salon.logo}
                              alt={branch.salon.salon_name}
                              className="w-full h-full object-cover rounded-md"
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-900">{branch.salon.salon_name}</div>
                          <div className="text-xs text-gray-500">{branch.salon.category_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-green-700">₱{branch.totalRevenue.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">{branch.appointments.length}</span>
                        <span className="text-xs text-gray-500">({branch.completedBookings} completed)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-sm text-gray-900">{branch.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({branch.reviews.length})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-gray-900">{branch.activeStaff}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        branch.salon.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                        branch.salon.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {branch.salon.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigateToBranch(branch.salon.id)}
                          className="p-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openSettings(branch.salon)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          title="Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSaveSettings} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-purple-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Branch Settings</h3>
                <p className="text-xs text-gray-500">Update {editingSalon.salon_name}</p>
              </div>
              <button type="button" onClick={() => setEditingSalon(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close branch settings">
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                Branch Name
                <input value={settingsName} onChange={(event) => setSettingsName(event.target.value)} required className="mt-1 w-full rounded-xl border border-purple-200 p-2.5 text-sm" />
              </label>
              <label className="block text-xs font-semibold text-gray-700">
                Address
                <input value={settingsAddress} onChange={(event) => setSettingsAddress(event.target.value)} required className="mt-1 w-full rounded-xl border border-purple-200 p-2.5 text-sm" />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Phone
                  <input value={settingsPhone} onChange={(event) => setSettingsPhone(event.target.value)} className="mt-1 w-full rounded-xl border border-purple-200 p-2.5 text-sm" />
                </label>
                <label className="block text-xs font-semibold text-gray-700">
                  Email
                  <input type="email" value={settingsEmail} onChange={(event) => setSettingsEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-purple-200 p-2.5 text-sm" />
                </label>
              </div>
              <label className="block text-xs font-semibold text-gray-700">
                Description
                <textarea rows={3} value={settingsDescription} onChange={(event) => setSettingsDescription(event.target.value)} className="mt-1 w-full rounded-xl border border-purple-200 p-2.5 text-sm" />
              </label>
              <label className="block text-xs font-semibold text-gray-700">
                Profile Image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      onShowToast('Please choose an image smaller than 2 MB');
                      event.currentTarget.value = '';
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setSettingsLogo(String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                  className="mt-1 w-full rounded-xl border border-purple-200 bg-white p-2 text-sm"
                />
                {settingsLogo && (
                  <img src={settingsLogo} alt="Branch profile preview" className="mt-2 h-20 w-20 rounded-xl border border-purple-200 object-cover" />
                )}
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingSalon(null)} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">Cancel</button>
              <button type="submit" disabled={savingSettings || !settingsName.trim() || !settingsAddress.trim()} className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};