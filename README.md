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
- **Database**: MySQL/MariaDB (via mysql2)
- **Maps**: Leaflet, React-Leaflet
- **Icons**: Lucide React
- **Animations**: Motion
- **Development**: tsx, esbuild

## Installation

### Prerequisites
- Node.js 18+ and npm
- MySQL 5.7+ or MariaDB
- XAMPP/WAMP/MAMP (for local MySQL) or standalone MySQL

### Setup Instructions

1. **Clone or download the project**
   ```bash
   cd c:\xampp\htdocs\capstone_1.4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create the database**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `nailglamhub_db`
   - Import `php-backend/database.sql`

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update the following variables:
   ```env
   PORT=3001
   NODE_ENV=development
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=nailglamhub_db
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ADMIN_CODES=ADMIN2025,GLAM_ADMIN,ADMIN,SUPERADMIN
   ```

5. **Start the development server**
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
- Password: (Set during registration with admin code)

### Salon Owner
- Email: salon@nailglamhub.com
- Password: (Set during registration)

### Customer
- Email: customer@nailglamhub.com
- Password: (Set during registration)

## File Structure

```
capstone_1.4/
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

## Security Features

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
- Database connection is working (MySQL running in XAMPP)
- Environment variables are properly configured
- Node.js dependencies are installed
- TypeScript compilation succeeds
