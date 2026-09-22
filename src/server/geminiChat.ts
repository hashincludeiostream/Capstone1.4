import { GoogleGenAI } from '@google/genai';
import db from '../config/db.js';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  userRole?: 'customer' | 'salon_owner' | 'admin' | 'guest';
  userId?: number;
  userName?: string;
  currentTab?: string;
  salonContext?: {
    salonId?: number;
    salonName?: string;
  };
}

// Fetch live database context to ground the chatbot in actual Nail Glam Hub data
async function getPlatformContext(userRole?: string, userId?: number) {
  try {
    // 1. Salons summary
    const [salonsRows] = await db.execute(
      'SELECT id, salon_name, address, phone, rating, total_reviews, is_verified, operating_hours FROM salons ORDER BY rating DESC LIMIT 10'
    );
    const salons = salonsRows as any[];

    // 2. Services summary
    const [servicesRows] = await db.execute(
      'SELECT s.id, s.service_name, s.price, s.duration_minutes, c.category_name FROM services s LEFT JOIN business_categories c ON s.category_id = c.id LIMIT 15'
    );
    const services = servicesRows as any[];

    // 3. Products summary
    const [productsRows] = await db.execute(
      'SELECT id, name, price, stock_quantity, category FROM products LIMIT 10'
    );
    const products = productsRows as any[];

    // 4. Role specific context (Strictly isolated by authenticated role)
    let ownerContext = '';
    if (userRole === 'salon_owner' && userId) {
      try {
        const [mySalons] = await db.execute(
          'SELECT id, salon_name, verification_status, address FROM salons WHERE owner_id = ?',
          [userId]
        );
        const ownerSalons = mySalons as any[];
        if (ownerSalons.length > 0) {
          const salonIds = ownerSalons.map((s) => s.id);
          const placeholders = salonIds.map(() => '?').join(',');
          const [apptsCountRows] = await db.execute(
            `SELECT status, COUNT(*) as count FROM appointments WHERE salon_id IN (${placeholders}) GROUP BY status`,
            salonIds
          );
          const [lowStockRows] = await db.execute(
            `SELECT name, stock_quantity FROM products WHERE salon_id IN (${placeholders}) AND stock_quantity <= 5`,
            salonIds
          );
          ownerContext = `
The owner manages the following salon(s): ${ownerSalons.map((s) => `"${s.salon_name}" (Status: ${s.verification_status})`).join(', ')}.
Appointment breakdown: ${JSON.stringify(apptsCountRows)}.
Low stock alerts (<=5 items remaining): ${JSON.stringify(lowStockRows)}.
`;
        }
      } catch (err) {
        console.warn('Could not load owner-specific chat context:', err);
      }
    }

    let adminContext = '';
    if (userRole === 'admin') {
      try {
        const [pendingSalonsRows] = await db.execute(
          "SELECT COUNT(*) as pending_count FROM salons WHERE verification_status = 'pending'"
        );
        const [totalUsersRows] = await db.execute(
          'SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type'
        );
        adminContext = `
Admin Platform Status:
- Pending salon verifications requiring review: ${(pendingSalonsRows as any[])[0]?.pending_count || 0}.
- User demographics: ${JSON.stringify(totalUsersRows)}.
`;
      } catch (err) {
        console.warn('Could not load admin-specific chat context:', err);
      }
    }

    return {
      salons: salons.map((s) => ({
        id: s.id,
        name: s.salon_name,
        address: s.address,
        rating: s.rating,
        reviews: s.total_reviews,
        verified: Boolean(s.is_verified),
        hours: s.operating_hours,
      })),
      services: services.map((srv) => ({
        id: srv.id,
        name: srv.service_name,
        price: `₱${srv.price}`,
        duration: `${srv.duration_minutes} mins`,
        category: srv.category_name,
      })),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: `₱${p.price}`,
        inStock: p.stock_quantity > 0,
        stock: p.stock_quantity,
        category: p.category,
      })),
      ownerContext: userRole === 'salon_owner' ? ownerContext : '',
      adminContext: userRole === 'admin' ? adminContext : '',
    };
  } catch (error) {
    console.error('Error loading platform context for chat:', error);
    return null;
  }
}

// Fallback intelligent responder when GEMINI_API_KEY is not configured or in case of network interruption
function generateFallbackResponse(
  query: string,
  userRole?: string,
  context?: any
): string {
  const q = query.toLowerCase();

  // Role: Customer specific queries & strict security boundaries
  if (userRole === 'customer' || !userRole || userRole === 'guest') {
    // Intercept attempts to query owner P&L or admin controls
    if (q.includes('profit') || q.includes('p&l') || q.includes('margin') || q.includes('commission') || q.includes('overhead')) {
      return `### Access Restricted: Salon Partner Portal
Salon financial P&L reporting, technician labor commission calculations, and operational performance metrics are private to verified **Salon Partner** accounts.

As your **Beauty & Booking Concierge**, I can help you with:
- Finding top-rated accredited salons and pricing
- Booking your nail appointments with certified artists
- Reserving retail products for convenient in-store pickup

If you own or manage a beauty salon, you can apply for a partner account via the **Partner with Us** portal!
[ACTION:explore|Discover Salons] [ACTION:services|View Services]`;
    }

    if (q.includes('verif') || q.includes('approve') || q.includes('ban') || q.includes('moderation') || q.includes('admin') || q.includes('governance')) {
      return `### Access Restricted: Platform Administration
Salon accreditation audits, review moderation, and account governance are strictly reserved for **Platform Administrators**.

As your **Beauty & Booking Concierge**, I'm here to assist you with booking appointments, exploring nail designs, and reserving salon-grade aftercare products!
[ACTION:explore|Explore Salons] [ACTION:products|Shop Retail Boutique]`;
    }

    // Navigation & System FAQ: How to navigate through the website
    if (q.includes('navigate') || q.includes('how to use') || q.includes('how do i use') || q.includes('guide') || q.includes('where do i find') || q.includes('where is') || q.includes('pages')) {
      return `### How to Navigate Nail Glam Hub
Nail Glam Hub is organized into clean, intuitive sections accessible through the top navigation bar:

1. 💅 **Explore Salons**: Search accredited studios by city, compare ratings, view portfolios, technician lists, and customer reels.
2. 📖 **Services Menu**: Browse all service categories (Gel, Acrylics, Polygel, 3D Nail Art, Spa Pedicures) with transparent pricing.
3. 🗺️ **Interactive Map**: Geolocation map of verified studios across Metro Manila with instant booking drawers.
4. 🛍️ **Retail Boutique**: Discover salon-grade cuticle oils, builder gels, and care kits reserved for in-store pickup.
5. 👤 **My Account & Dashboard**: Click your name in the top right to access **My Appointments** and **My Pickups**.
6. 💬 **GlamBot & FAQs**: Click the **FAQs & Guide** tab in this chat header to explore quick answers to common questions!

Where would you like to go first?
[ACTION:explore|Explore Salons] [ACTION:services|Browse Services] [ACTION:map|Interactive Map] [ACTION:products|Retail Boutique]`;
    }

    // System Overview FAQ: How does the system work?
    if (q.includes('how the system works') || q.includes('how does the system work') || q.includes('about the system') || q.includes('what is nail glam hub') || q.includes('faq')) {
      return `### How the Nail Glam Hub System Works
Nail Glam Hub is an all-in-one beauty ecosystem connecting clients with verified nail studios:

- 🔍 **1. Discovery & Accreditations**: All salons undergo verification for sanitation, professional licensing, and customer reviews.
- 📅 **2. Instant Appointment Booking**: Choose your salon, service, technician, and preferred date/time slot with live availability.
- 💳 **3. Flexible Payments**: Settle online via **PayMongo** (GCash, Maya, Credit/Debit cards) or select **Cash on Visit**.
- 🛍️ **4. In-Store Retail Pickups**: Reserve professional nail products with 0 upfront fee and pay when picking up at the salon desk.
- 🏢 **5. Partner & Admin Operations**: Salon owners manage appointments and staff, while platform administrators oversee accreditations.

[ACTION:explore|Find a Salon] [ACTION:services|View Services Menu] [ACTION:products|Shop Boutique]`;
    }

    // Bookings FAQ
    if (q.includes('book') || q.includes('appointment') || q.includes('reserve') || q.includes('schedule')) {
      return `### How to Book an Appointment at Nail Glam Hub
Booking your dream nail session is quick and seamless:
1. **Choose a Salon**: Go to **Explore Salons** or browse by location.
2. **Select Service**: Pick from gel manicures, acrylic extensions, nail art, or spa pedicures.
3. **Choose Date & Technician**: Pick your preferred date, time slot, and specialist artist.
4. **Payment Options**: Settle online via **PayMongo** (GCash, Maya, Cards) or select **Cash on Visit**.
5. **Confirmation**: Instant digital confirmation saved under **My Appointments**!

[ACTION:booking|Book an Appointment] [ACTION:explore|Explore Salons] [ACTION:services|Browse All Services]`;
    }

    // Payments FAQ
    if (q.includes('pay') || q.includes('payment') || q.includes('gcash') || q.includes('maya') || q.includes('card') || q.includes('price')) {
      return `### Accepted Payment Methods
Nail Glam Hub offers flexible, encrypted payment options:
- **PayMongo Digital Checkout**: Seamless online payments using **GCash**, **Maya**, and major credit/debit cards (Visa, Mastercard).
- **Cash on Visit**: Prefer paying in person? Select Cash on Visit and pay at the salon reception desk when you arrive.
- **Product Boutique**: In-store pickup reservations require 0 advance payment—you inspect items and pay at the counter!

[ACTION:explore|Explore Salons] [ACTION:products|Shop Boutique]`;
    }

    // In-Store Pickups FAQ
    if (q.includes('pickup') || q.includes('order') || q.includes('product') || q.includes('buy') || q.includes('shop') || q.includes('boutique')) {
      return `### In-Store Product Pickup & Boutique
Nail Glam Hub features genuine salon retail products (cuticle oils, gel polish kits, nail serums, hand balms):
1. **Browse & Reserve**: Add items to your bag in the **Retail Boutique** and reserve with 0 upfront fee.
2. **Pickup Code**: You will receive a unique digital **Pickup Voucher Code**.
3. **Counter Collection**: Drop by the partner salon counter, present your code, inspect your items, and pay upon collection!

[ACTION:products|Shop Retail Boutique] [ACTION:customer-orders|View My Pickups]`;
    }

    // Interactive Map FAQ
    if (q.includes('map') || q.includes('location') || q.includes('near') || q.includes('where') || q.includes('address') || q.includes('city')) {
      return `### Interactive Map & Salon Locator
Find salons right in your neighborhood:
- Click **Interactive Map** in the top navigation bar.
- Allow location access to center the map on your location in Metro Manila.
- Tap any salon pin to inspect verified ratings, address, technician roster, and open hours.
- Tap **Book Appointment** inside the map drawer to schedule immediately!

[ACTION:map|Open Interactive Map] [ACTION:explore|View Salon Directory]`;
    }

    // Technicians FAQ
    if (q.includes('technician') || q.includes('artist') || q.includes('specialist') || q.includes('staff')) {
      return `### Choosing Your Nail Artist
Every salon profile displays certified technician profiles:
- View technician bios, customer star ratings, and specialties (e.g. 3D French tips, Ombre, Polygel sculpting).
- During booking, select your preferred technician or choose "Any Available Artist" for quick scheduling.

[ACTION:explore|Browse Salons & Artists]`;
    }

    // Cancellation & Reschedule FAQ
    if (q.includes('cancel') || q.includes('resched') || q.includes('change date') || q.includes('refund') || q.includes('strike') || q.includes('fee') || q.includes('penalty')) {
      return `### Schedule Protection & Cancellation Policy
To prevent false appointments and protect salon technicians from calendar lockouts, Nail Glam Hub uses a fair, multi-step policy:

1. **Free Reschedule (Recommended - ₱0 Fee)**:
   - You can move your appointment to another date or time slot directly from **My Appointments** with **0 penalty** and **zero account strikes**!
2. **24h+ Advance Notice (Flexible)**:
   - **₱0 cancellation fee**, full deposit return, 0 strikes.
3. **4h to 24h Notice (Late)**:
   - **25% late fee** (min ₱150) to compensate your reserved artist, and 1 reliability strike is recorded.
4. **< 4h Notice (Critical Lockout)**:
   - **50% penalty fee** (min ₱250) applies since the slot cannot be re-filled on short notice; 2 strikes recorded.
5. **Account Standing**:
   - Clients maintain a **Reliability Score**. Accumulating 3+ strikes will trigger a Caution or Restricted status requiring salon approval.

You can manage your bookings or check your Reliability Badge under **My Appointments**.
[ACTION:customer-dashboard|View My Appointments & Standing]`;
    }

    if (q.includes('acrylic') || q.includes('gel') || q.includes('polygel') || q.includes('extension') || q.includes('nail art') || q.includes('design')) {
      return `### Nail Styles & Service Recommendations
Here is a guide to popular salon services:
- **Gel Manicure**: Long-lasting (2-3 weeks), cured under LED lamp, glossy finish, zero drying wait time.
- **Acrylic Extensions**: Durable sculpted tips perfect for extra length, coffin or almond shapes, and intricate 3D nail art.
- **Polygel / Builder Gel**: Lightweight, flexible, odorless alternative that looks ultra-natural.
- **Signature Nail Art**: Custom hand-painted designs, chrome powder, French tips, rhinestones, or cat-eye magnetic effects.
- **Spa Pedicure**: Exfoliating foot scrub, moisturizing mask, cuticle care, and massage.

Would you like to find an accredited salon offering these services?
[ACTION:services|Explore Nail Menu] [ACTION:explore|Accredited Salons]`;
    }

    if (q.includes('aftercare') || q.includes('care') || q.includes('last') || q.includes('healthy') || q.includes('damage')) {
      return `### Pro Nail Care & Maintenance Tips
Keep your nails healthy and your manicure looking fresh for weeks:
1. **Daily Cuticle Oil**: Apply nourishing jojoba or vitamin E cuticle oil nightly to keep the nail bed hydrated.
2. **Wear Gloves**: Always use rubber gloves when washing dishes or handling household cleaning chemicals.
3. **Don't Use Nails as Tools**: Avoid using nail tips to pry open cans or peel stickers.
4. **Never Peel Off Gel or Acrylic**: Peeling pulls off dorsal keratin layers. Always book a professional soak-off removal!
5. **Infill Schedule**: Book infills every 2 to 3 weeks to prevent lifting and bacterial traps.

[ACTION:products|Browse Cuticle Oils] [ACTION:booking|Book a Maintenance Slot]`;
    }

    // General Customer Greeting
    return `✨ **Welcome to Nail Glam Hub!** I'm **GlamBot**, your all-around website guide and beauty concierge.

I can help you with:
- 🧭 **Website Navigation**: Guiding you through Salons, Interactive Map, Boutique, and Bookings.
- 💅 **Salon Recommendations**: Find top-rated nail studios in Metro Manila & key hubs.
- 📅 **Appointment Bookings**: Step-by-step guidance on services, technicians, and payment.
- 🛍️ **In-Store Retail Pickups**: Reserving salon-grade cuticle oils, polishes, and kits.
- ❓ **System FAQs**: You can ask me any question or click the **FAQs & Guide** tab in the header above!

What would you like to explore today?
[ACTION:explore|Browse Salons] [ACTION:services|View Services] [ACTION:map|Interactive Map] [ACTION:products|Shop Boutique]`;
  }

  // Role: Salon Owner specific queries
  if (userRole === 'salon_owner') {
    // Intercept attempts to query global admin functions
    if (q.includes('ban user') || q.includes('delete user') || q.includes('accredit') || q.includes('admin code') || q.includes('passphrase') || q.includes('global admin')) {
      return `### Access Restricted: Platform Administration
Global user account suspensions, platform-wide accreditation approvals, and system settings are strictly reserved for **Platform Administrators**.

As your **Salon Business Co-Pilot**, I am dedicated to helping your specific studio with booking schedules, technician assignments, inventory stock alerts, and P&L financial reports.
[ACTION:owner-overview|Open Financial Reports] [ACTION:owner-appointments|Manage Appointments]`;
    }

    // Owner navigation guide
    if (q.includes('navigate') || q.includes('how to use') || q.includes('where do i find') || q.includes('owner guide') || q.includes('tabs')) {
      return `### Salon Owner Portal Navigation Guide
Here is how your dedicated Salon Partner workspace is structured:
- 📊 **Overview & Financial P&L**: Live revenue analytics, technician labor commissions, supply costs, and net profit margins.
- 📅 **Appointments**: Review pending, confirmed, and completed bookings; assign technicians.
- 💅 **Services Menu**: Update your salon's services, descriptions, durations, and pricing.
- 👥 **Staff Management**: Add technician profiles, bios, specialties, and schedules.
- 📦 **Inventory & Products**: Track retail stock, set low-stock thresholds, and manage in-store pickup reservations.
- 🏢 **Branch Management**: Register and administer secondary salon branch locations.

[ACTION:owner-overview|Open Financial P&L] [ACTION:owner-appointments|View Bookings] [ACTION:owner-inventory|Manage Inventory]`;
    }

    if (q.includes('profit') || q.includes('p&l') || q.includes('revenue') || q.includes('financial') || q.includes('margin') || q.includes('commission')) {
      return `### Financial P&L & Commission Guide for Salon Owners
Here is how your financial tracking works in Nail Glam Hub:
- **Gross Revenue**: Total booking services completed plus verified in-store retail product pickup sales.
- **Labor Commissions**: Automatically calculated on completed appointments (industry standard baseline of 35% commission allocated to assigned technicians).
- **Consumable Supplies**: Calculated at approximately 12% of service volume for gels, acrylic powders, tips, sanitizers, and top coats.
- **Fixed Overhead**: Rent and utilities distributed across active periods.
- **Net Profit & Margin**: Net revenue remaining after labor commissions, supplies, and overhead costs.

You can inspect visual trends, export CSV summaries, or generate printable financial P&L statements directly in your portal.
[ACTION:owner-overview|Open Financial Reports] [ACTION:owner-appointments|Check Booking Revenue]`;
    }

    if (q.includes('stock') || q.includes('inventory') || q.includes('product') || q.includes('reorder')) {
      return `### Inventory & Retail Product Management
Managing stock effectively ensures your clients can purchase aftercare items and technicians never run out of critical supplies:
1. **Low Stock Threshold**: Items with 5 or fewer units trigger automated warning badges in your inventory panel.
2. **In-Store Pickup Reservations**: Customers reserve products through the boutique catalog and pay upon in-salon pickup.
3. **Restocking**: Use the inventory tab to adjust on-hand counts or add new retail items.

[ACTION:owner-inventory|Manage Inventory & Stock]`;
    }

    if (q.includes('booking') || q.includes('appointment') || q.includes('client') || q.includes('schedule')) {
      return `### Managing Appointments & Client Bookings
In your Salon Owner Dashboard:
- Review incoming bookings marked as **Pending**, **Confirmed**, or **Completed**.
- Assign certified technicians to specific slots based on specialty (nail art, acrylic extensions, pedicure).
- Update status to 'completed' once service is rendered to record revenue in your financial reports.

[ACTION:owner-appointments|View Live Appointments]`;
    }

    if (q.includes('branch') || q.includes('location') || q.includes('expand')) {
      return `### Multi-Branch Registration & Management
Nail Glam Hub supports managing multiple branch locations under a single Salon Partner account:
- Register secondary branches with dedicated addresses, operating hours, and contact numbers.
- Each branch has its own staff roster, appointments, and inventory while rolling up to your primary owner dashboard.

[ACTION:owner-branches|Manage Salon Branches]`;
    }

    if (q.includes('staff') || q.includes('technician') || q.includes('team') || q.includes('nail artist')) {
      return `### Staff & Technician Management
You can assign, organize, and monitor your salon technicians:
- Add technician profiles with bios, specializations (e.g., 3D nail art, gel extensions), and working schedules.
- Track client reviews and star ratings per technician.
- Ensure fair commission tracking based on services performed.

[ACTION:owner-staff|View & Add Technicians]`;
    }

    return `Hello! As your **Salon Partner Co-Pilot**, I can assist you with:
- **Financial P&L Reports**: Revenue analysis, labor commissions, and net profit tracking.
- **Bookings Management**: Managing incoming client appointments and schedule slots.
- **Staff & Technicians**: Adding nail artists, assigning services, and monitoring performance.
- **Stock & Inventory**: Tracking retail products and low-stock reorder alerts.
- **Multi-Branch Expansion**: Registering and managing multiple salon locations.

How can I help optimize your salon operations today?
[ACTION:owner-overview|View Dashboard] [ACTION:owner-appointments|Appointments] [ACTION:owner-inventory|Inventory]`;
  }

  // Role: Admin specific queries
  if (userRole === 'admin') {
    if (q.includes('verif') || q.includes('approve') || q.includes('salon') || q.includes('partner')) {
      return `### Salon Verification & Accreditation Protocol
When auditing new salon partner applications:
1. **Business Identity**: Confirm official salon name, DTI/SEC registration, and contact details.
2. **Physical Address**: Verify exact geolocation coordinates and storefront accessibility.
3. **Service Accreditation**: Ensure services match registered business categories (Nails, Spa, Lashes).
4. **Approval Action**: Toggle salon status between *Pending*, *Approved*, or *Suspended* with one click.

[ACTION:admin-salons|Review Pending Salons]`;
    }

    if (q.includes('announce') || q.includes('promo') || q.includes('broadcast') || q.includes('banner')) {
      return `### Platform Announcements & Promotions
Admins can publish announcements that display across the entire platform:
- **Promotional Banners**: Highlight seasonal discounts (e.g., Valentine's Glam, Holiday specials) linking to specific tabs.
- **System Bulletins**: Post maintenance or policy updates for customers and salon partners.
- **Status Control**: Easily activate or archive announcements at any time.

[ACTION:admin-announcements|Manage Announcements]`;
    }

    if (q.includes('user') || q.includes('moderation') || q.includes('customer') || q.includes('role')) {
      return `### User Accounts & Governance
From the Administrative Suite:
- Oversee user accounts across **Customers**, **Salon Owners**, and **Administrators**.
- Review customer ratings and moderate flagged salon reviews or reels.
- Monitor system audit logs and account security statuses.

[ACTION:admin-users|Manage User Accounts]`;
    }

    return `Greetings, Administrator! I am your **Platform Governance & Intelligence Assistant**.
I can provide operational guidance on:
- **Salon Accreditation**: Reviewing and approving pending partner registrations.
- **User Governance**: Managing client, partner, and administrative accounts.
- **Promotions & Broadcasts**: Deploying platform-wide announcement banners.
- **Platform Analytics**: Tracking overall booking volumes, registered salons, and revenue health.

What administrative task would you like to review?
[ACTION:admin-dashboard|Admin Dashboard] [ACTION:admin-salons|Salons Suite] [ACTION:admin-announcements|Announcements]`;
  }

  return 'How can I assist you with Nail Glam Hub today?';
}

// Main chat handler
export async function handleChatMessage(body: ChatRequestBody): Promise<{
  reply: string;
  source: 'gemini' | 'fallback';
}> {
  const { messages, userRole = 'customer', userId, userName, currentTab } = body;

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  if (!lastUserMessage.trim()) {
    return {
      reply: 'How can I assist you with Nail Glam Hub today?',
      source: 'fallback',
    };
  }

  // 1. Gather live platform context (Strictly isolated by role)
  const platformContext = await getPlatformContext(userRole, userId);

  // 2. Check for Gemini client
  const ai = getGeminiClient();
  if (!ai) {
    console.info('GEMINI_API_KEY not configured. Utilizing Nail Glam Hub contextual knowledge engine.');
    const fallbackReply = generateFallbackResponse(lastUserMessage, userRole, platformContext);
    return {
      reply: fallbackReply,
      source: 'fallback',
    };
  }

  // 3. Construct System Instruction based on Role with strict boundaries
  let rolePersona = '';
  let securityRules = '';
  let allowedActions = '';

  if (userRole === 'salon_owner') {
    rolePersona = `
You are GlamBot, the executive Salon Business & Operations Co-Pilot for Nail Glam Hub salon partners.
You are communicating with a verified salon owner ${userName ? `named ${userName}` : ''}.
Your job is to provide actionable, expert advice on salon operations, booking schedules, staff management, inventory reordering, customer retention, and financial performance (understanding gross revenue, labor commissions, supply costs, overhead, and net profit margins).
`;
    securityRules = `
ACCESS CONTROL (SALON OWNER SESSION):
- You have access to this owner's salon data (appointments, services, technicians, product stock).
- You DO NOT have platform-wide administrator permissions. You cannot approve other salons or ban global users. If asked about platform-level admin tasks, state that they are reserved for Platform Administrators.
`;
    allowedActions = `
Supported action_keys for Salon Owners:
- owner-dashboard (Owner Portal Overview)
- owner-overview (Owner P&L Reports)
- owner-appointments (Owner Bookings)
- owner-services (Owner Service Menu)
- owner-staff (Owner Technicians)
- owner-inventory (Owner Stock & Inventory)
- owner-branches (Owner Salon Branches)
- explore (Explore Salons)
- services (Service Catalog)
- products (Retail Boutique)
`;
  } else if (userRole === 'admin') {
    rolePersona = `
You are GlamBot, the Administrative Governance & Operational Intelligence Assistant for Nail Glam Hub.
You are communicating with a verified platform administrator ${userName ? `named ${userName}` : ''}.
Your job is to provide authoritative, structured guidance on salon accreditation audits, partner verification criteria, user management, content and review moderation, platform promotional broadcasts, and system performance metrics.
`;
    securityRules = `
ACCESS CONTROL (ADMINISTRATOR SESSION):
- You have full platform governance access.
`;
    allowedActions = `
Supported action_keys for Administrators:
- admin-dashboard (Admin Suite)
- admin-salons (Admin Salon Verification)
- admin-users (Admin User Management)
- admin-announcements (Admin Announcements)
- explore (Explore Salons)
- services (Service Catalog)
- products (Retail Boutique)
`;
  } else {
    rolePersona = `
You are GlamBot, the friendly, stylish, and knowledgeable beauty concierge for Nail Glam Hub.
You are communicating with a customer ${userName ? `named ${userName}` : 'or guest client'}.
Your job is to help users discover top-rated nail salons, recommend services (gel manicures, acrylic extensions, polygel, nail art, spa pedicures), explain the booking procedure, guide them through in-store retail product pickup reservations, and share professional nail care and aftercare advice.
Keep your tone warm, chic, empowering, and helpful.
`;
    securityRules = `
STRICT SECURITY & ACCESS CONTROL (CUSTOMER SESSION):
- The user is in a regular CUSTOMER / CLIENT session.
- You MUST NEVER reveal internal salon financial models, technician commission rates, salon owner P&L figures, or administrative platform controls.
- You MUST NEVER generate action buttons for owner or admin panels (e.g. DO NOT output [ACTION:owner-*] or [ACTION:admin-*]).
- If the customer asks about salon profits, commission splits, owner dashboards, salon verification protocols, or user moderation, politely explain that those features are strictly reserved for verified Salon Partner and Administrator accounts, and guide them on how to book services or shop boutique products.
`;
    allowedActions = `
Supported action_keys for Customers:
- explore (Explore Salons)
- map (Interactive Map)
- services (Service Catalog)
- products (Retail Boutique)
- customer-dashboard (Client Appointments)
- customer-orders (Client Product Pickups)
- favorites (Saved Favorites)
- booking (Book an Appointment)
`;
  }

  const systemInstruction = `
${rolePersona}
${securityRules}

ABOUT NAIL GLAM HUB:
Nail Glam Hub is the premier beauty and nail salon portal in the Philippines (Metro Manila and key hubs).
Key platform features:
1. Salon Discovery: Verified studios with ratings, addresses, operating hours, technician lists, and photo reels.
2. Online Appointment Booking: Select salon, service, technician, date/time. Payment via PayMongo (GCash, Maya, Credit/Debit cards) or Cash on Visit.
3. Boutique Retail Catalog: Customers can reserve salon-grade products (cuticle oils, polishes, kits) for in-store pickup with zero advance fees, paying at the salon counter.
4. Salon Owner Suite: Manage appointments, technicians, service menus, inventory low-stock alerts, multi-branch locations, and financial P&L reporting (revenue, commissions, supply cost estimates, overhead, net profit).
5. Admin Suite: Verify new salon registrations, moderate reviews, manage user roles, and broadcast platform-wide promotional announcements.

LIVE PLATFORM CONTEXT:
- Top Salons: ${JSON.stringify(platformContext?.salons || [])}
- Popular Services & Pricing: ${JSON.stringify(platformContext?.services || [])}
- Featured Products: ${JSON.stringify(platformContext?.products || [])}
${platformContext?.ownerContext ? `OWNER SPECIFIC DATA:\n${platformContext.ownerContext}` : ''}
${platformContext?.adminContext ? `ADMIN SPECIFIC DATA:\n${platformContext.adminContext}` : ''}

NAVIGATION ACTION SHORTCUTS RULE:
Whenever relevant to your answer, you CAN include one or more interactive navigation buttons at the end of your response using this exact syntax:
[ACTION:action_key|Button Label]

${allowedActions}

WEBSITE NAVIGATION & ALL-AROUND SYSTEM FAQ INSTRUCTIONS:
You are an all-around website assistant and interactive help guide. Whenever users ask how to navigate the website, where to find specific sections, or how the Nail Glam Hub system operates:
1. Provide numbered, step-by-step navigation instructions pointing out exact tabs in the top navigation bar or dashboard.
2. Clearly explain system workflows:
   - Browsing studios, viewing technician portfolios, and checking service menus.
   - Reserving appointments with instant confirmation and selecting PayMongo (GCash, Maya, Cards) or Cash on Visit.
   - Reserving authentic salon products with 0 upfront fee for in-store pickup with a digital voucher code.
   - Accessing 'My Appointments' or 'My Pickups' from the user profile menu.
   - For salon owners: viewing P&L reports, managing staff, setting inventory low-stock limits, and multi-branch management.
   - For administrators: auditing salon partner registrations and broadcasting promotional announcements.
3. Inform users that they can also click the "FAQs & Guide" tab in the GlamBot header for quick answers to common questions.
4. ALWAYS conclude with relevant [ACTION:action_key|Button Label] shortcuts matching the allowed actions for the current role session!

FORMATTING GUIDELINES:
- Use clean Markdown: bolding, bullet points, headers (###), and numbered steps.
- When quoting prices, use Philippine Pesos (₱).
- Keep answers concise, highly readable, and directly practical.
- Never output raw JSON or code unless asked.
`;

  try {
    // Build conversation history for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Filter and take the last 8 messages to maintain focus and stay within token efficiency
    const recentMessages = messages.slice(-8);

    for (const msg of recentMessages) {
      contents.push({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Candidate models to attempt in order of priority:
    // 1. 'gemini-3.8-flash' (standard flash)
    // 2. 'gemini-flash-latest' (alias for latest flash version)
    // 3. 'gemini-3.1-flash-lite' (high-throughput low-latency model)
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents as any,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const replyText = response.text?.trim();
        if (replyText) {
          return {
            reply: replyText,
            source: 'gemini',
          };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTemporaryCapacityIssue =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('429');

        if (isTemporaryCapacityIssue) {
          console.warn(`[GlamBot] Model ${modelName} experiencing temporary high demand, attempting next available model...`);
          // Brief pause before trying next candidate
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        } else {
          // If it's a non-transient error, break to fallback immediately
          break;
        }
      }
    }

    console.warn('[GlamBot] Gemini API models at peak capacity, serving verified knowledge engine response:', lastError?.message || lastError);
    const fallbackReply = generateFallbackResponse(lastUserMessage, userRole, platformContext);
    return {
      reply: fallbackReply,
      source: 'fallback',
    };
  } catch (error) {
    console.warn('[GlamBot] Request processing fallback activated:', error instanceof Error ? error.message : error);
    const fallbackReply = generateFallbackResponse(lastUserMessage, userRole, platformContext);
    return {
      reply: fallbackReply,
      source: 'fallback',
    };
  }
}
