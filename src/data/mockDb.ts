import { User, Salon, Service, Technician, Appointment, Review, Reel, BusinessCategory, WorkingHour, Promotion, Announcement } from '../types';
import {
  seedCategories,
  seedUsers,
  seedSalons,
  seedServices,
  seedTechnicians,
  seedWorkingHours,
  seedAppointments,
  seedReviews,
  seedReels,
  seedPromotions,
  seedAnnouncements,
} from './seedData';

export const initialCategories: BusinessCategory[] = seedCategories as any[];
export const initialUsers: User[] = seedUsers as any[];
export const initialSalons: Salon[] = seedSalons as any[];
export const initialServices: Service[] = seedServices as any[];
export const initialTechnicians: Technician[] = seedTechnicians as any[];
export const initialAppointments: Appointment[] = seedAppointments as any[];
export const initialReviews: Review[] = seedReviews as any[];
export const initialReels: Reel[] = seedReels as any[];
export const initialPromotions: Promotion[] = seedPromotions as any[];
export const initialAnnouncements: Announcement[] = seedAnnouncements as any[];
export const initialWorkingHours: WorkingHour[] = seedWorkingHours as any[];
