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
  Lock,
  MapPin,
  LayoutGrid,
  User as UserIcon,
} from 'lucide-react';
import { User, Salon, Service, BusinessCategory, Appointment, Announcement, Product, ProductOrder, CartItem, PlatformStats, Reel, Review, Technician, PaymentTransaction } from './types';
import { initializeFirestoreData, subscribeToAppointments, updateFirestoreUser } from './lib/firestoreService';
import { fetchCategories, fetchSalons, fetchAnnouncements, updateUser, fetchProducts, fetchProductOrders, fetchAppointments, fetchStats, fetchReels, fetchReviews, fetchTechnicians, fetchServices, verifyAdminPermission, API_BASE } from './lib/api';
import { ajax } from './lib/ajax';
import { fetchReceiptByReference } from './lib/paymentService';
import { localStorage as safeLocalStorage } from './lib/localStorage';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HeroSection } from './components/HeroSection';
import { SalonCard, SalonCardSkeleton } from './components/SalonCard';
import { SalonDetailsModal } from './components/SalonDetailsModal';
import { ServiceCatalog } from './components/ServiceCatalog';
import { ReelsView } from './components/ReelsView';
import { BookingWizard } from './components/BookingWizard';
import { PaymentReceiptModal } from './components/payment/PaymentReceiptModal';
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
import { AdminGateModal } from './components/auth/AdminGateModal';
import { AuthPortalModal } from './components/auth/AuthPortalModal';
import { StoreLocationsMap } from './components/maps/StoreLocationsMap';
import { LandingPage } from './components/LandingPage';
import ProfileCustomizationModal from './components/ProfileCustomizationModal';
import { UserProfile } from './components/UserProfile';
import { OwnerProfile } from './components/owner/OwnerProfile';
import { FavoritesView } from './components/FavoritesView';
import { ProductCatalog } from './components/products/ProductCatalog';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { CartDrawer } from './components/products/CartDrawer';
import { ProductCheckoutModal } from './components/products/ProductCheckoutModal';
import { CustomerOrdersView } from './components/products/CustomerOrdersView';
import { EmailLogsModal } from './components/email/EmailLogsModal';
import { ChatWidget } from './components/chat/ChatWidget';
import { MobileBottomNav } from './components/MobileBottomNav';
import { scrollToElement } from './utils/scrollHelper';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationBadge } from './components/common/NotificationBadge';
import { SiteAnnouncementBar } from './components/common/SiteAnnouncementBar';

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
  // Persistent dismissed / viewed announcements so banners only persist UNLESS viewed
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>(() => {
    return safeLocalStorage.getJSON<number[]>('nailglamhub_viewed_announcements') || [];
  });
  const [loading, setLoading] = useState(true);

  // Sync viewed announcements across browser sessions/storage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nailglamhub_viewed_announcements' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setDismissedAnnouncements(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDismissAnnouncement = (id: number) => {
    setDismissedAnnouncements((prev) => {
      const next = Array.from(new Set([...prev, id]));
      safeLocalStorage.setJSON('nailglamhub_viewed_announcements', next);
      return next;
    });
  };

  const handleDismissAllAnnouncements = () => {
    setDismissedAnnouncements((prev) => {
      const allIds = announcements.map((a) => a.id);
      const next = Array.from(new Set([...prev, ...allIds]));
      safeLocalStorage.setJSON('nailglamhub_viewed_announcements', next);
      return next;
    });
  };

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
  const [aboutContactModal, setAboutContactModal] = useState<{ open: boolean; tab: 'about' | 'objectives' | 'contact' }>({
    open: false,
    tab: 'about',
  });
  const [profileCustomizationOpen, setProfileCustomizationOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminGateOpen, setAdminGateOpen] = useState(false);
  const [showEmailLogsModal, setShowEmailLogsModal] = useState(false);

  // E-Commerce / Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<ProductOrder[]>([]);
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);
  const [customerAppointments, setCustomerAppointments] = useState<Appointment[]>([]);
  const [customerAppointmentsLoading, setCustomerAppointmentsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    return safeLocalStorage.getJSON<CartItem[]>('nailglamhub_cart') || [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [targetElementId, setTargetElementId] = useState<string | null>(null);
  const [targetCartProductId, setTargetCartProductId] = useState<number | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Salon Owner notification state
  const [ownerSalons, setOwnerSalons] = useState<Salon[]>([]);
  const [ownerAppointments, setOwnerAppointments] = useState<Appointment[]>([]);
  const [ownerProductOrders, setOwnerProductOrders] = useState<ProductOrder[]>([]);
  const [ownerServices, setOwnerServices] = useState<Service[]>([]);
  const [ownerTechnicians, setOwnerTechnicians] = useState<Technician[]>([]);
  const [ownerReviews, setOwnerReviews] = useState<Review[]>([]);
  const [ownerProducts, setOwnerProducts] = useState<Product[]>([]);

  // Admin notification state
  const [adminStats, setAdminStats] = useState<PlatformStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminReels, setAdminReels] = useState<Reel[]>([]);
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);

  // Persist cart items to localStorage
  useEffect(() => {
    safeLocalStorage.setJSON('nailglamhub_cart', cartItems);
  }, [cartItems]);

  // PayMongo Payment Receipt Modal State & Persistence
  const [paymentReceiptOpen, setPaymentReceiptOpen] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<{
    appointment?: Appointment | null;
    transaction?: PaymentTransaction | null;
    salon?: Salon | null;
  } | null>(() => {
    return safeLocalStorage.getJSON<any>('nailglamhub_active_receipt') || null;
  });

  // Handler to open receipt for any past/current appointment
  const handleOpenReceiptForAppointment = (appt: Appointment) => {
    const salon = salons.find((s) => s.id === appt.salon_id) || null;
    const ref = appt.transaction_reference;
    const cached = ref ? safeLocalStorage.getJSON<any>(`nailglamhub_receipt_${ref}`) : null;

    if (cached?.appointment || cached?.transaction) {
      setReceiptData(cached);
      setPaymentReceiptOpen(true);
      return;
    }

    if (ref) {
      fetchReceiptByReference(ref).then((res) => {
        if (res.success && res.data) {
          const loaded = {
            appointment: res.data.appointment || appt,
            transaction: res.data.transaction,
            salon: res.data.salon || salon,
          };
          setReceiptData(loaded);
          setPaymentReceiptOpen(true);
          safeLocalStorage.setJSON(`nailglamhub_receipt_${ref}`, loaded);
          return;
        }
        setReceiptData({ appointment: appt, salon, transaction: null });
        setPaymentReceiptOpen(true);
      });
    } else {
      setReceiptData({ appointment: appt, salon, transaction: null });
      setPaymentReceiptOpen(true);
    }
  };

  // PayMongo Redirect Return & State Persistence Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      const paymentStatus = url.searchParams.get('payment_status');
      const ref = url.searchParams.get('ref');

      if (paymentStatus === 'success' || ref) {
        console.log('💳 PayMongo return detected:', { paymentStatus, ref });

        // 1. Immediately restore receipt from localStorage if present
        const cachedReceipt =
          (ref && safeLocalStorage.getJSON<any>(`nailglamhub_receipt_${ref}`)) ||
          safeLocalStorage.getJSON<any>('nailglamhub_active_receipt');

        if (cachedReceipt?.appointment || cachedReceipt?.transaction) {
          setReceiptData(cachedReceipt);
          setPaymentReceiptOpen(true);
        }

        // 2. Query backend to verify payment and synchronize status
        if (ref) {
          fetchReceiptByReference(ref, paymentStatus || 'success').then((res) => {
            if (res.success && res.data) {
              const verifiedReceipt = {
                appointment: res.data.appointment,
                transaction: res.data.transaction,
                salon: res.data.salon,
              };
              setReceiptData(verifiedReceipt);
              setPaymentReceiptOpen(true);
              safeLocalStorage.setJSON('nailglamhub_active_receipt', verifiedReceipt);
              safeLocalStorage.setJSON(`nailglamhub_receipt_${ref}`, verifiedReceipt);
            }
          });
        }

        // 3. Refresh user's appointments and show confirmation
        loadCustomerAppointments();
        showToast('Payment verified via PayMongo! Your appointment receipt is ready.');

        // 4. Clean up query parameters from browser URL so refreshes remain clean
        url.searchParams.delete('payment_status');
        url.searchParams.delete('ref');
        const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      } else if (paymentStatus === 'cancelled') {
        showToast('PayMongo checkout was cancelled. You can retry payment or pay in-salon.');
        url.searchParams.delete('payment_status');
        if (url.searchParams.get('ref')) url.searchParams.delete('ref');
        const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      console.warn('Error processing PayMongo redirect URL:', e);
    }
  }, []);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    // Initialize Firestore collections in background
    initializeFirestoreData().catch((err) => console.warn('Firestore init background error:', err));
    try {
      const isOwnerOrAdmin = currentUser?.user_type === 'salon_owner' || currentUser?.user_type === 'admin';
      const [cats, slns, anncs, prods] = await Promise.all([
        fetchCategories().catch(err => { console.error('Categories fetch error:', err); return []; }),
        fetchSalons(isOwnerOrAdmin ? { includeUnpublished: true } : undefined).catch(err => { console.error('Salons fetch error:', err); return []; }),
        fetchAnnouncements().catch(err => { console.error('Announcements fetch error:', err); return []; }),
        fetchProducts().catch(err => { console.error('Products fetch error:', err); return []; }),
      ]);
      setCategories(cats);

      let effectiveSalons = slns;
      if (currentUser?.id && isOwnerOrAdmin) {
        const cachedOwnerSalons = safeLocalStorage.getJSON<Salon[]>(`nailglamhub_owner_salons_${currentUser.id}`);
        if (Array.isArray(cachedOwnerSalons) && cachedOwnerSalons.length > 0) {
          const missingSalons = cachedOwnerSalons.filter(
            (cs) => !effectiveSalons.some((s) => s.id === cs.id)
          );
          if (missingSalons.length > 0) {
            effectiveSalons = [...missingSalons, ...effectiveSalons];
          }
        }
      }

      setSalons(effectiveSalons);
      setAnnouncements(anncs);
      setProducts(prods);
    } catch (err) {
      console.error('Error loading data:', err);
      // Set empty arrays as fallback to prevent crashes
      setCategories([]);
      setSalons([]);
      setAnnouncements([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated AJAX product loader for customer boutique & owner sync
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const prods = await fetchProducts();
      setProducts(prods);
      return prods;
    } catch (err) {
      console.error('Failed to load products via AJAX:', err);
      return [];
    } finally {
      setProductsLoading(false);
    }
  };

  // Live listener: sync customer catalog whenever owner adds/edits/deletes/restocks products
  useEffect(() => {
    const handleProductsUpdated = () => {
      loadProducts();
    };
    window.addEventListener('products-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('products-updated', handleProductsUpdated);
    };
  }, []);

  // Load Customer's Reserved Product Orders
  const loadCustomerOrders = async () => {
    if (!currentUser || currentUser.user_type !== 'customer') {
      setCustomerOrders([]);
      return;
    }
    setCustomerOrdersLoading(true);
    try {
      const orders = await fetchProductOrders({ customer_id: currentUser.id });
      setCustomerOrders(orders);
    } catch (err) {
      console.error('Failed to load customer product orders:', err);
    } finally {
      setCustomerOrdersLoading(false);
    }
  };

  // Load Customer's Bookings & Appointments
  const loadCustomerAppointments = async () => {
    if (!currentUser || currentUser.user_type !== 'customer') {
      setCustomerAppointments([]);
      return;
    }
    setCustomerAppointmentsLoading(true);
    try {
      const appts = await fetchAppointments({ customer_id: currentUser.id });
      const sortedAppts = (Array.isArray(appts) ? appts : []).sort((a, b) => {
        const timeB = new Date(b.updated_at || b.cancelled_at || b.created_at || (b.appointment_date ? `${b.appointment_date}T${b.appointment_time || '00:00'}` : 0)).getTime();
        const timeA = new Date(a.updated_at || a.cancelled_at || a.created_at || (a.appointment_date ? `${a.appointment_date}T${a.appointment_time || '00:00'}` : 0)).getTime();
        if (!isNaN(timeB) && !isNaN(timeA) && timeB !== timeA) return timeB - timeA;
        return Number(b.id || 0) - Number(a.id || 0);
      });
      setCustomerAppointments(sortedAppts);
    } catch (err) {
      console.error('Failed to load customer appointments:', err);
    } finally {
      setCustomerAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id && currentUser.user_type === 'customer') {
      loadCustomerOrders();
      loadCustomerAppointments();

      // Real-time Firestore sync for customer's live appointments
      const unsubscribe = subscribeToAppointments({ customer_id: currentUser.id }, (liveAppts) => {
        if (liveAppts) {
          setCustomerAppointments(liveAppts);
        }
      });
      return () => unsubscribe();
    } else {
      setCustomerOrders([]);
      setCustomerAppointments([]);
    }
  }, [currentUser?.id, currentUser?.user_type]);

  // Load Salon Owner data for sidebar counters & live badges
  const loadOwnerData = async () => {
    if (!currentUser || currentUser.user_type !== 'salon_owner') {
      setOwnerSalons([]);
      setOwnerAppointments([]);
      setOwnerProductOrders([]);
      setOwnerServices([]);
      setOwnerTechnicians([]);
      setOwnerReviews([]);
      setOwnerProducts([]);
      return;
    }
    try {
      // 1. Get owner's salons
      let mySalons = salons.filter((s) => Number(s.owner_id) === Number(currentUser.id));
      if (mySalons.length === 0) {
        mySalons = await fetchSalons({ owner_id: currentUser.id, includeUnpublished: true });
      }
      setOwnerSalons(mySalons);

      if (mySalons.length > 0) {
        const apptsAcc: Appointment[] = [];
        const ordersAcc: ProductOrder[] = [];
        const servsAcc: Service[] = [];
        const techsAcc: Technician[] = [];
        const revsAcc: Review[] = [];
        const prodsAcc: Product[] = [];

        await Promise.all(
          mySalons.map(async (salon) => {
            const [salonAppts, salonOrders, salonServs, salonTechs, salonRevs, salonProds] = await Promise.all([
              fetchAppointments({ salon_id: salon.id }).catch(() => []),
              fetchProductOrders({ salon_id: salon.id }).catch(() => []),
              fetchServices(salon.id).catch(() => []),
              fetchTechnicians(salon.id).catch(() => []),
              fetchReviews(salon.id).catch(() => []),
              fetchProducts({ salon_id: salon.id }).catch(() => []),
            ]);
            apptsAcc.push(...salonAppts);
            ordersAcc.push(...salonOrders);
            servsAcc.push(...salonServs);
            techsAcc.push(...salonTechs);
            revsAcc.push(...salonRevs);
            prodsAcc.push(...salonProds);
          })
        );

        apptsAcc.sort((a, b) => {
          const timeB = new Date(b.updated_at || b.cancelled_at || b.created_at || (b.appointment_date ? `${b.appointment_date}T${b.appointment_time || '00:00'}` : 0)).getTime();
          const timeA = new Date(a.updated_at || a.cancelled_at || a.created_at || (a.appointment_date ? `${a.appointment_date}T${a.appointment_time || '00:00'}` : 0)).getTime();
          if (!isNaN(timeB) && !isNaN(timeA) && timeB !== timeA) return timeB - timeA;
          return Number(b.id || 0) - Number(a.id || 0);
        });

        setOwnerAppointments(apptsAcc);
        setOwnerProductOrders(ordersAcc);
        setOwnerServices(servsAcc);
        setOwnerTechnicians(techsAcc);
        setOwnerReviews(revsAcc);
        setOwnerProducts(prodsAcc);
      }
    } catch (err) {
      console.warn('Failed to load owner sidebar counts:', err);
    }
  };

  // Load Admin data for sidebar governance counters
  const loadAdminData = async () => {
    if (!currentUser || currentUser.user_type !== 'admin') {
      setAdminStats(null);
      setAdminUsers([]);
      setAdminReels([]);
      setAdminReviews([]);
      return;
    }
    try {
      const [statsData, uRes, reelsData, revsData] = await Promise.all([
        fetchStats().catch(() => null),
        ajax(`${API_BASE}/users`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetchReels().catch(() => []),
        fetchReviews().catch(() => []),
      ]);
      if (statsData) setAdminStats(statsData);
      if (Array.isArray(uRes)) setAdminUsers(uRes);
      if (Array.isArray(reelsData)) setAdminReels(reelsData);
      if (Array.isArray(revsData)) setAdminReviews(revsData);
    } catch (err) {
      console.warn('Failed to load admin sidebar counts:', err);
    }
  };

  useEffect(() => {
    if (currentUser?.id && currentUser.user_type === 'salon_owner') {
      loadOwnerData();

      // Real-time Firestore sync for owner salons' appointments
      const mySalons = salons.filter((s) => Number(s.owner_id) === Number(currentUser.id));
      const unsubscribers = mySalons.map((s) =>
        subscribeToAppointments({ salon_id: s.id }, (liveAppts) => {
          if (liveAppts && liveAppts.length > 0) {
            setOwnerAppointments((prev) => {
              const otherSalonAppts = prev.filter((a) => a.salon_id !== s.id);
              const merged = [...otherSalonAppts, ...liveAppts];
              return merged.sort((a, b) => {
                const timeB = new Date(b.updated_at || b.cancelled_at || b.created_at || (b.appointment_date ? `${b.appointment_date}T${b.appointment_time || '00:00'}` : 0)).getTime();
                const timeA = new Date(a.updated_at || a.cancelled_at || a.created_at || (a.appointment_date ? `${a.appointment_date}T${a.appointment_time || '00:00'}` : 0)).getTime();
                if (!isNaN(timeB) && !isNaN(timeA) && timeB !== timeA) return timeB - timeA;
                return Number(b.id || 0) - Number(a.id || 0);
              });
            });
          }
        })
      );
      return () => {
        unsubscribers.forEach((u) => u());
      };
    } else {
      setOwnerSalons([]);
      setOwnerAppointments([]);
      setOwnerProductOrders([]);
      setOwnerServices([]);
      setOwnerTechnicians([]);
      setOwnerReviews([]);
      setOwnerProducts([]);
    }
  }, [currentUser?.id, currentUser?.user_type, salons, ownerBranchRefreshKey]);

  useEffect(() => {
    if (currentUser?.id && currentUser.user_type === 'admin') {
      loadAdminData();
    } else {
      setAdminStats(null);
      setAdminUsers([]);
      setAdminReels([]);
      setAdminReviews([]);
    }
  }, [currentUser?.id, currentUser?.user_type, salons, announcements]);

  // Synchronize appointments across customer, owner, and admin accounts on any status change
  useEffect(() => {
    const handleGlobalApptChange = () => {
      if (currentUser?.user_type === 'customer') {
        loadCustomerAppointments();
      }
      if (currentUser?.user_type === 'salon_owner') {
        loadOwnerData();
      }
      if (currentUser?.user_type === 'admin') {
        loadAdminData();
      }
    };
    window.addEventListener('appointment-status-changed', handleGlobalApptChange);
    return () => window.removeEventListener('appointment-status-changed', handleGlobalApptChange);
  }, [currentUser?.id, currentUser?.user_type]);

  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (!currentUser || currentUser.user_type !== 'customer') {
      handleRequireCustomerLogin('Please sign in to your customer account to add products to your reservation bag.');
      return;
    }
    if (product.stock_quantity <= 0) {
      showToast(`${product.name} is currently out of stock`);
      return;
    }
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = Math.min(product.stock_quantity, existing.quantity + quantity);
        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      }
      return [...prev, { product, quantity: Math.min(product.stock_quantity, quantity) }];
    });
    showToast(`Added ${quantity}x ${product.name} to cart`);
  };

  const handleUpdateCartQuantity = (productId: number, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock_quantity) {
              showToast(`Only ${item.product.stock_quantity} available in stock`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart');
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleProceedToCheckout = () => {
    if (!currentUser || currentUser.user_type !== 'customer') {
      setCartOpen(false);
      handleRequireCustomerLogin('Please sign in to your customer account to complete your reservation.');
      return;
    }
    setCartOpen(false);
    setCheckoutModalOpen(true);
  };

  const handleDirectCheckout = (product: Product, quantity: number) => {
    if (!currentUser || currentUser.user_type !== 'customer') {
      handleRequireCustomerLogin('Please sign in to your customer account to reserve products.');
      return;
    }
    handleAddToCart(product, quantity);
    setSelectedProductForDetail(null);
    setCheckoutModalOpen(true);
  };

  const handleOrderSuccess = (order: ProductOrder) => {
    setCartItems([]);
    setCheckoutModalOpen(false);
    showToast(`Reservation #${order.order_number} confirmed! Settle balance upon in-store pickup.`);
    // Refresh product stock and customer orders
    fetchProducts().then(setProducts).catch(console.error);
    loadCustomerOrders();
    setActiveTab('customer-orders');
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check for admin URL parameter, hash, or persisted session clearance
  useEffect(() => {
    const checkAdminClearance = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasAdminQuery =
        urlParams.get('admin') === 'true' ||
        urlParams.get('admin') === '1' ||
        urlParams.has('admin');
      const hash = window.location.hash.toLowerCase();
      const hasAdminHash =
        hash === '#admin' ||
        hash === '#admin-gate' ||
        hash === '#security' ||
        hash === '#secops';
      const hasSessionClearance = sessionStorage.getItem('nailglamhub_admin_unlocked') === 'true';
      const path = window.location.pathname.toLowerCase();
      const isDirectAdminPath = path === '/admin' || path.endsWith('/admin');

      if (hasSessionClearance) {
        setIsAdminMode(true);
        if (hasAdminQuery || hasAdminHash || isDirectAdminPath) {
          setActiveTab(currentUser?.user_type === 'admin' ? 'admin-dashboard' : 'login-admin');
        }
      } else if (hasAdminQuery || hasAdminHash || isDirectAdminPath) {
        setAdminGateOpen(true);
      } else {
        setIsAdminMode(false);
      }
    };

    checkAdminClearance();
    window.addEventListener('hashchange', checkAdminClearance);
    window.addEventListener('popstate', checkAdminClearance);
    return () => {
      window.removeEventListener('hashchange', checkAdminClearance);
      window.removeEventListener('popstate', checkAdminClearance);
    };
  }, [currentUser?.user_type]);

  // Covert physical security triggers:
  // 1. Keyboard shortcuts: Ctrl + Shift + A, Cmd + Shift + A, Alt + Shift + A, Ctrl + Alt + A
  // 2. Secret typing sequence: typing "admin" or "secops" when not in an input/textarea
  useEffect(() => {
    let keySequence = '';
    let sequenceTimeout: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check chord combinations
      const isAKey = e.key === 'A' || e.key === 'a';
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && isAKey) ||
        (e.altKey && e.shiftKey && isAKey) ||
        ((e.ctrlKey || e.metaKey) && e.altKey && isAKey)
      ) {
        e.preventDefault();
        setAdminGateOpen(true);
        return;
      }

      // 2. Check covert sequence typing when not focused on an input element
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (!isInput && e.key && e.key.length === 1) {
        keySequence = (keySequence + e.key.toLowerCase()).slice(-10);
        clearTimeout(sequenceTimeout);
        sequenceTimeout = setTimeout(() => {
          keySequence = '';
        }, 3000);

        if (
          keySequence.endsWith('admin') ||
          keySequence.endsWith('secops') ||
          keySequence.endsWith('glamadmin')
        ) {
          keySequence = '';
          setAdminGateOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(sequenceTimeout);
    };
  }, []);

  const handleAdminGateAuthorized = () => {
    setIsAdminMode(true);
    sessionStorage.setItem('nailglamhub_admin_unlocked', 'true');
    showToast('Administrative Security Clearance Granted');
    if (currentUser?.user_type === 'admin') {
      setActiveTab('admin-dashboard');
    } else {
      setActiveTab('login-admin');
    }
  };

  const handleLockAdminPortal = () => {
    sessionStorage.removeItem('nailglamhub_admin_unlocked');
    setIsAdminMode(false);
    showToast('Administrative Portal Locked');
    if (currentUser?.user_type === 'admin') {
      setCurrentUser(null);
    }
    setActiveTab('landing');
  };

  // Persist activeTab to localStorage and reflect in URL hash
  useEffect(() => {
    safeLocalStorage.setItem('nailglamhub_activeTab', activeTab);
    if (typeof window !== 'undefined' && activeTab && activeTab !== 'landing') {
      if (window.location.hash !== `#${activeTab}`) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    }
  }, [activeTab]);

  // Synchronize on browser history popstate or hashchange
  useEffect(() => {
    const handleUrlHashChange = () => {
      if (typeof window === 'undefined') return;
      const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!rawHash) return;
      const validTabs = [
        'landing', 'explore', 'salons', 'map', 'services', 'products',
        'reels', 'reviews', 'favorites', 'customer-dashboard', 'customer-orders',
        'profile', 'login-customer', 'register-customer', 'login-owner', 'register-owner',
        'owner-dashboard', 'owner-branches', 'owner-appointments', 'owner-services',
        'owner-staff', 'owner-inventory', 'owner-location', 'owner-settings',
        'owner-cancellation-fees', 'owner-emails', 'admin-dashboard', 'admin-salons',
        'admin-users', 'admin-content', 'admin-announcements', 'admin-appointments',
        'admin-cancellation-fees', 'admin-emails', 'admin-reports',
      ];
      if (validTabs.includes(rawHash)) {
        setActiveTab((prev) => (prev !== rawHash ? rawHash : prev));
      }
    };

    window.addEventListener('hashchange', handleUrlHashChange);
    window.addEventListener('popstate', handleUrlHashChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlHashChange);
      window.removeEventListener('popstate', handleUrlHashChange);
    };
  }, []);

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

  // Role view authorization & live database route guard protection
  useEffect(() => {
    let isCancelled = false;

    // Restrict admin portal to super admins only with live database verification
    if (activeTab.startsWith('admin')) {
      if (!currentUser || currentUser.user_type !== 'admin') {
        setActiveTab('landing');
        showToast('Administrative authorization required.');
        return;
      }

      // Explicitly verify 'admin' flag against current user's actual permission level in the database
      verifyAdminPermission(currentUser)
        .then((verification) => {
          if (isCancelled) return;
          if (!verification.authorized) {
            console.warn('[Route Guard] Admin credentials mismatch in database:', verification.error);
            setActiveTab('landing');
            showToast(verification.error || 'Access denied: User credentials do not match verified database administrator records.');
            if (verification.user_type && verification.user_type !== currentUser.user_type) {
              setCurrentUser((prev) => (prev ? { ...prev, user_type: verification.user_type! } : null));
            }
          }
        })
        .catch((err) => {
          if (isCancelled) return;
          console.error('[Route Guard] Error verifying admin credentials against database:', err);
          setActiveTab('landing');
          showToast('Security verification error. Redirected to landing.');
        });

      return () => {
        isCancelled = true;
      };
    }

    // Restrict salon owner portal to salon owners and admins
    if (activeTab.startsWith('owner')) {
      if (!currentUser || (currentUser.user_type !== 'salon_owner' && currentUser.user_type !== 'admin')) {
        setActiveTab('landing');
        showToast('Salon owner credentials required.');
      }
      return;
    }
  }, [currentUser?.id, currentUser?.user_type, activeTab]);

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

  const handleRequireCustomerLogin = (customMessage?: string) => {
    setBookingModalOpen(false);
    setBookingSalon(null);
    setBookingService(null);
    setCartOpen(false);
    setCheckoutModalOpen(false);
    setSelectedProductForDetail(null);
    setActiveTab('login-customer');
    showToast(customMessage || 'To continue, please login to your customer account.');
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
      safeLocalStorage.setJSON('nailglamhub_user', updatedUser);
      if (currentUser.id) {
        updateFirestoreUser(currentUser.id, profileData).catch(() => {});
      }
      showToast('Profile updated successfully!');
      
      // Mark that user has seen the popup
      safeLocalStorage.setItem(`nailglamhub_profile_popup_${currentUser.id}`, 'true');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile');
    }
  };

  const handleUpdateUser = (userData: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...userData };
    setCurrentUser(updated);
    safeLocalStorage.setJSON('nailglamhub_user', updated);
    if (currentUser.id) {
      updateFirestoreUser(currentUser.id, userData).catch(() => {});
      updateUser(currentUser.id, userData).catch(() => {});
    }
    showToast('Profile updated successfully!');
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
    setCartItems([]);
    safeLocalStorage.removeItem('nailglamhub_user');
    safeLocalStorage.removeItem('nailglamhub_activeTab');
    safeLocalStorage.removeItem('nailglamhub_cart');
    showToast('Signed out successfully');
  };

  // Centralized navigation handler with robust database-verified route guards
  const handleNavigate = async (tab: string, targetDomId?: string) => {
    // Restrict administrative portal with explicit database permission verification
    if (tab.startsWith('admin')) {
      if (!currentUser || currentUser.user_type !== 'admin') {
        setActiveTab('landing');
        showToast('Administrative authorization required.');
        return;
      }

      // Explicitly verify the 'admin' flag against current user's actual permission level in the database
      try {
        const verification = await verifyAdminPermission(currentUser);
        if (!verification.authorized) {
          console.warn('[handleNavigate Route Guard] Admin credentials mismatch in database:', verification.error);
          setActiveTab('landing');
          showToast(verification.error || 'Access denied: Database credentials do not match administrator permissions.');
          if (verification.user_type && verification.user_type !== currentUser.user_type) {
            setCurrentUser((prev) => (prev ? { ...prev, user_type: verification.user_type! } : null));
          }
          return;
        }
      } catch (err) {
        console.error('[handleNavigate Route Guard] Verification network error:', err);
        setActiveTab('landing');
        showToast('Security verification error. Redirected to landing.');
        return;
      }
    }

    // Restrict salon owner portal
    if (tab.startsWith('owner') && currentUser?.user_type !== 'salon_owner' && currentUser?.user_type !== 'admin') {
      setActiveTab('landing');
      showToast('Salon owner credentials required.');
      return;
    }

    setActiveTab(tab);

    if (tab === 'products') {
      loadProducts();
    }

    if (targetDomId) {
      setTargetElementId(targetDomId);
      scrollToElement(targetDomId);
    }
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

  // Client-side notification signals & numbering
  const activeCustomerBookings = customerAppointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  );
  const totalCustomerBookings = customerAppointments.filter(
    (a) => a.status !== 'cancelled'
  );
  const bookingsNotificationCount =
    activeCustomerBookings.length > 0
      ? activeCustomerBookings.length
      : totalCustomerBookings.length;

  const activeCustomerOrders = customerOrders.filter(
    (o) => o.status === 'pending_pickup' || o.status === 'ready_for_pickup'
  );
  const totalCustomerOrders = customerOrders.filter(
    (o) => o.status !== 'cancelled'
  );
  const ordersNotificationCount =
    activeCustomerOrders.length > 0
      ? activeCustomerOrders.length
      : totalCustomerOrders.length;

  // Salon Owner notification signals & numbering
  const effectiveOwnerSalons =
    ownerSalons.length > 0
      ? ownerSalons
      : salons.filter((s) => currentUser?.id && Number(s.owner_id) === Number(currentUser.id));
  const ownerPendingSalons = effectiveOwnerSalons.filter(
    (s) => s.verification_status === 'pending'
  );
  const ownerPendingAppointments = ownerAppointments.filter(
    (a) => a.status === 'pending'
  );
  const ownerActiveAppointments = ownerAppointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  );
  const ownerPendingOrders = ownerProductOrders.filter(
    (o) => o.status === 'pending_pickup'
  );

  // Admin notification signals & numbering
  const adminPendingSalons = salons.filter(
    (s) => s.verification_status === 'pending'
  );
  const adminActiveAnnouncements = announcements.filter((a) => a.is_active);
  const adminTotalAppointments =
    adminStats?.total_appointments ?? 16;
  const adminTotalUsers =
    adminUsers.length > 0
      ? adminUsers.length
      : adminStats
      ? adminStats.total_customers + adminStats.total_salon_owners + adminStats.total_admins
      : 6;
  const adminTotalSalons =
    salons.length > 0 ? salons.length : adminStats?.total_salons ?? 3;
  const adminContentCount =
    (adminReels.length > 0 ? adminReels.length : 3) +
    (adminReviews.length > 0 ? adminReviews.length : 4);

  return (
    <NotificationProvider
      currentUser={currentUser}
      announcements={announcements}
      customerAppointments={customerAppointments}
      customerOrders={customerOrders}
      ownerAppointments={ownerAppointments}
      ownerProductOrders={ownerProductOrders}
      ownerSalons={effectiveOwnerSalons}
      adminPendingSalons={adminPendingSalons}
      cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
    >
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
        onLockAdminPortal={handleLockAdminPortal}
        onOpenAdminGate={() => setAdminGateOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenBooking={() => {
          setBookingSalon(salons[0] || null);
          setBookingService(null);
          setBookingModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenRegisterSalon={() => setBranchRegistrationOpen(true)}
        onNavigate={handleNavigate}
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={(targetProductId) => {
          setCartOpen(true);
          if (targetProductId) {
            setTargetCartProductId(targetProductId);
          }
        }}
        cartItems={cartItems}
        customerAppointments={customerAppointments}
        customerOrders={customerOrders}
        announcements={announcements}
        salons={salons}
        ownerSalons={effectiveOwnerSalons}
        ownerAppointments={ownerAppointments}
        ownerProductOrders={ownerProductOrders}
        ownerReviews={ownerReviews}
        adminPendingSalons={adminPendingSalons}
        adminTotalSalons={adminTotalSalons}
        adminTotalUsers={adminTotalUsers}
        adminTotalAppointments={adminTotalAppointments}
        favoritesCount={favorites.length}
        onOpenEmailHistory={() => setShowEmailLogsModal(true)}
        dismissedAnnouncements={dismissedAnnouncements}
        onDismissAnnouncement={handleDismissAnnouncement}
        onDismissAllAnnouncements={handleDismissAllAnnouncements}
      />

      {/* Live Site-Wide Announcements Broadcasted by Super Admin - Only Persistent UNLESS Viewed */}
      <SiteAnnouncementBar
        announcements={announcements}
        dismissedAnnouncements={dismissedAnnouncements}
        onDismissAnnouncement={handleDismissAnnouncement}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenBookingModal={() => {
          setBookingSalon(salons[0] || null);
          setBookingModalOpen(true);
        }}
      />

      {/* Main Workspace Layout */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6 flex items-start gap-6 xl:gap-8 flex-1 min-h-[calc(100vh-10rem)] max-w-full overflow-x-clip">
        {/* Pinterest-Style Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdminMode={isAdminMode}
          onAdminSecretTrigger={() => setAdminGateOpen(true)}
          onOpenBooking={() => {
            setBookingSalon(salons[0] || null);
            setBookingService(null);
            setBookingModalOpen(true);
          }}
          onOpenAbout={() => setAboutContactModal({ open: true, tab: 'about' })}
          onOpenObjectives={() => setAboutContactModal({ open: true, tab: 'objectives' })}
          onOpenContact={() => setAboutContactModal({ open: true, tab: 'contact' })}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          // Customer notification signals
          bookingsCount={bookingsNotificationCount}
          activeBookingsCount={activeCustomerBookings.length}
          totalBookingsCount={totalCustomerBookings.length}
          ordersCount={ordersNotificationCount}
          activeOrdersCount={activeCustomerOrders.length}
          totalOrdersCount={totalCustomerOrders.length}
          favoritesCount={favorites.length}
          // Salon Owner notification signals
          ownerSalonsCount={effectiveOwnerSalons.length}
          ownerPendingSalonsCount={ownerPendingSalons.length}
          ownerAppointmentsCount={ownerAppointments.length}
          ownerPendingAppointmentsCount={ownerPendingAppointments.length}
          ownerActiveAppointmentsCount={ownerActiveAppointments.length}
          ownerTotalAppointmentsCount={ownerAppointments.length}
          ownerServicesCount={ownerServices.length}
          ownerStaffCount={ownerTechnicians.length}
          ownerInventoryCount={ownerProducts.length}
          ownerPendingOrdersCount={ownerPendingOrders.length}
          ownerReviewsCount={ownerReviews.length}
          // Admin notification signals
          adminPendingSalonsCount={adminPendingSalons.length}
          adminTotalSalonsCount={adminTotalSalons}
          adminTotalUsersCount={adminTotalUsers}
          adminContentCount={adminContentCount}
          adminActiveAnnouncementsCount={adminActiveAnnouncements.length}
          adminTotalAppointmentsCount={adminTotalAppointments}
        />

        {/* Dynamic Center Stage Views */}
        <main className="flex-1 min-w-0 max-w-full pb-32 sm:pb-28 lg:pb-12">
          {/* 0. LANDING PAGE VIEW */}
          {activeTab === 'landing' && (
            <LandingPage
              salons={salons}
              categories={categories}
              currentUser={currentUser}
              products={products}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onExplore={() => setActiveTab('explore')}
              onOpenLogin={() => setActiveTab('login-customer')}
              onOpenRegisterSalon={() => setActiveTab('register-owner')}
              onBookSalon={(salon) => handleOpenBookingWithSalon(salon)}
              onSelectSalon={(salon) => setSelectedSalonForDetails(salon)}
              onAddToCart={(p, qty) => handleAddToCart(p, qty || 1)}
              onSelectProduct={(p) => setSelectedProductForDetail(p)}
              onOpenProducts={() => setActiveTab('products')}
              onOpenBooking={() => {
                setBookingSalon(salons[0] || null);
                setBookingService(null);
                setBookingModalOpen(true);
              }}
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
                <div
                  aria-label="Loading verified salons"
                  aria-busy="true"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8"
                >
                  {Array.from({ length: 8 }).map((_, index) => (
                    <SalonCardSkeleton key={`salon-loading-skeleton-${index}`} />
                  ))}
                </div>
              ) : exploreViewMode === 'map' ? (
                <div className="animate-in fade-in duration-200">
                  <StoreLocationsMap
                    salons={salons}
                    onViewSalonDetails={(s) => setSelectedSalonForDetails(s)}
                    onBookSalon={(s) => handleOpenBookingWithSalon(s)}
                  />
                </div>
              ) : filteredSalons.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  No salons match your search criteria. Try a different keyword or category.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8">
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
                onViewSalonDetails={(s) => setSelectedSalonForDetails(s)}
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
                onRefreshAppointments={loadCustomerAppointments}
                onViewReceipt={handleOpenReceiptForAppointment}
                targetAppointmentId={
                  targetElementId && targetElementId.startsWith('customer-appointment-')
                    ? Number(targetElementId.replace('customer-appointment-', ''))
                    : null
                }
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

          {/* E-COMMERCE PRODUCTS & BOUTIQUE */}
          {activeTab === 'products' && (
            <ProductCatalog
              products={products}
              salons={salons}
              loading={productsLoading}
              currentUser={currentUser}
              onRequireLogin={handleRequireCustomerLogin}
              onSelectProduct={(p) => setSelectedProductForDetail(p)}
              onAddToCart={(p, qty) => handleAddToCart(p, qty || 1)}
              onOpenCart={() => setCartOpen(true)}
              cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              onRefresh={loadProducts}
            />
          )}

          {/* CUSTOMER RESERVED PRODUCT ORDERS */}
          {activeTab === 'customer-orders' && (
            <CustomerOrdersView
              orders={customerOrders}
              currentUser={currentUser}
              onRefreshOrders={loadCustomerOrders}
              onBrowseProducts={() => setActiveTab('products')}
              onOpenLogin={() => setActiveTab('login-customer')}
              targetOrderId={
                targetElementId && targetElementId.startsWith('customer-order-')
                  ? Number(targetElementId.replace('customer-order-', ''))
                  : null
              }
            />
          )}

          {/* 6. SALON OWNER DASHBOARD & SUB-TABS */}
          {activeTab.startsWith('owner') && (
            currentUser?.user_type === 'salon_owner' || currentUser?.user_type === 'admin' ? (
              <SalonOwnerDashboard
                currentUser={currentUser}
                onOpenRegisterSalon={() => setRegisterSalonModalOpen(true)}
                onOpenRegisterBranch={() => setBranchRegistrationOpen(true)}
                refreshKey={ownerBranchRefreshKey}
                initialSalons={salons.filter(
                  (s) => currentUser?.user_type === 'admin' || Number(s.owner_id) === Number(currentUser?.id)
                )}
                targetId={targetElementId}
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
                    : activeTab === 'owner-inventory'
                    ? 'inventory'
                    : activeTab === 'owner-cancellation-fees'
                    ? 'cancellation-fees'
                    : activeTab === 'owner-emails'
                    ? 'emails'
                    : 'overview'
                }
                onNavigateTab={(tab) => handleNavigate(tab)}
                onRefreshAppointments={() => {
                  loadOwnerData();
                  loadCustomerAppointments();
                }}
                onRefreshProducts={loadProducts}
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
          {activeTab.startsWith('admin') && (
            currentUser?.user_type === 'admin' ? (
              <AdminDashboard
                currentUser={currentUser}
                targetId={targetElementId}
                initialTab={
                  activeTab === 'admin-salons'
                    ? 'salons'
                    : activeTab === 'admin-users'
                    ? 'users'
                    : activeTab === 'admin-content'
                    ? 'content'
                    : activeTab === 'admin-announcements'
                    ? 'announcements'
                    : activeTab === 'admin-email_reports'
                    ? 'email_reports'
                    : 'overview'
                }
                onNavigateTab={(tab) => handleNavigate(tab)}
                onLogout={handleLogout}
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
                  onUpdateUser={handleUpdateUser}
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
                  onUpdateUser={handleUpdateUser}
                  onLogout={() => {
                    setCurrentUser(null);
                    setActiveTab('landing');
                    safeLocalStorage.removeItem('nailglamhub_user');
                    safeLocalStorage.removeItem('nailglamhub_activeTab');
                    showToast('Signed out successfully');
                  }}
                  onNavigateToDashboard={() => setActiveTab('admin-dashboard')}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              ) : (
                <UserProfile
                  currentUser={currentUser}
                  salons={salons}
                  customerAppointments={customerAppointments}
                  customerOrders={customerOrders}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onUpdateUser={handleUpdateUser}
                  onLogout={() => {
                    setCurrentUser(null);
                    setActiveTab('landing');
                    safeLocalStorage.removeItem('nailglamhub_user');
                    safeLocalStorage.removeItem('nailglamhub_activeTab');
                    showToast('Signed out successfully');
                  }}
                  onNavigateToDashboard={() => setActiveTab('customer-dashboard')}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenBooking={(salon) => handleOpenBookingWithSalon(salon || salons[0])}
                  onSelectSalon={(salon) => setSelectedSalonForDetails(salon)}
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
                setActiveTab('customer-dashboard');
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
                setActiveTab('customer-dashboard');
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
                loadData();
                showToast(`Welcome back, Partner ${user.fullname}!`);
                setActiveTab('owner-dashboard');
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
                setActiveTab('owner-dashboard');
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* C. Super Admin Login & Register - Only accessible via URL parameter or Security Gate */}
          {activeTab === 'login-admin' && (
            <AdminAuthPage
              initialMode="signin"
              currentUser={currentUser}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                showToast(`Admin Console authorized for ${user.fullname}.`);
                setActiveTab('admin-dashboard');
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'register-admin' && (
            <AdminAuthPage
              initialMode="register"
              currentUser={currentUser}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                showToast(`Administrator account authorized for ${user.fullname}!`);
                setActiveTab('admin-dashboard');
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
        </main>
      </div>

      {/* Discreet Platform & Physical Security Footer */}
      <footer className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 py-6 border-t border-pink-100/70 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <span>© 2026 Nail Glam Hub</span>
          <span>•</span>
          <span>Verified Nail Studios & Salon Management Platform</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAdminGateOpen(true)}
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Restricted Administrative Security Gate (Passcode Protected)"
          >
            <Lock className="w-3 h-3 text-stone-400 group-hover:text-rose-600 transition-colors" />
            <span>SecOps Clearance</span>
          </button>
        </div>
      </footer>

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
            loadCustomerAppointments();
            loadOwnerData();
          }}
        />
      )}

      {/* 2b. Official PayMongo Payment & Booking Receipt Modal (Permanent & Persistent across redirects) */}
      {paymentReceiptOpen && (
        <PaymentReceiptModal
          isOpen={paymentReceiptOpen}
          onClose={() => setPaymentReceiptOpen(false)}
          appointment={receiptData?.appointment}
          transaction={receiptData?.transaction}
          salon={receiptData?.salon}
          onViewAppointments={() => {
            setActiveTab('customer-dashboard');
            setPaymentReceiptOpen(false);
          }}
          onBookAnother={() => {
            setPaymentReceiptOpen(false);
            setBookingSalon(salons[0] || null);
            setBookingService(null);
            setBookingModalOpen(true);
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
            if (currentUser?.id) {
              const prevCached = safeLocalStorage.getJSON<Salon[]>(`nailglamhub_owner_salons_${currentUser.id}`) || [];
              safeLocalStorage.setJSON(`nailglamhub_owner_salons_${currentUser.id}`, [
                newSalon,
                ...prevCached.filter((s) => s.id !== newSalon.id),
              ]);
            }
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
            if (currentUser?.id) {
              const prevCached = safeLocalStorage.getJSON<Salon[]>(`nailglamhub_owner_salons_${currentUser.id}`) || [];
              safeLocalStorage.setJSON(`nailglamhub_owner_salons_${currentUser.id}`, [
                newBranch,
                ...prevCached.filter((s) => s.id !== newBranch.id),
              ]);
            }
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

      {/* 8. Product Detail Modal */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          currentUser={currentUser}
          onRequireLogin={handleRequireCustomerLogin}
          onClose={() => setSelectedProductForDetail(null)}
          onAddToCart={(product, qty) => {
            handleAddToCart(product, qty);
          }}
          onDirectCheckout={(product, qty) => {
            handleDirectCheckout(product, qty);
          }}
        />
      )}

      {/* 9. E-Commerce Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => {
          setCartOpen(false);
          setTargetCartProductId(null);
        }}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
        onContinueShopping={() => {
          setCartOpen(false);
          setTargetCartProductId(null);
        }}
        targetProductId={targetCartProductId}
      />

      {/* 10. In-Store Product Reservation Checkout Modal */}
      <ProductCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        cartItems={cartItems}
        currentUser={currentUser}
        salons={salons}
        onOrderSuccess={handleOrderSuccess}
        onViewMyOrders={() => {
          setCheckoutModalOpen(false);
          setActiveTab('customer-orders');
        }}
      />

      {/* 11. Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenBooking={() => {
          setBookingSalon(salons[0] || null);
          setBookingService(null);
          setBookingModalOpen(true);
        }}
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={(targetProductId) => {
          setCartOpen(true);
          if (targetProductId) {
            setTargetCartProductId(targetProductId);
          }
        }}
        bookingsCount={bookingsNotificationCount}
        ordersCount={ordersNotificationCount}
        ownerPendingAppointmentsCount={ownerPendingAppointments.length}
        adminPendingSalonsCount={adminPendingSalons.length}
      />

      {/* 12. AI Assistant Chatbot (Accessible across Customer, Salon Owner, and Admin views) */}
      <ChatWidget
        currentUser={currentUser}
        activeTab={activeTab}
        salons={salons}
        onNavigate={handleNavigate}
        onOpenBookingModal={() => {
          setBookingSalon(salons[0] || null);
          setBookingService(null);
          setBookingModalOpen(true);
        }}
      />

      {/* 13. Email Notifications & Monthly Reports Audit Modal */}
      {showEmailLogsModal && currentUser && (
        <EmailLogsModal
          currentUser={currentUser}
          onClose={() => setShowEmailLogsModal(false)}
        />
      )}

      {/* 14. Restricted Administrative Security Gate Modal */}
      <AdminGateModal
        isOpen={adminGateOpen}
        onClose={() => setAdminGateOpen(false)}
        onAuthorized={handleAdminGateAuthorized}
      />
    </div>
    </NotificationProvider>
  );
};
