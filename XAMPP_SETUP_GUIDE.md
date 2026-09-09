# Nail Glam Hub - XAMPP & PHP/MySQL Integration Guide

This guide explains how to run **Nail Glam Hub** on your local machine using **XAMPP** (Apache + MySQL + PHP) with full database persistence and zero visual design breakage.

---

## 📁 Architecture Overview

- **Frontend**: Modern React 18, Tailwind CSS, Lucide Icons, and Interactive Maps compiled into high-performance static HTML/CSS/JS bundles in `/dist`.
- **Backend**: Clean PHP PDO REST API scripts in `/php-backend/api/`.
- **Database**: MySQL/MariaDB database (`nailglamhub_db`) managed via phpMyAdmin using `/php-backend/database.sql`.

---

## 🚀 Step-by-Step Setup in XAMPP

### Step 1: Start XAMPP Services
1. Open the **XAMPP Control Panel**.
2. Click **Start** for both **Apache** and **MySQL**.
3. Ensure both modules are green and running.

---

### Step 2: Create & Import the MySQL Database
1. Open your web browser and go to:
   ```
   http://localhost/phpmyadmin/
   ```
2. In phpMyAdmin, click on the **Import** tab in the top navigation bar.
3. Click **Choose File** and select `php-backend/database.sql` from your project folder.
4. Click **Import** (or **Go**) at the bottom.
5. This will automatically create the database `nailglamhub_db` and seed all tables:
   - `users` (Admin, Salon Owner, Client accounts)
   - `salons` (Verified Metro Manila salons with GPS coordinates & parking info)
   - `services` (Manicures, Pedicures, Lash Lifts, Gel Extensions)
   - `technicians` (Staff stylists, ratings, specialties)
   - `appointments` (Booking statuses, dates, times, customer details)
   - `reviews` (Client ratings & testimonials)
   - `working_hours`, `reels`, `promotions`, `announcements`

---

### Step 3: Copy the Files to XAMPP `htdocs`
1. Export your project from AI Studio as a ZIP (or clone via GitHub).
2. Extract the project into your XAMPP web root directory:
   ```
   C:\xampp\htdocs\nailglamhub\
   ```
3. Your folder structure inside `C:\xampp\htdocs\nailglamhub\` should look like:
   ```
   nailglamhub/
   ├── php-backend/
   │   ├── config/
   │   │   └── db.php          <-- MySQL connection (default: root, no password)
   │   ├── api/
   │   │   ├── categories.php
   │   │   ├── salons.php
   │   │   ├── services.php
   │   │   ├── technicians.php
   │   │   ├── appointments.php
   │   │   ├── reviews.php
   │   │   ├── reels.php
   │   │   ├── promotions.php
   │   │   ├── announcements.php
   │   │   ├── auth.php
   │   │   └── .htaccess
   │   └── database.sql
   ├── dist/                   <-- Built static frontend
   └── ...
   ```

---

### Step 4: Build the Frontend (Compiles all CSS/Layouts)
1. Open a terminal / command prompt in `C:\xampp\htdocs\nailglamhub\`.
2. Install node dependencies (if building locally for the first time):
   ```bash
   npm install
   ```
3. Run the production build command:
   ```bash
   npm run build
   ```
4. Copy the contents of the generated `dist/` folder directly into `C:\xampp\htdocs\nailglamhub\`:
   - `index.html`
   - `assets/` (contains all bundled CSS styles, fonts, and scripts)

---

### Step 5: Test in Browser
Open your browser and navigate to:
```
http://localhost/nailglamhub/
```

- **Interactive Map & GPS locator**: Fully loaded with Metro Manila salons.
- **Client Booking**: Book appointments in real-time.
- **Salon Owner Portal**: Manage services, staff, store coordinates, and business hours.
- **Admin Hub**: Verify new studios, post announcements, and view platform metrics.

---

## 🔑 Default Login Accounts in `database.sql`

The imported local seed accounts use `Demo123!` as the initial password. Change these credentials after local verification.

| Role | Email | Password / Access |
| :--- | :--- | :--- |
| **System Administrator** | `admin@nailglamhub.com` | Password: `Demo123!`; registration code: `ADMIN2025` |
| **Salon Owner** | `salon@nailglamhub.com` | Password: `Demo123!`; Luxe Glow Lounge owner |
| **Verified Customer** | `customer@nailglamhub.com` | Password: `Demo123!`; Sophia Rodriguez profile |
