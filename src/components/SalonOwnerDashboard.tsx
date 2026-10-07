import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  DollarSign,
  Calendar,
  Users,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Scissors,
  Trash2,
  Edit2,
  Sparkles,
  Phone,
  AlertCircle,
  BarChart3,
  Search,
  Filter,
  UserCheck,
  Building,
  MapPin,
  Save,
  Check,
  RefreshCw,
  Package,
  AlertTriangle,
  Image as ImageIcon,
  X,
  ShieldAlert,
  User as UserIcon,
  Upload,
} from 'lucide-react';
import { Salon, Service, Technician, Appointment, User, Review, AppointmentStatus, WorkingHour, Product, ProductOrder } from '../types';
import { localStorage as safeLocalStorage } from '../lib/localStorage';
import { subscribeToAppointments } from '../lib/firestoreService';
import {
  fetchSalons,
  fetchServices,
  fetchTechnicians,
  fetchAppointments,
  fetchReviews,
  fetchWorkingHours,
  fetchProducts,
  fetchProductOrders,
  updateAppointmentStatus,
  updateAppointmentTechnician,
  updateSalon,
  updateWorkingHours,
  API_BASE,
} from '../lib/api';
import { StoreOverviewReports } from './owner/StoreOverviewReports';
import { BranchOverview } from './owner/BranchOverview';
import { OwnerLocationPicker } from './maps/OwnerLocationPicker';
import { ProductInventoryManager } from './owner/ProductInventoryManager';
import { LateCancellationFeesManager } from './owner/LateCancellationFeesManager';
import { OwnerEmailReportsManager } from './owner/OwnerEmailReportsManager';
import { CancelBookingConfirmationModal } from './cancellation/CancelBookingConfirmationModal';
import { useNotifications } from '../context/NotificationContext';
import { EmptyState } from './EmptyState';
import { scrollToElement } from '../utils/scrollHelper';

const DEFAULT_WORKING_HOURS: WorkingHour[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
].map((day, index) => ({
  id: index,
  salon_id: 0,
  day_of_week: day,
  opening_time: day === 'Saturday' ? '09:00' : '10:00',
  closing_time: day === 'Saturday' ? '21:00' : day === 'Sunday' ? '18:00' : '20:00',
  is_closed: false,
}));

interface SalonOwnerDashboardProps {
  currentUser: User;
  initialTab?: 'overview' | 'appointments' | 'services' | 'staff' | 'location' | 'settings' | 'branches' | 'inventory' | 'cancellation-fees' | 'emails';
  onOpenRegisterSalon?: () => void;
  onOpenRegisterBranch?: () => void;
  onNavigateTab?: (tab: string) => void;
  refreshKey?: number;
  initialSalons?: Salon[];
  targetId?: string | null;
  onRefreshAppointments?: () => void;
}

export const SalonOwnerDashboard: React.FC<SalonOwnerDashboardProps> = ({
  currentUser,
  initialTab = 'overview',
  onOpenRegisterSalon,
  onOpenRegisterBranch,
  onNavigateTab,
  refreshKey = 0,
  initialSalons,
  targetId,
  onRefreshAppointments,
}) => {
  const [salons, setSalons] = useState<Salon[]>(() => {
    if (initialSalons && initialSalons.length > 0) {
      return initialSalons;
    }
    if (currentUser?.id) {
      const cached = safeLocalStorage.getJSON<Salon[]>(`nailglamhub_owner_salons_${currentUser.id}`);
      if (Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }
    return [];
  });
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(() => {
    if (currentUser?.id) {
      const saved = safeLocalStorage.getJSON<number>(`nailglamhub_owner_selected_salon_${currentUser.id}`);
      if (saved) return saved;
    }
    return null;
  });
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [allOwnerServices, setAllOwnerServices] = useState<Service[]>([]);
  const [allOwnerTechnicians, setAllOwnerTechnicians] = useState<Technician[]>([]);
  const [serviceBranchFilter, setServiceBranchFilter] = useState<'selected' | 'all'>('selected');
  const [staffBranchFilter, setStaffBranchFilter] = useState<'selected' | 'all'>('selected');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'services' | 'staff' | 'location' | 'settings' | 'branches' | 'inventory' | 'cancellation-fees' | 'emails'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewInspoImage, setPreviewInspoImage] = useState<{ url: string; clientName: string } | null>(null);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const { addNotification } = useNotifications();
  const dashboardLoadId = React.useRef(0);

  const handleTabClick = (tabKey: 'overview' | 'appointments' | 'services' | 'staff' | 'location' | 'settings' | 'branches' | 'inventory' | 'cancellation-fees' | 'emails') => {
    setActiveTab(tabKey);
    if (onNavigateTab) {
      const parentTab = tabKey === 'overview' ? 'owner-dashboard' : `owner-${tabKey}`;
      onNavigateTab(parentTab);
    }
  };

  // Sync initialTab when navigation changes from navbar or sidebar
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Auto-scroll when targetId is provided from notification click
  useEffect(() => {
    if (targetId) {
      if (targetId.startsWith('owner-appointment-')) {
        setActiveTab('appointments');
        setBookingStatusFilter('all');
        setBookingDateFilter('all');
        setBookingSearch('');
        scrollToElement(targetId);
      } else if (targetId.startsWith('owner-branch-')) {
        setActiveTab('branches');
        scrollToElement(targetId);
      } else if (targetId.startsWith('owner-order-')) {
        setActiveTab('inventory');
      } else if (targetId.startsWith('owner-cancellation-')) {
        setActiveTab('cancellation-fees');
      }
    }
  }, [targetId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Appointments filter state
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');

  // New Service Form State
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Manicure');
  const [newServicePrice, setNewServicePrice] = useState('500');
  const [newServiceDuration, setNewServiceDuration] = useState('60');
  const [newServiceDifficulty, setNewServiceDifficulty] = useState('Intermediate');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceImage, setNewServiceImage] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);

  // New Technician Form State
  const [showAddTech, setShowAddTech] = useState(false);
  const [newTechName, setNewTechName] = useState('');
  const [newTechEmail, setNewTechEmail] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');
  const [newTechSpecialties, setNewTechSpecialties] = useState('');
  const [newTechExp, setNewTechExp] = useState('3');
  const [newTechAvatar, setNewTechAvatar] = useState('');
  const [editingTechnicianId, setEditingTechnicianId] = useState<number | null>(null);

  // Salon Studio Settings State
  const [settingsName, setSettingsName] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(DEFAULT_WORKING_HOURS);

  const loadDashboardData = async () => {
    const loadId = ++dashboardLoadId.current;
    setLoading(true);
    try {
      let allSalons = await fetchSalons({
        owner_id: currentUser.id,
        includeUnpublished: true,
      });

      if (allSalons.length === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        allSalons = await fetchSalons({
          owner_id: currentUser.id,
          includeUnpublished: true,
        });
      }

      if (loadId !== dashboardLoadId.current) return;

      // Isolation: Salon owners access salons they own. Admins can view all.
      let userSalons =
        currentUser.user_type === 'admin'
          ? allSalons
          : allSalons.filter((s) => Number(s.owner_id) === Number(currentUser.id));

      // Resilient fallback: if server returned empty, check local storage for this owner
      if (userSalons.length === 0 && currentUser?.id) {
        const cached = safeLocalStorage.getJSON<Salon[]>(`nailglamhub_owner_salons_${currentUser.id}`);
        if (Array.isArray(cached) && cached.length > 0) {
          userSalons = cached;
          // Silent background re-sync to backend in case database restarted
          for (const s of cached) {
            fetch(`${API_BASE}/salons`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                owner_id: currentUser.id,
                salon_name: s.salon_name,
                address: s.address,
                phone: s.phone || '',
                email: s.email || '',
                description: s.description || '',
                logo: s.logo || null,
                category_id: s.category_id || 1,
              }),
            }).catch((err) => console.warn('Auto recovery sync error:', err));
          }
        }
      }

      setSalons(userSalons);
      if (userSalons.length > 0 && currentUser?.id) {
        safeLocalStorage.setJSON(`nailglamhub_owner_salons_${currentUser.id}`, userSalons);
      }

      if (userSalons.length > 0) {
        const savedSalonId = currentUser?.id
          ? safeLocalStorage.getJSON<number>(`nailglamhub_owner_selected_salon_${currentUser.id}`)
          : null;
        let currentId = (selectedSalonId && userSalons.some((s) => s.id === selectedSalonId))
          ? selectedSalonId
          : (savedSalonId && userSalons.some((s) => s.id === savedSalonId))
          ? savedSalonId
          : null;

        // Fetch all owner services & technicians across all userSalons
        const [allOwnerServs, allOwnerTechs] = await Promise.all([
          fetchServices(undefined, currentUser.id).catch(() => []),
          fetchTechnicians(undefined, currentUser.id).catch(() => []),
        ]);

        if (!currentId) {
          // Prefer branch that already has services or staff, or default to the most recent branch
          const salonWithServ = userSalons.find((s) => allOwnerServs.some((srv) => Number(srv.salon_id) === Number(s.id)));
          const salonWithTech = userSalons.find((s) => allOwnerTechs.some((t) => Number(t.salon_id) === Number(s.id)));
          currentId = salonWithServ?.id || salonWithTech?.id || userSalons[userSalons.length - 1]?.id || userSalons[0].id;
        }

        setSelectedSalonId(currentId);
        if (currentUser?.id) {
          safeLocalStorage.setJSON(`nailglamhub_owner_selected_salon_${currentUser.id}`, currentId);
        }

        setAllOwnerServices(allOwnerServs);
        setAllOwnerTechnicians(allOwnerTechs);

        const [servs, techs, appts, revs, hours, prods, prodOrders] = await Promise.all([
          fetchServices(currentId),
          fetchTechnicians(currentId),
          fetchAppointments({ salon_id: currentId }),
          fetchReviews(currentId),
          fetchWorkingHours(currentId),
          fetchProducts({ salon_id: currentId }),
          fetchProductOrders({ salon_id: currentId }),
        ]);

        if (loadId !== dashboardLoadId.current) return;

        setServices(servs);
        setTechnicians(techs);
        setAppointments(appts);
        setReviews(revs);
        setWorkingHours(hours.length > 0 ? hours : DEFAULT_WORKING_HOURS.map((hour) => ({ ...hour, salon_id: currentId })));
        setProducts(prods);
        setProductOrders(prodOrders);
        console.log('Loaded reviews for salon:', currentId, revs);

        const currentSalon = userSalons.find((s) => s.id === currentId) || userSalons[0];
        setSettingsName(currentSalon.salon_name);
        setSettingsAddress(currentSalon.address);
        setSettingsPhone(currentSalon.phone || '');
        setSettingsEmail(currentSalon.email || '');
        setSettingsDesc(currentSalon.description || '');
      } else {
        setSelectedSalonId(null);
        setServices([]);
        setTechnicians([]);
        setAppointments([]);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading salon owner data:', error);
      showToast('Unable to refresh branch data. Showing the last saved branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser.id, currentUser.user_type, refreshKey]);

  // Real-time Firestore sync for salon appointments (instant live updates without delay)
  useEffect(() => {
    if (!selectedSalonId) return;

    const unsubscribe = subscribeToAppointments({ salon_id: selectedSalonId }, (liveAppts) => {
      if (liveAppts && liveAppts.length > 0) {
        setAppointments(liveAppts);
      }
    });

    return () => unsubscribe();
  }, [selectedSalonId]);

  // Reload branch data when selected salon changes
  const handleSelectSalon = async (salonId: number) => {
    setSelectedSalonId(salonId);
    if (currentUser?.id) {
      safeLocalStorage.setJSON(`nailglamhub_owner_selected_salon_${currentUser.id}`, salonId);
    }
    setLoading(true);
    const [servs, techs, appts, revs, prods, prodOrders] = await Promise.all([
      fetchServices(salonId),
      fetchTechnicians(salonId),
      fetchAppointments({ salon_id: salonId }),
      fetchReviews(salonId),
      fetchProducts({ salon_id: salonId }),
      fetchProductOrders({ salon_id: salonId }),
    ]);
    setServices(servs);
    setTechnicians(techs);
    setAppointments(appts);
    setReviews(revs);
    setProducts(prods);
    setProductOrders(prodOrders);

    const s = salons.find((item) => item.id === salonId);
    if (s) {
      setSettingsName(s.salon_name);
      setSettingsAddress(s.address);
      setSettingsPhone(s.phone || '');
      setSettingsEmail(s.email || '');
      setSettingsDesc(s.description || '');
    }
    setLoading(false);
  };

  const handleCopyServicesFromBranch = async (sourceSalonId: number) => {
    if (!selectedSalonId || sourceSalonId === selectedSalonId) return;
    try {
      setLoading(true);
      const sourceServices = await fetchServices(sourceSalonId);
      if (sourceServices.length === 0) {
        showToast('No treatments found in source branch to copy.');
        setLoading(false);
        return;
      }
      for (const srv of sourceServices) {
        await fetch(`${API_BASE}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            salon_id: selectedSalonId,
            service_name: srv.service_name,
            category_name: srv.category || srv.category_name || 'Nail Services',
            price: Number(srv.price) || 0,
            duration_minutes: Number(srv.duration || srv.duration_minutes || 45),
            description: srv.description || '',
            image: srv.image_url || srv.image || null,
          }),
        }).catch((e) => console.warn('Copy service error:', e));
      }
      const updatedServs = await fetchServices(selectedSalonId);
      setServices(updatedServs);
      const allServs = await fetchServices(undefined, currentUser.id).catch(() => []);
      setAllOwnerServices(allServs);
      showToast(`Copied ${sourceServices.length} treatments to active branch.`);
    } catch (err) {
      console.error('Error copying treatments:', err);
      showToast('Failed to copy treatments.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyStaffFromBranch = async (sourceSalonId: number) => {
    if (!selectedSalonId || sourceSalonId === selectedSalonId) return;
    try {
      setLoading(true);
      const sourceStaff = await fetchTechnicians(sourceSalonId);
      if (sourceStaff.length === 0) {
        showToast('No specialists found in source branch to copy.');
        setLoading(false);
        return;
      }
      for (const stf of sourceStaff) {
        await fetch(`${API_BASE}/technicians`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            salon_id: selectedSalonId,
            fullname: stf.fullname || stf.name,
            email: stf.email || '',
            phone: stf.phone || '',
            specialties: stf.specialties || 'Nail Specialist',
            experience_years: Number(stf.experience_years || 2),
            avatar: stf.avatar || null,
            rating: Number(stf.rating || 5),
            is_available: true,
          }),
        }).catch((e) => console.warn('Copy staff error:', e));
      }
      const updatedStaff = await fetchTechnicians(selectedSalonId);
      setTechnicians(updatedStaff);
      const allTechs = await fetchTechnicians(undefined, currentUser.id).catch(() => []);
      setAllOwnerTechnicians(allTechs);
      showToast(`Assigned ${sourceStaff.length} specialists to active branch.`);
    } catch (err) {
      console.error('Error copying specialists:', err);
      showToast('Failed to assign specialists.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: number, newStatus: AppointmentStatus) => {
    const success = await updateAppointmentStatus(appointmentId, newStatus);
    if (success) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
      showToast(`Appointment status updated to ${newStatus}`);
    }
  };

  const handleConfirmOwnerCancel = async (reason: string, notes?: string) => {
    if (!cancellingAppt) return;
    const appt = cancellingAppt;
    try {
      const success = await updateAppointmentStatus(appt.id, 'cancelled', {
        cancellation_reason: reason,
        cancellation_notes: notes,
        cancelled_by: 'salon_owner',
      });
      if (success) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appt.id
              ? {
                  ...a,
                  status: 'cancelled',
                  cancellation_reason: reason,
                  cancellation_notes: notes,
                  cancelled_by: 'salon_owner',
                }
              : a
          )
        );
        // Dispatch in-app notification to the client
        addNotification({
          recipient_role: 'customer',
          recipient_user_id: appt.customer_id,
          category: 'bookings',
          title: 'Salon Cancelled Booking ⚠️',
          message: `${activeSalon?.salon_name || appt.salon_name || 'Salon'} cancelled your appointment for ${appt.service_name} on ${appt.appointment_date} at ${appt.appointment_time}. Reason: ${reason}.`,
          type: 'booking_cancelled_by_owner',
          priority: 'urgent',
          linkTab: 'customer-dashboard',
          metadata: { appointmentId: appt.id },
        });
        showToast('Booking cancelled. Client has been notified.');
      } else {
        showToast('Unable to cancel booking. Please try again.');
      }
    } catch (err) {
      console.error('Owner cancellation error:', err);
      showToast('Failed to cancel appointment');
    } finally {
      setCancellingAppt(null);
    }
  };

  const handleAssignTechnician = async (appointmentId: number, techId: number, techName: string) => {
    const updated = await updateAppointmentTechnician(appointmentId, techId);
    if (!updated) {
      showToast('Unable to save technician assignment');
      return;
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, technician_id: techId, staff_id: techId, staff_name: techName } : a))
    );
    showToast(`Assigned ${techName} to appointment #${appointmentId}`);
  };

  const handleRefreshAppointments = async () => {
    if (selectedSalonId) {
      setLoading(true);
      const appts = await fetchAppointments({ salon_id: selectedSalonId });
      setAppointments(appts);
      setLoading(false);
      showToast('Appointments refreshed');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !selectedSalonId) return;

    try {
      const priceNum = Math.max(0, parseFloat(newServicePrice) || 0);
      const res = await fetch(`${API_BASE}/services${editingServiceId ? `/${editingServiceId}` : ''}`, {
        method: editingServiceId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: selectedSalonId,
          service_name: newServiceName,
          category_name: newServiceCategory,
          price: priceNum,
          duration_minutes: Number(newServiceDuration),
          description: newServiceDesc,
          image: newServiceImage || null,
        }),
      });
      const responseData = await res.json();
      if (res.ok) {
        const savedResponse = responseData.service || responseData;
        const saved = {
          ...savedResponse,
          image_url: savedResponse.image_url || savedResponse.image,
        };
        setServices((prev) => editingServiceId
          ? prev.map((service) => service.id === editingServiceId ? saved : service)
          : [...prev, saved]);
        setShowAddService(false);
        setNewServiceName('');
        setNewServicePrice('500');
        setNewServiceDesc('');
        setNewServiceImage('');
        setEditingServiceId(null);
        showToast(`${editingServiceId ? 'Updated' : 'Added'} ${saved.service_name} ${editingServiceId ? '' : 'to treatments menu'}`);
      } else {
        showToast(responseData.error || 'Unable to save service');
      }
    } catch (err) {
      console.error('Create service error:', err);
      showToast('Unable to save service');
    }
  };

  const startEditingService = (service: Service) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.service_name);
    setNewServiceCategory(service.category || service.category_name || 'Manicure');
    setNewServicePrice(service.price !== undefined ? String(service.price) : '500');
    setNewServiceDuration(String(service.duration || service.duration_minutes || 45));
    setNewServiceDesc(service.description || '');
    setNewServiceImage(service.image_url || service.image || '');
    setShowAddService(true);
  };

  const handleDeleteService = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        showToast('Treatment removed from menu');
      }
    } catch (err) {
      console.error('Delete service error:', err);
    }
  };

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName) return;

    try {
      const res = await fetch(`${API_BASE}/technicians${editingTechnicianId ? `/${editingTechnicianId}` : ''}`, {
        method: editingTechnicianId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: selectedSalonId,
          fullname: newTechName,
          email: newTechEmail,
          phone: newTechPhone,
          specialties: newTechSpecialties,
          experience_years: Number(newTechExp),
          avatar: newTechAvatar || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTechnicians((prev) => editingTechnicianId
          ? prev.map((technician) => technician.id === editingTechnicianId ? created : technician)
          : [...prev, created]);
        setShowAddTech(false);
        setNewTechName('');
        setNewTechEmail('');
        setNewTechPhone('');
        setNewTechSpecialties('');
        setNewTechAvatar('');
        setEditingTechnicianId(null);
        showToast(`${editingTechnicianId ? 'Updated' : 'Registered'} specialist ${created.fullname}`);
      }
    } catch (err) {
      console.error('Create technician error:', err);
    }
  };

  const startEditingTechnician = (technician: Technician) => {
    setEditingTechnicianId(technician.id);
    setNewTechName(technician.fullname || technician.name || '');
    setNewTechEmail(technician.email || '');
    setNewTechPhone(technician.phone || '');
    setNewTechSpecialties(technician.specialties || '');
    setNewTechExp(String(technician.experience_years || 0));
    setNewTechAvatar(technician.avatar || '');
    setShowAddTech(true);
  };

  const handleDeleteTechnician = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/technicians/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTechnicians((prev) => prev.filter((t) => t.id !== id));
        showToast('Specialist removed from team');
      } else {
        showToast(data.details || data.error || 'Cannot remove specialist with existing bookings');
      }
    } catch (err) {
      console.error('Delete technician error:', err);
      showToast('Error removing specialist');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalonId || !settingsName.trim() || !settingsAddress.trim()) return;
    try {
      const updatedSalon = await updateSalon(selectedSalonId, {
        salon_name: settingsName.trim(),
        address: settingsAddress.trim(),
        phone: settingsPhone.trim(),
        email: settingsEmail.trim(),
        description: settingsDesc.trim(),
      });
      const savedHours = await updateWorkingHours(selectedSalonId, workingHours);
      setSalons((prev) => prev.map((s) => s.id === selectedSalonId ? updatedSalon : s));
      setWorkingHours(savedHours);
      setSettingsSaved(true);
      showToast('Studio profile saved to the database');
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('Save studio profile error:', err);
      showToast('Unable to save studio profile');
    }
  };

  const activeSalon = salons.find((s) => s.id === selectedSalonId) || salons[0];
  const displayedServices = serviceBranchFilter === 'all' && allOwnerServices.length > 0
    ? allOwnerServices
    : services;

  const displayedStaff = staffBranchFilter === 'all' && allOwnerTechnicians.length > 0
    ? allOwnerTechnicians
    : technicians;

  const otherBranchesWithServices = useMemo(() => {
    return salons.filter((s) => s.id !== selectedSalonId && allOwnerServices.some((srv) => Number(srv.salon_id) === Number(s.id)));
  }, [salons, selectedSalonId, allOwnerServices]);

  const otherBranchesWithStaff = useMemo(() => {
    return salons.filter((s) => s.id !== selectedSalonId && allOwnerTechnicians.some((t) => Number(t.salon_id) === Number(s.id)));
  }, [salons, selectedSalonId, allOwnerTechnicians]);

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const lowStockProductCount = useMemo(
    () => products.filter((p) => p.stock_quantity <= (p.low_stock_threshold || 5)).length,
    [products]
  );

  const lateCancellationCount = useMemo(() => {
    return appointments.filter(
      (a) => a.status === 'cancelled' && (a.outside_grace_period || (Number(a.cancellation_fee || 0) > 0))
    ).length;
  }, [appointments]);

  // Filter Bookings Queue
  const filteredBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return appointments.filter((appt) => {
      // Status Filter
      if (bookingStatusFilter !== 'all' && appt.status !== bookingStatusFilter) {
        return false;
      }

      // Date Filter
      if (bookingDateFilter === 'today' && appt.appointment_date !== todayStr) {
        return false;
      }
      if (bookingDateFilter === 'upcoming' && appt.appointment_date < todayStr) {
        return false;
      }
      if (bookingDateFilter === 'past' && appt.appointment_date > todayStr) {
        return false;
      }

      // Search
      if (bookingSearch) {
        const q = bookingSearch.toLowerCase();
        const matchCust = (appt.customer_name || '').toLowerCase().includes(q);
        const matchService = (appt.service_name || '').toLowerCase().includes(q);
        const matchStaff = (appt.staff_name || '').toLowerCase().includes(q);
        if (!matchCust && !matchService && !matchStaff) return false;
      }

      return true;
    });
  }, [appointments, bookingStatusFilter, bookingDateFilter, bookingSearch]);

  if (!loading && salons.length === 0) {
    return (
      <EmptyState
        variant="salon"
        title="No Salon Branches Yet"
        description="You do not have any salon branches linked to this owner account yet. Register your first branch to set up services, assign staff, and start receiving appointments."
        action={{
          label: "Register Your First Salon Branch",
          onClick: onOpenRegisterSalon || (() => {})
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-purple-950 text-white px-4 py-3 rounded-2xl shadow-xl border border-purple-800 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Branch Switcher */}
      <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-rose-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-md border-2 border-purple-200 overflow-hidden shrink-0">
            {activeSalon?.logo ? (
              <img
                src={activeSalon.logo}
                alt={activeSalon.salon_name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : null}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-purple-200 text-xs font-semibold mb-1">
              <Store className="w-3.5 h-3.5" /> Partner Portal • {activeSalon?.category_name || 'Nail Studio'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">
              {activeSalon?.salon_name || 'My Salon Studio'}
            </h2>
            <p className="text-xs text-purple-100/80 mt-0.5">{activeSalon?.address}</p>
          </div>
        </div>

        {salons.length > 1 && (
          <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20">
            <label className="block text-[10px] uppercase font-bold text-purple-200 mb-1">
              Active Store Branch
            </label>
            <select
              value={selectedSalonId || ''}
              onChange={(e) => handleSelectSalon(Number(e.target.value))}
              className="bg-purple-950 text-white text-xs font-semibold p-2 rounded-xl border border-purple-400/30 cursor-pointer"
            >
              {salons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.salon_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Navigation Container */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs overflow-hidden">
        {/* Six Distinct Header Tabs */}
        <div className="flex border-b border-pink-100 px-4 sm:px-6 bg-pink-50/30 overflow-x-auto no-scrollbar scroll-smooth gap-1">
          {/* Tab 1: Branch Overview */}
          <button
            id="owner-tab-branches"
            onClick={() => handleTabClick('branches')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'branches'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Store className="w-4 h-4 text-purple-600" />
            <span>Branch Overview ({salons.length})</span>
          </button>

          {/* Tab 2: Overview & Store Reports (CRM) */}
          <button
            id="owner-tab-overview"
            onClick={() => handleTabClick('overview')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span>Overview, Analytics &amp; Inventory</span>
          </button>

          {/* Tab 2: Bookings & Schedule */}
          <button
            id="owner-tab-appointments"
            onClick={() => handleTabClick('appointments')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'appointments'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-pink-600" />
            <span>Bookings & Schedule ({appointments.length})</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Tab: Late Cancellation Fees (30-min Grace) */}
          <button
            id="owner-tab-cancellation-fees"
            onClick={() => handleTabClick('cancellation-fees')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'cancellation-fees'
                ? 'border-rose-600 text-rose-950 font-bold bg-white/80 rounded-t-xl shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Cancellation Fees & Grace</span>
            {lateCancellationCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {lateCancellationCount}
              </span>
            )}
          </button>

          {/* Tab 3: Services & Treatments */}
          <button
            id="owner-tab-services"
            onClick={() => handleTabClick('services')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'services'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Scissors className="w-4 h-4 text-purple-700" />
            <span>Treatments Menu ({displayedServices.length})</span>
          </button>

          {/* Tab 4: Staff Roster */}
          <button
            id="owner-tab-staff"
            onClick={() => handleTabClick('staff')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'staff'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Staff Roster ({displayedStaff.length})</span>
          </button>

          {/* Tab 5: Products & Stock Inventory */}
          <button
            id="owner-tab-inventory"
            onClick={() => handleTabClick('inventory')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'inventory'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Products & Stock ({products.length})</span>
            {lowStockProductCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                {lowStockProductCount}
              </span>
            )}
          </button>

          {/* Tab 6: Store Location & Map */}
          <button
            id="owner-tab-location"
            onClick={() => handleTabClick('location')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'location'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-600" />
            <span>Store Location & Map</span>
          </button>

          {/* Tab 7: Studio Settings */}
          <button
            id="owner-tab-settings"
            onClick={() => handleTabClick('settings')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Studio Profile & Hours</span>
          </button>

          {/* Tab 8: Email Reports & Monthly PDF */}
          <button
            id="owner-tab-emails"
            onClick={() => handleTabClick('emails')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'emails'
                ? 'border-purple-600 text-purple-900 font-bold bg-white/70 rounded-t-xl shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Email Reports & Alerts</span>
            <span className="px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold">
              PDF
            </span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-3.5 sm:p-6">
          {/* TAB 1: BRANCH OVERVIEW */}
          {activeTab === 'branches' && (
            <BranchOverview
              salons={salons}
              currentUser={currentUser}
              onNavigateToBranch={(salonId) => {
                setSelectedSalonId(salonId);
                setActiveTab('overview');
              }}
              onOpenRegisterSalon={onOpenRegisterBranch || onOpenRegisterSalon || (() => {})}
              onShowToast={showToast}
            />
          )}

          {/* TAB 2: DEDICATED STORE OVERVIEW & CRM REPORTING VIEW */}
          {activeTab === 'overview' && activeSalon && (
            <StoreOverviewReports
              salon={activeSalon}
              appointments={appointments}
              services={services}
              technicians={technicians}
              reviews={reviews}
              products={products}
              productOrders={productOrders}
              onNavigateToInventory={() => setActiveTab('inventory')}
              onRefreshProducts={loadDashboardData}
              showToast={showToast}
            />
          )}

          {/* TAB: PRODUCTS & STOCK INVENTORY */}
          {activeTab === 'inventory' && (
            <ProductInventoryManager
              salon={activeSalon}
              products={products}
              orders={productOrders}
              onRefresh={loadDashboardData}
              targetOrderId={
                targetId && targetId.startsWith('owner-order-')
                  ? Number(targetId.replace('owner-order-', ''))
                  : null
              }
            />
          )}

          {/* TAB 3: DEDICATED BOOKINGS & APPOINTMENTS SCHEDULE VIEW */}
          {activeTab === 'appointments' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-700" />
                    Appointment Operations & Scheduling Queue
                  </h3>
                  <p className="text-xs text-gray-500">
                    Review incoming client bookings, assign salon specialists, and manage service statuses.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">
                    {filteredBookings.length} Bookings shown
                  </span>
                  <button
                    onClick={handleRefreshAppointments}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Booking Controls & Filters */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-50/70 p-3 sm:p-3.5 rounded-2xl border border-gray-200/70 max-w-full overflow-hidden">
                {/* Search Client / Treatment */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search client, service, or artist..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 max-w-full">
                  {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setBookingStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                        bookingStatusFilter === status
                          ? 'bg-purple-700 text-white shadow-xs font-bold'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {status} {status === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
                    </button>
                  ))}
                </div>

                {/* Date Filter Dropdown */}
                <select
                  value={bookingDateFilter}
                  onChange={(e) => setBookingDateFilter(e.target.value as any)}
                  className="bg-white text-gray-700 border border-gray-200 text-xs font-semibold p-2 rounded-xl focus:outline-none w-full md:w-auto cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today's Schedule</option>
                  <option value="upcoming">Upcoming Bookings</option>
                  <option value="past">Past Records</option>
                </select>
              </div>

              {/* Bookings List */}
              {filteredBookings.length === 0 ? (
                <div className="text-center py-16 bg-pink-50/20 rounded-2xl border border-dashed border-pink-200 text-gray-500 text-sm space-y-2">
                  <Calendar className="w-8 h-8 text-pink-400 mx-auto" />
                  <p className="font-semibold text-gray-700">No appointments match the selected filters.</p>
                  <button
                    onClick={() => {
                      setBookingStatusFilter('all');
                      setBookingDateFilter('all');
                      setBookingSearch('');
                    }}
                    className="text-xs text-purple-700 font-bold hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 max-w-full">
                  {filteredBookings.map((appt) => (
                    <div
                      key={appt.id}
                      id={`owner-appointment-${appt.id}`}
                      className="p-3.5 sm:p-5 rounded-2xl border border-pink-100 hover:border-purple-300 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 shadow-xs transition-all max-w-full overflow-hidden min-w-0"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {appt.customer_name}
                          </span>
                          <span className="text-xs text-gray-400 truncate max-w-[180px] sm:max-w-none">
                            ({appt.customer_phone || appt.customer_email || 'No phone recorded'})
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              appt.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : appt.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : appt.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-serif font-bold text-purple-950 flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                          <span className="break-words">{appt.service_name}</span>
                          <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md font-sans font-medium shrink-0">
                            {appt.service_duration || 60} mins
                          </span>
                          {appt.payment_method ? (
                            <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-sans font-semibold max-w-full truncate">
                              {appt.payment_method.replace('paymongo_', 'PayMongo ').toUpperCase()}
                              {appt.paid_amount ? ` (₱${Number(appt.paid_amount).toLocaleString()} Paid)` : ''}
                            </span>
                          ) : (
                            <span className="text-[11px] text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-md font-sans font-semibold shrink-0">
                              In-Store Settlement
                            </span>
                          )}
                          {Number(appt.remaining_balance || 0) > 0 && (
                            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-sans font-medium shrink-0">
                              ₱{Number(appt.remaining_balance).toLocaleString()} Due In-Store
                            </span>
                          )}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-gray-600">
                          <span className="font-semibold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-md shrink-0">
                            📅 {appt.appointment_date} at {appt.appointment_time}
                          </span>
                          <span className="text-purple-200 hidden sm:inline">•</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-gray-500 shrink-0">Specialist:</span>
                            <select
                              value={appt.technician_id || appt.staff_id || ''}
                              onChange={(e) => {
                                const tId = Number(e.target.value);
                                const tech = technicians.find((t) => t.id === tId);
                                if (tech) {
                                  handleAssignTechnician(appt.id, tech.id, tech.fullname);
                                }
                              }}
                              className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-2 py-1 text-gray-800 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-xs truncate"
                            >
                              <option value="">{appt.staff_name || 'Select Specialist'}</option>
                              {technicians.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.fullname} ({t.specialties})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {appt.notes && (
                          <p className="text-xs text-gray-600 mt-1 italic bg-pink-50/50 p-2.5 rounded-xl border border-pink-100/70 break-words max-w-full">
                            <span className="font-semibold text-pink-900 not-italic">Client Note: </span>
                            "{appt.notes}"
                          </p>
                        )}

                        {appt.design_image && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewInspoImage({ url: appt.design_image!, clientName: appt.customer_name || 'Client' })}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-900 cursor-pointer transition-colors shadow-2xs max-w-full"
                              title="Click to view reference photo uploaded by client"
                            >
                              <img
                                src={appt.design_image}
                                alt="Inspo Thumbnail"
                                className="w-6 h-6 rounded-md object-cover border border-purple-300 shrink-0"
                              />
                              <span className="flex items-center gap-1 truncate">
                                <ImageIcon className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                <span className="truncate">View Client Design Inspo Photo</span>
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Cancellation Reason and Policy info for Salon Owner */}
                        {appt.status === 'cancelled' && (
                          <div className="mt-2.5 p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5 min-w-0 max-w-full overflow-hidden">
                            <div className="font-bold flex flex-wrap items-center justify-between gap-2 text-rose-950">
                              <span className="flex items-start gap-1.5 break-words min-w-0 flex-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                <span className="break-words">Cancellation Log ({appt.cancelled_by === 'customer' ? 'By Client' : 'By Salon'}): {appt.cancellation_reason || 'Client cancelled appointment'}</span>
                              </span>
                              {appt.outside_grace_period ? (
                                <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 font-bold text-[10px] shrink-0">
                                  Outside 30m Grace
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                                  Within 30m Grace
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-rose-800 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5">
                              {appt.cancellation_tier && (
                                <span>Policy Tier: <strong>{appt.cancellation_tier.toUpperCase()}</strong></span>
                              )}
                              {Number(appt.cancellation_fee || 0) > 0 ? (
                                <span>• Late Fee: <strong className="text-rose-900">₱{Number(appt.cancellation_fee).toLocaleString()}</strong> ({appt.cancellation_fee_status || 'assessed'})</span>
                              ) : (
                                <span>• Fee Waived / Grace Window (₱0.00)</span>
                              )}
                              <button
                                onClick={() => setActiveTab('cancellation-fees')}
                                className="text-purple-700 hover:text-purple-900 underline font-bold cursor-pointer"
                              >
                                View in Late Fee Manager &rarr;
                              </button>
                            </div>
                            {appt.cancellation_notes && (
                              <p className="text-[11px] text-rose-700 italic pl-5 break-words">"{appt.cancellation_notes}"</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-end md:self-center mt-2 md:mt-0 w-full sm:w-auto justify-end">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'confirmed')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Booking</span>
                          </button>
                        )}

                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'completed')}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}

                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button
                            onClick={() => setCancellingAppt(appt)}
                            className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer transition-colors"
                            title="Cancel booking (prompts confirmation)"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: LATE CANCELLATION FEES & 30-MIN GRACE POLICY */}
          {activeTab === 'cancellation-fees' && (
            <div className="animate-in fade-in duration-200">
              <LateCancellationFeesManager
                salon={activeSalon || null}
                salons={salons}
                appointments={appointments}
                onRefresh={loadDashboardData}
                onSelectSalon={(sId) => setSelectedSalonId(sId)}
              />
            </div>
          )}

          {/* TAB 4: SERVICES MANAGEMENT */}
          {activeTab === 'services' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-purple-700" />
                    Salon Treatment Catalog &amp; Menu
                  </h3>
                  <p className="text-xs text-gray-500">
                    Configure treatments, duration, and descriptions for client browsing &amp; in-salon bookings.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingServiceId ? 'Edit Treatment' : 'Add New Treatment'}</span>
                </button>
              </div>

              {/* Branch Filter & View Control */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-purple-50/70 border border-purple-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-900">Branch View:</span>
                  <select
                    value={serviceBranchFilter}
                    onChange={(e) => setServiceBranchFilter(e.target.value as 'selected' | 'all')}
                    className="bg-white text-purple-950 text-xs font-semibold px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs cursor-pointer focus:outline-none focus:border-purple-500"
                  >
                    <option value="selected">Active Branch: {activeSalon?.salon_name || 'Selected'} ({services.length})</option>
                    {salons.length > 1 && (
                      <option value="all">All Branches Combined ({allOwnerServices.length > 0 ? allOwnerServices.length : services.length})</option>
                    )}
                  </select>
                </div>
                <div className="text-xs text-purple-800 font-medium">
                  Showing <strong className="font-bold">{displayedServices.length}</strong> treatment{displayedServices.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Add Service Modal/Form */}
              {showAddService && (
                <form
                  onSubmit={handleCreateService}
                  className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4 animate-in fade-in duration-150"
                >
                  <h4 className="text-sm font-bold text-purple-950">{editingServiceId ? 'Edit Treatment' : 'Add New Treatment to Menu'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="e.g. Japanese Jelly Builder Gel"
                        className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => setNewServiceCategory(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value="Manicure">Manicure</option>
                        <option value="Pedicure">Pedicure</option>
                        <option value="Nail Extensions">Nail Extensions</option>
                        <option value="Nail Art">Nail Art</option>
                        <option value="Gel Polish">Gel Polish</option>
                        <option value="Nail Care">Nail Care</option>
                        <option value="Nail Design">Nail Design</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Set Price (₱)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 text-xs font-bold">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full pl-7 pr-2 py-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500 font-semibold"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Duration &amp; Skill Level
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newServiceDuration}
                          onChange={(e) => setNewServiceDuration(e.target.value)}
                          placeholder="Duration (e.g. 60)"
                          className="w-1/2 p-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500"
                          required
                        />
                        <select
                          value={newServiceDifficulty}
                          onChange={(e) => setNewServiceDifficulty(e.target.value)}
                          className="w-1/2 p-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Treatment Image
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          showToast('Please choose an image smaller than 2 MB');
                          e.currentTarget.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setNewServiceImage(String(reader.result));
                        reader.readAsDataURL(file);
                      }}
                      className="w-full rounded-xl bg-white border border-purple-200 p-2 text-xs"
                    />
                    {newServiceImage && (
                      <img
                        src={newServiceImage}
                        alt="Treatment preview"
                        className="mt-2 h-24 w-24 rounded-xl object-cover border border-purple-200"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      placeholder="Brief details about steps, products used, and styling..."
                      className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddService(false);
                        setEditingServiceId(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      {editingServiceId ? 'Update Service' : 'Save Service'}
                    </button>
                  </div>
                </form>
              )}

              {/* Empty state when 0 treatments */}
              {displayedServices.length === 0 && (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-purple-200 bg-white">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-purple-950">No treatments listed for this branch yet</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                    Add treatments to {activeSalon?.salon_name || 'this branch'} so clients can browse treatments and book appointment slots.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setShowAddService(true)}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Treatment</span>
                    </button>
                    {otherBranchesWithServices.length > 0 && (
                      <button
                        onClick={() => handleCopyServicesFromBranch(otherBranchesWithServices[0].id)}
                        className="px-4 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-800 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-pink-600" />
                        <span>Copy treatments from {otherBranchesWithServices[0].salon_name}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Service List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {displayedServices.map((s) => {
                  const branchName = salons.find((sl) => sl.id === s.salon_id)?.salon_name;
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl border border-pink-100 bg-white flex items-start justify-between gap-3 shadow-xs hover:border-purple-200 transition-all"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.2 rounded-md">
                            {s.category}
                          </span>
                          {s.difficulty_level && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-md">
                              {s.difficulty_level}
                            </span>
                          )}
                          {serviceBranchFilter === 'all' && branchName && (
                            <span className="text-[10px] text-pink-700 bg-pink-50 px-2 py-0.2 rounded-md border border-pink-100 font-semibold">
                              {branchName}
                            </span>
                          )}
                          <span className="text-xs font-bold text-gray-900">{s.service_name}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-gray-700">
                          <span className="text-purple-800 font-bold bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200">
                            {Number(s.price) > 0 ? `₱${Number(s.price).toLocaleString()}` : 'Free / In-Store Settlement'}
                          </span>
                          <span>•</span>
                          <span>{s.duration || s.duration_minutes || 45} mins</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingService(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Edit service"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: STAFF MANAGEMENT */}
          {activeTab === 'staff' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-700" />
                    Salon Technicians &amp; Specialist Artists
                  </h3>
                  <p className="text-xs text-gray-500">
                    Manage artists assigned to client booking slots and their specialties.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTech(!showAddTech)}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Specialist</span>
                </button>
              </div>

              {/* Branch Filter & View Control */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-900">Branch View:</span>
                  <select
                    value={staffBranchFilter}
                    onChange={(e) => setStaffBranchFilter(e.target.value as 'selected' | 'all')}
                    className="bg-white text-blue-950 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="selected">Active Branch: {activeSalon?.salon_name || 'Selected'} ({technicians.length})</option>
                    {salons.length > 1 && (
                      <option value="all">All Branches Combined ({allOwnerTechnicians.length > 0 ? allOwnerTechnicians.length : technicians.length})</option>
                    )}
                  </select>
                </div>
                <div className="text-xs text-blue-800 font-medium">
                  Showing <strong className="font-bold">{displayedStaff.length}</strong> specialist{displayedStaff.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Add Tech Form */}
              {showAddTech && (
                <form
                  onSubmit={handleCreateTechnician}
                  className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3 animate-in fade-in duration-150"
                >
                  <h4 className="text-sm font-bold text-purple-950">{editingTechnicianId ? 'Edit Staff Member' : 'Register New Staff Member'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newTechName}
                        onChange={(e) => setNewTechName(e.target.value)}
                        placeholder="e.g. Maria Santos"
                        className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Specialties</label>
                      <input
                        type="text"
                        value={newTechSpecialties}
                        onChange={(e) => setNewTechSpecialties(e.target.value)}
                        placeholder="e.g. Russian Manicure, 3D Art"
                        className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        value={newTechExp}
                        onChange={(e) => setNewTechExp(e.target.value)}
                        className="w-full p-2 rounded-xl bg-white border border-purple-200 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Technician Profile Image Upload */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Profile Image / Photo
                    </label>
                    <div className="flex items-center gap-3">
                      {newTechAvatar ? (
                        <div className="relative group shrink-0">
                          <img
                            src={newTechAvatar}
                            alt="Technician avatar preview"
                            className="w-14 h-14 rounded-full object-cover border-2 border-purple-300 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setNewTechAvatar('')}
                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors shadow-xs cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-purple-100/80 border-2 border-dashed border-purple-300 flex items-center justify-center text-purple-400 shrink-0">
                          <UserIcon className="w-6 h-6 text-purple-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              showToast('Please choose an image smaller than 2 MB');
                              e.currentTarget.value = '';
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => setNewTechAvatar(String(reader.result));
                            reader.readAsDataURL(file);
                          }}
                          className="w-full rounded-xl bg-white border border-purple-200 p-2 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Upload JPG, PNG, or WEBP photo (up to 2MB). Displayed during appointment scheduling.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTech(false);
                        setNewTechAvatar('');
                        setEditingTechnicianId(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      {editingTechnicianId ? 'Update Specialist' : 'Save Specialist'}
                    </button>
                  </div>
                </form>
              )}

              {/* Empty state when 0 staff */}
              {displayedStaff.length === 0 && (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-blue-200 bg-white">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-blue-950">No specialists found for this branch</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                    Register nail artists and beauty specialists for {activeSalon?.salon_name || 'this branch'} to handle client appointments.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setShowAddTech(true)}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Specialist</span>
                    </button>
                    {otherBranchesWithStaff.length > 0 && (
                      <button
                        onClick={() => handleCopyStaffFromBranch(otherBranchesWithStaff[0].id)}
                        className="px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>Assign specialists from {otherBranchesWithStaff[0].salon_name}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedStaff.map((t) => {
                  const branchName = salons.find((sl) => sl.id === t.salon_id)?.salon_name;
                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl border border-pink-100 bg-white flex items-center gap-3.5 shadow-xs hover:border-purple-200 transition-all"
                    >
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-12 h-12 rounded-full object-cover border border-pink-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center border border-pink-200 shrink-0">
                          <span className="text-white text-sm font-bold">
                            {t.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-sm font-bold text-gray-900">{t.name}</h5>
                          {staffBranchFilter === 'all' && branchName && (
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.2 rounded-md border border-blue-100 font-semibold">
                              {branchName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-purple-800 font-medium">
                          {t.experience_years} Years Experience
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.specialties}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => startEditingTechnician(t)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Edit technician"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTechnician(t.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete technician"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: STORE LOCATION, PIN PLACEMENT & MAP SETTINGS */}
          {activeTab === 'location' && activeSalon && (
            <div className="animate-in fade-in duration-200">
              <OwnerLocationPicker
                salon={activeSalon}
                onSalonUpdated={(updatedSalon) => {
                  setSalons((prev) =>
                    prev.map((s) => (s.id === updatedSalon.id ? updatedSalon : s))
                  );
                }}
                onShowToast={showToast}
              />
            </div>
          )}

          {/* TAB 7: STUDIO PROFILE & HOURS SETTINGS */}
          {activeTab === 'settings' && activeSalon && (
            <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-700" />
                  Studio Profile, Contact & Business Hours
                </h3>
                <p className="text-xs text-gray-500">
                  Update your public studio storefront information, contact details, and weekly operational hours.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Salon Business Name
                    </label>
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                    <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Store Address / Location
                    </label>
                    <input
                      type="text"
                      value={settingsAddress}
                      onChange={(e) => setSettingsAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                    <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                    <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={settingsEmail}
                      onChange={(e) => setSettingsEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Store Bio & Description
                  </label>
                  <textarea
                    rows={3}
                    value={settingsDesc}
                    onChange={(e) => setSettingsDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Operating Hours Table */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-700" />
                    Standard Operating Schedule
                  </h4>
                  <div className="space-y-2">
                    {workingHours.map((hour, index) => (
                      <div key={hour.day_of_week} className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 text-xs">
                        <span className="font-bold text-gray-800">{hour.day_of_week}</span>
                        <label className="flex items-center gap-1.5 text-gray-600">
                          <input
                            type="checkbox"
                            checked={hour.is_closed}
                            onChange={(event) => setWorkingHours((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, is_closed: event.target.checked } : item))}
                          />
                          Closed
                        </label>
                        <input
                          type="time"
                          value={hour.opening_time}
                          disabled={hour.is_closed}
                          onChange={(event) => setWorkingHours((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, opening_time: event.target.value } : item))}
                          className="rounded-lg border border-gray-200 p-1.5 disabled:bg-gray-100"
                        />
                        <input
                          type="time"
                          value={hour.closing_time}
                          disabled={hour.is_closed}
                          onChange={(event) => setWorkingHours((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, closing_time: event.target.value } : item))}
                          className="rounded-lg border border-gray-200 p-1.5 disabled:bg-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  {settingsSaved && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Changes saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Studio Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: EMAIL REPORTS & MONTHLY PDF */}
          {activeTab === 'emails' && (salons.find((s) => s.id === selectedSalonId) || salons[0]) && (
            <OwnerEmailReportsManager
              salon={salons.find((s) => s.id === selectedSalonId) || salons[0]}
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
        </div>
      </div>

      {/* Lightbox Modal for Client Inspiration Photo */}
      {previewInspoImage && (
        <div
          id="owner-inspo-lightbox-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setPreviewInspoImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-purple-200 animate-in fade-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-bold text-gray-900">
                  Client Design Inspo Reference ({previewInspoImage.clientName})
                </h4>
              </div>
              <button
                onClick={() => setPreviewInspoImage(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewInspoImage.url}
                alt="Client Inspiration Full"
                className="w-full h-auto max-h-[68vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
      {/* Cancel Booking Confirmation Modal */}
      <CancelBookingConfirmationModal
        isOpen={Boolean(cancellingAppt)}
        appointment={cancellingAppt}
        cancelledByRole="salon_owner"
        onClose={() => setCancellingAppt(null)}
        onConfirm={handleConfirmOwnerCancel}
      />
    </div>
  );
};
