# Salon Notifications, Schedule Warnings & Private Messaging Implementation Plan

Comprehensive system plan to introduce multi-channel email notification alerts for bookings and product reservations, automated 24-hour, 2-hour, and overdue appointment schedule warnings, and real-time private messaging between customers and salon owners accessible via floating chat and dedicated dashboard tabs.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions have been aligned based on user clarification answers:

- **Email Notifications & Status Alerts**: Handled via interactive in-app email logs featuring instant notification alerts (toasts + notification bell dropdown), with full HTML preview, certified PDF generation, and optional direct Gmail dispatch.
- **Schedule Warnings Cadence**: Configured for three distinct checkpoints: **24 hours prior** (advance reminder), **2 hours prior** (immediate preparation reminder), and **Overdue alert** (when appointment time passes without completion or check-in).
- **Private Messaging Placement**: Dual access via a sleek **floating chat modal** (accessible across all pages) AND a dedicated **Messages tab** embedded directly within both the Customer Dashboard and Salon Owner Dashboard.

---

### 1. Overview & Core Concept

- **What It Does**: 
  1. Automatically triggers and records structured email notifications and in-app system alerts whenever new bookings or product reservations are submitted, accepted/confirmed, cancelled, or marked (completed, ready for pickup, unclaimed).
  2. Runs scheduled deadline monitors to alert both customers and salon staff at 24 hours and 2 hours before appointments, as well as an urgent overdue notice when an appointment has lapsed.
  3. Provides a private two-way chat system linking customers with the respective salon owner/staff, complete with unread badges, conversation threading, appointment context, and message history.
- **Target Audience / Persona**: Salon customers tracking their appointments and product orders, and salon owners/managers overseeing client communication, schedule compliance, and inventory pickup.
- **Key Value**: Eliminates missed appointments (no-shows), keeps customers and owners transparently informed at every reservation milestone, and provides a direct, contextual communication channel between clients and salon management.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Booking & Reservation Status Lifecycle**:
   - Customer places a booking or reserves a product in the shop.
   - Instant in-app notification appears; server records an interactive email log.
   - Salon owner accepts, reschedules, or marks status (e.g. `confirmed`, `completed`, `cancelled`, `ready_for_pickup`, `unclaimed`).
   - Customer and owner receive instant targeted system alerts and synchronized email logs with actionable details.
2. **Appointment Schedule Warnings (24h, 2h, Overdue)**:
   - Automated schedule watcher evaluates appointment dates and times against the current clock.
   - At $\le 24$ hours: Gentle reminder alert created with preparation tips and salon address.
   - At $\le 2$ hours: Urgent reminder with arrival advisory and salon contact.
   - Past appointment time (status still pending/confirmed): Warning banner and alert highlighting that the appointment is overdue, offering one-click check-in or reschedule options.
3. **Private Customer-Owner Messaging**:
   - **Floating Modal Flow**: Clicking the chat trigger in the bottom corner opens a compact, floating two-pane messenger showing active salon conversations, recent messages, unread indicators, and a message composer.
   - **Portal Tab Flow**: In both the Customer Dashboard and Salon Owner Dashboard, navigating to the dedicated **Messages** tab displays an expansive inbox with conversation lists, client/salon details, linked appointment history, and real-time message exchange.

#### Visual Identity & Theme
- **Aesthetic Direction**: Contemporary luxury salon editorial (warm rose, deep slate, clean hairline borders) conforming to SaaS dashboard standards.
- **Color Palette & Mood**:
  - Dominant Canvas: Crisp clean surface (`bg-white` / `bg-stone-50` / `dark:bg-stone-950`).
  - Brand Accents: Soft rose and champagne accents (`#BE185D`, `#EC4899`, `#9D174D`) for interactive CTA and active chat badges.
  - Semantic Status Tokens:
    - Normal / Confirmed: Emerald (`text-emerald-700 bg-emerald-50 border-emerald-200`)
    - Approaching / Warning: Amber (`text-amber-700 bg-amber-50 border-amber-200`)
    - Overdue / Cancelled: Crimson (`text-rose-700 bg-rose-50 border-rose-200`)
- **Typography & Layout**:
  - Headings & Titles: `Plus Jakarta Sans` with balanced tracking.
  - Tabular Numbers & Timestamps: Tabular figures (`tabular-nums font-mono`) for delivery times and countdowns.
  - Zero-pill discipline for metadata: Quiet text with typographic separators (`·`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Email Storage & Dispatch (In-App Logs + Optional Real Gmail)**
  - *Chosen Approach*: Persist every generated email in the database (`email_logs` table) with full HTML templates and certified PDF attachments, visible in the interactive `EmailLogsModal`, while automatically notifying in-app and dispatching via Gmail API if OAuth is authenticated.
  - *Why*: Guarantees 100% reliable inspection and testing in preview environments without external mail deliverability blockers, while maintaining full support for real Gmail inbox dispatch.
- **Decision 2: Automated Schedule Warning Watcher**
  - *Chosen Approach*: Implement a dual-layer schedule monitor: a backend interval endpoint (`/api/appointments/schedule-alerts`) combined with client-side reactive evaluation in `NotificationContext`.
  - *Why*: Ensures instant alerts appear even if the client never refreshes the page, with persistent deduplication keys (`24h_notified`, `2h_notified`, `overdue_notified`) preventing repeated spam.
- **Decision 3: Dedicated Messages Data Model with Full Role Context**
  - *Chosen Approach*: Dedicated `messages` table in the database schema supporting `sender_id`, `recipient_id`, `salon_id`, `appointment_id`, `content`, `read_at`, and `created_at`.
  - *Why*: Allows conversation threads to be partitioned cleanly by salon and customer, enabling owners with multiple salons to filter messages while linking conversations to specific appointments.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION RUNTIME                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│       CUSTOMER PORTAL        │              │     SALON OWNER PORTAL       │
│  - Floating Chat Modal       │              │  - Floating Chat Modal       │
│  - Dedicated 'Messages' Tab  │              │  - Dedicated 'Messages' Tab  │
│  - Interactive Email Logs    │              │  - Interactive Email Logs    │
│  - Notification Bell & Toast │              │  - Notification Bell & Toast │
└──────────────────────────────┘              └──────────────────────────────┘
        │                                                             │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NotificationContext.tsx                               │
│  - Real-time Alert Dispatch & Category Badges (Cart, Bookings, Messages)    │
│  - 24h / 2h / Overdue Appointment Warning Watcher                           │
│  - In-app System Notification State & Sound / Visual Indicators             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │ REST API Calls
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API (server.app.ts)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST  /api/appointments                   -> Dispatches new booking emails │
│  PATCH /api/appointments/:id/status        -> Dispatches status change email│
│  POST  /api/product-orders                 -> Dispatches reservation emails │
│  PATCH /api/product-orders/:id/status      -> Dispatches status change email│
│  GET   /api/appointments/schedule-warnings -> Checks 24h/2h/overdue deadlines│
│  GET   /api/messages/conversations         -> Lists active chat channels    │
│  GET   /api/messages                       -> Retrieves conversation thread │
│  POST  /api/messages                       -> Sends private message         │
│  PATCH /api/messages/mark-read             -> Updates read status           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                IN-MEMORY DATABASE & FIRESTORE REPLICATION                   │
│  - appointments | product_orders | email_logs | messages | system_notifs   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & Entities

```typescript
export interface PrivateMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: 'customer' | 'salon_owner' | 'admin';
  recipient_id: number;
  recipient_name: string;
  salon_id: number;
  salon_name: string;
  appointment_id?: number | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationChannel {
  channel_id: string; // e.g., "salon_12_cust_5"
  salon_id: number;
  salon_name: string;
  customer_id: number;
  customer_name: string;
  customer_email?: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
  active_appointment?: {
    id: number;
    service_name: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
  } | null;
}
```

#### Interactive Component & State Mapping

1. **`EmailLogsModal.tsx` & Email Notification Pipeline**:
   - Hooks into all booking and product order events (`new`, `confirmed`, `cancelled`, `completed`, `ready_for_pickup`, `unclaimed`).
   - Rich email view with preview tabs (HTML, Plaintext, PDF certificate generator).
   - "Dispatched" status indicator and "Send to My Inbox" button.
2. **`AppointmentScheduleWatcher` (in `NotificationContext.tsx`)**:
   - Calculates time remaining for all non-cancelled appointments:
     - If $23\text{h} \le \Delta t \le 24.5\text{h}$ and unflagged: Triggers 24-Hour Reminder email and system alert.
     - If $1.5\text{h} \le \Delta t \le 2.2\text{h}$ and unflagged: Triggers 2-Hour Urgent Preparation alert.
     - If $\Delta t < 0$ and status is `pending` or `confirmed`: Triggers Overdue Schedule Alert with action prompt.
3. **`PrivateMessaging` Components**:
   - `FloatingChatWidget.tsx`: Floating badge with togglable chat flyout, contact picker, message bubble feed, and fast response composer.
   - `MessagesView.tsx`: Dedicated full-page inbox embedded in both `CustomerDashboard.tsx` and `SalonOwnerDashboard.tsx`, featuring search, conversation filtering, real-time message auto-scroll, and appointment context card.
4. **Integration with Existing Navbars and Menus**:
   - Unread message counter in header / sidebar navigation (`Navbar.tsx`, `Sidebar.tsx`, `MobileBottomNav.tsx`).
   - Deep-linking from notification items directly to the relevant chat thread or appointment record.
