export interface ChatbotFaq {
  id: string;
  category: 'general' | 'navigation' | 'booking' | 'pickup' | 'owner' | 'admin';
  categoryLabel: string;
  question: string;
  answer: string;
  actionKey?: string;
  actionLabel?: string;
  roles?: Array<'customer' | 'salon_owner' | 'admin' | 'guest'>;
}

export const CHATBOT_FAQS: ChatbotFaq[] = [
  {
    id: 'faq-nav-overview',
    category: 'navigation',
    categoryLabel: 'Website Navigation',
    question: 'How do I navigate through the website?',
    answer: `Nail Glam Hub is organized into clear, intuitive sections accessible via the top navigation bar:
- **Explore Salons**: Browse verified nail studios, filter by location, view ratings, photos, and technician portfolios.
- **Services Menu**: Explore nail services (Gel, Acrylics, Polygel, Nail Art, Spa Pedicures) with transparent pricing.
- **Interactive Map**: View salon pins across Metro Manila, check operating hours, and find nearby studios.
- **Retail Boutique**: Discover salon-grade cuticle oils, polishes, and nail kits for in-store pickup reservations.
- **User Dashboard**: When logged in, view your upcoming appointments, order history, and saved favorite salons.
- **Salon Owner & Admin Portals**: Dedicated tabs for partner salons and platform admins to manage operations.`,
    actionKey: 'explore',
    actionLabel: 'Explore Salons',
  },
  {
    id: 'faq-system-overview',
    category: 'general',
    categoryLabel: 'System Overview',
    question: 'How does the Nail Glam Hub system work?',
    answer: `Nail Glam Hub connects beauty enthusiasts with accredited nail salons across the Philippines through a complete end-to-end system:
1. **Discover**: Search accredited nail salons by city, view verified customer reviews, photos, and certified technicians.
2. **Book**: Select your service, pick your preferred technician, choose date and time, and pay online (GCash, Maya, Cards) or Cash on Visit.
3. **Shop & Pickup**: Reserve salon-grade aftercare products online with zero advance fees and collect in-store.
4. **Partner Suite**: Salon owners manage real-time appointments, staff schedules, inventory stock, and automated financial P&L reporting.
5. **Governance**: Platform administrators audit salon accreditations and broadcast promotional banners.`,
    actionKey: 'services',
    actionLabel: 'View Services',
  },
  {
    id: 'faq-booking-steps',
    category: 'booking',
    categoryLabel: 'Bookings & Appointments',
    question: 'How do I book an appointment?',
    answer: `Booking an appointment takes under a minute:
1. Go to **Explore Salons** or the **Services** tab.
2. Click **Book Now** on any salon card or service listing.
3. Choose your desired service (Gel Manicure, Acrylic Extensions, Nail Art, Spa Pedicure).
4. Select your preferred date, time slot, and specialist technician.
5. Select your payment method: **PayMongo** (GCash, Maya, Cards) or **Cash on Visit**.
6. Review your details and confirm! You will receive an instant digital booking voucher in your dashboard.`,
    actionKey: 'booking',
    actionLabel: 'Book an Appointment',
  },
  {
    id: 'faq-pickup-steps',
    category: 'pickup',
    categoryLabel: 'In-Store Product Pickup',
    question: 'How does In-Store Product Pickup work?',
    answer: `Our boutique lets you reserve authentic salon products with zero payment upfront:
1. Visit the **Retail Boutique** to browse organic cuticle oils, builder gels, and professional care kits.
2. Add your items to the bag and click **Reserve for In-Store Pickup**.
3. Choose your preferred pickup date and confirm.
4. A unique **Pickup Voucher Code** will be generated on your dashboard.
5. Head to the partner salon counter, present your code, inspect your fresh items, and pay at the desk!`,
    actionKey: 'products',
    actionLabel: 'Browse Boutique',
  },
  {
    id: 'faq-my-bookings',
    category: 'navigation',
    categoryLabel: 'Website Navigation',
    question: 'Where can I view my appointments and pickup vouchers?',
    answer: `To access your bookings and orders:
- Click your profile name or avatar in the top navigation bar.
- Choose **My Appointments** to check appointment times, salon addresses, assigned technicians, and status.
- Choose **My Pickups** to view active product pickup vouchers, codes, and salon counter addresses.
- If you're using GlamBot, you can also click the direct action buttons below!`,
    actionKey: 'customer-dashboard',
    actionLabel: 'My Appointments',
  },
  {
    id: 'faq-map-guide',
    category: 'navigation',
    categoryLabel: 'Website Navigation',
    question: 'How do I find salons near me using the map?',
    answer: `Our interactive geolocation map makes finding studios easy:
1. Click **Interactive Map** in the top navigation bar.
2. Allow location access when prompted to center on your current neighborhood.
3. Interactive map pins show all verified salons with their address and average star rating.
4. Click on any pin to preview photos, open hours, and tap **Book Appointment** directly from the map drawer!`,
    actionKey: 'map',
    actionLabel: 'Open Interactive Map',
  },
  {
    id: 'faq-payments',
    category: 'booking',
    categoryLabel: 'Bookings & Appointments',
    question: 'What payment options are accepted?',
    answer: `Nail Glam Hub offers flexible and secure payment methods:
- **Digital Payments via PayMongo**: Fast and encrypted payments supporting **GCash**, **Maya**, and major Credit/Debit Cards (Visa, Mastercard).
- **Cash on Visit**: Prefer paying in person? Select Cash on Visit during checkout and settle your payment at the salon reception desk.
- **Product Pickups**: Reserved items are paid in-store during collection.`,
    actionKey: 'explore',
    actionLabel: 'Explore Salons',
  },
  {
    id: 'faq-technician-selection',
    category: 'booking',
    categoryLabel: 'Bookings & Appointments',
    question: 'Can I choose my favorite nail technician?',
    answer: `Yes! We believe great nail art comes from trusted artists:
- In each salon profile, you can view the team of certified technicians.
- Each technician profile showcases their specialty (e.g. 3D French tips, hand-painted art, polygel sculpting).
- During booking, you can pick a specific technician or select "Any Available Artist" for maximum scheduling flexibility.`,
    actionKey: 'explore',
    actionLabel: 'Browse Studios & Artists',
  },
  {
    id: 'faq-cancellation-reschedule',
    category: 'booking',
    categoryLabel: 'Bookings & Appointments',
    question: 'How do cancellations and rescheduling work? Are there fees or penalties?',
    answer: `Nail Glam Hub enforces a professional Schedule Protection Policy to prevent calendar lockouts and protect our artists' livelihoods:

1. **Free Zero-Penalty Rescheduling (Recommended)**:
   - You can move your appointment to another date or time slot directly from **My Appointments** with **₱0 penalty** and **zero strikes**.

2. **Standard Notice (24h+ in advance)**:
   - **₱0 cancellation fee**, full deposit return, and zero account strikes.

3. **Late Notice (4h to 24h before time slot)**:
   - A **25% late cancellation fee** (minimum ₱150) is assessed to compensate the reserved specialist, and 1 reliability strike is recorded.

4. **Critical / Last-Minute Notice (< 4h before time slot)**:
   - A **50% cancellation fee** (minimum ₱250) applies because the technician slot cannot be re-booked on short notice. 2 reliability strikes are recorded.

5. **Multi-Step Cancellation Workflow**:
   - Cancellations require completing a confirmation step with reason selection and fee acknowledgment to ensure you are fully aware of schedule impacts.`,
    actionKey: 'customer-dashboard',
    actionLabel: 'My Bookings & Standing',
  },
  {
    id: 'faq-account-reliability-strikes',
    category: 'general',
    categoryLabel: 'System Overview',
    question: 'What is the Account Reliability Score and how do strikes work?',
    answer: `To protect salons from false appointments and ghost bookings, every client profile maintains a transparent **Reliability Score**:
- **Excellent Standing (Score ≥ 90%)**: Zero restrictions, full access to Cash on Visit and digital PayMongo bookings.
- **Good Standing (Score 75% - 89%)**: Normal booking privileges with standard reminders.
- **Caution Status (1-2 strikes)**: Reminders sent to confirm sessions in advance.
- **Restricted Status (3+ strikes)**: High cancellation rate; client must contact salon support or settle outstanding cancellation fees to restore unrestricted instant booking.
- You can check your current standing anytime by looking at the **Reliability Badge** on your client dashboard!`,
    actionKey: 'customer-dashboard',
    actionLabel: 'View Reliability Standing',
  },
  {
    id: 'faq-order-cancellation-restock',
    category: 'pickup',
    categoryLabel: 'In-Store Product Pickup',
    question: 'Can I cancel an in-store product pickup reservation?',
    answer: `Yes! If you are unable to collect reserved boutique products:
1. Open **My Pickups** from your profile menu.
2. Click **Cancel Pickup Reservation** on the pending order.
3. Select your cancellation reason and confirm.
4. All reserved items are instantly returned to the salon's shelf inventory so walk-in clients can purchase them.`,
    actionKey: 'customer-orders',
    actionLabel: 'My Product Pickups',
  },
  {
    id: 'faq-salon-partner-registration',
    category: 'owner',
    categoryLabel: 'Salon Partners & Owners',
    question: 'How can a salon become a partner on Nail Glam Hub?',
    answer: `Joining Nail Glam Hub as a salon partner gives you access to hundreds of local beauty clients:
1. Click **Partner with Us** in the navigation bar or footer.
2. Submit your salon name, address, business registration, contact details, and service menu.
3. Platform Administrators review and accredit your studio within 24 to 48 hours.
4. Once accredited, access your dedicated Salon Owner portal to manage bookings, staff, and inventory!`,
    actionKey: 'explore',
    actionLabel: 'Partner with Us',
    roles: ['customer', 'salon_owner', 'guest'],
  },
  {
    id: 'faq-owner-pl-system',
    category: 'owner',
    categoryLabel: 'Salon Partners & Owners',
    question: 'How do Salon Owner Financial P&L Reports work?',
    answer: `The Salon Owner Portal features automated financial tracking:
- **Gross Revenue**: Live tally of completed appointments and verified in-store retail product sales.
- **Labor Commissions**: Automatically calculated per completed appointment (industry standard 35% commission allocated to assigned technicians).
- **Consumable Supplies**: Estimated at 12% of service volume for gels, acrylics, tips, sanitizers, and top coats.
- **Overhead**: Fixed monthly costs (rent, electricity, utilities).
- **Net Profit & Margin**: Visual line charts, CSV exports, and printable financial statements tracking your studio's profitability.`,
    actionKey: 'owner-overview',
    actionLabel: 'Open Financial Reports',
    roles: ['salon_owner', 'admin'],
  },
  {
    id: 'faq-owner-inventory',
    category: 'owner',
    categoryLabel: 'Salon Partners & Owners',
    question: 'How do low-stock inventory alerts work for salon owners?',
    answer: `In the **Inventory & Products** tab of the Salon Owner Suite:
- Every product tracks current stock on hand and low-stock reorder thresholds.
- When an item drops to 5 or fewer units, an automated warning badge is highlighted.
- Retail reservations placed by customers automatically adjust the reserved counts until collected in-store.`,
    actionKey: 'owner-inventory',
    actionLabel: 'Manage Inventory',
    roles: ['salon_owner', 'admin'],
  },
  {
    id: 'faq-owner-branches',
    category: 'owner',
    categoryLabel: 'Salon Partners & Owners',
    question: 'Can I manage multiple salon branches under one account?',
    answer: `Yes! Nail Glam Hub supports multi-branch management:
- Salon partners can register secondary branch locations with dedicated addresses, operating hours, and staff rosters.
- Each branch maintains its own appointments and inventory while rolling up financial summaries to the master owner dashboard.`,
    actionKey: 'owner-branches',
    actionLabel: 'Manage Branches',
    roles: ['salon_owner', 'admin'],
  },
  {
    id: 'faq-admin-verification',
    category: 'admin',
    categoryLabel: 'Platform Administration',
    question: 'How does Platform Administration and Salon Accreditation work?',
    answer: `Platform Administrators maintain system quality and safety:
- **Salon Audits**: Inspect new partner submissions for business permits, sanitary certifications, and physical venue legitimacy.
- **Status Toggle**: Set studios to *Pending*, *Approved*, or *Suspended* with one click.
- **Review Moderation**: Monitor customer feedback, photos, and reported reviews.
- **Promotional Banners**: Broadcast platform-wide seasonal announcements and discount banners.`,
    actionKey: 'admin-dashboard',
    actionLabel: 'Admin Suite',
    roles: ['admin'],
  },
];
