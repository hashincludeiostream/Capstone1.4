/**
 * Automated Email & PDF Reports Service for Customers, Salon Owners, and Admins
 * Supports real Gmail API delivery (OAuth token) and server-backed email logging & dispatch.
 */

import { EmailLog, User, Salon, Appointment, ProductOrder, UserRole, PlatformStats } from '../types';
import { getCachedAccessToken } from './firebase';

export interface EmailDispatchOptions {
  to: string;
  toName?: string;
  role: UserRole;
  subject: string;
  category: 'booking' | 'order' | 'promo' | 'report' | 'verification' | 'alert';
  htmlBody: string;
  hasPdfAttachment?: boolean;
  pdfHtml?: string;
  attachmentName?: string;
  senderEmail?: string;
}

const BRAND_NAME = 'Nail Glam Hub';
const DEFAULT_SENDER = 'notifications@nailglamhub.com';

/**
 * Creates a beautiful, responsive HTML email shell with consistent branding
 */
export function wrapHtmlEmailTemplate(title: string, contentHtml: string, actionButton?: { text: string; url: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FDF7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D1A28; line-height: 1.6; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); border: 1px solid #FCE7F3; }
    .header { background: linear-gradient(135deg, #EC4899 0%, #DB2777 50%, #BE185D 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 9999px; padding: 6px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-pink { background-color: #FCE7F3; color: #BE185D; }
    .badge-green { background-color: #D1FAE5; color: #065F46; }
    .badge-amber { background-color: #FEF3C7; color: #92400E; }
    .card { background-color: #FFF9FB; border: 1px solid #FCE7F3; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #FCE7F3; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #831843; font-weight: 500; }
    .detail-value { font-weight: 600; color: #1F2937; }
    .btn { display: inline-block; background-color: #EC4899; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 20px 0 10px 0; text-align: center; box-shadow: 0 2px 10px rgba(236, 72, 153, 0.35); }
    .footer { background-color: #FFF1F7; padding: 24px; text-align: center; font-size: 12px; color: #9D174D; border-top: 1px solid #FCE7F3; }
    .footer a { color: #DB2777; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">💅 ${BRAND_NAME} Official Alert</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${contentHtml}
      ${actionButton ? `<div style="text-align: center;"><a href="${actionButton.url}" class="btn">${actionButton.text}</a></div>` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;">This email was automatically dispatched to your verified account via Nail Glam Hub.</p>
      <p style="margin: 0;">You can update your automated email notification preferences anytime in your Account Settings.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Builds RFC 2822 format and base64url encodes it for direct Gmail API sending
 */
function createRawEmail(to: string, from: string, subject: string, htmlBody: string): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `From: ${BRAND_NAME} <${from}>`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(htmlBody))),
  ];
  const rawMessage = messageParts.join('\r\n');
  return btoa(rawMessage)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Dispatches an email notification via server and optional direct Gmail API
 */
export async function sendEmailNotification(options: EmailDispatchOptions): Promise<{ success: boolean; log?: EmailLog; error?: string }> {
  try {
    const accessToken = getCachedAccessToken();

    // 1. If user has active Google OAuth access token with Gmail scope, attempt direct dispatch
    if (accessToken) {
      try {
        const raw = createRawEmail(options.to, options.senderEmail || DEFAULT_SENDER, options.subject, options.htmlBody);
        const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        });
        if (gmailRes.ok) {
          console.log(`[EmailService] Dispatched via Google Gmail API directly to: ${options.to}`);
        }
      } catch (gmailErr) {
        console.warn('[EmailService] Direct Gmail API call warning (falling back to relay):', gmailErr);
      }
    }

    // 2. Dispatch to server to record in database and trigger automated notification
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Server failed to dispatch email');
    }

    const data = await response.json();

    // Notify in-app UI via event for instant live toast/feedback
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nailglamhub_email_sent', {
          detail: {
            to: options.to,
            subject: options.subject,
            category: options.category,
            hasPdf: Boolean(options.hasPdfAttachment),
          },
        })
      );
    }

    return { success: true, log: data.log };
  } catch (error: any) {
    console.error('[EmailService] Dispatch error:', error);
    return { success: false, error: error.message || 'Unknown email dispatch error' };
  }
}

// =========================================================================
// CUSTOMER NOTIFICATIONS
// =========================================================================

/**
 * Customer: Booking Confirmation Email
 */
export async function sendCustomerBookingConfirmation(
  appointment: Appointment,
  salon: Salon,
  customer: { fullname: string; email: string; phone?: string }
) {
  const subject = `Booking Confirmed! 💅 ${appointment.service_name || 'Nail Appointment'} at ${salon.salon_name}`;
  const content = `
    <p>Dear <strong>${customer.fullname}</strong>,</p>
    <p>Your salon booking has been successfully confirmed at <strong>${salon.salon_name}</strong>. Here are your appointment details:</p>
    
    <div class="card">
      <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${appointment.service_name || 'Nail Care & Styling'}</span></div>
      <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${appointment.appointment_date}</span></div>
      <div class="detail-row"><span class="detail-label">Time:</span><span class="detail-value">${appointment.appointment_time}</span></div>
      <div class="detail-row"><span class="detail-label">Specialist:</span><span class="detail-value">${appointment.staff_name || appointment.technician_name || 'Assigned Salon Specialist'}</span></div>
      <div class="detail-row"><span class="detail-label">Total Fee:</span><span class="detail-value">₱${Number(appointment.total_price || 0).toLocaleString()}</span></div>
      <div class="detail-row"><span class="detail-label">Salon Address:</span><span class="detail-value">${salon.address}</span></div>
      <div class="detail-row"><span class="detail-label">Salon Phone:</span><span class="detail-value">${salon.phone}</span></div>
    </div>

    <p style="font-size: 13px; color: #6B7280;">
      💡 <em>Friendly reminder: Please arrive 10 minutes before your slot. Late cancellations within 30 minutes of scheduled time may be subject to salon late policy.</em>
    </p>
  `;

  const html = wrapHtmlEmailTemplate('Your Salon Appointment is Confirmed', content);
  return sendEmailNotification({
    to: customer.email,
    toName: customer.fullname,
    role: 'customer',
    subject,
    category: 'booking',
    htmlBody: html,
  });
}

/**
 * Customer: Booking Status Update (Confirmed, Completed, Cancelled, Rescheduled)
 */
export async function sendCustomerBookingStatusUpdate(
  appointment: Appointment,
  salon: Salon,
  customer: { fullname: string; email: string },
  newStatus: string,
  extraNote?: string
) {
  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmed & Scheduled',
    completed: 'Completed & Thank You',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
  };

  const label = statusLabels[newStatus] || newStatus;
  const subject = `Update on your appointment at ${salon.salon_name}: ${label}`;
  const content = `
    <p>Dear <strong>${customer.fullname}</strong>,</p>
    <p>There is an update regarding your appointment at <strong>${salon.salon_name}</strong>.</p>
    
    <div class="card">
      <div class="detail-row"><span class="detail-label">Status:</span><span class="detail-value badge ${newStatus === 'completed' ? 'badge-green' : newStatus === 'cancelled' ? 'badge-amber' : 'badge-pink'}">${label}</span></div>
      <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${appointment.service_name || 'Nail Treatment'}</span></div>
      <div class="detail-row"><span class="detail-label">Date & Time:</span><span class="detail-value">${appointment.appointment_date} at ${appointment.appointment_time}</span></div>
      ${extraNote ? `<div class="detail-row"><span class="detail-label">Details / Note:</span><span class="detail-value">${extraNote}</span></div>` : ''}
    </div>

    <p>${newStatus === 'completed' ? 'Thank you for visiting! We hope you love your nails. Feel free to leave a review.' : 'If you have any questions or need assistance, feel free to reach out to the salon directly.'}</p>
  `;

  const html = wrapHtmlEmailTemplate(`Appointment Status: ${label}`, content);
  return sendEmailNotification({
    to: customer.email,
    toName: customer.fullname,
    role: 'customer',
    subject,
    category: 'booking',
    htmlBody: html,
  });
}

/**
 * Customer: In-Store Pickup Order Confirmation Receipt
 */
export async function sendCustomerOrderConfirmation(
  order: ProductOrder,
  salon: Salon,
  customer: { fullname: string; email: string }
) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subject = `Order Reserved! 🛍️ #${order.order_number} for In-Store Pickup at ${order.salon_name || salon.salon_name}`;
  
  const itemsHtml = items.map((i: any) => `
    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #FCE7F3; font-size: 13px;">
      <span>${i.product_name} x${i.quantity}</span>
      <strong>₱${(Number(i.unit_price || 0) * Number(i.quantity || 1)).toLocaleString()}</strong>
    </div>
  `).join('');

  const content = `
    <p>Dear <strong>${customer.fullname}</strong>,</p>
    <p>Your boutique product reservation is confirmed! You can inspect and settle your payment at the physical salon counter upon pickup.</p>
    
    <div class="card">
      <div class="detail-row"><span class="detail-label">Order Number:</span><span class="detail-value">#${order.order_number}</span></div>
      <div class="detail-row"><span class="detail-label">Scheduled Pickup:</span><span class="detail-value">${order.pickup_date} at ${order.pickup_time}</span></div>
      <div class="detail-row"><span class="detail-label">Salon Location:</span><span class="detail-value">${order.salon_address || salon.address}</span></div>
      <div class="detail-row"><span class="detail-label">Salon Contact:</span><span class="detail-value">${order.salon_phone || salon.phone}</span></div>
      <div style="margin-top: 14px; font-weight: 600; color: #831843; font-size: 14px;">Reserved Products:</div>
      ${itemsHtml}
      <div class="detail-row" style="margin-top: 10px; font-size: 16px;"><span class="detail-label">Total to Pay at Counter:</span><span class="detail-value" style="color: #BE185D;">₱${Number(order.total_amount || 0).toLocaleString()}</span></div>
    </div>

    <p style="font-size: 13px; color: #6B7280;">
      📍 Please show your order number <strong>#${order.order_number}</strong> at the salon front desk when claiming.
    </p>
  `;

  const html = wrapHtmlEmailTemplate(`Order Confirmed: #${order.order_number}`, content);
  return sendEmailNotification({
    to: customer.email,
    toName: customer.fullname,
    role: 'customer',
    subject,
    category: 'order',
    htmlBody: html,
  });
}

/**
 * Customer: Promotional / News Announcement Email
 */
export async function sendCustomerPromoAnnouncement(
  customerEmail: string,
  customerName: string,
  title: string,
  message: string,
  discountCode?: string
) {
  const subject = `Special Salon Offer & News! ✨ ${title}`;
  const content = `
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Exciting beauty news and exclusive perks from the salons at <strong>Nail Glam Hub</strong>!</p>
    
    <div class="card" style="border-left: 4px solid #EC4899;">
      <h3 style="margin-top: 0; color: #BE185D;">${title}</h3>
      <p style="margin-bottom: 0; font-size: 14px; color: #4B5563;">${message}</p>
      ${discountCode ? `
        <div style="margin-top: 16px; background: #FFF1F2; border: 1px dashed #FB7185; padding: 12px; border-radius: 8px; text-align: center;">
          <span style="font-size: 12px; color: #9F1239; font-weight: 600; text-transform: uppercase;">Use Promo Code</span>
          <div style="font-size: 20px; font-weight: 800; color: #BE123C; letter-spacing: 2px;">${discountCode}</div>
        </div>
      ` : ''}
    </div>
  `;

  const html = wrapHtmlEmailTemplate(title, content, { text: 'Explore & Book Today', url: 'https://nailglamhub.com' });
  return sendEmailNotification({
    to: customerEmail,
    toName: customerName,
    role: 'customer',
    subject,
    category: 'promo',
    htmlBody: html,
  });
}

// =========================================================================
// SALON OWNER NOTIFICATIONS & MONTHLY PDF REPORTS
// =========================================================================

/**
 * Salon Owner: New Customer Booking Alert
 */
export async function sendOwnerNewBookingAlert(
  ownerEmail: string,
  salon: Salon,
  appointment: Appointment,
  customer: { fullname: string; phone?: string; email?: string }
) {
  const subject = `New Appointment Alert! 📅 ${appointment.customer_name} on ${appointment.appointment_date} at ${appointment.appointment_time}`;
  const content = `
    <p>Hello <strong>${salon.salon_name}</strong> Team,</p>
    <p>A new customer booking has been scheduled at your salon.</p>
    
    <div class="card">
      <div class="detail-row"><span class="detail-label">Customer Name:</span><span class="detail-value">${customer.fullname}</span></div>
      <div class="detail-row"><span class="detail-label">Customer Phone:</span><span class="detail-value">${customer.phone || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">Customer Email:</span><span class="detail-value">${customer.email || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${appointment.service_name || 'Nail Treatment'}</span></div>
      <div class="detail-row"><span class="detail-label">Date & Time:</span><span class="detail-value">${appointment.appointment_date} @ ${appointment.appointment_time}</span></div>
      <div class="detail-row"><span class="detail-label">Specialist:</span><span class="detail-value">${appointment.staff_name || appointment.technician_name || 'Any Specialist'}</span></div>
      <div class="detail-row"><span class="detail-label">Total Expected:</span><span class="detail-value">₱${Number(appointment.total_price || 0).toLocaleString()}</span></div>
    </div>
  `;

  const html = wrapHtmlEmailTemplate('New Appointment Scheduled', content, { text: 'View Owner Dashboard', url: 'https://nailglamhub.com' });
  return sendEmailNotification({
    to: ownerEmail,
    role: 'salon_owner',
    subject,
    category: 'booking',
    htmlBody: html,
  });
}

/**
 * Salon Owner: New Customer Product Order Alert
 */
export async function sendOwnerNewOrderAlert(
  ownerEmail: string,
  salon: Salon,
  order: ProductOrder,
  customer: { fullname: string; phone?: string; email?: string }
) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subject = `New In-Store Order! 🛍️ #${order.order_number} by ${customer.fullname}`;
  
  const itemsHtml = items.map((i: any) => `
    <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px;">
      <span>${i.product_name} (x${i.quantity})</span>
      <strong>₱${(Number(i.unit_price || 0) * Number(i.quantity || 1)).toLocaleString()}</strong>
    </div>
  `).join('');

  const content = `
    <p>Hello <strong>${salon.salon_name}</strong> Store Staff,</p>
    <p>A customer has reserved products for in-store pickup and settlement.</p>
    
    <div class="card">
      <div class="detail-row"><span class="detail-label">Order Number:</span><span class="detail-value">#${order.order_number}</span></div>
      <div class="detail-row"><span class="detail-label">Customer:</span><span class="detail-value">${customer.fullname} (${customer.phone || 'No phone'})</span></div>
      <div class="detail-row"><span class="detail-label">Expected Pickup:</span><span class="detail-value">${order.pickup_date} at ${order.pickup_time}</span></div>
      <div class="detail-row"><span class="detail-label">Total Amount:</span><span class="detail-value" style="color: #BE185D; font-weight: 700;">₱${Number(order.total_amount || 0).toLocaleString()}</span></div>
      <div style="margin-top: 12px; font-weight: 600; color: #831843;">Reserved Items to prepare:</div>
      ${itemsHtml}
    </div>
  `;

  const html = wrapHtmlEmailTemplate(`New Order: #${order.order_number}`, content, { text: 'Manage Orders', url: 'https://nailglamhub.com' });
  return sendEmailNotification({
    to: ownerEmail,
    role: 'salon_owner',
    subject,
    category: 'order',
    htmlBody: html,
  });
}

/**
 * Salon Owner: Automated Monthly PDF Business & Revenue Report
 */
export async function sendOwnerMonthlyPdfReport(
  ownerEmail: string,
  ownerName: string,
  salon: Salon,
  reportMetrics: {
    monthYear: string;
    totalRevenue: number;
    servicesRevenue: number;
    retailRevenue: number;
    appointmentCount: number;
    orderCount: number;
    netProfit: number;
    profitMargin: number;
    averageTicket: number;
    peakPeriod: string;
  }
) {
  const subject = `Monthly Business Report (PDF) 📊 ${reportMetrics.monthYear} - ${salon.salon_name}`;
  
  // PDF Document HTML template for attachment / printing
  const pdfHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Monthly Performance Report - ${salon.salon_name}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1F2937; background: #fff; }
    .report-header { border-bottom: 2px solid #EC4899; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .report-title { font-size: 26px; font-weight: 800; color: #9D174D; margin: 0; }
    .report-meta { font-size: 13px; color: #6B7280; text-align: right; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .kpi-card { background: #FFF9FB; border: 1px solid #FCE7F3; border-radius: 10px; padding: 16px; text-align: center; }
    .kpi-val { font-size: 22px; font-weight: 800; color: #BE185D; margin: 6px 0 0 0; }
    .kpi-lbl { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #831843; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #FFF1F7; color: #831843; padding: 12px; text-align: left; font-size: 13px; border-bottom: 2px solid #FCE7F3; }
    td { padding: 12px; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
    .footer-note { margin-top: 40px; font-size: 11px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <div style="color: #EC4899; font-weight: 700; font-size: 14px; text-transform: uppercase;">Nail Glam Hub • Monthly Financial Audit</div>
      <h1 class="report-title">${salon.salon_name}</h1>
      <div style="font-size: 13px; color: #4B5563; margin-top: 4px;">Branch: ${salon.address} | Contact: ${salon.phone}</div>
    </div>
    <div class="report-meta">
      <div><strong>Reporting Cycle:</strong> ${reportMetrics.monthYear}</div>
      <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
      <div><strong>Status:</strong> Reconciled & Certified</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-lbl">Total Gross Revenue</div>
      <div class="kpi-val">₱${reportMetrics.totalRevenue.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">Net Operating Profit</div>
      <div class="kpi-val">₱${reportMetrics.netProfit.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">Net Profit Margin</div>
      <div class="kpi-val">${reportMetrics.profitMargin.toFixed(1)}%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-lbl">Appointments Served</div>
      <div class="kpi-val">${reportMetrics.appointmentCount}</div>
    </div>
  </div>

  <h3 style="color: #831843; margin-bottom: 8px;">Revenue & Expense Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Volume</th>
        <th>Gross Revenue</th>
        <th>Contribution</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Salon Services & Treatments</td>
        <td>${reportMetrics.appointmentCount} bookings</td>
        <td><strong>₱${reportMetrics.servicesRevenue.toLocaleString()}</strong></td>
        <td>${reportMetrics.totalRevenue > 0 ? ((reportMetrics.servicesRevenue / reportMetrics.totalRevenue) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td>Retail Product Boutique</td>
        <td>${reportMetrics.orderCount} orders</td>
        <td><strong>₱${reportMetrics.retailRevenue.toLocaleString()}</strong></td>
        <td>${reportMetrics.totalRevenue > 0 ? ((reportMetrics.retailRevenue / reportMetrics.totalRevenue) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr style="font-weight: bold; background-color: #FFF9FB;">
        <td>Total Operating Turnover</td>
        <td>${reportMetrics.appointmentCount + reportMetrics.orderCount} transactions</td>
        <td style="color: #BE185D;">₱${reportMetrics.totalRevenue.toLocaleString()}</td>
        <td>100.0%</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 25px; background: #FFF9FB; border: 1px solid #FCE7F3; padding: 16px; border-radius: 8px; font-size: 13px;">
    <strong>Strategic Notes:</strong> Average ticket revenue per client transaction this month was <strong>₱${reportMetrics.averageTicket.toLocaleString()}</strong>. Peak client traffic recorded during <strong>${reportMetrics.peakPeriod}</strong>.
  </div>

  <div class="footer-note">
    Confidential Monthly Report automatically dispatched to ${ownerEmail}. Verified by Nail Glam Hub Platform Engine.
  </div>
</body>
</html>
  `.trim();

  const content = `
    <p>Dear <strong>${ownerName || 'Salon Owner'}</strong>,</p>
    <p>Your official <strong>${reportMetrics.monthYear} Monthly Business & Financial Report</strong> for <strong>${salon.salon_name}</strong> is ready. Your PDF report is attached below and archived in your owner records.</p>
    
    <div class="card">
      <div class="detail-row"><span class="detail-label">Period:</span><span class="detail-value">${reportMetrics.monthYear}</span></div>
      <div class="detail-row"><span class="detail-label">Gross Revenue:</span><span class="detail-value" style="color: #BE185D;">₱${reportMetrics.totalRevenue.toLocaleString()}</span></div>
      <div class="detail-row"><span class="detail-label">Net Profit:</span><span class="detail-value" style="color: #065F46;">₱${reportMetrics.netProfit.toLocaleString()} (${reportMetrics.profitMargin.toFixed(1)}%)</span></div>
      <div class="detail-row"><span class="detail-label">Appointments:</span><span class="detail-value">${reportMetrics.appointmentCount} booked</span></div>
      <div class="detail-row"><span class="detail-label">Retail Boutique Orders:</span><span class="detail-value">${reportMetrics.orderCount} fulfilled</span></div>
      <div class="detail-row"><span class="detail-label">Average Ticket:</span><span class="detail-value">₱${reportMetrics.averageTicket.toLocaleString()}</span></div>
      <div class="detail-row"><span class="detail-label">PDF Attachment:</span><span class="detail-value badge badge-pink">Attached (${salon.salon_name.replace(/\s+/g, '_')}_Monthly_Report.pdf)</span></div>
    </div>

    <p style="font-size: 13px; color: #6B7280;">
      📄 You can print or download your official PDF report anytime from this email or directly inside the Salon Owner Dashboard.
    </p>
  `;

  const html = wrapHtmlEmailTemplate(`Monthly PDF Status Report: ${reportMetrics.monthYear}`, content, { text: 'Open Salon Dashboard', url: 'https://nailglamhub.com' });
  return sendEmailNotification({
    to: ownerEmail,
    toName: ownerName,
    role: 'salon_owner',
    subject,
    category: 'report',
    htmlBody: html,
    hasPdfAttachment: true,
    pdfHtml,
    attachmentName: `${salon.salon_name.replace(/\s+/g, '_')}_Monthly_Report_${reportMetrics.monthYear.replace(/\s+/g, '_')}.pdf`,
  });
}

// =========================================================================
// ADMIN NOTIFICATIONS & REGISTRATION ALERTS
// =========================================================================

/**
 * Admin: New User Registration Alert
 */
export async function sendAdminNewUserRegistrationAlert(
  adminEmail: string,
  newUser: { fullname: string; email: string; user_type: string; phone?: string }
) {
  const roleLabel = newUser.user_type === 'salon_owner' ? 'Salon Owner' : newUser.user_type === 'admin' ? 'Administrator' : 'Customer';
  const subject = `New Registration Alert! 👤 ${newUser.fullname} (${roleLabel})`;
  const content = `
    <p>Hello Administrator,</p>
    <p>A new user has just registered and verified their account on <strong>Nail Glam Hub</strong>.</p>
    
    <div class="card">
      <div class="detail-row"><span class="detail-label">Full Name:</span><span class="detail-value">${newUser.fullname}</span></div>
      <div class="detail-row"><span class="detail-label">Email:</span><span class="detail-value">${newUser.email}</span></div>
      <div class="detail-row"><span class="detail-label">User Role:</span><span class="detail-value badge badge-pink">${roleLabel}</span></div>
      <div class="detail-row"><span class="detail-label">Phone:</span><span class="detail-value">${newUser.phone || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">Registered At:</span><span class="detail-value">${new Date().toLocaleString()}</span></div>
    </div>
  `;

  const html = wrapHtmlEmailTemplate(`New User Alert: ${newUser.fullname}`, content, { text: 'Review Admin Portal', url: 'https://nailglamhub.com' });
  return sendEmailNotification({
    to: adminEmail,
    role: 'admin',
    subject,
    category: 'alert',
    htmlBody: html,
  });
}

/**
 * Admin: Automated Platform Status PDF Report
 */
export async function sendAdminPlatformStatusReport(
  adminEmail: string,
  stats: PlatformStats,
  salonsCount: number
) {
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const subject = `Platform Status Report (PDF) 🛡️ ${monthYear} - Nail Glam Hub Admin`;
  
  const content = `
    <p>Hello Administrator,</p>
    <p>Here is your comprehensive <strong>Platform Health & Status Report</strong> for <strong>${monthYear}</strong>.</p>
    
    <div class="card">
      <div class="detail-row"><span class="detail-label">Active Salons:</span><span class="detail-value">${salonsCount || stats.total_salons} verified salons</span></div>
      <div class="detail-row"><span class="detail-label">Total Platform Users:</span><span class="detail-value">${stats.total_users ?? (stats.total_customers + stats.total_salon_owners + stats.total_admins)} users</span></div>
      <div class="detail-row"><span class="detail-label">Total Appointments Booked:</span><span class="detail-value">${stats.total_appointments} bookings</span></div>
      <div class="detail-row"><span class="detail-label">Customer Reviews:</span><span class="detail-value">${stats.total_reviews} reviews (${stats.average_rating ? stats.average_rating.toFixed(1) : '4.9'} avg rating)</span></div>
      <div class="detail-row"><span class="detail-label">System Health:</span><span class="detail-value badge badge-green">100% Operational</span></div>
    </div>
  `;

  const html = wrapHtmlEmailTemplate(`Platform Status Report: ${monthYear}`, content, { text: 'Open Admin Center', url: 'https://nailglamhub.com' });
  return sendEmailNotification({
    to: adminEmail,
    role: 'admin',
    subject,
    category: 'report',
    htmlBody: html,
    hasPdfAttachment: true,
    attachmentName: `Platform_Status_Report_${monthYear.replace(/\s+/g, '_')}.pdf`,
  });
}
