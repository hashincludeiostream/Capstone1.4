import {
  User,
  Salon,
  Service,
  Technician,
  Appointment,
  Review,
  Reel,
  BusinessCategory,
  Promotion,
  AppointmentStatus,
  Announcement,
  WorkingHour,
  ReelCommentResponse,
  PlatformStats,
  Product,
  ProductOrder,
  ProductOrderStatus,
} from '../types';
import {
  createFirestoreAppointment,
  updateFirestoreAppointmentStatus,
  createFirestoreSalon,
} from './firestoreService';

const configuredApiBase = import.meta.env.VITE_API_URL as string | undefined;
const staticAppBase = typeof window !== 'undefined'
  ? (window.location.pathname.endsWith('/')
    ? window.location.pathname
    : window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1))
  : '/';

export const API_BASE = configuredApiBase || '/api';

// Error message mapping for better user feedback
const getErrorMessage = (error: unknown, context: string): string => {
  const err = error as Error;
  
  if (err.name === 'TypeError' && err.message.includes('fetch')) {
    return `Network error: Unable to connect to the server. Please check your internet connection and try again.`;
  }
  
  if (err.message?.includes('Failed to fetch')) {
    return `Server error: Could not load ${context}. The server may be temporarily unavailable. Please try again later.`;
  }
  
  if (err.message?.includes('404')) {
    return `Not found: The requested ${context} could not be found.`;
  }
  
  if (err.message?.includes('401') || err.message?.includes('403')) {
    return `Authentication error: You don't have permission to access this ${context}. Please log in again.`;
  }
  
  if (err.message?.includes('500')) {
    return `Server error: Something went wrong on our end. Please try again later.`;
  }
  
  return err.message || `An error occurred while loading ${context}. Please try again.`;
};

export async function fetchCategories(): Promise<BusinessCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (err) {
    console.warn('API fetchCategories error:', err);
    const errorMessage = getErrorMessage(err, 'categories');
    console.error('User-facing error:', errorMessage);
    return [];
  }
}

export async function fetchSalons(params?: {
  category?: number;
  search?: string;
  owner_id?: number;
  includeUnpublished?: boolean;
}): Promise<Salon[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', String(params.category));
    if (params?.search) query.set('search', params.search);
    if (params?.owner_id) query.set('owner_id', String(params.owner_id));
    if (params?.includeUnpublished) query.set('include_unpublished', 'true');

    const res = await fetch(`${API_BASE}/salons?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch salons');
    const salons = await res.json();
    return (Array.isArray(salons) ? salons : []).map((salon: Salon) => ({
      ...salon,
      id: Number(salon.id),
      owner_id: Number(salon.owner_id),
      category_id: salon.category_id == null ? undefined : Number(salon.category_id),
      avg_rating: Number(salon.avg_rating) || 0,
      review_count: Number(salon.review_count) || 0,
      is_active: Boolean(Number(salon.is_active)),
    }));
  } catch (err) {
    console.warn('API fetchSalons error:', err);
    const errorMessage = getErrorMessage(err, 'salons');
    console.error('User-facing error:', errorMessage);
    throw err;
  }
}

export async function fetchSalonDetails(id: number): Promise<{
  salon: Salon;
  services: Service[];
  technicians: Technician[];
  reviews: Review[];
  working_hours: WorkingHour[];
} | null> {
  try {
    const res = await fetch(`${API_BASE}/salons/${id}`);
    if (!res.ok) throw new Error('Failed to fetch salon details');
    return await res.json();
  } catch (err) {
    console.warn('API fetchSalonDetails error:', err);
    return null;
  }
}

export async function fetchServices(salonId?: number): Promise<Service[]> {
  try {
    const url = salonId ? `${API_BASE}/services?salon_id=${salonId}` : `${API_BASE}/services`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch services');
    const services = await res.json();
    return (Array.isArray(services) ? services : []).map((service: Service) => ({
      ...service,
      id: Number(service.id),
      salon_id: Number(service.salon_id),
      image_url: service.image_url || service.image,
    }));
  } catch (err) {
    console.warn('API fetchServices error:', err);
    const errorMessage = getErrorMessage(err, 'services');
    console.error('User-facing error:', errorMessage);
    return [];
  }
}

export async function fetchTechnicians(salonId?: number): Promise<Technician[]> {
  try {
    const url = salonId ? `${API_BASE}/technicians?salon_id=${salonId}` : `${API_BASE}/technicians`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch technicians');
    return await res.json();
  } catch (err) {
    console.warn('API fetchTechnicians error:', err);
    const errorMessage = getErrorMessage(err, 'technicians');
    console.error('User-facing error:', errorMessage);
    return [];
  }
}

export async function fetchAppointments(params?: { customer_id?: number; salon_id?: number }): Promise<Appointment[]> {
  try {
    const query = new URLSearchParams();
    if (params?.customer_id) query.set('customer_id', String(params.customer_id));
    if (params?.salon_id) query.set('salon_id', String(params.salon_id));

    const res = await fetch(`${API_BASE}/appointments?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return await res.json();
  } catch (err) {
    console.warn('API fetchAppointments error:', err);
    const errorMessage = getErrorMessage(err, 'appointments');
    console.error('User-facing error:', errorMessage);
    return [];
  }
}

export async function createAppointment(data: Partial<Appointment>): Promise<{ success: boolean; appointment: Appointment }> {
  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create appointment');
    const result = await res.json();
    
    // Sync directly to Firestore for real-time listeners across all devices/sessions
    if (result.appointment) {
      createFirestoreAppointment(result.appointment).catch((err) =>
        console.warn('Firestore appointment sync warning:', err)
      );
    }

    return result;
  } catch (err) {
    console.error('API createAppointment error:', err);
    const errorMessage = getErrorMessage(err, 'appointment');
    console.error('User-facing error:', errorMessage);
    throw new Error(errorMessage);
  }
}

export async function updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    // Real-time Firestore sync
    updateFirestoreAppointmentStatus(id, status).catch((err) =>
      console.warn('Firestore status sync warning:', err)
    );

    return res.ok;
  } catch (err) {
    console.warn('API updateAppointmentStatus error:', err);
    const errorMessage = getErrorMessage(err, 'appointment status');
    console.error('User-facing error:', errorMessage);
    return false;
  }
}

export async function updateAppointmentTechnician(id: number, technicianId: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}/technician`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id: technicianId }),
    });
    return res.ok;
  } catch (err) {
    console.error('API updateAppointmentTechnician error:', err);
    return false;
  }
}

export async function fetchReviews(salonId?: number): Promise<Review[]> {
  try {
    const url = salonId ? `${API_BASE}/reviews?salon_id=${salonId}` : `${API_BASE}/reviews`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return await res.json();
  } catch (err) {
    console.warn('API fetchReviews error:', err);
    const errorMessage = getErrorMessage(err, 'reviews');
    console.error('User-facing error:', errorMessage);
    return [];
  }
}

export async function createReview(data: Partial<Review>): Promise<Review> {
  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return await res.json();
  } catch (err) {
    console.error('API createReview error:', err);
    const errorMessage = getErrorMessage(err, 'review');
    console.error('User-facing error:', errorMessage);
    throw new Error(errorMessage);
  }
}

export async function fetchReels(): Promise<Reel[]> {
  try {
    const res = await fetch(`${API_BASE}/reels`);
    if (!res.ok) throw new Error('Failed to fetch reels');
    return await res.json();
  } catch (err) {
    console.warn('API fetchReels error:', err);
    return [];
  }
}

export async function toggleReelLike(reelId: number): Promise<{ likes: number; is_liked: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/reels/${reelId}/like`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle like');
    return await res.json();
  } catch (err) {
    console.error('API toggleReelLike error:', err);
    const errorMessage = getErrorMessage(err, 'like');
    console.error('User-facing error:', errorMessage);
    throw new Error(errorMessage);
  }
}

export async function toggleReelSave(reelId: number): Promise<{ saves_count: number; is_saved: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/reels/${reelId}/save`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle save');
    return await res.json();
  } catch (err) {
    console.error('API toggleReelSave error:', err);
    const errorMessage = getErrorMessage(err, 'save');
    console.error('User-facing error:', errorMessage);
    throw new Error(errorMessage);
  }
}

export async function addReelComment(reelId: number, comment: string, userName?: string): Promise<ReelCommentResponse> {
  try {
    const res = await fetch(`${API_BASE}/reels/${reelId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment, user_name: userName }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return await res.json();
  } catch (err) {
    console.error('API addReelComment error:', err);
    const errorMessage = getErrorMessage(err, 'comment');
    console.error('User-facing error:', errorMessage);
    throw new Error(errorMessage);
  }
}

export async function fetchPromotions(): Promise<Promotion[]> {
  try {
    const res = await fetch(`${API_BASE}/promotions`);
    if (!res.ok) throw new Error('Failed to fetch promotions');
    return await res.json();
  } catch (err) {
    console.warn('API fetchPromotions error:', err);
    return [];
  }
}

export async function fetchStats(): Promise<PlatformStats | null> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (err) {
    console.warn('API fetchStats error:', err);
    return null;
  }
}

// Announcements API
export async function fetchAnnouncements(audience?: string): Promise<Announcement[]> {
  try {
    const url = audience ? `${API_BASE}/announcements?audience=${audience}` : `${API_BASE}/announcements`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch announcements');
    return await res.json();
  } catch (err) {
    console.warn('API fetchAnnouncements error:', err);
    return [];
  }
}

export async function createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
  const res = await fetch(`${API_BASE}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create announcement');
  return await res.json();
}

export async function updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement> {
  const res = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update announcement');
  return await res.json();
}

export async function deleteAnnouncement(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function fetchRegistrationRateLimitStatus(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/settings/registration-rate-limit`);
  if (!res.ok) throw new Error('Failed to fetch registration rate-limit status');
  const data = await res.json();
  return data.enabled === true;
}

export async function updateRegistrationRateLimit(enabled: boolean): Promise<boolean> {
  const res = await fetch(`${API_BASE}/settings/registration-rate-limit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error('Failed to update registration rate-limit status');
  const data = await res.json();
  return data.enabled === true;
}

// Salon Profile & Location Update
export async function updateSalon(id: number, data: Partial<Salon>): Promise<Salon> {
  const res = await fetch(`${API_BASE}/salons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const responseData = await res.json();
  if (!res.ok) {
    throw new Error(responseData.error || responseData.details || 'Failed to update salon');
  }
  return responseData.salon || responseData;
}

export async function fetchWorkingHours(salonId: number): Promise<WorkingHour[]> {
  const res = await fetch(`${API_BASE}/working-hours?salon_id=${salonId}`);
  if (!res.ok) throw new Error('Failed to fetch working hours');
  return await res.json();
}

export async function updateWorkingHours(salonId: number, hours: Partial<WorkingHour>[]): Promise<WorkingHour[]> {
  const res = await fetch(`${API_BASE}/working-hours`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salon_id: salonId, hours }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update working hours');
  return data.working_hours;
}

// Admin Salon Approvals & Moderation
export async function updateSalonVerification(id: number, status: 'verified' | 'pending' | 'rejected'): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/salons/${id}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_status: status }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function toggleSalonActive(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/salons/${id}/toggle-active`, { method: 'PATCH' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function toggleSalonFeatured(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/salons/${id}/toggle-featured`, { method: 'PATCH' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function deleteSalon(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/salons/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Admin User Management
export async function updateUserStatus(id: number, status: 'active' | 'suspended'): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Admin Media/Content Moderation
export async function deleteReel(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/reels/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function deleteReview(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/reviews/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// User Profile Management
export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return await res.json();
  } catch (err) {
    console.error('API updateUser error:', err);
    const errorMessage = getErrorMessage(err, 'user profile');
    console.error('User-facing error:', errorMessage);
    throw new Error(errorMessage);
  }
}

export async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return await res.json();
}

// ---------------------------------------------------------------------------
// E-COMMERCE PRODUCTS & INVENTORY API (In-Store Physical Settlement)
// ---------------------------------------------------------------------------

export async function fetchProducts(params?: {
  salon_id?: number;
  category?: string;
  search?: string;
  low_stock_only?: boolean;
}): Promise<Product[]> {
  try {
    const query = new URLSearchParams();
    if (params?.salon_id) query.set('salon_id', String(params.salon_id));
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.low_stock_only) query.set('low_stock_only', 'true');

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const items = await res.json();
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn('API fetchProducts error:', err);
    return [];
  }
}

export async function fetchProductDetails(id: number): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return await res.json();
  } catch (err) {
    console.error('API fetchProductDetails error:', err);
    return null;
  }
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create product');
  }
  return await res.json();
}

export async function updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update product');
  }
  return await res.json();
}

export async function updateProductStock(
  id: number,
  change: { delta?: number; stock_quantity?: number }
): Promise<{ success: boolean; product: Product; message: string }> {
  const res = await fetch(`${API_BASE}/products/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(change),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to adjust stock');
  }
  return await res.json();
}

export async function deleteProduct(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function fetchProductOrders(params?: {
  customer_id?: number;
  salon_id?: number;
  status?: string;
}): Promise<ProductOrder[]> {
  try {
    const query = new URLSearchParams();
    if (params?.customer_id) query.set('customer_id', String(params.customer_id));
    if (params?.salon_id) query.set('salon_id', String(params.salon_id));
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/product-orders?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch product orders');
    const items = await res.json();
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn('API fetchProductOrders error:', err);
    return [];
  }
}

export async function createProductOrder(orderData: {
  salon_id: number;
  customer_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: Array<{
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    image_url?: string;
    volume_or_size?: string;
  }>;
  pickup_date: string;
  pickup_time?: string;
  notes?: string;
}): Promise<{ success: boolean; order: ProductOrder; message: string }> {
  const res = await fetch(`${API_BASE}/product-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to reserve product order');
  }
  return await res.json();
}

export async function updateProductOrderStatus(
  orderId: number,
  status: ProductOrderStatus
): Promise<{ success: boolean; order: ProductOrder; message: string }> {
  const res = await fetch(`${API_BASE}/product-orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update order status');
  }
  return await res.json();
}

