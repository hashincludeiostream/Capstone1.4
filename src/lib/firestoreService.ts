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

let initialized = false;

/**
 * Initializes Firestore collections with seed data if they don't already exist.
 * Maintains the relational IDs (salon_id, owner_id, customer_id, service_id, technician_id)
 * so that all relational queries work natively.
 */
export async function initializeFirestoreData() {
  if (initialized) return;
  initialized = true;

  try {
    // Check if salons collection has documents
    const salonsSnap = await getDocs(collection(db, 'salons'));
    if (salonsSnap.empty) {
      console.log('[Firestore] Seeding relational collections to Firestore...');

      // 1. Categories
      for (const cat of seedCategories) {
        await setDoc(doc(db, 'categories', String(cat.id)), cat);
      }

      // 2. Users
      for (const user of seedUsers) {
        await setDoc(doc(db, 'users', String(user.id)), user);
      }

      // 3. Salons
      for (const salon of seedSalons) {
        await setDoc(doc(db, 'salons', String(salon.id)), salon);
      }

      // 4. Services (Relational link: salon_id)
      for (const service of seedServices) {
        await setDoc(doc(db, 'services', String(service.id)), service);
      }

      // 5. Technicians (Relational link: salon_id)
      for (const tech of seedTechnicians) {
        await setDoc(doc(db, 'technicians', String(tech.id)), tech);
      }

      // 6. Appointments (Relational links: salon_id, customer_id, service_id, technician_id)
      for (const appt of seedAppointments) {
        await setDoc(doc(db, 'appointments', String(appt.id)), appt);
      }

      // 7. Reviews (Relational links: salon_id, user_id)
      for (const review of seedReviews) {
        await setDoc(doc(db, 'reviews', String(review.id)), review);
      }

      // 8. Products (Relational links: salon_id)
      for (const product of seedProducts) {
        await setDoc(doc(db, 'products', String(product.id)), product);
      }

      console.log('✅ [Firestore] All relational seed collections seeded successfully!');
    }
  } catch (err) {
    console.warn('[Firestore] Initialization check failed (using fallback/offline mode):', err);
  }
}

// ----------------------------------------------------------------------------
// Real-time Subscriptions (onSnapshot) for live reactive UI
// ----------------------------------------------------------------------------

/**
 * Real-time listener for salon appointments.
 * Fires callback immediately with data and whenever any appointment is added/modified.
 */
export function subscribeToAppointments(
  filters: { salon_id?: number; customer_id?: number },
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const apptsCol = collection(db, 'appointments');
    let q = query(apptsCol);

    if (filters.salon_id) {
      q = query(apptsCol, where('salon_id', '==', Number(filters.salon_id)));
    } else if (filters.customer_id) {
      q = query(apptsCol, where('customer_id', '==', Number(filters.customer_id)));
    }

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
        // Sort descending by created_at / appointment_date
        items.sort((a, b) => new Date(b.created_at || b.appointment_date).getTime() - new Date(a.created_at || a.appointment_date).getTime());
        onUpdate(items);
      },
      (error) => {
        console.warn('[Firestore] Real-time appointments subscription error:', error);
        if (onError) onError(error);
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
        console.warn('[Firestore] Real-time salons subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach salons listener:', err);
    return () => {};
  }
}

// ----------------------------------------------------------------------------
// Async CRUD operations directly with Firestore
// ----------------------------------------------------------------------------

export async function createFirestoreAppointment(data: Partial<Appointment>): Promise<Appointment> {
  const newId = Date.now();
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
    created_at: new Date().toISOString(),
  };

  await setDoc(doc(db, 'appointments', String(newId)), appointmentRecord);
  return appointmentRecord;
}

export async function updateFirestoreAppointmentStatus(id: number, status: AppointmentStatus): Promise<boolean> {
  try {
    const ref = doc(db, 'appointments', String(id));
    await updateDoc(ref, { status, updated_at: new Date().toISOString() });
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to update appointment status:', err);
    return false;
  }
}

export async function updateFirestoreAppointmentTechnician(
  id: number,
  technicianId: number,
  technicianName?: string
): Promise<boolean> {
  try {
    const ref = doc(db, 'appointments', String(id));
    const updateData: Record<string, any> = {
      technician_id: Number(technicianId),
      updated_at: new Date().toISOString(),
    };
    if (technicianName) {
      updateData.technician_name = technicianName;
    }
    await updateDoc(ref, updateData);
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to update appointment technician:', err);
    return false;
  }
}

export async function createFirestoreProductOrder(order: any): Promise<any> {
  try {
    const orderId = String(order.id || Date.now());
    await setDoc(doc(db, 'product_orders', orderId), order);
    return order;
  } catch (err) {
    console.warn('[Firestore] Failed to sync product order to firestore:', err);
    return order;
  }
}

export async function updateFirestoreProductOrderStatus(
  orderId: number,
  status: string
): Promise<boolean> {
  try {
    const ref = doc(db, 'product_orders', String(orderId));
    await updateDoc(ref, { status, updated_at: new Date().toISOString() });
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to update product order status in firestore:', err);
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

  await setDoc(doc(db, 'salons', String(newId)), salonRecord);
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

  await setDoc(doc(db, 'services', String(newId)), serviceRecord);
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

  await setDoc(doc(db, 'reviews', String(newId)), reviewRecord);
  return reviewRecord;
}
