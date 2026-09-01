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
} from '../types';

export const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export async function fetchCategories(): Promise<BusinessCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (err) {
    console.warn('API fetchCategories error:', err);
    return [];
  }
}

export async function fetchSalons(params?: { category?: number; search?: string; owner_id?: number }): Promise<Salon[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', String(params.category));
    if (params?.search) query.set('search', params.search);
    if (params?.owner_id) query.set('owner_id', String(params.owner_id));

    const res = await fetch(`${API_BASE}/salons?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch salons');
    return await res.json();
  } catch (err) {
    console.warn('API fetchSalons error:', err);
    return [];
  }
}

export async function fetchSalonDetails(id: number): Promise<{
  salon: Salon;
  services: Service[];
  technicians: Technician[];
  reviews: Review[];
  working_hours: any[];
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
    return await res.json();
  } catch (err) {
    console.warn('API fetchServices error:', err);
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
    return [];
  }
}

export async function createAppointment(data: Partial<Appointment>): Promise<{ success: boolean; appointment: Appointment }> {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create appointment');
  return await res.json();
}

export async function updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API updateAppointmentStatus error:', err);
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
    return [];
  }
}

export async function createReview(data: Partial<Review>): Promise<Review> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return await res.json();
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
  const res = await fetch(`${API_BASE}/reels/${reelId}/like`, { method: 'POST' });
  return await res.json();
}

export async function toggleReelSave(reelId: number): Promise<{ saves_count: number; is_saved: boolean }> {
  const res = await fetch(`${API_BASE}/reels/${reelId}/save`, { method: 'POST' });
  return await res.json();
}

export async function addReelComment(reelId: number, comment: string, userName?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/reels/${reelId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment, user_name: userName }),
  });
  return await res.json();
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

export async function fetchStats(): Promise<any> {
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

// Salon Profile & Location Update
export async function updateSalon(id: number, data: Partial<Salon>): Promise<Salon> {
  const res = await fetch(`${API_BASE}/salons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update salon');
  return await res.json();
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
  const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001';
  const res = await fetch(`${apiBase}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return await res.json();
}

export async function fetchUser(id: number): Promise<User> {
  const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001';
  const res = await fetch(`${apiBase}/api/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return await res.json();
}

