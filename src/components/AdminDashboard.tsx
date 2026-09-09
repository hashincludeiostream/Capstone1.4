import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Store,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Sparkles,
  Tag,
  Star,
  Trash2,
  Ban,
  Check,
  X,
  Megaphone,
  Radio,
  Flame,
  MessageSquare,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  Edit,
  ExternalLink,
  Lock,
  UserCheck,
  FileText,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Salon, User, Reel, Review, Announcement, BusinessCategory } from '../types';
import {
  AdminReportData,
  generateAdminVisualHtmlReport,
  downloadFile,
  openPrintableReport,
} from '../utils/reportGenerators';
import {
  fetchStats,
  fetchSalons,
  fetchReels,
  fetchReviews,
  fetchServices,
  fetchTechnicians,
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  fetchRegistrationRateLimitStatus,
  updateRegistrationRateLimit,
  updateSalonVerification,
  toggleSalonActive,
  toggleSalonFeatured,
  deleteSalon,
  updateUserStatus,
  deleteUser,
  deleteReel,
  deleteReview,
  fetchCategories,
  API_BASE,
} from '../lib/api';

interface AdminDashboardProps {
  initialTab?: 'overview' | 'salons' | 'users' | 'content' | 'announcements';
  onNavigateTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab = 'overview',
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'salons' | 'users' | 'content' | 'announcements'>(
    initialTab || 'overview'
  );
  const [stats, setStats] = useState<any>({
    total_customers: 0,
    total_salon_owners: 0,
    total_admins: 0,
    total_salons: 0,
    verified_salons: 0,
    pending_salons: 0,
    total_appointments: 0,
    pending_appointments: 0,
    confirmed_appointments: 0,
    completed_appointments: 0,
    total_reviews: 0,
    total_reels: 0,
    total_announcements: 0,
    active_announcements: 0,
    estimated_gmv: 0,
    platform_commission: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [registrationRateLimitEnabled, setRegistrationRateLimitEnabled] = useState(true);
  const [updatingRegistrationRateLimit, setUpdatingRegistrationRateLimit] = useState(false);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'salon_owner' | 'admin'>('all');
  const [salonSearch, setSalonSearch] = useState('');
  const [salonFilter, setSalonFilter] = useState<'all' | 'pending' | 'verified' | 'featured'>('all');
  const [contentSubTab, setContentSubTab] = useState<'reels' | 'reviews'>('reels');

  // Modals & Forms
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'promo' as 'info' | 'promo' | 'alert' | 'maintenance',
    target_audience: 'all' as 'all' | 'customers' | 'owners',
    link_text: '',
    link_url: '',
    is_active: true,
  });

  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    user_type: 'customer' as 'customer' | 'salon_owner' | 'admin',
    admin_code: 'ADMIN2025',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync external tab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sData, allSalons, allReels, allReviews, allAnnounce, allCats, allServices, allTechnicians] = await Promise.all([
        fetchStats(),
        fetchSalons({ includeUnpublished: true }),
        fetchReels(),
        fetchReviews(),
        fetchAnnouncements(),
        fetchCategories(),
        fetchServices(),
        fetchTechnicians(),
      ]);

      setStats(sData);
      setSalons(allSalons);
      setReels(allReels);
      setReviews(allReviews);
      setAnnouncements(allAnnounce);
      setCategories(allCats);
      setServices(allServices);
      setTechnicians(allTechnicians);

      try {
        setRegistrationRateLimitEnabled(await fetchRegistrationRateLimitStatus());
      } catch (error) {
        console.warn('Failed to load registration rate-limit status:', error);
      }

      const uRes = await fetch(`${API_BASE}/users`);
      if (uRes.ok) {
        const uList = await uRes.json();
        setUsers(uList);
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleToggleRegistrationRateLimit = async () => {
    setUpdatingRegistrationRateLimit(true);
    try {
      const enabled = await updateRegistrationRateLimit(!registrationRateLimitEnabled);
      setRegistrationRateLimitEnabled(enabled);
      showToast(enabled ? 'Registration protection enabled' : 'Registration protection disabled');
    } catch (error) {
      console.error('Failed to update registration rate-limit:', error);
      showToast('Unable to update registration protection');
    } finally {
      setUpdatingRegistrationRateLimit(false);
    }
  };

  // ----------------------------------------------------
  // SALON ACTIONS
  // ----------------------------------------------------
  const handleVerifySalon = async (salonId: number, status: 'verified' | 'pending' | 'rejected') => {
    const ok = await updateSalonVerification(salonId, status);
    if (ok) {
      setSalons((prev) =>
        prev.map((s) => (s.id === salonId ? { ...s, verification_status: status } : s))
      );
      showToast(`Salon status changed to ${status.toUpperCase()}`);
    }
  };

  const handleToggleActiveSalon = async (salonId: number) => {
    const ok = await toggleSalonActive(salonId);
    if (ok) {
      setSalons((prev) =>
        prev.map((s) => (s.id === salonId ? { ...s, is_active: !s.is_active } : s))
      );
      showToast('Salon availability status updated');
    }
  };

  const handleToggleFeaturedSalon = async (salonId: number) => {
    const ok = await toggleSalonFeatured(salonId);
    if (ok) {
      setSalons((prev) =>
        prev.map((s) => (s.id === salonId ? { ...s, featured: !s.featured } : s))
      );
      showToast('Featured spotlight badge updated');
    }
  };

  const handleDeleteSalon = async (salonId: number, salonName: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${salonName}" from the platform?`)) return;
    const ok = await deleteSalon(salonId);
    if (ok) {
      setSalons((prev) => prev.filter((s) => s.id !== salonId));
      showToast(`Removed salon "${salonName}"`);
    }
  };

  // ----------------------------------------------------
  // USER ACTIONS
  // ----------------------------------------------------
  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const ok = await updateUserStatus(user.id, newStatus);
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      showToast(`User account is now ${newStatus.toUpperCase()}`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user account "${user.fullname}" (${user.email})?`)) return;
    const ok = await deleteUser(user.id);
    if (ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`Deleted user account ${user.fullname}`);
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullname || !newUserForm.email) {
      alert('Please fill in user name and email');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUsers((prev) => [...prev, data.user]);
        setNewUserModalOpen(false);
        setNewUserForm({
          fullname: '',
          email: '',
          phone: '',
          user_type: 'customer',
          admin_code: 'ADMIN2025',
        });
        showToast(`Created new ${data.user.user_type} account for ${data.user.fullname}`);
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) {
      alert('Network error while provisioning user');
    }
  };

  // ----------------------------------------------------
  // ANNOUNCEMENT ACTIONS
  // ----------------------------------------------------
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.message) {
      alert('Title and message are required.');
      return;
    }

    if (editingAnnouncement) {
      const updated = await updateAnnouncement(editingAnnouncement.id, announcementForm);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === editingAnnouncement.id ? updated : a))
      );
      showToast('Announcement updated successfully');
    } else {
      const created = await createAnnouncement(announcementForm);
      setAnnouncements((prev) => [created, ...prev]);
      showToast('Broadcast published to site');
    }

    setAnnouncementModalOpen(false);
    setEditingAnnouncement(null);
    setAnnouncementForm({
      title: '',
      message: '',
      type: 'promo',
      target_audience: 'all',
      link_text: '',
      link_url: '',
      is_active: true,
    });
  };

  const handleToggleAnnouncementActive = async (item: Announcement) => {
    const updated = await updateAnnouncement(item.id, { is_active: !item.is_active });
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === item.id ? updated : a))
    );
    showToast(updated.is_active ? 'Announcement activated' : 'Announcement paused');
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!window.confirm('Delete this announcement broadcast?')) return;
    const ok = await deleteAnnouncement(id);
    if (ok) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      showToast('Announcement deleted');
    }
  };

  // ----------------------------------------------------
  // CONTENT MODERATION (REELS & REVIEWS)
  // ----------------------------------------------------
  const handleDeleteReel = async (id: number, title: string) => {
    if (!window.confirm(`Delete reel "${title}"?`)) return;
    const ok = await deleteReel(id);
    if (ok) {
      setReels((prev) => prev.filter((r) => r.id !== id));
      showToast('Video reel removed from public feed');
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!window.confirm('Delete this customer review?')) return;
    const ok = await deleteReview(id);
    if (ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('Review removed from salon ratings');
    }
  };

  // Filtered lists
  const filteredUsers = (users || []).filter((u) => {
    const name = (u.fullname || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || '');
    const q = (userSearch || '').toLowerCase();
    const matchSearch = name.includes(q) || email.includes(q) || phone.includes(q);
    const matchRole = userRoleFilter === 'all' || u.user_type === userRoleFilter;
    return matchSearch && matchRole;
  });

  const pendingSalons = (salons || []).filter((s) => s.verification_status === 'pending');

  const filteredSalons = (salons || []).filter((s) => {
    const name = (s.salon_name || '').toLowerCase();
    const addr = (s.address || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const q = (salonSearch || '').toLowerCase();
    const matchSearch = name.includes(q) || addr.includes(q) || email.includes(q);

    if (salonFilter === 'pending') return matchSearch && s.verification_status === 'pending';
    if (salonFilter === 'verified') return matchSearch && s.verification_status === 'verified';
    if (salonFilter === 'featured') return matchSearch && !!s.featured;
    return matchSearch;
  });

  // Admin Data Visualization Report Generator
  const adminReportData: AdminReportData = {
    generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
    totalSalons: salons.length,
    verifiedSalons: salons.filter((s) => s.verification_status === 'verified').length,
    pendingSalons: pendingSalons.length,
    totalUsers: users.length,
    totalAppointments: stats?.total_appointments || 0,
    fulfillmentRate: stats?.total_appointments
      ? Math.round(((stats.completed_appointments || 0) / stats.total_appointments) * 1000) / 10
      : 0,
    totalReviews: reviews.length,
    avgRating: reviews.length > 0
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : 0,
    salonsList: salons.map((s) => ({
      name: s.salon_name,
      city: s.city || 'Not provided',
      status: s.verification_status || 'pending',
      servicesCount: services.filter((service) => service.salon_id === s.id).length,
      staffCount: technicians.filter((technician) => technician.salon_id === s.id).length,
    })),
  };

  const handleDownloadAdminHtmlReport = () => {
    const html = generateAdminVisualHtmlReport(adminReportData);
    const filename = `Nail_Glam_Hub_Platform_Decision_Report_${new Date().toISOString().split('T')[0]}.html`;
    downloadFile(html, filename, 'text/html');
    showToast('Platform Visual Decision Report (HTML) downloaded');
  };

  const handlePrintAdminReport = () => {
    const html = generateAdminVisualHtmlReport(adminReportData);
    openPrintableReport(html);
    showToast('Opening print preview for PDF report');
  };

  const handleExportAdminCsv = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Nail Glam Hub - Platform Governance & Growth Audit\n';
    csv += `Date: ${new Date().toLocaleDateString()}\n\n`;
    csv += `--- ECOSYSTEM SUMMARY ---\n`;
    csv += `Total Salons,${salons.length}\n`;
    csv += `Verified Branches,${adminReportData.verifiedSalons}\n`;
    csv += `Pending Approvals,${pendingSalons.length}\n`;
    csv += `Registered Users,${users.length}\n`;
    csv += `Total Appointments,${adminReportData.totalAppointments}\n`;
    csv += `Average Rating,${adminReportData.avgRating || 'Not rated'}\n\n`;

    csv += `--- REGISTERED SALON PARTNERS ---\n`;
    csv += `ID,Salon Name,City,Status,Rating,Reviews,Address\n`;
    salons.forEach((s) => {
      csv += `${s.id},"${s.salon_name}","${s.city || ''}","${s.verification_status}",${s.avg_rating || 'Not rated'},${s.review_count || 0},"${(s.address || '').replace(/"/g, '""')}"\n`;
    });

    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Nail_Glam_Hub_Admin_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Platform CSV Audit exported');
  };

  const activityItems = [
    {
      title: 'Database data synchronized',
      detail: `${salons.length} salons, ${users.length} user accounts, and ${reviews.length} reviews loaded.`,
      color: 'bg-emerald-500',
    },
    {
      title: 'Salon approval queue updated',
      detail: `${pendingSalons.length} salon applications currently require review.`,
      color: 'bg-amber-500',
    },
    {
      title: 'Appointment metrics updated',
      detail: `${stats?.total_appointments || 0} appointments recorded across all branches.`,
      color: 'bg-pink-500',
    },
    {
      title: 'Broadcast status synchronized',
      detail: `${announcements.filter((announcement) => announcement.is_active).length} announcements are currently live.`,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-rose-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Console */}
      <div className="bg-gradient-to-r from-stone-950 via-rose-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-rose-900/30">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Central Control Hub & Governance</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
            Platform Master Console
          </h2>
          <p className="text-xs sm:text-sm text-rose-100/70 max-w-xl">
            Administer verified salons, user accounts, content moderation, and site-wide broadcast announcements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadAdminHtmlReport}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-500 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Download Platform Report</span>
          </button>
          <button
            onClick={handlePrintAdminReport}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
          <button
            onClick={handleExportAdminCsv}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer"
          >
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>
          <button
            onClick={() => {
              setEditingAnnouncement(null);
              setAnnouncementForm({
                title: '',
                message: '',
                type: 'promo',
                target_audience: 'all',
                link_text: '',
                link_url: '',
                is_active: true,
              });
              setAnnouncementModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>+ Broadcast</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Registration Rate Protection</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Limit repeated account registrations from the same IP address.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={registrationRateLimitEnabled}
          aria-label="Toggle registration rate protection"
          onClick={handleToggleRegistrationRateLimit}
          disabled={updatingRegistrationRateLimit}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60 ${
            registrationRateLimitEnabled ? 'bg-emerald-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              registrationRateLimitEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Admin Tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-1.5 border border-pink-100 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-pink-50/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Overview & Health</span>
        </button>

        <button
          onClick={() => setActiveTab('salons')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'salons'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-pink-50/50'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Salon Approvals & Directory</span>
          {pendingSalons.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-stone-900">
              {pendingSalons.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-pink-50/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'content'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-pink-50/50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Content Moderation</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'announcements'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-pink-50/50'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Promotions & Broadcasts ({announcements.length})</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. OVERVIEW & ANALYTICS TAB                          */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key KPI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
              <p className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-1">
                {stats?.total_appointments || 0}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Directory Appointments</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fulfillment Rate</p>
              <p className="text-xl sm:text-2xl font-serif font-bold text-rose-700 mt-1">
                {adminReportData.fulfillmentRate}%
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">In-Salon Completion</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Salons</p>
              <p className="text-xl sm:text-2xl font-serif font-bold text-purple-900 mt-1">
                {salons.length}
              </p>
              <p className="text-[10px] text-purple-600 font-semibold mt-1">
                {stats?.verified_salons || salons.filter((s) => s.verification_status === 'verified').length} Verified
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Owners</p>
              <p className="text-xl sm:text-2xl font-serif font-bold text-amber-600 mt-1">
                {pendingSalons.length}
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Awaiting Review</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
              <p className="text-xl sm:text-2xl font-serif font-bold text-indigo-900 mt-1">
                {users.length}
              </p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-1">Registered Accounts</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Reviews</p>
              <p className="text-xl sm:text-2xl font-serif font-bold text-pink-700 mt-1">
                {reviews.length}
              </p>
              <p className="text-[10px] text-pink-600 font-semibold mt-1">
                {reviews.length > 0
                  ? `${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)}/5.0 Avg Rating`
                  : 'Not rated yet'}
              </p>
            </div>
          </div>

          {/* Pending Owner Approvals Banner (If Any) */}
          {pendingSalons.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    {pendingSalons.length} Salon Registration Application{pendingSalons.length > 1 ? 's' : ''} Pending Admin Review
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Review and verify partner credentials to allow their branches to go live on the public directory.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('salons');
                  setSalonFilter('pending');
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
              >
                Review Applications
              </button>
            </div>
          )}

          {/* System Overview Dashboard Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Platform Quick Governance Actions */}
            <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xs space-y-4">
              <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-700" />
                <span>Central Management Tools</span>
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('salons')}
                  className="w-full text-left p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-50 border border-pink-100 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-purple-700" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Verify & Approve Salons</p>
                      <p className="text-[11px] text-gray-500">Manage {salons.length} registered locations</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full text-left p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-50 border border-pink-100 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-indigo-700" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">User Roles & Access Audit</p>
                      <p className="text-[11px] text-gray-500">Inspect customers, owners, admins</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => setActiveTab('announcements')}
                  className="w-full text-left p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-50 border border-pink-100 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-rose-700" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Publish Site Broadcasts</p>
                      <p className="text-[11px] text-gray-500">{announcements.filter((a) => a.is_active).length} live banners active</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => setActiveTab('content')}
                  className="w-full text-left p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-50 border border-pink-100 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Flame className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Moderate Reels & Reviews</p>
                      <p className="text-[11px] text-gray-500">{reels.length} reels, {reviews.length} reviews</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Live Platform Security & Activity Log */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-pink-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-700" />
                  <span>Platform Activity & Audit Log</span>
                </h3>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time Security Guard Active
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-gray-50">
                {activityItems.map((item) => (
                  <div key={item.title} className="pt-2 flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${item.color} mt-1.5 shrink-0`} />
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-gray-500 text-[11px]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Decision-Making & Visual Analytics Reports Card */}
          <div className="bg-gradient-to-r from-purple-950 via-rose-950 to-stone-950 rounded-3xl p-6 text-white border border-rose-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-[11px] font-bold uppercase tracking-wider border border-pink-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Executive Decision Support</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold">
                Platform Intelligence & Governance Visual Reports
              </h3>
              <p className="text-xs text-rose-100/70 leading-relaxed">
                Download interactive visual infographics, city saturation breakdowns, salon compliance scores, and ecosystem health reports formatted for stakeholders and branch partners.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadAdminHtmlReport}
                className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-lg shadow-pink-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download Visual Report (HTML)</span>
              </button>
              <button
                onClick={handlePrintAdminReport}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Print / PDF</span>
              </button>
              <button
                onClick={handleExportAdminCsv}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Export Audit CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. SALON APPROVALS & DIRECTORY TAB                  */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'salons' && (
        <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-900">
                Salon Marketplace Directory & Approvals
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review owner registrations, verify legitimacy, toggle active listings, or spotlight top branches.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={salonSearch}
                  onChange={(e) => setSalonSearch(e.target.value)}
                  placeholder="Search salons..."
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-pink-200 text-xs focus:outline-rose-500 w-48"
                />
              </div>

              <button
                onClick={() => setSalonFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  salonFilter === 'all' ? 'bg-rose-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({salons.length})
              </button>

              <button
                onClick={() => setSalonFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                  salonFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Pending ({pendingSalons.length})
              </button>

              <button
                onClick={() => setSalonFilter('verified')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  salonFilter === 'verified' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                Verified
              </button>

              <button
                onClick={() => setSalonFilter('featured')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  salonFilter === 'featured' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                Featured
              </button>
            </div>
          </div>

          {/* Salons Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSalons.length === 0 ? (
              <div className="lg:col-span-2 bg-white rounded-2xl p-12 text-center border border-dashed border-pink-200">
                <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No salons found</p>
                <p className="text-xs text-gray-400 mt-1">No salon entries matched your search or verification filter.</p>
              </div>
            ) : (
              filteredSalons.map((s) => (
                <div
                  key={s.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    s.verification_status === 'pending'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-pink-100 bg-white hover:border-pink-200'
                  } shadow-xs space-y-3`}
                >
                <div className="flex items-start gap-4">
                  <img
                    src={s.logo}
                    alt={s.salon_name}
                    className="w-16 h-16 rounded-2xl object-cover border border-pink-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{s.salon_name}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {s.verification_status === 'pending' ? (
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Pending Review
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{s.address}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {s.avg_rating} ({s.review_count})
                      </span>
                      <span>•</span>
                      <span className="text-gray-500 font-medium">{s.phone}</span>
                      <span>•</span>
                      <span className="text-purple-700 font-semibold">{s.category_name || 'Nail Studio'}</span>
                    </div>
                  </div>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl line-clamp-2">
                  {s.description}
                </p>

                {/* Admin Management Controls */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {s.verification_status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleVerifySalon(s.id, 'verified')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve & Verify
                        </button>
                        <button
                          onClick={() => handleVerifySalon(s.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          handleVerifySalon(
                            s.id,
                            s.verification_status === 'verified' ? 'pending' : 'verified'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-[11px] font-semibold cursor-pointer"
                      >
                        {s.verification_status === 'verified' ? 'Revoke Verification' : 'Re-verify'}
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleActiveSalon(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        s.is_active
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-rose-100 text-rose-800 font-bold'
                      }`}
                    >
                      {s.is_active ? 'Set Inactive' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleToggleFeaturedSalon(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        s.featured
                          ? 'bg-purple-100 text-purple-800 font-bold'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s.featured ? '★ Featured' : 'Feature'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteSalon(s.id, s.salon_name)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Salon from Platform"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. USER ACCOUNTS DIRECTORY TAB                       */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-900">
                User Accounts & Permissions Directory
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Audit registered clients, salon owners, and administrator accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name, email..."
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-pink-200 text-xs focus:outline-rose-500 w-52"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="py-1.5 px-3 rounded-xl border border-pink-200 text-xs bg-white text-gray-700 font-semibold focus:outline-rose-500 cursor-pointer"
              >
                <option value="all">All Roles ({users.length})</option>
                <option value="customer">Clients ({users.filter((u) => u.user_type === 'customer').length})</option>
                <option value="salon_owner">Salon Owners ({users.filter((u) => u.user_type === 'salon_owner').length})</option>
                <option value="admin">Administrators ({users.filter((u) => u.user_type === 'admin').length})</option>
              </select>

              <button
                onClick={() => setNewUserModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Provision User</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pink-50/50 text-gray-700 font-bold border-b border-pink-100">
                <tr>
                  <th className="p-3.5">User Identity</th>
                  <th className="p-3.5">Contact Info</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 text-gray-600">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No user accounts match your search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-pink-50/30">
                      <td className="p-3.5 flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.fullname}
                            className="w-9 h-9 rounded-full object-cover border border-pink-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center border border-pink-200">
                            <span className="text-white text-xs font-bold">
                              {u.fullname.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{u.fullname}</p>
                          <p className="text-[11px] text-gray-400">ID: #{u.id} • Registered {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-gray-800">{u.email}</p>
                        <p className="text-[11px] text-gray-500">{u.phone || 'No phone'}</p>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                            u.user_type === 'admin'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : u.user_type === 'salon_owner'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-pink-100 text-pink-800 border border-pink-200'
                          }`}
                        >
                          {u.user_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {u.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            u.status === 'suspended'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>

                        {u.user_type !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg inline-flex items-center cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. CONTENT & MEDIA MODERATION TAB                    */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-900">
                Media & Public Content Moderation
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Inspect public video reels and review comments to ensure marketplace quality.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setContentSubTab('reels')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  contentSubTab === 'reels' ? 'bg-rose-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Nail Reels ({reels.length})</span>
              </button>

              <button
                onClick={() => setContentSubTab('reviews')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  contentSubTab === 'reviews' ? 'bg-rose-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Customer Reviews ({reviews.length})</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Reels Moderation */}
          {contentSubTab === 'reels' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {reels.map((r) => (
                <div key={r.id} className="rounded-2xl border border-pink-100 bg-white overflow-hidden shadow-xs space-y-2">
                  <div className="relative aspect-video bg-black">
                    <img
                      src={r.thumbnail}
                      alt={r.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] bg-black/60 backdrop-blur-xs px-2 py-1 rounded-lg">
                      <span className="font-semibold">{r.salon_name}</span>
                      <span>{r.views} views</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <h5 className="font-bold text-gray-900 text-xs line-clamp-1">{r.title}</h5>
                    <p className="text-[11px] text-gray-500 line-clamp-2">{r.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                      <span>❤️ {r.likes} likes</span>
                      <button
                        onClick={() => handleDeleteReel(r.id, r.title)}
                        className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-Tab 2: Reviews Moderation */}
          {contentSubTab === 'reviews' && (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl border border-pink-100 bg-white flex items-start justify-between gap-4 shadow-xs">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs">{rev.customer_name}</span>
                      <span className="text-[10px] text-gray-400">reviewed</span>
                      <span className="font-semibold text-purple-900 text-xs">{rev.salon_name || 'Salon'}</span>
                      <div className="flex items-center text-amber-500 text-xs font-bold ml-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                        {rev.rating}.0
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl italic">
                      "{rev.review_text}"
                    </p>
                    <p className="text-[10px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer shrink-0"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. SITE BROADCASTS & ANNOUNCEMENTS TAB               */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-700" />
                <span>Promotions & Global Broadcasts</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Approve, pause, and remove every promotion or announcement shown across customer and owner portals.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setAnnouncementForm({
                  title: '',
                  message: '',
                  type: 'promo',
                  target_audience: 'all',
                  link_text: '',
                  link_url: '',
                  is_active: true,
                });
                setAnnouncementModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-pink-700 hover:from-rose-800 hover:to-pink-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-700/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Broadcast</span>
            </button>
          </div>

          {/* Announcements List */}
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-pink-200">
                <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No active announcements</p>
                <p className="text-xs text-gray-400 mt-1">Create a broadcast to alert users across the site.</p>
              </div>
            ) : (
              announcements.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    item.is_active ? 'border-pink-200 bg-pink-50/20' : 'border-gray-200 bg-gray-50/50 opacity-75'
                  } space-y-3 shadow-xs`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          item.type === 'promo'
                            ? 'bg-pink-100 text-pink-800'
                            : item.type === 'alert'
                            ? 'bg-amber-100 text-amber-800'
                            : item.type === 'maintenance'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.type}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                        Audience: {item.target_audience.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {item.is_active ? 'LIVE ON SITE' : 'PAUSED'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">{item.message}</p>

                  {item.link_text && (
                    <p className="text-xs text-pink-700 font-semibold flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>Action CTA: "{item.link_text}"</span>
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400">
                      Created {new Date(item.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAnnouncementActive(item)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                          item.is_active
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-emerald-600 text-white font-bold'
                        }`}
                      >
                        {item.is_active ? 'Pause Broadcast' : 'Activate'}
                      </button>

                      <button
                        onClick={() => {
                          setEditingAnnouncement(item);
                          setAnnouncementForm({
                            title: item.title,
                            message: item.message,
                            type: item.type,
                            target_audience: item.target_audience,
                            link_text: item.link_text || '',
                            link_url: item.link_url || '',
                            is_active: item.is_active,
                          });
                          setAnnouncementModalOpen(true);
                        }}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                        title="Edit Announcement"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT ANNOUNCEMENT                    */}
      {/* ---------------------------------------------------- */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-pink-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-700" />
                <span>{editingAnnouncement ? 'Edit Announcement Broadcast' : 'Publish New Site Broadcast'}</span>
              </h3>
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Broadcast Headline</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g., ✨ Summer Nail Festival — 20% OFF All Salons"
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:outline-rose-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Announcement Message Body</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  placeholder="Describe the promotion, platform update, or important notice for users..."
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:outline-rose-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Banner Type</label>
                  <select
                    value={announcementForm.type}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value as any })}
                    className="w-full p-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold focus:outline-rose-600"
                  >
                    <option value="promo">Promo (Pink / Gold)</option>
                    <option value="info">Info (Blue)</option>
                    <option value="alert">Alert (Amber)</option>
                    <option value="maintenance">Maintenance (Rose)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Target Audience</label>
                  <select
                    value={announcementForm.target_audience}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, target_audience: e.target.value as any })}
                    className="w-full p-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold focus:outline-rose-600"
                  >
                    <option value="all">All Users (Public)</option>
                    <option value="customers">Customers Only</option>
                    <option value="owners">Salon Partners Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Action Button Text (Optional)</label>
                <input
                  type="text"
                  value={announcementForm.link_text}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, link_text: e.target.value })}
                  placeholder="e.g., Claim Discount or Learn More"
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:outline-rose-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ann-is-active"
                  checked={announcementForm.is_active}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <label htmlFor="ann-is-active" className="text-xs font-semibold text-gray-800">
                  Publish live to site immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold shadow-md cursor-pointer"
                >
                  {editingAnnouncement ? 'Save Changes' : 'Broadcast to Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: PROVISION NEW USER                           */}
      {/* ---------------------------------------------------- */}
      {newUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-pink-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-rose-700" />
                <span>Provision User Account</span>
              </h3>
              <button
                onClick={() => setNewUserModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserForm.fullname}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullname: e.target.value })}
                  placeholder="e.g. Maria Clara Santos"
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:outline-rose-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="name@nailglamhub.com"
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:outline-rose-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="0917-000-0000"
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:outline-rose-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Assigned Role</label>
                <select
                  value={newUserForm.user_type}
                  onChange={(e) => setNewUserForm({ ...newUserForm, user_type: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-xs focus:outline-rose-600"
                >
                  <option value="customer">Client / Customer</option>
                  <option value="salon_owner">Salon Owner / Partner</option>
                  <option value="admin">Super Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold shadow-md cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
