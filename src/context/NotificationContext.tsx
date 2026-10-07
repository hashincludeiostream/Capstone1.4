import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Announcement, Appointment, ProductOrder, Salon, User } from '../types';
import { localStorage as safeLocalStorage } from '../lib/localStorage';

export type NotificationPriority = 'urgent' | 'normal' | 'low';

export interface NotificationItem {
  id: string;
  category: 'cart' | 'bookings' | 'orders' | 'alerts' | 'system';
  priority: NotificationPriority;
  timestamp?: string;
  meta?: any;
}

export interface NotificationContextType {
  readItemIds: Set<string>;
  viewedAnnouncementIds: Set<number>;
  isRead: (id: string | number) => boolean;
  markAsRead: (id: string | number) => void;
  markAsUnread: (id: string | number) => void;
  markAllAsRead: (category?: string) => void;
  isAnnouncementViewed: (id: number) => boolean;
  markAnnouncementViewed: (id: number) => void;
  markAllAnnouncementsViewed: (announcementIds?: number[]) => void;
  isUrgent: (typeOrCategory: string, meta?: any) => boolean;
  unreadCount: number;
  urgentCount: number;
  categoryUnread: {
    cart: boolean;
    bookings: boolean;
    alerts: boolean;
  };
  unreadBookingsCount: number;
  unreadOrdersCount: number;
  unreadAlertsCount: number;
}

const STORAGE_KEY_READ = 'nailglamhub_read_notifications_global';
const STORAGE_KEY_ANNOUNCEMENTS = 'nailglamhub_viewed_announcements';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  currentUser?: User | null;
  announcements?: Announcement[];
  customerAppointments?: Appointment[];
  customerOrders?: ProductOrder[];
  ownerAppointments?: Appointment[];
  ownerProductOrders?: ProductOrder[];
  ownerSalons?: Salon[];
  adminPendingSalons?: Salon[];
  cartItemCount?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  currentUser,
  announcements = [],
  customerAppointments = [],
  customerOrders = [],
  ownerAppointments = [],
  ownerProductOrders = [],
  ownerSalons = [],
  adminPendingSalons = [],
  cartItemCount = 0,
}) => {
  // Read item IDs stored globally
  const [readItemIds, setReadItemIds] = useState<Set<string>>(() => {
    try {
      const saved = safeLocalStorage.getJSON<string[]>(STORAGE_KEY_READ);
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  // Viewed announcement IDs stored globally
  const [viewedAnnouncementIds, setViewedAnnouncementIds] = useState<Set<number>>(() => {
    try {
      const saved = safeLocalStorage.getJSON<number[]>(STORAGE_KEY_ANNOUNCEMENTS);
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  // Cross-tab and window synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_READ && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setReadItemIds(new Set(parsed));
          }
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEY_ANNOUNCEMENTS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setViewedAnnouncementIds(new Set(parsed));
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Check if an item is read
  const isRead = useCallback(
    (id: string | number): boolean => {
      const idStr = String(id);
      if (readItemIds.has(idStr)) return true;
      if (typeof id === 'number' && viewedAnnouncementIds.has(id)) return true;
      if (idStr.startsWith('announcement-')) {
        const numId = Number(idStr.replace('announcement-', ''));
        if (!isNaN(numId) && viewedAnnouncementIds.has(numId)) return true;
      }
      return false;
    },
    [readItemIds, viewedAnnouncementIds]
  );

  // Mark single item as read
  const markAsRead = useCallback((id: string | number) => {
    const idStr = String(id);
    setReadItemIds((prev) => {
      if (prev.has(idStr)) return prev;
      const next = new Set(prev);
      next.add(idStr);
      safeLocalStorage.setJSON(STORAGE_KEY_READ, Array.from(next));
      return next;
    });

    if (idStr.startsWith('announcement-')) {
      const numId = Number(idStr.replace('announcement-', ''));
      if (!isNaN(numId)) {
        setViewedAnnouncementIds((prev) => {
          if (prev.has(numId)) return prev;
          const next = new Set(prev);
          next.add(numId);
          safeLocalStorage.setJSON(STORAGE_KEY_ANNOUNCEMENTS, Array.from(next));
          return next;
        });
      }
    }
  }, []);

  // Mark single item as unread
  const markAsUnread = useCallback((id: string | number) => {
    const idStr = String(id);
    setReadItemIds((prev) => {
      if (!prev.has(idStr)) return prev;
      const next = new Set(prev);
      next.delete(idStr);
      safeLocalStorage.setJSON(STORAGE_KEY_READ, Array.from(next));
      return next;
    });
  }, []);

  // Check if announcement is viewed
  const isAnnouncementViewed = useCallback(
    (id: number): boolean => {
      return viewedAnnouncementIds.has(id) || readItemIds.has(`announcement-${id}`);
    },
    [viewedAnnouncementIds, readItemIds]
  );

  // Mark announcement as viewed
  const markAnnouncementViewed = useCallback((id: number) => {
    setViewedAnnouncementIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      safeLocalStorage.setJSON(STORAGE_KEY_ANNOUNCEMENTS, Array.from(next));
      return next;
    });

    setReadItemIds((prev) => {
      const key = `announcement-${id}`;
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      safeLocalStorage.setJSON(STORAGE_KEY_READ, Array.from(next));
      return next;
    });
  }, []);

  // Mark all announcements as viewed
  const markAllAnnouncementsViewed = useCallback(
    (anncIds?: number[]) => {
      const idsToView = anncIds && anncIds.length > 0 ? anncIds : announcements.map((a) => a.id);
      setViewedAnnouncementIds((prev) => {
        const next = new Set(prev);
        idsToView.forEach((id) => next.add(id));
        safeLocalStorage.setJSON(STORAGE_KEY_ANNOUNCEMENTS, Array.from(next));
        return next;
      });

      setReadItemIds((prev) => {
        const next = new Set(prev);
        idsToView.forEach((id) => next.add(`announcement-${id}`));
        safeLocalStorage.setJSON(STORAGE_KEY_READ, Array.from(next));
        return next;
      });
    },
    [announcements]
  );

  // Determine urgency according to domain rules
  const isUrgent = useCallback((typeOrCategory: string, meta?: any): boolean => {
    if (typeOrCategory === 'alert' || typeOrCategory === 'urgent') return true;
    if (meta?.type === 'alert') return true;
    if (meta?.is_overdue_unclaimed) return true;
    if (meta?.status === 'pending_pickup' && meta?.pickup_date && meta.pickup_date < new Date().toISOString().split('T')[0]) {
      return true;
    }
    // High-priority salon approval requests or pending cancellations
    if (meta?.isUrgent) return true;
    return false;
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(
    (category?: string) => {
      const allIdsToAdd: string[] = [];

      if (!category || category === 'cart' || category === 'all') {
        if (cartItemCount > 0) allIdsToAdd.push('cart-active');
        customerOrders.forEach((o) => allIdsToAdd.push(`cust-order-${o.id}`));
        ownerProductOrders.forEach((o) => allIdsToAdd.push(`owner-order-${o.id}`));
      }

      if (!category || category === 'bookings' || category === 'all') {
        customerAppointments.forEach((a) => {
          allIdsToAdd.push(`cust-appt-${a.id}`);
          allIdsToAdd.push(`cust-appt-${a.id}-${a.status}`);
        });
        ownerAppointments.forEach((a) => {
          allIdsToAdd.push(`owner-appt-${a.id}`);
          allIdsToAdd.push(`owner-appt-${a.id}-${a.status}`);
        });
      }

      if (!category || category === 'alerts' || category === 'all') {
        adminPendingSalons.forEach((s) => allIdsToAdd.push(`admin-salon-${s.id}`));
        ownerSalons
          .filter((s) => s.verification_status === 'pending')
          .forEach((s) => allIdsToAdd.push(`owner-branch-${s.id}`));
        announcements.forEach((a) => allIdsToAdd.push(`announcement-${a.id}`));
      }

      setReadItemIds((prev) => {
        const next = new Set(prev);
        allIdsToAdd.forEach((id) => next.add(id));
        safeLocalStorage.setJSON(STORAGE_KEY_READ, Array.from(next));
        return next;
      });

      // Also mark announcements viewed
      markAllAnnouncementsViewed();
    },
    [
      cartItemCount,
      customerOrders,
      ownerProductOrders,
      customerAppointments,
      ownerAppointments,
      adminPendingSalons,
      ownerSalons,
      announcements,
      markAllAnnouncementsViewed,
    ]
  );

  // Calculate unread items & urgent notifications
  const { unreadCount, urgentCount, categoryUnread, unreadBookingsCount, unreadOrdersCount, unreadAlertsCount } = useMemo(() => {
    let unread = 0;
    let urgent = 0;
    let unreadCart = false;
    let unreadBookings = false;
    let unreadAlerts = false;
    let bookingsUnreadCount = 0;
    let ordersUnreadCount = 0;
    let alertsUnreadCount = 0;

    // 1. Cart
    if (cartItemCount > 0 && !readItemIds.has('cart-active')) {
      unread++;
      unreadCart = true;
      ordersUnreadCount++;
    }

    // 2. Customer orders
    if (currentUser?.user_type === 'customer') {
      customerOrders
        .filter((o) => o.status === 'pending_pickup' || o.status === 'ready_for_pickup')
        .forEach((o) => {
          if (!readItemIds.has(`cust-order-${o.id}`)) {
            unread++;
            unreadCart = true;
            ordersUnreadCount++;
            if (o.is_overdue_unclaimed) urgent++;
          }
        });
    }

    // 3. Owner orders
    if (currentUser?.user_type === 'salon_owner') {
      ownerProductOrders
        .filter((o) => o.status === 'pending_pickup')
        .forEach((o) => {
          if (!readItemIds.has(`owner-order-${o.id}`)) {
            unread++;
            unreadCart = true;
            ordersUnreadCount++;
          }
        });
    }

    // 4. Customer Bookings (Pending, Confirmed, Cancelled)
    if (currentUser?.user_type === 'customer') {
      customerAppointments
        .filter((a) => ['confirmed', 'pending', 'cancelled'].includes(a.status))
        .forEach((a) => {
          const statusKey = `cust-appt-${a.id}-${a.status}`;
          if (!readItemIds.has(statusKey)) {
            unread++;
            unreadBookings = true;
            bookingsUnreadCount++;
            if (a.status === 'cancelled' || a.status === 'confirmed') {
              urgent++;
            }
          }
        });
    }

    // 5. Owner Bookings (Pending requests, Confirmed schedule, Cancelled bookings)
    if (currentUser?.user_type === 'salon_owner') {
      ownerAppointments
        .filter((a) => ['pending', 'confirmed', 'cancelled'].includes(a.status))
        .forEach((a) => {
          const statusKey = `owner-appt-${a.id}-${a.status}`;
          if (!readItemIds.has(statusKey)) {
            unread++;
            unreadBookings = true;
            bookingsUnreadCount++;
            if (a.status === 'pending' || a.status === 'cancelled') {
              // Booking requests awaiting owner approval or cancellations are urgent
              urgent++;
            }
          }
        });
    }

    // 6. Admin pending salons
    if (currentUser?.user_type === 'admin') {
      adminPendingSalons.forEach((s) => {
        if (!readItemIds.has(`admin-salon-${s.id}`)) {
          unread++;
          unreadAlerts = true;
          alertsUnreadCount++;
        }
      });
    }

    // 7. Owner pending branches
    if (currentUser?.user_type === 'salon_owner') {
      ownerSalons
        .filter((s) => s.verification_status === 'pending')
        .forEach((s) => {
          if (!readItemIds.has(`owner-branch-${s.id}`)) {
            unread++;
            unreadAlerts = true;
            alertsUnreadCount++;
          }
        });
    }

    // 8. Active announcements
    announcements
      .filter((a) => a.is_active && !viewedAnnouncementIds.has(a.id) && !readItemIds.has(`announcement-${a.id}`))
      .forEach((a) => {
        unread++;
        unreadAlerts = true;
        alertsUnreadCount++;
        if (a.type === 'alert') {
          urgent++;
        }
      });

    return {
      unreadCount: unread,
      urgentCount: urgent,
      categoryUnread: {
        cart: unreadCart,
        bookings: unreadBookings,
        alerts: unreadAlerts,
      },
      unreadBookingsCount: bookingsUnreadCount,
      unreadOrdersCount: ordersUnreadCount,
      unreadAlertsCount: alertsUnreadCount,
    };
  }, [
    cartItemCount,
    readItemIds,
    currentUser,
    customerOrders,
    ownerProductOrders,
    customerAppointments,
    ownerAppointments,
    adminPendingSalons,
    ownerSalons,
    announcements,
    viewedAnnouncementIds,
  ]);

  const value = useMemo(
    () => ({
      readItemIds,
      viewedAnnouncementIds,
      isRead,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      isAnnouncementViewed,
      markAnnouncementViewed,
      markAllAnnouncementsViewed,
      isUrgent,
      unreadCount,
      urgentCount,
      categoryUnread,
      unreadBookingsCount,
      unreadOrdersCount,
      unreadAlertsCount,
    }),
    [
      readItemIds,
      viewedAnnouncementIds,
      isRead,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      isAnnouncementViewed,
      markAnnouncementViewed,
      markAllAnnouncementsViewed,
      isUrgent,
      unreadCount,
      urgentCount,
      categoryUnread,
      unreadBookingsCount,
      unreadOrdersCount,
      unreadAlertsCount,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
