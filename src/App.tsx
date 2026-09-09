import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  Store,
  Scissors,
  Flame,
  Star,
  Calendar,
  Heart,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  ShieldAlert,
  Megaphone,
  Shield,
  MapPin,
  LayoutGrid,
  User as UserIcon,
} from 'lucide-react';
import { User, Salon, Service, BusinessCategory, Appointment, Announcement } from './types';
import { fetchCategories, fetchSalons, fetchAnnouncements, updateUser } from './lib/api';
import { localStorage as safeLocalStorage } from './lib/localStorage';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HeroSection } from './components/HeroSection';
import { SalonCard } from './components/SalonCard';
import { SalonDetailsModal } from './components/SalonDetailsModal';
import { ServiceCatalog } from './components/ServiceCatalog';
import { ReelsView } from './components/ReelsView';
import { BookingWizard } from './components/BookingWizard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { SalonOwnerDashboard } from './components/SalonOwnerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ReviewsView } from './components/ReviewsView';
import { LeaveReviewModal } from './components/LeaveReviewModal';
import { AuthModal } from './components/AuthModal';
import { RegisterSalonModal } from './components/RegisterSalonModal';
import { BranchRegistrationModal } from './components/BranchRegistrationModal';
import { AboutContactModal } from './components/AboutContactModal';
import { CustomerAuthPage } from './components/auth/CustomerAuthPage';
import { OwnerAuthPage } from './components/auth/OwnerAuthPage';
import { AdminAuthPage } from './components/auth/AdminAuthPage';
import { AuthPortalModal } from './components/auth/AuthPortalModal';
import { StoreLocationsMap } from './components/maps/StoreLocationsMap';
import { LandingPage } from './components/LandingPage';
import ProfileCustomizationModal from './components/ProfileCustomizationModal';
import { UserProfile } from './components/UserProfile';
import { OwnerProfile } from './components/owner/OwnerProfile';
import { FavoritesView } from './components/FavoritesView';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

const AppContent: React.FC = () => {
  // Load persisted state from localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return safeLocalStorage.getJSON<User>('nailglamhub_user');
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = safeLocalStorage.getItem('nailglamhub_activeTab');
    return savedTab || 'landing';
  });
  const [exploreViewMode, setExploreViewMode] = useState<'grid' | 'map'>('grid');

  // Core Data
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filtering
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoritesOwnerKey, setFavoritesOwnerKey] = useState<string | null>(null);

  const favoritesStorageKey = currentUser?.user_type === 'customer'
    ? `nailglamhub_favorites_${currentUser.id}`
    : null;

  useEffect(() => {
    if (!favoritesStorageKey) {
      setFavorites([]);
      setFavoritesOwnerKey(null);
      return;
    }

    const savedFavorites = safeLocalStorage.getJSON<number[]>(favoritesStorageKey);
    setFavorites(Array.isArray(savedFavorites) ? savedFavorites : []);
    setFavoritesOwnerKey(favoritesStorageKey);
  }, [favoritesStorageKey]);

  useEffect(() => {
    if (favoritesStorageKey && favoritesOwnerKey === favoritesStorageKey) {
      safeLocalStorage.setJSON(favoritesStorageKey, favorites);
    }
  }, [favorites, favoritesOwnerKey, favoritesStorageKey]);

  // Modals
  const [selectedSalonForDetails, setSelectedSalonForDetails] = useState<Salon | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingSalon, setBookingSalon] = useState<Salon | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSalon, setReviewSalon] = useState<Salon | null>(null);
  const [reviewTechnicianId, setReviewTechnicianId] = useState<number | null>(null);
  const [reviewTechnicianName, setReviewTechnicianName] = useState<string | undefined>();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [registerSalonModalOpen, setRegisterSalonModalOpen] = useState(false);
  const [branchRegistrationOpen, setBranchRegistrationOpen] = useState(false);
  const [ownerBranchRefreshKey, setOwnerBranchRefreshKey] = useState(0);
  const [aboutContactModal, setAboutContactModal] = useState<{ open: boolean; tab: 'about' | 'contact' }>({
    open: false,
    tab: 'about',
  });
  const [profileCustomizationOpen, setProfileCustomizationOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, slns, anncs] = await Promise.all([
        fetchCategories().catch(err => { console.error('Categories fetch error:', err); return []; }),
        fetchSalons().catch(err => { console.error('Salons fetch error:', err); return []; }),
        fetchAnnouncements().catch(err => { console.error('Announcements fetch error:', err); return []; }),
      ]);
      setCategories(cats);
      setSalons(slns);
      setAnnouncements(anncs);
    } catch (err) {
      console.error('Error loading data:', err);
      // Set empty arrays as fallback to prevent crashes
      setCategories([]);
      setSalons([]);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check for admin URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setIsAdminMode(true);
      setActiveTab('login-admin');
    } else {
      setIsAdminMode(false);
    }
  }, []);

  // Persist activeTab to localStorage
  useEffect(() => {
    safeLocalStorage.setItem('nailglamhub_activeTab', activeTab);
  }, [activeTab]);

  // Persist currentUser to localStorage
  useEffect(() => {
    if (currentUser) {
      safeLocalStorage.setJSON('nailglamhub_user', currentUser);
      
      // Check if user has seen profile customization popup
      const hasSeenProfilePopup = safeLocalStorage.getItem(`nailglamhub_profile_popup_${currentUser.id}`);
      if (!hasSeenProfilePopup && !currentUser.avatar) {
        // Show popup if user hasn't seen it and has no avatar
        setTimeout(() => setProfileCustomizationOpen(true), 1000);
      }
    } else {
      safeLocalStorage.removeItem('nailglamhub_user');
    }
  }, [currentUser]);

  // Strict role view enforcement
  useEffect(() => {
    if (currentUser?.user_type === 'admin') {
      if (
        !activeTab.startsWith('admin') &&
        !activeTab.startsWith('login-') &&
        !activeTab.startsWith('register') &&
        activeTab !== 'profile'
      ) {
        setActiveTab('admin-dashboard');
      }
    } else if (currentUser?.user_type === 'salon_owner') {
      if (
        !activeTab.startsWith('owner') &&
        !activeTab.startsWith('login-') &&
        !activeTab.startsWith('register') &&
        activeTab !== 'profile' &&
        activeTab !== 'owner-branches'
      ) {
        setActiveTab('owner-dashboard');
      }
    }
  }, [currentUser?.user_type, activeTab]);

  const handleToggleFavorite = (salonId: number) => {
    if (!currentUser || currentUser.user_type !== 'customer') {
      setActiveTab('login-customer');
      showToast('Please login as a customer to save favorites.');
      return;
    }

    setFavorites((prev) =>
      prev.includes(salonId) ? prev.filter((id) => id !== salonId) : [...prev, salonId]
    );
    showToast(favorites.includes(salonId) ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleRequireCustomerLogin = () => {
    setBookingModalOpen(false);
    setBookingSalon(null);
    setBookingService(null);
    setActiveTab('login-customer');
    showToast('To continue, please login to your customer account.');
  };

  const handleOpenBookingWithService = (service: Service) => {
    if (!currentUser || currentUser.user_type !== 'customer') {
      handleRequireCustomerLogin();
      return;
    }

    const s = salons.find((item) => item.id === service.salon_id) || salons[0];
    setBookingSalon(s);
    setBookingService(service);
    setBookingModalOpen(true);
  };

  const handleOpenBookingWithSalon = (salon: Salon) => {
    if (!currentUser || currentUser.user_type !== 'customer') {
      handleRequireCustomerLogin();
      return;
    }

    setBookingSalon(salon);
    setBookingService(null);
    setBookingModalOpen(true);
  };

  const handleOpenLeaveReviewForSalon = (salon: Salon, technicianId?: number | null, technicianName?: string) => {
    setReviewSalon(salon);
    setReviewTechnicianId(technicianId || null);
    setReviewTechnicianName(technicianName);
    setReviewModalOpen(true);
  };

  const handleSaveProfile = async (profileData: { avatar?: string; fullname?: string; phone?: string }) => {
    if (!currentUser) return;
    
    try {
      const updatedUser = await updateUser(currentUser.id, profileData);
      setCurrentUser(updatedUser);
      showToast('Profile updated successfully!');
      
      // Mark that user has seen the popup
      safeLocalStorage.setItem(`nailglamhub_profile_popup_${currentUser.id}`, 'true');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile');
    }
  };

  const handleSkipProfile = () => {
    if (!currentUser) return;
    
    // Mark that user has seen the popup
    safeLocalStorage.setItem(`nailglamhub_profile_popup_${currentUser.id}`, 'true');
    showToast('You can customize your profile later in settings');
  };

  // Centralized logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('landing');
    safeLocalStorage.removeItem('nailglamhub_user');
    safeLocalStorage.removeItem('nailglamhub_activeTab');
    showToast('Signed out successfully');
  };

  // Centralized navigation handler with validation
  const handleNavigate = (tab: string) => {
    // Validate navigation based on user role
    if (currentUser?.user_type === 'salon_owner') {
      const allowedTabs = ['owner-dashboard', 'owner-profile', 'explore', 'profile'];
      if (!allowedTabs.includes(tab) && !tab.startsWith('owner-')) {
        console.warn(`Navigation to ${tab} not allowed for salon owner`);
        return;
      }
    } else if (currentUser?.user_type === 'admin') {
      const allowedTabs = ['admin-dashboard', 'admin-salons', 'admin-users', 'profile'];
      if (!allowedTabs.includes(tab) && !tab.startsWith('admin-')) {
        console.warn(`Navigation to ${tab} not allowed for admin`);
        return;
      }
    }

    setActiveTab(tab);
  };

  // Filter salons for Explore tab
  const filteredSalons = salons.filter((s) => {
    const matchCategory = selectedCategory === null || s.category_id === selectedCategory;
    const matchSearch =
      !searchQuery ||
      s.salon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF8FA] text-[#2D1A28]">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-pink-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminMode={isAdminMode}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenBooking={() => {
          setBookingSalon(salons[0] || null);
          setBookingService(null);
          setBookingModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenRegisterSalon={() => setBranchRegistrationOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Live Site-Wide Announcements Broadcasted by Super Admin */}
      {announcements
        .filter((a) => a.is_active && !dismissedAnnouncements.includes(a.id))
        .map((a) => {
          const isAlert = a.type === 'alert';
          const isPromo = a.type === 'promo';
          const isMaintenance = a.type === 'maintenance';

          return (
            <div
              key={a.id}
              className={`border-b text-xs py-2 px-4 flex items-center justify-between transition-all ${
                isAlert
                  ? 'bg-red-500 text-white border-red-600'
                  : isPromo
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-700'
                  : isMaintenance
                  ? 'bg-amber-500 text-stone-900 border-amber-600 font-semibold'
                  : 'bg-stone-900 text-white border-stone-800'
              }`}
            >
              <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  {isAlert ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-white animate-bounce" />
                  ) : isPromo ? (
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                  ) : (
                    <Megaphone className="w-4 h-4 shrink-0" />
                  )}
                  <span className="font-bold tracking-wide uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/20">
                    {a.type}
                  </span>
                  <span className="font-bold truncate">{a.title}:</span>
                  <span className="truncate opacity-95">{a.message}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {a.link_url && a.link_text && (
                    <button
                      onClick={() => {
                        if (a.link_url?.startsWith('tab:')) {
                          setActiveTab(a.link_url.replace('tab:', ''));
                        } else if (a.link_url === 'booking') {
                          setBookingSalon(salons[0] || null);
                          setBookingModalOpen(true);
                        }
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-gray-900 hover:bg-gray-100 shadow-2xs transition-colors cursor-pointer"
                    >
                      {a.link_text}
                    </button>
                  )}
                  <button
                    onClick={() => setDismissedAnnouncements((prev) => [...prev, a.id])}
                    className="p-1 hover:bg-black/20 rounded-full transition-colors cursor-pointer"
                    title="Dismiss Announcement"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex gap-8 flex-1">
        {/* Pinterest-Style Sidebar */}
        <Sidebar
          currentUser={currentUser}
          technicianId={reviewTechnicianId}
          technicianName={reviewTechnicianName}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdminMode={isAdminMode}
          onOpenBooking={() => {
            setBookingSalon(salons[0] || null);
            setBookingService(null);
            setBookingModalOpen(true);
          }}
          onOpenAbout={() => setAboutContactModal({ open: true, tab: 'about' })}
          onOpenContact={() => setAboutContactModal({ open: true, tab: 'contact' })}
          onNavigate={handleNavigate}
        />

        {/* Dynamic Center Stage Views */}
        <main className="flex-1 min-w-0 pb-12">
          {/* 0. LANDING PAGE VIEW */}
          {activeTab === 'landing' && (
            <LandingPage
              salons={salons}
              categories={categories}
              currentUser={currentUser}
              onExplore={() => setActiveTab('explore')}
              onOpenLogin={() => setActiveTab('login-customer')}
              onOpenRegisterSalon={() => setActiveTab('register-owner')}
              onBookSalon={(salon) => handleOpenBookingWithSalon(salon)}
              onSelectSalon={(salon) => setSelectedSalonForDetails(salon)}
            />
          )}

          {/* 1. EXPLORE SALONS VIEW */}
          {activeTab === 'explore' && (
            <div className="space-y-8">
              {/* Hero Banner */}
              <HeroSection
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenBooking={() => {
                  setBookingSalon(salons[0] || null);
                  setBookingService(null);
                  setBookingModalOpen(true);
                }}
              />

              {/* Admin-approved promotional announcement */}
              {announcements.filter((announcement) => announcement.type === 'promo' && announcement.is_active)[0] && !searchQuery && (
                <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider text-pink-100">Admin Promotion</p>
                      <h4 className="text-sm font-bold">{announcements.find((announcement) => announcement.type === 'promo' && announcement.is_active)?.title}</h4>
                      <p className="text-xs text-pink-50 mt-0.5">{announcements.find((announcement) => announcement.type === 'promo' && announcement.is_active)?.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const promoAnnouncement = announcements.find((announcement) => announcement.type === 'promo' && announcement.is_active);
                        if (promoAnnouncement?.link_url?.startsWith('tab:')) {
                          setActiveTab(promoAnnouncement.link_url.replace('tab:', ''));
                        } else {
                          setBookingSalon(salons[0] || null);
                          setBookingService(null);
                          setBookingModalOpen(true);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-white text-pink-700 hover:bg-pink-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {announcements.find((announcement) => announcement.type === 'promo' && announcement.is_active)?.link_text || 'View Promotion'}
                    </button>
                  </div>
                </div>
              )}

              {/* Salons Header & View Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                    Verified Salons & Studios
                  </h2>
                  <p className="text-xs text-gray-500">
                    Showing {filteredSalons.length} accredited beauty spaces in Metro Manila & key hubs
                  </p>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 self-start sm:self-auto">
                  <button
                    onClick={() => setExploreViewMode('grid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      exploreViewMode === 'grid'
                        ? 'bg-white text-pink-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grid View</span>
                  </button>
                  <button
                    onClick={() => setExploreViewMode('map')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      exploreViewMode === 'map'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Interactive Map</span>
                  </button>
                </div>
              </div>

              {/* Salons Content */}
              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading beauty salons...</p>
                </div>
              ) : exploreViewMode === 'map' ? (
                <div className="animate-in fade-in duration-200">
                  <StoreLocationsMap
                    salons={salons}
                    onSelectSalon={(s) => setSelectedSalonForDetails(s)}
                    onBookSalon={(s) => handleOpenBookingWithSalon(s)}
                  />
                </div>
              ) : filteredSalons.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  No salons match your search criteria. Try a different keyword or category.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredSalons.map((salon) => (
                    <SalonCard
                      key={salon.id}
                      salon={salon}
                      onSelect={(s) => setSelectedSalonForDetails(s)}
                      onBook={(s) => handleOpenBookingWithSalon(s)}
                      isFavorite={favorites.includes(salon.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER FAVORITES */}
          {activeTab === 'favorites' && (
            currentUser?.user_type === 'customer' ? (
              <FavoritesView
                salons={salons}
                favoriteSalonIds={favorites}
                onSelectSalon={(salon) => setSelectedSalonForDetails(salon)}
                onBookSalon={(salon) => handleOpenBookingWithSalon(salon)}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              <div className="py-16 text-center bg-white rounded-3xl p-8 border border-pink-100 max-w-lg mx-auto shadow-sm">
                <Heart className="w-10 h-10 text-pink-400 mx-auto mb-3" />
                <h2 className="text-xl font-serif font-bold text-gray-900">Customer login required</h2>
                <p className="text-sm text-gray-500 mt-2">Sign in to save and view your favorite salons.</p>
                <button
                  onClick={() => setActiveTab('login-customer')}
                  className="mt-5 px-4 py-2 rounded-xl bg-pink-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Customer Login
                </button>
              </div>
            )
          )}

          {/* DEDICATED STORE LOCATIONS MAP TAB */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              <StoreLocationsMap
                salons={salons}
                onSelectSalon={(s) => setSelectedSalonForDetails(s)}
                onBookSalon={(s) => handleOpenBookingWithSalon(s)}
              />
            </div>
          )}

          {/* 2. SERVICES & MENU */}
          {activeTab === 'services' && (
            <ServiceCatalog
              salons={salons}
              onBookService={handleOpenBookingWithService}
            />
          )}

          {/* 3. REELS & INSPIRATION */}
          {activeTab === 'reels' && (
            <ReelsView
              currentUser={currentUser}
              salons={salons}
              onBookLook={(salonId) => {
                const s = salons.find((item) => item.id === salonId) || salons[0];
                handleOpenBookingWithSalon(s);
              }}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {/* 4. REVIEWS */}
          {activeTab === 'reviews' && (
            <ReviewsView
              salons={salons}
              onOpenLeaveReview={(salon) => handleOpenLeaveReviewForSalon(salon)}
            />
          )}

          {/* 5. CUSTOMER DASHBOARD */}
          {activeTab === 'customer-dashboard' && (
            currentUser?.user_type === 'customer' ? (
              <CustomerDashboard
                currentUser={currentUser}
                salons={salons}
                onOpenBooking={() => {
                  setBookingSalon(salons[0] || null);
                  setBookingService(null);
                  setBookingModalOpen(true);
                }}
                onOpenLeaveReview={(salon) => handleOpenLeaveReviewForSalon(salon)}
                onSelectSalon={(salon) => setSelectedSalonForDetails(salon)}
              />
            ) : currentUser ? (
              <div className="py-16 text-center bg-white rounded-3xl p-8 border border-pink-100 max-w-lg mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900">Client Access Restricted</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  You are currently signed in as <span className="font-semibold text-gray-800">{currentUser.fullname}</span> ({currentUser.user_type.replace('_', ' ')}). Customer booking history and appointments are only accessible via Client accounts.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setActiveTab('login-customer');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Sign Out & Switch to Client Login
                  </button>
                  <button
                    onClick={() => {
                      if (currentUser.user_type === 'salon_owner') setActiveTab('owner-dashboard');
                      else if (currentUser.user_type === 'admin') setActiveTab('admin-dashboard');
                      else setActiveTab('explore');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Return to My Workspace
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-3xl p-8 border border-pink-100 max-w-lg mx-auto">
                <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                <h3 className="text-xl font-serif font-bold text-gray-900">Sign In to View Your Bookings</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Access your upcoming appointments, receipts, and saved nail inspiration.
                </p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => setActiveTab('login-customer')}
                    className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Customer Sign In
                  </button>
                  <button
                    onClick={() => setActiveTab('register-customer')}
                    className="px-5 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-semibold cursor-pointer"
                  >
                    New Client Register
                  </button>
                </div>
              </div>
            )
          )}

          {/* 6. SALON OWNER DASHBOARD & SUB-TABS */}
          {(activeTab.startsWith('owner') ||
            (currentUser?.user_type === 'salon_owner' &&
              !activeTab.startsWith('login-') &&
              !activeTab.startsWith('register-') &&
              activeTab !== 'profile')) && (
            currentUser?.user_type === 'salon_owner' || currentUser?.user_type === 'admin' ? (
              <SalonOwnerDashboard
                currentUser={currentUser}
                onOpenRegisterSalon={() => setRegisterSalonModalOpen(true)}
                onOpenRegisterBranch={() => setBranchRegistrationOpen(true)}
                refreshKey={ownerBranchRefreshKey}
                initialTab={
                  activeTab === 'owner-services'
                    ? 'services'
                    : activeTab === 'owner-staff'
                    ? 'staff'
                    : activeTab === 'owner-location'
                    ? 'location'
                    : activeTab === 'owner-settings'
                    ? 'settings'
                    : activeTab === 'owner-appointments'
                    ? 'appointments'
                    : activeTab === 'owner-branches'
                    ? 'branches'
                    : 'overview'
                }
              />
            ) : currentUser ? (
              <div className="py-16 text-center bg-white rounded-3xl p-8 border border-purple-100 max-w-lg mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-4">
                  <Store className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900">Partner Access Restricted</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  You are currently signed in as <span className="font-semibold text-gray-800">{currentUser.fullname}</span> (Client). Salon partner operations and financial stats are protected and require a registered salon owner account.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setActiveTab('login-owner');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Sign Out & Partner Login
                  </button>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Back to Explore
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-3xl p-8 border border-purple-100 max-w-lg mx-auto">
                <Store className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <h3 className="text-xl font-serif font-bold text-gray-900">Salon Partner Portal</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Sign in with your salon owner credentials or register your salon to manage bookings and staff.
                </p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => setActiveTab('login-owner')}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Salon Partner Login
                  </button>
                  <button
                    onClick={() => setActiveTab('register-owner')}
                    className="px-5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold cursor-pointer"
                  >
                    Register New Salon
                  </button>
                </div>
              </div>
            )
          )}

          {/* 7. ADMIN DASHBOARD & GOVERNANCE SUITE */}
          {(activeTab.startsWith('admin') ||
            (currentUser?.user_type === 'admin' &&
              !activeTab.startsWith('login-') &&
              !activeTab.startsWith('register-'))) && (
            currentUser?.user_type === 'admin' ? (
              <AdminDashboard
                initialTab={
                  activeTab === 'admin-salons'
                    ? 'salons'
                    : activeTab === 'admin-users'
                    ? 'users'
                    : activeTab === 'admin-content'
                    ? 'content'
                    : activeTab === 'admin-announcements'
                    ? 'announcements'
                    : 'overview'
                }
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            ) : currentUser ? (
              <div className="py-16 text-center bg-white rounded-3xl p-8 border border-rose-100 max-w-lg mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900">Administrative Authorization Required</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  You are currently signed in as <span className="font-semibold text-gray-800">{currentUser.fullname}</span> ({currentUser.user_type.replace('_', ' ')}). System governance requires verified super administrator credentials.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setActiveTab('login-admin');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Sign Out & Admin Sign In
                  </button>
                  <button
                    onClick={() => {
                      if (currentUser.user_type === 'salon_owner') setActiveTab('owner-dashboard');
                      else setActiveTab('explore');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-3xl p-8 border border-rose-100 max-w-lg mx-auto">
                <Shield className="w-12 h-12 text-rose-600 mx-auto mb-3" />
                <h3 className="text-xl font-serif font-bold text-gray-900">Administrator Access Restricted</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Administrative access is restricted. Please use the proper admin access URL.
                </p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setActiveTab('landing');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )
          )}

          {/* 8. USER PROFILE PAGE */}
          {activeTab === 'profile' && currentUser && (
            <>
              {currentUser.user_type === 'salon_owner' ? (
                <OwnerProfile
                  currentUser={currentUser}
                  salons={salons}
                  onUpdateUser={(userData) => setCurrentUser({ ...currentUser, ...userData })}
                  onLogout={() => {
                    setCurrentUser(null);
                    setActiveTab('landing');
                    safeLocalStorage.removeItem('nailglamhub_user');
                    safeLocalStorage.removeItem('nailglamhub_activeTab');
                    showToast('Signed out successfully');
                  }}
                  onNavigateToDashboard={() => setActiveTab('owner-dashboard')}
                />
              ) : currentUser.user_type === 'admin' ? (
                <UserProfile
                  currentUser={currentUser}
                  salons={salons}
                  onUpdateUser={(userData) => setCurrentUser({ ...currentUser, ...userData })}
                  onLogout={() => {
                    setCurrentUser(null);
                    setActiveTab('landing');
                    safeLocalStorage.removeItem('nailglamhub_user');
                    safeLocalStorage.removeItem('nailglamhub_activeTab');
                    showToast('Signed out successfully');
                  }}
                  onNavigateToDashboard={() => setActiveTab('admin-dashboard')}
                />
              ) : (
                <UserProfile
                  currentUser={currentUser}
                  salons={salons}
                  onUpdateUser={(userData) => setCurrentUser({ ...currentUser, ...userData })}
                  onLogout={() => {
                    setCurrentUser(null);
                    setActiveTab('landing');
                    safeLocalStorage.removeItem('nailglamhub_user');
                    safeLocalStorage.removeItem('nailglamhub_activeTab');
                    showToast('Signed out successfully');
                  }}
                  onNavigateToDashboard={() => setActiveTab('customer-dashboard')}
                />
              )}
            </>
          )}
          {activeTab === 'profile' && !currentUser && (
            <div className="text-center py-16 bg-white rounded-3xl p-8 border border-pink-100 max-w-lg mx-auto">
              <UserIcon className="w-12 h-12 text-pink-500 mx-auto mb-3" />
              <h3 className="text-xl font-serif font-bold text-gray-900">Sign In Required</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Please sign in to view your profile.
              </p>
              <button
                onClick={() => setActiveTab('login-customer')}
                className="mt-5 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}

          {/* 9. DEDICATED AUTH PAGES */}
          {/* A. Customer Login & Register */}
          {activeTab === 'login-customer' && (
            <CustomerAuthPage
              initialMode="signin"
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                showToast(`Welcome, ${user.fullname}! Signed in as Client.`);
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'register-customer' && (
            <CustomerAuthPage
              initialMode="register"
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                showToast(`Account created! Welcome, ${user.fullname}.`);
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* B. Salon Owner Login & Register */}
          {activeTab === 'login-owner' && (
            <OwnerAuthPage
              initialMode="signin"
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                showToast(`Welcome back, Partner ${user.fullname}!`);
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'register-owner' && (
            <OwnerAuthPage
              initialMode="register"
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                loadData();
                showToast(`Salon and Partner account created for ${user.fullname}!`);
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* C. Super Admin Login & Register - Only accessible via URL parameter */}
          {activeTab === 'login-admin' && (
            <AdminAuthPage
              initialMode="signin"
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                showToast(`Admin Console authorized for ${user.fullname}.`);
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'register-admin' && (
            <AdminAuthPage
              initialMode="register"
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                showToast(`Administrator account authorized for ${user.fullname}!`);
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Salon Details Modal */}
      {selectedSalonForDetails && (
        <SalonDetailsModal
          salon={selectedSalonForDetails}
          onClose={() => setSelectedSalonForDetails(null)}
          onBookService={(salon, service) => {
            setSelectedSalonForDetails(null);
            setBookingSalon(salon);
            setBookingService(service || null);
            setBookingModalOpen(true);
          }}
          onOpenLeaveReview={(salon) => {
            setSelectedSalonForDetails(null);
            handleOpenLeaveReviewForSalon(salon);
          }}
        />
      )}

      {/* 2. Multi-Step Booking Wizard */}
      {bookingModalOpen && (
        <BookingWizard
          salons={salons}
          initialSalon={bookingSalon}
          initialService={bookingService}
          currentUser={currentUser}
          onClose={() => setBookingModalOpen(false)}
          onSuccess={(newAppt) => {
            showToast(`Appointment reserved with ${newAppt.salon_name}!`);
          }}
        />
      )}

      {/* 3. Leave Review Modal */}
      {reviewModalOpen && reviewSalon && (
        <LeaveReviewModal
          salon={reviewSalon}
          currentUser={currentUser}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={() => {
            showToast('Review submitted successfully!');
            loadData();
          }}
        />
      )}

      {/* 4. Auth Portal Selector Modal */}
      {authModalOpen && (
        <AuthPortalModal
          onClose={() => setAuthModalOpen(false)}
          onSelectPortal={(portal) => {
            setActiveTab(portal);
            setAuthModalOpen(false);
          }}
        />
      )}

      {/* 5. Register Salon Modal */}
      {registerSalonModalOpen && (
        <RegisterSalonModal
          currentUser={currentUser}
          categories={categories}
          onClose={() => setRegisterSalonModalOpen(false)}
          onSuccess={(newSalon) => {
            setSalons((prev) => [newSalon, ...prev]);
            setOwnerBranchRefreshKey((value) => value + 1);
            showToast(`Registered ${newSalon.salon_name}!`);
          }}
        />
      )}

      {branchRegistrationOpen && currentUser?.user_type === 'salon_owner' && (
        <BranchRegistrationModal
          currentUser={currentUser}
          categories={categories}
          onClose={() => setBranchRegistrationOpen(false)}
          onSuccess={(newBranch) => {
            setSalons((prev) => [newBranch, ...prev]);
            setOwnerBranchRefreshKey((value) => value + 1);
            setBranchRegistrationOpen(false);
            showToast(`Registered ${newBranch.salon_name} under your account`);
          }}
        />
      )}

      {/* 6. About / Contact Modal */}
      {aboutContactModal.open && (
        <AboutContactModal
          initialTab={aboutContactModal.tab}
          onClose={() => setAboutContactModal({ open: false, tab: 'about' })}
        />
      )}

      {/* 7. Profile Customization Modal */}
      {profileCustomizationOpen && currentUser && (
        <ProfileCustomizationModal
          isOpen={profileCustomizationOpen}
          onClose={() => setProfileCustomizationOpen(false)}
          onSave={handleSaveProfile}
          onSkip={handleSkipProfile}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
