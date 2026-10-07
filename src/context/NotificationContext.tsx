import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Announcement, Appointment, ProductOrder, Salon, User } from '../types';
import { localStorage as safeLocalStorage } from '../lib/localStorage';

export type NotificationPriority = 'urgent' | 'normal' | 'low';

export interface SystemNotification {
  id: string;
  category: 'cart' | 'bookings' | 'orders' | 'alerts' | 'system';
  title: string;
  message: string;
  timestamp: string;
  recipient_role?: 'customer' | 'salon_owner' | 'admin' | 'all';
  recipient_user_id?: number;
  recipient_salon_id?: number;
  priority?: NotificationPriority;
  type?:
    | 'booking_confirmed'
    | 'booking_cancelled_by_owner'
    | 'booking_cancelled_by_customer'
    | 'booking_new'
    | 'order_status'
    | 'system_alert';
  linkTab?: string;
  linkTargetId?: string;
  metadata?: any;
}

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
  trashedItemIds: Set<string>;
  deletedItemIds: Set<string>;
  systemNotifications: SystemNotification[];
  isRead: (id: string | number) => boolean;
  markAsRead: (id: string | number) => void;
  markAsUnread: (id: string | number) => void;
  markAllAsRead: (category?: string) => void;
  isAnnouncementViewed: (id: number) => boolean;
  markAnnouncementViewed: (id: number) => void;
  markAllAnnouncementsViewed: (announcementIds?: number[]) => void;
  isUrgent: (typeOrCategory: string, meta?: any) => boolean;
  isTrashed: (id: string | number) => boolean;
  isDeleted: (id: string | number) => boolean;
  moveToTrash: (id: string | number) => void;
  restoreFromTrash: (id: string | number) => void;
  deleteNotification: (id: string | number) => void;
  emptyTrash: () => void;
  addNotification: (
    notif: Omit<SystemNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ) => void;
  unreadCount: number;
  urgentCount: number;
  trashedCount: number;
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
const STORAGE_KEY_TRASHED = 'nailglamhub_trashed_notifications';
const STORAGE_KEY_DELETED = 'nailglamhub_deleted_notifications';
const STORAGE_KEY_SYSTEM_NOTIFS = 'nailglamhub_system_notifications';

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

  // Trashed notification IDs (moved to trash via dot action)
  const [trashedItemIds, setTrashedItemIds] = useState<Set<string>>(() => {
    try {
      const saved = safeLocalStorage.getJSON<string[]>(STORAGE_KEY_TRASHED);
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  // Deleted notification IDs (permanently removed via dot action)
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(() => {
    try {
      const saved = safeLocalStorage.getJSON<string[]>(STORAGE_KEY_DELETED);
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  // Dynamic system-level notifications (booking completion, owner cancellation, etc.)
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>(() => {
    try {
      const saved = safeLocalStorage.getJSON<SystemNotification[]>(STORAGE_KEY_SYSTEM_NOTIFS);
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {
      // fallback
    }
    return [
      {
        id: 'sys-booking-confirmed-welcome',
        category: 'bookings',
        title: 'Booking Confirmed! 🎉',
        message: 'Your appointment for Signature Russian Manicure & Japanese Gel at Luxe Glow Nail & Spa Lounge is confirmed.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        recipient_role: 'customer',
        type: 'booking_confirmed',
        priority: 'normal',
        linkTab: 'customer-dashboard',
      },
      {
        id: 'sys-booking-owner-cancelled-notice',
        category: 'bookings',
        title: 'Salon Cancelled Booking ⚠️',
        message: 'Glamour Lounge Davao cancelled your booking for Gel Extensions due to salon facility maintenance. No fees charged.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        recipient_role: 'customer',
        type: 'booking_cancelled_by_owner',
        priority: 'urgent',
        linkTab: 'customer-dashboard',
      },
      {
        id: 'sys-owner-new-booking-alert',
        category: 'bookings',
        title: 'New Customer Booking 📅',
        message: 'Sophia Reyes booked Signature Russian Manicure for tomorrow at 2:00 PM.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        recipient_role: 'salon_owner',
        type: 'booking_new',
        priority: 'urgent',
        linkTab: 'owner-appointments',
      },
      {
        id: 'sys-owner-cust-cancelled-alert',
        category: 'bookings',
        title: 'Customer Cancelled Booking ⚠️',
        message: 'Maria Clara Gomez cancelled appointment for Deluxe Foot Spa. Reason: Schedule conflict.',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        recipient_role: 'salon_owner',
        type: 'booking_cancelled_by_customer',
        priority: 'normal',
        linkTab: 'owner-appointments',
      },
    ];
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
      } else if (e.key === STORAGE_KEY_TRASHED && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setTrashedItemIds(new Set(parsed));
          }
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEY_DELETED && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setDeletedItemIds(new Set(parsed));
          }
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEY_SYSTEM_NOTIFS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setSystemNotifications(parsed);
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
        customerAppointments.forEach((a) => allIdsToAdd.push(`cust-appt-${a.id}`));
        ownerAppointments.forEach((a) => allIdsToAdd.push(`owner-appt-${a.id}`));
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

  // Trash & Deletion helpers
  const isTrashed = useCallback(
    (id: string | number): boolean => trashedItemIds.has(String(id)),
    [trashedItemIds]
  );

  const isDeleted = useCallback(
    (id: string | number): boolean => deletedItemIds.has(String(id)),
    [deletedItemIds]
  );

  const moveToTrash = useCallback((id: string | number) => {
    const idStr = String(id);
    setTrashedItemIds((prev) => {
      if (prev.has(idStr)) return prev;
      const next = new Set(prev);
      next.add(idStr);
      safeLocalStorage.setJSON(STORAGE_KEY_TRASHED, Array.from(next));
      return next;
    });
  }, []);

  const restoreFromTrash = useCallback((id: string | number) => {
    const idStr = String(id);
    setTrashedItemIds((prev) => {
      if (!prev.has(idStr)) return prev;
      const next = new Set(prev);
      next.delete(idStr);
      safeLocalStorage.setJSON(STORAGE_KEY_TRASHED, Array.from(next));
      return next;
    });
  }, []);

  const deleteNotification = useCallback((id: string | number) => {
    const idStr = String(id);
    setTrashedItemIds((prev) => {
      if (!prev.has(idStr)) return prev;
      const next = new Set(prev);
      next.delete(idStr);
      safeLocalStorage.setJSON(STORAGE_KEY_TRASHED, Array.from(next));
      return next;
    });
    setDeletedItemIds((prev) => {
      if (prev.has(idStr)) return prev;
      const next = new Set(prev);
      next.add(idStr);
      safeLocalStorage.setJSON(STORAGE_KEY_DELETED, Array.from(next));
      return next;
    });
    setSystemNotifications((prev) => {
      const next = prev.filter((item) => item.id !== idStr);
      safeLocalStorage.setJSON(STORAGE_KEY_SYSTEM_NOTIFS, next);
      return next;
    });
  }, []);

  const emptyTrash = useCallback(() => {
    setDeletedItemIds((prev) => {
      const next = new Set(prev);
      trashedItemIds.forEach((id) => next.add(id));
      safeLocalStorage.setJSON(STORAGE_KEY_DELETED, Array.from(next));
      return next;
    });
    setTrashedItemIds(() => {
      safeLocalStorage.setJSON(STORAGE_KEY_TRASHED, []);
      return new Set();
    });
  }, [trashedItemIds]);

  const addNotification = useCallback(
    (notif: Omit<SystemNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => {
      const fullNotif: SystemNotification = {
        ...notif,
        id: notif.id || `sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: notif.timestamp || new Date().toISOString(),
      };
      setSystemNotifications((prev) => {
        const next = [fullNotif, ...prev];
        safeLocalStorage.setJSON(STORAGE_KEY_SYSTEM_NOTIFS, next);
        return next;
      });
    },
    []
  );

  // Calculate unread items & urgent notifications (excluding trashed or deleted items)
  const { unreadCount, urgentCount, categoryUnread, unreadBookingsCount, unreadOrdersCount, unreadAlertsCount } = useMemo(() => {
    let unread = 0;
    let urgent = 0;
    let unreadCart = false;
    let unreadBookings = false;
    let unreadAlerts = false;
    let bookingsUnreadCount = 0;
    let ordersUnreadCount = 0;
    let alertsUnreadCount = 0;

    const isExcluded = (id: string) => trashedItemIds.has(id) || deletedItemIds.has(id);

    // 1. Cart
    if (cartItemCount > 0 && !readItemIds.has('cart-active') && !isExcluded('cart-active')) {
      unread++;
      unreadCart = true;
      ordersUnreadCount++;
    }

    // 2. Customer orders
    if (currentUser?.user_type === 'customer') {
      customerOrders
        .filter((o) => o.status === 'pending_pickup' || o.status === 'ready_for_pickup')
        .forEach((o) => {
          const key = `cust-order-${o.id}`;
          if (!readItemIds.has(key) && !isExcluded(key)) {
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
          const key = `owner-order-${o.id}`;
          if (!readItemIds.has(key) && !isExcluded(key)) {
            unread++;
            unreadCart = true;
            ordersUnreadCount++;
          }
        });
    }

    // 4. Customer Bookings
    if (currentUser?.user_type === 'customer') {
      customerAppointments
        .filter((a) => a.status === 'confirmed' || a.status === 'pending' || a.status === 'cancelled')
        .forEach((a) => {
          const key = `cust-appt-${a.id}`;
          if (!readItemIds.has(key) && !isExcluded(key)) {
            unread++;
            unreadBookings = true;
            bookingsUnreadCount++;
            if (a.status === 'cancelled' && a.cancelled_by === 'salon_owner') {
              urgent++;
            }
          }
        });
    }

    // 5. Owner Bookings
    if (currentUser?.user_type === 'salon_owner') {
      ownerAppointments
        .filter((a) => a.status === 'pending' || a.status === 'confirmed' || a.status === 'cancelled')
        .forEach((a) => {
          const key = `owner-appt-${a.id}`;
          if (!readItemIds.has(key) && !isExcluded(key)) {
            unread++;
            unreadBookings = true;
            bookingsUnreadCount++;
            if (a.status === 'pending') {
              urgent++;
            }
          }
        });
    }

    // 6. Admin pending salons
    if (currentUser?.user_type === 'admin') {
      adminPendingSalons.forEach((s) => {
        const key = `admin-salon-${s.id}`;
        if (!readItemIds.has(key) && !isExcluded(key)) {
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
          const key = `owner-branch-${s.id}`;
          if (!readItemIds.has(key) && !isExcluded(key)) {
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
        const key = `announcement-${a.id}`;
        if (!isExcluded(key)) {
          unread++;
          unreadAlerts = true;
          alertsUnreadCount++;
          if (a.type === 'alert') {
            urgent++;
          }
        }
      });

    // 9. System notifications
    systemNotifications.forEach((s) => {
      if (
        !readItemIds.has(s.id) &&
        !isExcluded(s.id) &&
        (!s.recipient_role ||
          s.recipient_role === 'all' ||
          s.recipient_role === currentUser?.user_type)
      ) {
        unread++;
        if (s.category === 'bookings') {
          unreadBookings = true;
          bookingsUnreadCount++;
        } else if (s.category === 'alerts') {
          unreadAlerts = true;
          alertsUnreadCount++;
        } else {
          unreadCart = true;
          ordersUnreadCount++;
        }
        if (s.priority === 'urgent') urgent++;
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
    trashedItemIds,
    deletedItemIds,
    systemNotifications,
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
      trashedItemIds,
      deletedItemIds,
      systemNotifications,
      isRead,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      isAnnouncementViewed,
      markAnnouncementViewed,
      markAllAnnouncementsViewed,
      isUrgent,
      isTrashed,
      isDeleted,
      moveToTrash,
      restoreFromTrash,
      deleteNotification,
      emptyTrash,
      addNotification,
      unreadCount,
      urgentCount,
      trashedCount: trashedItemIds.size,
      categoryUnread,
      unreadBookingsCount,
      unreadOrdersCount,
      unreadAlertsCount,
    }),
    [
      readItemIds,
      viewedAnnouncementIds,
      trashedItemIds,
      deletedItemIds,
      systemNotifications,
      isRead,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      isAnnouncementViewed,
      markAnnouncementViewed,
      markAllAnnouncementsViewed,
      isUrgent,
      isTrashed,
      isDeleted,
      moveToTrash,
      restoreFromTrash,
      deleteNotification,
      emptyTrash,
      addNotification,
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
