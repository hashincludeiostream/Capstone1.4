import { User, Salon, Service, Technician, Appointment, Review, Reel, BusinessCategory, WorkingHour, Promotion, Announcement } from '../types';

export const initialCategories: BusinessCategory[] = [
  { id: 1, category_name: 'Nail Services', description: 'Professional nail care and beauty services', icon: '💅' },
  { id: 2, category_name: 'Manicure', description: 'Nail shaping, cuticle care, polish, and manicure services', icon: '✂️' },
  { id: 3, category_name: 'Pedicure', description: 'Foot care, nail shaping, polish, and pedicure treatments', icon: '🩷' },
  { id: 4, category_name: 'Nail Art', description: 'Decorative nail art, chrome, charms, and design services', icon: '✨' },
  { id: 5, category_name: 'Nail Extensions', description: 'Gel-X, acrylic, hard gel, and extension services', icon: '💎' },
  { id: 6, category_name: 'Gel Polish', description: 'Gel polish, shine, strengthening, and premium color services', icon: '🌈' },
  { id: 7, category_name: 'Nail Care', description: 'Nail health, strengthening, cuticle, and repair treatments', icon: '🌿' },
  { id: 8, category_name: 'Nail Design', description: 'Custom nail design and seasonal nail styling services', icon: '🎨' },
];

export const initialUsers: User[] = [];

export const initialSalons: Salon[] = [];

export const initialServices: Service[] = [];

export const initialTechnicians: Technician[] = [];

export const initialAppointments: Appointment[] = [];

export const initialReviews: Review[] = [];

export const initialReels: Reel[] = [];

export const initialPromotions: Promotion[] = [];

export const initialAnnouncements: Announcement[] = [];

export const initialWorkingHours: WorkingHour[] = [];

