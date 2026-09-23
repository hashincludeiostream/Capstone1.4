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
  cancellation_strikes?: number;
  reliability_score?: number;
  booking_cooldown_until?: string | null;
  requires_prepayment?: boolean;
  email_verified?: boolean;
  google_verified?: boolean;
  provider?: 'google' | 'local';
  notification_preferences?: {
    email_bookings?: boolean;
    email_orders?: boolean;
    email_promos?: boolean;
    email_monthly_reports?: boolean;
    email_registration_alerts?: boolean;
  };
}

export interface EmailLog {
  id: number | string;
  recipient_email: string;
  recipient_name?: string;
  recipient_role: UserRole;
  subject: string;
  category: 'booking' | 'order' | 'promo' | 'report' | 'verification' | 'alert';
  content_preview: string;
  html_body: string;
  has_pdf_attachment?: boolean;
  attachment_name?: string;
  pdf_html?: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'failed';
  sender_email?: string;
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
  cancellation_policy_config?: SalonCancellationPolicyConfig;
}

export interface SalonCancellationPolicyConfig {
  grace_period_minutes: number; // default: 30
  late_fee_type: 'percentage' | 'fixed'; // default: 'percentage'
  late_fee_percentage: number; // default: 25 (%)
  critical_fee_percentage: number; // default: 50 (%)
  min_late_fee: number; // default: 150 (PHP)
  min_critical_fee: number; // default: 250 (PHP)
  allow_owner_waiver: boolean; // default: true
  enable_grace_period: boolean; // default: true
  auto_charge_deposit: boolean; // default: true
  unclaimed_order_grace_hours?: number; // default: 48 (hours before in-store order is considered overdue/unclaimed)
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

export type PaymentMethod = 'pay_in_salon' | 'paymongo_gcash' | 'paymongo_maya' | 'paymongo_card' | 'paymongo_link';
export type PaymentType = 'deposit' | 'full_payment' | 'pay_at_salon';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded';

export interface PaymentTransaction {
  id: number;
  transaction_reference: string;
  entity_type: 'appointment' | 'product_order';
  entity_id: number;
  customer_id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  salon_id: number;
  salon_name?: string;
  amount: number;
  total_service_price?: number;
  remaining_balance?: number;
  currency: 'PHP';
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  payment_status: 'succeeded' | 'pending' | 'failed';
  provider: 'paymongo_live' | 'paymongo_sandbox';
  provider_reference?: string;
  paymongo_checkout_url?: string;
  receipt_number?: string;
  created_at: string;
}

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
  design_image?: string;
  // Payment tracking
  payment_method?: PaymentMethod;
  payment_type?: PaymentType;
  payment_status?: PaymentStatus;
  paid_amount?: number;
  remaining_balance?: number;
  transaction_reference?: string;
  // Cancellation & Rescheduling tracking
  cancellation_reason?: string;
  cancellation_notes?: string;
  cancellation_tier?: 'flexible' | 'late' | 'critical';
  cancellation_fee?: number;
  cancellation_fee_status?: 'assessed' | 'collected' | 'waived';
  cancellation_fee_waived_reason?: string;
  outside_grace_period?: boolean;
  grace_period_minutes?: number;
  cancellation_elapsed_minutes?: number;
  cancellation_strike?: boolean;
  cancelled_at?: string;
  cancelled_by?: 'customer' | 'salon_owner' | 'admin';
  rescheduled_from_id?: number;
  reschedule_count?: number;
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
  total_users?: number;
  total_salons: number;
  verified_salons: number;
  pending_salons: number;
  total_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  total_reviews: number;
  average_rating?: number;
  total_reels: number;
  total_announcements: number;
  active_announcements: number;
  estimated_gmv: number;
  platform_commission: number;
}

// ---------------------------------------------------------------------------
// E-COMMERCE PRODUCTS & INVENTORY TYPES (In-Store Physical Settlement)
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  salon_id: number;
  salon_name?: string;
  salon_city?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  low_stock_threshold: number;
  sku?: string;
  image_url?: string;
  volume_or_size?: string;
  rating?: number;
  review_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductOrderItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  image_url?: string;
  volume_or_size?: string;
}

export type ProductOrderStatus = 'pending_pickup' | 'ready_for_pickup' | 'completed' | 'cancelled' | 'unclaimed';

export interface ProductOrder {
  id: number;
  order_number: string;
  salon_id: number;
  salon_name?: string;
  salon_address?: string;
  salon_phone?: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  items: ProductOrderItem[];
  total_amount: number;
  total_items: number;
  status: ProductOrderStatus;
  pickup_date: string;
  pickup_time?: string;
  notes?: string;
  payment_method: 'pay_in_store';
  // Cancellation tracking
  cancellation_reason?: string;
  cancellation_notes?: string;
  cancelled_at?: string;
  cancelled_by?: 'customer' | 'salon_owner' | 'admin';
  restocked_items_count?: number;
  // Unclaimed In-Store tracking
  unclaimed_at?: string;
  unclaimed_reason?: string;
  is_overdue_unclaimed?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
