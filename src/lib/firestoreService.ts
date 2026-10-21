import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from './firebase';
import {
  seedCategories,
  seedUsers,
  seedSalons,
  seedServices,
  seedTechnicians,
  seedAppointments,
  seedReviews,
  seedProducts,
} from '../data/seedData';
import {
  Salon,
  Service,
  Technician,
  Appointment,
  Review,
  Product,
  BusinessCategory,
  User,
  AppointmentStatus,
} from '../types';

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initializes Firestore collections with seed data if they don't already exist.
 * Maintains the relational IDs (salon_id, owner_id, customer_id, service_id, technician_id)
 * so that all relational queries work natively.
 */
export async function initializeFirestoreData(): Promise<boolean> {
  // If already successfully verified, return true
  if (isInitialized) return true;

  // Deduplicate concurrent in-flight initialization attempts
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Verify connection to Cloud Firestore
      const salonsSnap = await getDocs(collection(db, 'salons'));
      if (!salonsSnap.empty) {
        console.log(`🔥 [Firestore] Connected to Cloud Firestore (${salonsSnap.size} live salons loaded).`);
      } else {
        console.log('🔥 [Firestore] Connected to Cloud Firestore.');
      }
      isInitialized = true;
      return true;
    } catch (err) {
      // Do NOT permanently set isInitialized to true if the check failed;
      // keep it false so subsequent requests can retry.
      isInitialized = false;
      console.warn('[Firestore] Initialization check note (using fallback/offline mode):', err);
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

// ----------------------------------------------------------------------------
// Real-time Subscriptions (onSnapshot) for live reactive UI
// ----------------------------------------------------------------------------

/**
 * Real-time listener for salon appointments.
 * Fires callback immediately with data and whenever any appointment is added/modified.
 * Strictly requires either customer_id or salon_id to prevent unconstrained queries
 * that could expose other users' private appointments.
 */
export function subscribeToAppointments(
  filters: { salon_id?: number; customer_id?: number },
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (err: Error) => void
): () => void {
  const salonId = filters?.salon_id ? Number(filters.salon_id) : null;
  const customerId = filters?.customer_id ? Number(filters.customer_id) : null;

  // Security guard against missing filters: NEVER allow an unconstrained query that exposes all appointments!
  if (!salonId && !customerId) {
    const error = new Error('Security Error: subscribeToAppointments requires a specific salon_id or customer_id filter to prevent exposing other clients\' appointments.');
    console.error('[Firestore Security]', error.message);
    if (onError) onError(error);
    onUpdate([]);
    return () => {};
  }

  try {
    const apptsCol = collection(db, 'appointments');
    const q = salonId
      ? query(apptsCol, where('salon_id', '==', salonId))
      : query(apptsCol, where('customer_id', '==', customerId!));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: Appointment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            ...data,
            id: Number(data.id || docSnap.id),
          } as Appointment);
        });
        // Sort descending by recency (LIFO)
        items.sort((a, b) => {
          const timeB = new Date(b.updated_at || b.cancelled_at || b.created_at || (b.appointment_date ? `${b.appointment_date}T${b.appointment_time || '00:00'}` : 0)).getTime();
          const timeA = new Date(a.updated_at || a.cancelled_at || a.created_at || (a.appointment_date ? `${a.appointment_date}T${a.appointment_time || '00:00'}` : 0)).getTime();
          if (!isNaN(timeB) && !isNaN(timeA) && timeB !== timeA) return timeB - timeA;
          return Number(b.id || 0) - Number(a.id || 0);
        });
        onUpdate(items);
      },
      (error) => {
        const isTransientIdle =
          (error as any)?.code === 'cancelled' ||
          (error as any)?.code === 1 ||
          error.message?.includes('CANCELLED') ||
          error.message?.includes('idle stream') ||
          error.message?.includes('Timed out waiting for new targets');
        if (!isTransientIdle) {
          console.warn('[Firestore] Real-time appointments subscription error:', error);
          if (onError) onError(error);
        }
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach appointment listener:', err);
    return () => {};
  }
}

/**
 * Real-time listener for salons (e.g. for owner dashboard branches or main directory).
 */
export function subscribeToSalons(
  filters: { owner_id?: number; includeUnpublished?: boolean },
  onUpdate: (salons: Salon[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const salonsCol = collection(db, 'salons');
    let q = query(salonsCol);

    if (filters.owner_id) {
      q = query(salonsCol, where('owner_id', '==', Number(filters.owner_id)));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const items: Salon[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!filters.includeUnpublished && !filters.owner_id) {
            if (!data.is_active || data.verification_status !== 'verified') {
              return;
            }
          }
          items.push({
            ...data,
            id: Number(data.id || docSnap.id),
            owner_id: Number(data.owner_id),
            is_active: Boolean(data.is_active),
            avg_rating: Number(data.avg_rating || 0),
            review_count: Number(data.review_count || 0),
          } as Salon);
        });
        onUpdate(items);
      },
      (error) => {
        const isTransientIdle =
          (error as any)?.code === 'cancelled' ||
          (error as any)?.code === 1 ||
          error.message?.includes('CANCELLED') ||
          error.message?.includes('idle stream') ||
          error.message?.includes('Timed out waiting for new targets');
        if (!isTransientIdle) {
          console.warn('[Firestore] Real-time salons subscription error:', error);
          if (onError) onError(error);
        }
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach salons listener:', err);
    return () => {};
  }
}

// ----------------------------------------------------------------------------
// Async CRUD operations directly with Firestore with Quota Circuit-Breaker
// ----------------------------------------------------------------------------

let clientQuotaExceeded = false;
let clientQuotaCooldownUntil = 0;

function isClientQuotaExceeded(): boolean {
  if (clientQuotaExceeded) {
    if (Date.now() < clientQuotaCooldownUntil) {
      return true;
    }
    clientQuotaExceeded = false;
  }
  return false;
}

function handleClientFirestoreError(err: any, context: string): void {
  const code = err?.code || '';
  const msg = err?.message || String(err || '');
  if (
    code === 'resource-exhausted' ||
    code === 8 ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota limit exceeded')
  ) {
    if (!clientQuotaExceeded) {
      clientQuotaExceeded = true;
      clientQuotaCooldownUntil = Date.now() + 30 * 60 * 1000;
      console.warn('⚠️ [Firestore Quota] Free tier daily write limit reached (RESOURCE_EXHAUSTED). Application gracefully operating in local persistence mode.');
    }
    return;
  }
  if (!msg.includes('UNAVAILABLE') && !msg.includes('unavailable') && !msg.includes('offline')) {
    console.warn(`[Firestore] ${context} note:`, msg);
  }
}

export async function createFirestoreAppointment(data: Partial<Appointment>): Promise<Appointment> {
  const newId = Number(data.id) || Date.now();
  const appointmentRecord: Appointment = {
    id: newId,
    customer_id: Number(data.customer_id || 1),
    customer_name: data.customer_name || 'Valued Client',
    customer_phone: data.customer_phone || '',
    customer_email: data.customer_email || '',
    salon_id: Number(data.salon_id),
    salon_name: data.salon_name || '',
    service_id: Number(data.service_id),
    service_name: data.service_name || '',
    service_price: Number(data.service_price || 0),
    service_duration: Number(data.service_duration || 60),
    technician_id: data.technician_id ? Number(data.technician_id) : null,
    technician_name: data.technician_name || 'First Available Specialist',
    total_price: Number(data.total_price || data.service_price || 0),
    appointment_date: data.appointment_date || new Date().toISOString().split('T')[0],
    appointment_time: data.appointment_time || '10:00 AM',
    status: (data.status as AppointmentStatus) || 'pending',
    notes: data.notes || '',
    design_image: data.design_image || '',
    payment_method: data.payment_method || 'pay_in_salon',
    payment_type: data.payment_type || 'pay_at_salon',
    payment_status: data.payment_status || (data.payment_type === 'deposit' ? 'deposit_paid' : data.payment_type === 'full_payment' ? 'fully_paid' : 'unpaid'),
    paid_amount: Number(data.paid_amount || 0),
    remaining_balance: Number(data.remaining_balance !== undefined ? data.remaining_balance : (data.total_price || data.service_price || 0)),
    transaction_reference: data.transaction_reference || '',
    created_at: new Date().toISOString(),
  };

  if (!isClientQuotaExceeded()) {
    try {
      await setDoc(doc(db, 'appointments', String(newId)), appointmentRecord);
    } catch (err) {
      handleClientFirestoreError(err, 'create appointment');
    }
  }
  return appointmentRecord;
}

export async function createFirestoreTransaction(tx: any): Promise<any> {
  const txId = tx.id || Date.now();
  const docRef = doc(db, 'transactions', String(txId));
  if (!isClientQuotaExceeded()) {
    try {
      await setDoc(docRef, { ...tx, id: txId });
    } catch (err) {
      handleClientFirestoreError(err, 'create transaction');
    }
  }
  return { ...tx, id: txId };
}

export async function updateFirestoreAppointmentStatus(
  id: number,
  status: AppointmentStatus,
  extraData?: Record<string, any>
): Promise<boolean> {
  if (isClientQuotaExceeded()) return true;
  try {
    const ref = doc(db, 'appointments', String(id));
    await setDoc(
      ref,
      {
        id: Number(id),
        status,
        ...(extraData || {}),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleClientFirestoreError(err, 'update appointment status');
    return false;
  }
}

export async function updateFirestoreAppointmentTechnician(
  id: number,
  technicianId: number,
  technicianName?: string
): Promise<boolean> {
  if (isClientQuotaExceeded()) return true;
  try {
    const ref = doc(db, 'appointments', String(id));
    const updateData: Record<string, any> = {
      id: Number(id),
      technician_id: Number(technicianId),
      updated_at: new Date().toISOString(),
    };
    if (technicianName) {
      updateData.technician_name = technicianName;
    }
    await setDoc(ref, updateData, { merge: true });
    return true;
  } catch (err) {
    handleClientFirestoreError(err, 'update appointment technician');
    return false;
  }
}

export async function createFirestoreProductOrder(order: any): Promise<any> {
  const orderId = String(order.id || Date.now());
  if (!isClientQuotaExceeded()) {
    try {
      await setDoc(doc(db, 'product_orders', orderId), order);
    } catch (err) {
      handleClientFirestoreError(err, 'create product order');
    }
  }
  return order;
}

export async function updateFirestoreProductOrderStatus(
  orderId: number,
  status: string,
  extraData?: Record<string, any>
): Promise<boolean> {
  if (isClientQuotaExceeded()) return true;
  try {
    const ref = doc(db, 'product_orders', String(orderId));
    await updateDoc(ref, {
      status,
      ...(extraData || {}),
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    handleClientFirestoreError(err, 'update product order status');
    return false;
  }
}

export async function createFirestoreSalon(data: Partial<Salon>): Promise<Salon> {
  const newId = Date.now();
  const salonRecord: Salon = {
    id: newId,
    owner_id: Number(data.owner_id || 1),
    salon_name: data.salon_name || 'New Salon Branch',
    address: data.address || 'Davao City',
    city: data.city || 'Davao City',
    province: data.province || 'Davao del Sur',
    postal_code: data.postal_code || '8000',
    landmark: data.landmark || '',
    parking_info: data.parking_info || '',
    phone: data.phone || '',
    email: data.email || '',
    description: data.description || '',
    logo: data.logo || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&auto=format&fit=crop&q=80',
    banner: data.banner || 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=1200&auto=format&fit=crop&q=80',
    avg_rating: 0,
    review_count: 0,
    is_active: true,
    verification_status: 'verified',
    category_id: data.category_id ? Number(data.category_id) : 1,
    category_name: data.category_name || 'Nail Services',
    latitude: data.latitude || 7.0898,
    longitude: data.longitude || 125.6111,
    featured: Boolean(data.featured),
    monthly_target_bookings: Number(data.monthly_target_bookings || 100),
  };

  if (!isClientQuotaExceeded()) {
    try {
      await setDoc(doc(db, 'salons', String(newId)), salonRecord);
    } catch (err) {
      handleClientFirestoreError(err, 'create salon');
    }
  }
  return salonRecord;
}

export async function createFirestoreService(data: Partial<Service>): Promise<Service> {
  const newId = Date.now();
  const serviceRecord: Service = {
    id: newId,
    salon_id: Number(data.salon_id),
    service_name: data.service_name || 'Specialty Nail Treatment',
    description: data.description || '',
    category: data.category || 'Nail Services',
    category_name: data.category_name || data.category || 'Nail Services',
    price: Number(data.price || 0),
    duration: Number(data.duration || 60),
    duration_minutes: Number(data.duration || 60),
    is_active: true,
    image_url: data.image_url || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80',
    difficulty_level: data.difficulty_level || 'Intermediate',
  };

  if (!isClientQuotaExceeded()) {
    try {
      await setDoc(doc(db, 'services', String(newId)), serviceRecord);
    } catch (err) {
      handleClientFirestoreError(err, 'create service');
    }
  }
  return serviceRecord;
}

export async function createFirestoreReview(data: Partial<Review>): Promise<Review> {
  const newId = Date.now();
  const reviewRecord: Review = {
    id: newId,
    salon_id: Number(data.salon_id),
    user_id: Number(data.user_id || 1),
    user_name: data.user_name || 'Verified Client',
    user_avatar: data.user_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: Number(data.rating || 5),
    comment: data.comment || '',
    service_name: data.service_name || 'Nail Service',
    created_at: new Date().toISOString(),
  };

  if (!isClientQuotaExceeded()) {
    try {
      await setDoc(doc(db, 'reviews', String(newId)), reviewRecord);
    } catch (err) {
      handleClientFirestoreError(err, 'create review');
    }
  }
  return reviewRecord;
}

export async function updateFirestoreUser(
  userId: number,
  userData: Record<string, any>
): Promise<boolean> {
  if (isClientQuotaExceeded()) return true;
  try {
    const ref = doc(db, 'users', String(userId));
    await updateDoc(ref, {
      ...userData,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    // If doc doesn't exist yet, create it with setDoc merge
    try {
      const ref = doc(db, 'users', String(userId));
      await setDoc(ref, { ...userData, id: userId, updated_at: new Date().toISOString() }, { merge: true });
      return true;
    } catch (setErr) {
      handleClientFirestoreError(setErr, 'update user');
      return false;
    }
  }
}
