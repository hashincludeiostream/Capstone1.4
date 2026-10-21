# Nail Glam Hub

A modern mobile-web responsive nail salon portal built with React, TypeScript, Node.js, and MySQL.

## Features

### User Authentication
- User registration (Customer/Salon Owner/Admin)
- Secure login with bcrypt password hashing
- Rate limiting for login attempts
- Email and password strength validation
- Admin security code verification

### Dashboard System
- Role-based dashboards (Customer/Salon Owner/Admin)
- Appointment management and booking
- Service catalog management
- Review and rating system
- Real-time statistics and reporting
- Announcement management

### Database Structure
- Users management with role-based access
- Salons and services with verification system
- Appointments and bookings with status tracking
- Reviews and ratings
- Working hours management
- Reels and promotions
- Business categories

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS 4.0, Vite
- **Backend**: Node.js, Express.js
- **Database**: Google Cloud Firestore (ai-studio-capstone14-f7575340-b666-4d9b-b5f4-cffdf3c32bbc)
- **Maps**: Leaflet, React-Leaflet
- **Icons**: Lucide React
- **Animations**: Motion
- **Development**: tsx, esbuild

## Installation & Architecture

### Prerequisites
- Node.js 18+ and npm
- Fully provisioned Google Cloud Firestore database in AI Studio

### Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Database Verification & Sync**
   - The system connects directly to Google Cloud Firestore.
   - Run `npx tsx scripts/verifyFirestore.ts` to inspect live cloud collections.

3. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Navigate to: http://localhost:3001

## Build for Production

```bash
npm run build
npm start
```

## Default Login Credentials

### Admin
- Email: admin@nailglamhub.com
- Password: Demo123! (local seed account; change after import)

### Salon Owner
- Email: salon@nailglamhub.com
- Password: Demo123! (local seed account; change after import)

### Customer
- Email: customer@nailglamhub.com
- Password: Demo123! (local seed account; change after import)

## File Structure

```
nail-glam-hub/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── config/            # Configuration files
│   ├── data/              # Mock data
│   ├── lib/               # API utilities
│   └── types.ts           # TypeScript types
├── php-backend/           # PHP API endpoints (legacy)
│   ├── api/               # PHP API files
│   ├── config/            # PHP database config
│   └── database.sql       # Database schema
├── server.ts              # Node.js server
├── package.json           # Node dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
└── .env                   # Environment variables (not committed)
```

## Central Email Sender Configuration & Management

Nail Glam Hub enforces a strict single central sender architecture for all outbound emails. All platform events—including customer booking confirmations, salon owner alerts, cancellation notices, order receipts, promotional campaigns, and certified executive PDF audit reports—are dispatched through one centralized backend Nodemailer transporter.

The sender is never derived from logged-in customer or salon owner addresses, and no fallback dummy addresses are hardcoded in application logic. If configuration is missing or invalid, the system fails explicitly and logs the event safely in the communication ledger.

### Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `SYSTEM_SENDER_EMAIL` | Official address shown as the sender (RFC 5322 format) | `noreply@nailglamhub.com` |
| `SYSTEM_SENDER_NAME` | Friendly sender name displayed in inboxes | `Nail Glam Hub` |
| `SMTP_HOST` | Hostname of your SMTP provider | `smtp.gmail.com` |
| `SMTP_PORT` | Port number (`587` for STARTTLS, `465` for SSL/TLS) | `587` |
| `SMTP_USER` | Authenticated SMTP account username | `mailer@nailglamhub.com` |
| `SMTP_PASS` | SMTP password or provider app password (never committed) | `xxxx-xxxx-xxxx-xxxx` |
| `SMTP_SECURE` | Set `false` for port 587 (STARTTLS); `true` for 465 (SSL) | `false` |
| `SMTP_IGNORE_TLS_ERRORS` | Optional boolean; leave `false` in production | `false` |

### How to Change the Sender Account

1. **Edit `.env`**: Update `SYSTEM_SENDER_EMAIL`, `SYSTEM_SENDER_NAME`, and matching `SMTP_USER` / `SMTP_PASS` credentials.
2. **Restart the Backend**: Restart the application process (`npm run dev` or restart your production container/daemon). The server revalidates credentials and automatically instantiates a fresh Nodemailer transporter.
3. **Verify Connection & Dispatch**:
   - Run `npm run test:email` to execute the automated configuration test suite.
   - Or open the **Administrator Dashboard** -> **Email Reports** tab and click **Test Connection**, followed by **Send Test**.

### Switching Between SMTP Providers

- **Google Workspace / Gmail**:
  - `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`.
  - Enable 2-Step Verification on the Google account and generate a 16-character **App Password** for `SMTP_PASS`.
  - If `SYSTEM_SENDER_EMAIL` is an alias (e.g., `noreply@domain.com`) different from `SMTP_USER`, add it in Gmail under *Settings -> Accounts -> Send mail as*.
- **SendGrid**:
  - `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`, `SMTP_SECURE=false`.
  - `SMTP_USER=apikey`, `SMTP_PASS=<SendGrid-API-Key>`.
  - `SYSTEM_SENDER_EMAIL` must be a verified Single Sender Identity or from a verified sender domain.
- **Amazon SES**:
  - `SMTP_HOST=email-smtp.<region>.amazonaws.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`.
  - `SMTP_USER=<SES_SMTP_User>`, `SMTP_PASS=<SES_SMTP_Password>`.
  - Ensure the domain or sender email address is verified in the AWS SES Console.

### Security & Password Protection

- **No Database Credential Storage**: To prevent privilege escalation and credential leakage, SMTP passwords are not stored in database tables and cannot be modified by arbitrary portal users.
- **No Password Exposure**: Password values are stripped from all diagnostic endpoints (`/api/email/system-status`, `/api/email/verify-connection`), client bundles, and logging tables.

## Security Features

- **Centralized Email Dispatcher**: Strict RFC validation, single transporter caching, and no fallback address spoofing
- **Password Hashing**: Uses bcrypt for secure password storage
- **SQL Injection Prevention**: Prepared statements with parameterized queries and field whitelisting
- **XSS Protection**: Input sanitization and validation
- **Rate Limiting**: Login attempt rate limiting to prevent brute force attacks
- **CORS Protection**: Restricted CORS policy for specific origins
- **Environment Variables**: Sensitive data stored in .env (not committed)

## Development Notes

- The application uses responsive design for mobile and desktop
- TypeScript strict mode enabled for better type safety
- Error handling and user feedback throughout
- Modern React practices with security in mind

## Support

For issues or questions, please ensure:
- Google Cloud Firestore connection is active
- Environment variables are properly configured
- Node.js dependencies are installed
- TypeScript compilation succeeds
