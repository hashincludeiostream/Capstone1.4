export type UserRole = 'customer' | 'salon_owner' | 'admin';

export interface User {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  user_type: UserRole;
  created_at: string;
  avatar?: string;
  status?: 'active' | 'suspended' | 'banned';
}

export interface Salon {
  id: number;
  owner_id: number;
  salon_name: string;
  address: string;
  city?: string;
  province?: string;
  postal_code?: string;
  landmark?: string;
  parking_info?: string;
  phone: string;
  email: string;
  description: string;
  logo: string;
  banner?: string;
  avg_rating: number;
  review_count: number;
  is_active: boolean;
  verification_status?: 'verified' | 'pending' | 'rejected';
  category_id?: number;
  category_name?: string;
  latitude?: number;
  longitude?: number;
  maps_place_id?: string;
  maps_embed_url?: string;
  featured?: boolean;
  monthly_target_bookings?: number;
}

export interface Service {
  id: number;
  salon_id: number;
  service_name: string;
  description: string;
  category: string;
  category_name?: string;
  price: number;
  duration: number; // in minutes
  duration_minutes?: number;
  is_active: boolean;
  image_url?: string;
  image?: string;
  difficulty_level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Technician {
  id: number;
  salon_id: number;
  fullname: string;
  name?: string;
  email?: string;
  phone?: string;
  specialties: string;
  bio?: string;
  experience_years: number;
  avatar?: string;
  is_available?: boolean;
  is_active?: boolean;
  rating?: number;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  salon_id: number;
  salon_name?: string;
  service_id: number;
  service_name?: string;
  service_price?: number;
  service_duration?: number;
  technician_id?: number | null;
  technician_name?: string;
  staff_id?: number | null;
  staff_name?: string;
  total_price?: number;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

export interface Review {
  id: number;
  salon_id: number;
  salon_name?: string;
  technician_id?: number | null;
  technician_name?: string;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  service_name?: string;
  created_at: string;
  // Backend compatibility fields
  customer_id?: number;
  customer_name?: string;
  review_text?: string;
}

export interface ReelComment {
  id: number;
  reel_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface Reel {
  id: number;
  salon_id: number;
  salon_name: string;
  salon_logo?: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  category: string;
  duration: number;
  views: number;
  likes: number;
  is_liked?: boolean;
  is_saved?: boolean;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  comments?: ReelComment[];
  created_at: string;
}

export interface BusinessCategory {
  id: number;
  category_name: string;
  description: string;
  icon: string;
}

export interface WorkingHour {
  id: number;
  salon_id: number;
  day_of_week: string;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
}

export interface Promotion {
  id: number;
  salon_id: number;
  salon_name?: string;
  title: string;
  description: string;
  discount_percentage: number;
  promo_code?: string;
  valid_from: string;
  valid_until: string;
  image_url?: string;
  is_active: boolean;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'promo' | 'alert' | 'maintenance';
  is_active: boolean;
  target_audience: 'all' | 'customers' | 'owners';
  created_at: string;
  link_url?: string;
  link_text?: string;
}

export interface ReelCommentResponse {
  id: number;
  reel_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface PlatformStats {
  total_customers: number;
  total_salon_owners: number;
  total_admins: number;
  total_salons: number;
  verified_salons: number;
  pending_salons: number;
  total_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  total_reviews: number;
  total_reels: number;
  total_announcements: number;
  active_announcements: number;
  estimated_gmv: number;
  platform_commission: number;
}
