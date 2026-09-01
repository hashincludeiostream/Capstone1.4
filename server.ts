import express from 'express';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { initialCategories } from './src/data/mockDb';
import { Appointment, Review, Salon, Service, Technician, User, Reel, Announcement } from './src/types';
import db, { testConnection } from './src/config/db.js';

// Load environment variables
const PORT = process.env.PORT || 3001;
const ADMIN_CODES = process.env.ADMIN_CODES ? process.env.ADMIN_CODES.split(',') : ['ADMIN2025', 'GLAM_ADMIN', 'ADMIN', 'SUPERADMIN'];

async function startServer() {
  // Test database connection
  await testConnection();

  const app = express();

  app.use(cors());
  app.use(express.json());

  // Rate limiting for login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', loginLimiter);

  // Password strength validation
  function validatePasswordStrength(password: string): { valid: boolean; message: string } {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long (e.g., MyPass123!)' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z)' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter (a-z)' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number (0-9)' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*())' };
    }
    return { valid: true, message: 'Password is strong.' };
  }

  // Email format validation
  function validateEmailFormat(email: string): { valid: boolean; message: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { valid: false, message: 'Email address is required.' };
    }
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address (e.g., user@example.com)' };
    }
    return { valid: true, message: 'Email format is valid.' };
  }

  // ----------------------------------------------------
  // API ROUTES
  // ----------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth: Sign In
  app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      // Validate email format
      const emailValidation = validateEmailFormat(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ error: emailValidation.message });
      }

      const [rows] = await db.execute(
        'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
        [email.trim()]
      );
      const user = (rows as any[])[0];
      
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email address. Please check your email or create a new account.' });
      }

      // Verify password using bcrypt with fallback for legacy plaintext passwords
      let passwordValid = false;
      if (user.password) {
        // Check if password is bcrypt hash (starts with $2b$ or $2a$)
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
          passwordValid = await bcrypt.compare(password, user.password);
        } else {
          // Legacy plaintext password - direct comparison
          passwordValid = password === user.password;
        }
      }

      if (!passwordValid) {
        return res.status(401).json({ error: 'Incorrect password. Please check your password and try again.' });
      }

      // Role-specific check if specified
      if (role && user.user_type !== role) {
        return res.status(403).json({
          error: `This account is registered as a ${user.user_type.replace('_', ' ')}. Please use the appropriate ${user.user_type.replace('_', ' ')} portal or change your selection.`,
          user_type: user.user_type,
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Server error during login' });
    }
  });

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    const {
      fullname,
      email,
      password,
      phone,
      user_type,
      salon_name,
      salon_address,
      salon_phone,
      salon_category_id,
      salon_description,
      admin_code,
    } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    // Validate email format
    const emailValidation = validateEmailFormat(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.message });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Admin security validation
    if (user_type === 'admin') {
      if (!admin_code || !ADMIN_CODES.includes(admin_code.trim().toUpperCase())) {
        return res.status(403).json({
          error: 'Invalid Administrator Security Authorization Code. Please enter the valid admin passphrase.',
        });
      }
    }

    try {
      // Check duplicate email
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
        [email.trim()]
      );
      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Set avatar based on user type (optional - can be removed if not desired)
      const avatar = null; // Set to null to avoid automatic profile image assignment

      // Insert new user
      const [result] = await db.execute(
        'INSERT INTO users (fullname, email, password, phone, user_type, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [fullname, email.trim(), hashedPassword, phone || '', user_type || 'customer', avatar, 'active']
      );
      const userId = (result as any).insertId;

      // Get the created user
      const [userRows] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      const newUser = (userRows as any[])[0];

      // If salon owner, auto-create their salon profile
      let createdSalon = null;
      if (newUser.user_type === 'salon_owner') {
        const catId = salon_category_id ? Number(salon_category_id) : 1;
        const categoryObj = initialCategories.find((c) => c.id === catId);

        const [salonResult] = await db.execute(
          `INSERT INTO salons (
            owner_id, salon_name, address, phone, email, description, logo,
            category_id, category_name, verification_status, is_active, avg_rating, review_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            salon_name?.trim() || `${fullname}'s Salon & Spa`,
            salon_address?.trim() || 'Metro Manila, Philippines',
            salon_phone || phone || '0917-000-0000',
            email.trim(),
            salon_description?.trim() || 'Premier beauty and bespoke salon studio providing top tier grooming and aesthetic styling.',
            'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=300&auto=format&fit=crop&q=80',
            catId,
            categoryObj ? categoryObj.category_name : 'Nail Services',
            'pending',
            1,
            5.0,
            0
          ]
        );
        const salonId = (salonResult as any).insertId;

        const [salonRows] = await db.execute(
          'SELECT * FROM salons WHERE id = ?',
          [salonId]
        );
        createdSalon = (salonRows as any[])[0];
      }

      return res.status(201).json({ success: true, user: newUser, salon: createdSalon });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: 'Server error during registration' });
    }
  });

  // Users List (Admin)
  app.get('/api/users', async (req, res) => {
    try {
      const [rows] = await db.execute(
        'SELECT id, fullname, email, phone, user_type, avatar, status, created_at FROM users ORDER BY id ASC'
      );
      res.json(rows);
    } catch (error) {
      console.error('Users list error:', error);
      res.status(500).json({ error: 'Server error fetching users' });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM business_categories ORDER BY id ASC');
      res.json(rows);
    } catch (error) {
      console.error('Categories error:', error);
      res.status(500).json({ error: 'Server error fetching categories' });
    }
  });

  // Salons List & Search
  app.get('/api/salons', async (req, res) => {
    const { category, search, owner_id } = req.query;
    try {
      let query = 'SELECT * FROM salons WHERE is_active = 1';
      const params: any[] = [];

      if (owner_id) {
        query += ' AND owner_id = ?';
        params.push(Number(owner_id));
      }
      if (category) {
        query += ' AND category_id = ?';
        params.push(Number(category));
      }
      if (search) {
        query += ' AND (salon_name LIKE ? OR description LIKE ? OR address LIKE ?)';
        const searchTerm = `%${String(search)}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY featured DESC, avg_rating DESC';
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Salons list error:', error);
      res.status(500).json({ error: 'Server error fetching salons' });
    }
  });

  // Salon Details
  app.get('/api/salons/:id', async (req, res) => {
    const salonId = Number(req.params.id);
    try {
      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [salonId]);
      const salon = (salonRows as any[])[0];
      
      if (!salon) return res.status(404).json({ error: 'Salon not found' });

      const [serviceRows] = await db.execute(
        'SELECT * FROM services WHERE salon_id = ?',
        [salonId]
      );
      const [technicianRows] = await db.execute(
        'SELECT * FROM technicians WHERE salon_id = ?',
        [salonId]
      );
      const [reviewRows] = await db.execute(
        'SELECT * FROM reviews WHERE salon_id = ?',
        [salonId]
      );
      // Map database field names to frontend expected names
      const mappedReviews = (reviewRows as any[]).map((r: any) => ({
        ...r,
        customer_id: r.user_id,
        customer_name: r.user_name,
        review_text: r.comment
      }));
      const [hoursRows] = await db.execute(
        'SELECT * FROM working_hours WHERE salon_id = ?',
        [salonId]
      );

      res.json({
        salon,
        services: serviceRows,
        technicians: technicianRows,
        reviews: mappedReviews,
        working_hours: hoursRows,
      });
    } catch (error) {
      console.error('Salon details error:', error);
      res.status(500).json({ error: 'Server error fetching salon details' });
    }
  });

  // Register New Salon
  app.post('/api/salons', async (req, res) => {
    const { owner_id, salon_name, address, phone, email, description, logo, category_id } = req.body;
    if (!salon_name || !address) {
      return res.status(400).json({ error: 'Salon name and address are required' });
    }

    try {
      const categoryObj = initialCategories.find((c) => c.id === Number(category_id));

      const [result] = await db.execute(
        `INSERT INTO salons (
          owner_id, salon_name, address, phone, email, description, logo,
          category_id, category_name, verification_status, is_active, avg_rating, review_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          owner_id || 2,
          salon_name,
          address,
          phone || '',
          email || '',
          description || '',
          logo || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&auto=format&fit=crop&q=80',
          category_id ? Number(category_id) : 1,
          categoryObj ? categoryObj.category_name : 'Nail Services',
          'pending',
          1,
          5.0,
          0
        ]
      );
      const salonId = (result as any).insertId;

      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [salonId]);
      const newSalon = (salonRows as any[])[0];
      
      res.status(201).json(newSalon);
    } catch (error) {
      console.error('Create salon error:', error);
      res.status(500).json({ error: 'Server error creating salon' });
    }
  });

  // Update Salon
  app.put('/api/salons/:id', async (req, res) => {
    const salonId = Number(req.params.id);
    try {
      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [salonId]);
      if ((salonRows as any[]).length === 0) return res.status(404).json({ error: 'Salon not found' });

      // Whitelist of allowed fields to prevent SQL injection
      const allowedFields = [
        'salon_name', 'address', 'city', 'province', 'postal_code', 'landmark',
        'parking_info', 'phone', 'email', 'description', 'logo', 'banner',
        'latitude', 'longitude', 'maps_place_id', 'maps_embed_url'
      ];
      
      const updateFields = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined && key !== 'id' && allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length > 0) {
        await db.execute(
          `UPDATE salons SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, salonId]
        );
      }

      const [updatedRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [salonId]);
      res.json((updatedRows as any[])[0]);
    } catch (error) {
      console.error('Update salon error:', error);
      res.status(500).json({ error: 'Server error updating salon' });
    }
  });

  // Services List
  app.get('/api/services', async (req, res) => {
    const { salon_id } = req.query;
    try {
      if (salon_id) {
        const [rows] = await db.execute('SELECT * FROM services WHERE salon_id = ?', [Number(salon_id)]);
        return res.json(rows);
      }
      const [rows] = await db.execute('SELECT * FROM services');
      res.json(rows);
    } catch (error) {
      console.error('Services list error:', error);
      res.status(500).json({ error: 'Server error fetching services' });
    }
  });

  // Add Service
  app.post('/api/services', async (req, res) => {
    const { salon_id, service_name, description, price, duration_minutes, category_name, image } = req.body;
    if (!service_name || !price) {
      return res.status(400).json({ error: 'Service name and price are required' });
    }

    try {
      const [result] = await db.execute(
        `INSERT INTO services (salon_id, service_name, description, price, duration_minutes, category_name, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(salon_id) || 1,
          service_name,
          description || '',
          Number(price),
          Number(duration_minutes) || 45,
          category_name || 'Nail Services',
          image || 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&auto=format&fit=crop&q=80'
        ]
      );
      const serviceId = (result as any).insertId;

      const [serviceRows] = await db.execute('SELECT * FROM services WHERE id = ?', [serviceId]);
      const newService = (serviceRows as any[])[0];
      
      res.status(201).json(newService);
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ error: 'Server error creating service' });
    }
  });

  // Update Service
  app.put('/api/services/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      const [serviceRows] = await db.execute('SELECT * FROM services WHERE id = ?', [id]);
      if ((serviceRows as any[]).length === 0) return res.status(404).json({ error: 'Service not found' });

      // Whitelist of allowed fields to prevent SQL injection
      const allowedFields = [
        'service_name', 'description', 'price', 'duration_minutes',
        'category_name', 'image', 'is_active'
      ];
      
      const updateFields = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined && key !== 'id' && allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length > 0) {
        await db.execute(
          `UPDATE services SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, id]
        );
      }

      const [updatedRows] = await db.execute('SELECT * FROM services WHERE id = ?', [id]);
      res.json((updatedRows as any[])[0]);
    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({ error: 'Server error updating service' });
    }
  });

  // Delete / Toggle Service
  app.delete('/api/services/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await db.execute('DELETE FROM services WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete service error:', error);
      res.status(500).json({ error: 'Server error deleting service' });
    }
  });

  // Technicians List
  app.get('/api/technicians', async (req, res) => {
    const { salon_id } = req.query;
    try {
      if (salon_id) {
        const [rows] = await db.execute('SELECT * FROM technicians WHERE salon_id = ?', [Number(salon_id)]);
        return res.json(rows);
      }
      const [rows] = await db.execute('SELECT * FROM technicians');
      res.json(rows);
    } catch (error) {
      console.error('Technicians list error:', error);
      res.status(500).json({ error: 'Server error fetching technicians' });
    }
  });

  // Add Technician
  app.post('/api/technicians', async (req, res) => {
    const { salon_id, fullname, specialties, rating, is_available, avatar, experience_years } = req.body;
    try {
      const [result] = await db.execute(
        `INSERT INTO technicians (salon_id, fullname, specialties, rating, is_available, avatar, experience_years)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(salon_id) || 1,
          fullname || 'New Technician',
          specialties || 'Nail Artist',
          Number(rating) || 4.90,
          is_available !== undefined ? is_available : 1,
          avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          Number(experience_years) || 2
        ]
      );
      const techId = (result as any).insertId;

      const [techRows] = await db.execute('SELECT * FROM technicians WHERE id = ?', [techId]);
      const newTech = (techRows as any[])[0];
      
      res.status(201).json(newTech);
    } catch (error) {
      console.error('Create technician error:', error);
      res.status(500).json({ error: 'Server error creating technician' });
    }
  });

  // Appointments List
  app.get('/api/appointments', async (req, res) => {
    const { customer_id, salon_id } = req.query;
    try {
      let query = 'SELECT * FROM appointments';
      const params: any[] = [];
      const conditions = [];

      if (customer_id) {
        conditions.push('customer_id = ?');
        params.push(Number(customer_id));
      }
      if (salon_id) {
        conditions.push('salon_id = ?');
        params.push(Number(salon_id));
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Appointments list error:', error);
      res.status(500).json({ error: 'Server error fetching appointments' });
    }
  });

  // Book Appointment
  app.post('/api/appointments', async (req, res) => {
    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      salon_id,
      service_id,
      technician_id,
      appointment_date,
      appointment_time,
      notes,
    } = req.body;

    try {
      // Get salon and service details
      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [Number(salon_id)]);
      const salon = (salonRows as any[])[0];
      
      const [serviceRows] = await db.execute('SELECT * FROM services WHERE id = ?', [Number(service_id)]);
      const service = (serviceRows as any[])[0];
      
      let technician = null;
      if (technician_id) {
        const [techRows] = await db.execute('SELECT * FROM technicians WHERE id = ?', [Number(technician_id)]);
        technician = (techRows as any[])[0];
      }

      const [result] = await db.execute(
        `INSERT INTO appointments (
          customer_id, customer_name, customer_phone, customer_email,
          salon_id, salon_name, service_id, service_name, total_price,
          technician_id, technician_name, appointment_date, appointment_time, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(customer_id) || 3,
          customer_name || 'Guest Client',
          customer_phone || '',
          customer_email || '',
          Number(salon_id),
          salon ? salon.salon_name : 'Nail Salon',
          Number(service_id),
          service ? service.service_name : 'Nail Service',
          service ? service.price : 0,
          technician_id ? Number(technician_id) : null,
          technician ? technician.fullname : 'Any Available Specialist',
          appointment_date,
          appointment_time,
          'pending',
          notes || ''
        ]
      );
      const appointmentId = (result as any).insertId;

      const [apptRows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
      const newAppt = (apptRows as any[])[0];
      
      res.status(201).json({ success: true, appointment: newAppt });
    } catch (error) {
      console.error('Book appointment error:', error);
      res.status(500).json({ error: 'Server error booking appointment' });
    }
  });

  // Update Appointment Status
  app.patch('/api/appointments/:id/status', async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    try {
      const [apptRows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [id]);
      if ((apptRows as any[]).length === 0) return res.status(404).json({ error: 'Appointment not found' });

      await db.execute('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
      const [updatedRows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [id]);
      res.json({ success: true, appointment: (updatedRows as any[])[0] });
    } catch (error) {
      console.error('Update appointment status error:', error);
      res.status(500).json({ error: 'Server error updating appointment status' });
    }
  });

  // Reviews List
  app.get('/api/reviews', async (req, res) => {
    const { salon_id } = req.query;
    try {
      if (salon_id) {
        const [rows] = await db.execute('SELECT * FROM reviews WHERE salon_id = ?', [Number(salon_id)]);
        // Map database field names to frontend expected names
        const mappedRows = (rows as any[]).map((r: any) => ({
          ...r,
          customer_id: r.user_id,
          customer_name: r.user_name,
          review_text: r.comment
        }));
        return res.json(mappedRows);
      }
      const [rows] = await db.execute('SELECT * FROM reviews');
      // Map database field names to frontend expected names
      const mappedRows = (rows as any[]).map((r: any) => ({
        ...r,
        customer_id: r.user_id,
        customer_name: r.user_name,
        review_text: r.comment
      }));
      res.json(mappedRows);
    } catch (error) {
      console.error('Reviews list error:', error);
      res.status(500).json({ error: 'Server error fetching reviews' });
    }
  });

  // Leave Review
  app.post('/api/reviews', async (req, res) => {
    const { user_id, user_name, salon_id, rating, comment, service_name } = req.body;
    try {
      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [Number(salon_id)]);
      const salon = (salonRows as any[])[0];

      const [result] = await db.execute(
        `INSERT INTO reviews (salon_id, user_id, user_name, rating, comment, service_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          Number(salon_id),
          Number(user_id) || 3,
          user_name || 'Verified Client',
          Number(rating) || 5,
          comment || '',
          service_name || 'Nail Service'
        ]
      );
      const reviewId = (result as any).insertId;

      // Update salon average rating
      if (salon) {
        const [allReviews] = await db.execute('SELECT * FROM reviews WHERE salon_id = ?', [Number(salon_id)]);
        const reviews = allReviews as any[];
        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = Number((total / reviews.length).toFixed(2));
        
        await db.execute(
          'UPDATE salons SET avg_rating = ?, review_count = ? WHERE id = ?',
          [avgRating, reviews.length, Number(salon_id)]
        );
      }

      const [reviewRows] = await db.execute('SELECT * FROM reviews WHERE id = ?', [reviewId]);
      const newReview = (reviewRows as any[])[0];
      
      res.status(201).json(newReview);
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ error: 'Server error creating review' });
    }
  });

  // Reels
  app.get('/api/reels', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM reels ORDER BY created_at DESC');
      res.json(rows);
    } catch (error) {
      console.error('Reels list error:', error);
      res.status(500).json({ error: 'Server error fetching reels' });
    }
  });

  // Reel Engagement: Like
  app.post('/api/reels/:id/like', async (req, res) => {
    const reelId = Number(req.params.id);
    try {
      const [reelRows] = await db.execute('SELECT * FROM reels WHERE id = ?', [reelId]);
      if ((reelRows as any[]).length === 0) return res.status(404).json({ error: 'Reel not found' });

      const reel = (reelRows as any[])[0];
      const newLikes = reel.likes + 1;
      
      await db.execute('UPDATE reels SET likes = ? WHERE id = ?', [newLikes, reelId]);
      res.json({ success: true, likes: newLikes, is_liked: true });
    } catch (error) {
      console.error('Like reel error:', error);
      res.status(500).json({ error: 'Server error liking reel' });
    }
  });

  // Reel Engagement: Save
  app.post('/api/reels/:id/save', async (req, res) => {
    const reelId = Number(req.params.id);
    try {
      const [reelRows] = await db.execute('SELECT * FROM reels WHERE id = ?', [reelId]);
      if ((reelRows as any[]).length === 0) return res.status(404).json({ error: 'Reel not found' });

      const reel = (reelRows as any[])[0];
      // Note: Database schema doesn't have saves_count, so we'll just return success
      res.json({ success: true, saves_count: 0, is_saved: true });
    } catch (error) {
      console.error('Save reel error:', error);
      res.status(500).json({ error: 'Server error saving reel' });
    }
  });

  // Reel Comment
  app.post('/api/reels/:id/comment', async (req, res) => {
    const reelId = Number(req.params.id);
    const { user_name, comment } = req.body;
    try {
      const [reelRows] = await db.execute('SELECT * FROM reels WHERE id = ?', [reelId]);
      if ((reelRows as any[]).length === 0) return res.status(404).json({ error: 'Reel not found' });

      // Note: Database schema doesn't have comments table, so we'll just return a mock response
      const newComment = {
        id: 1,
        reel_id: reelId,
        user_id: 3,
        user_name: user_name || 'You',
        comment: comment || '',
        created_at: 'Just now',
      };

      res.status(201).json(newComment);
    } catch (error) {
      console.error('Comment on reel error:', error);
      res.status(500).json({ error: 'Server error commenting on reel' });
    }
  });

  // Promotions
  app.get('/api/promotions', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM promotions ORDER BY created_at DESC');
      res.json(rows);
    } catch (error) {
      console.error('Promotions list error:', error);
      res.status(500).json({ error: 'Server error fetching promotions' });
    }
  });

  // Announcements (Site-wide Banners & Broadcasts)
  app.get('/api/announcements', async (req, res) => {
    const { audience } = req.query;
    try {
      let query = 'SELECT * FROM announcements';
      const params: any[] = [];

      if (audience && audience !== 'all') {
        query += ' WHERE target_audience = ? OR target_audience = ?';
        params.push(audience, 'all');
      }

      query += ' ORDER BY created_at DESC';
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Announcements list error:', error);
      res.status(500).json({ error: 'Server error fetching announcements' });
    }
  });

  app.post('/api/announcements', async (req, res) => {
    const { title, message, type, is_active, target_audience, link_url, link_text } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    try {
      const [result] = await db.execute(
        `INSERT INTO announcements (title, message, priority, target_audience, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [
          title.trim(),
          message.trim(),
          type || 'normal',
          target_audience || 'all',
          'Administrator'
        ]
      );
      const announcementId = (result as any).insertId;

      const [announcementRows] = await db.execute('SELECT * FROM announcements WHERE id = ?', [announcementId]);
      const newAnnouncement = (announcementRows as any[])[0];
      
      res.status(201).json(newAnnouncement);
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ error: 'Server error creating announcement' });
    }
  });

  app.put('/api/announcements/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      const [announcementRows] = await db.execute('SELECT * FROM announcements WHERE id = ?', [id]);
      if ((announcementRows as any[]).length === 0) return res.status(404).json({ error: 'Announcement not found' });

      // Whitelist of allowed fields to prevent SQL injection
      const allowedFields = [
        'title', 'message', 'priority', 'target_audience', 'is_active',
        'link_url', 'link_text'
      ];
      
      const updateFields = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined && key !== 'id' && allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length > 0) {
        await db.execute(
          `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, id]
        );
      }

      const [updatedRows] = await db.execute('SELECT * FROM announcements WHERE id = ?', [id]);
      res.json((updatedRows as any[])[0]);
    } catch (error) {
      console.error('Update announcement error:', error);
      res.status(500).json({ error: 'Server error updating announcement' });
    }
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await db.execute('DELETE FROM announcements WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({ error: 'Server error deleting announcement' });
    }
  });

  // Admin Salon Approvals & Verification
  app.patch('/api/salons/:id/verification', async (req, res) => {
    const id = Number(req.params.id);
    const { verification_status } = req.body;
    try {
      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [id]);
      if ((salonRows as any[]).length === 0) return res.status(404).json({ error: 'Salon not found' });

      await db.execute('UPDATE salons SET verification_status = ? WHERE id = ?', [verification_status, id]);
      const [updatedRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [id]);
      res.json({ success: true, salon: (updatedRows as any[])[0] });
    } catch (error) {
      console.error('Verification update error:', error);
      res.status(500).json({ error: 'Server error updating verification status' });
    }
  });

  // Admin Salon Active / Featured Toggle
  app.patch('/api/salons/:id/toggle-active', async (req, res) => {
    const id = Number(req.params.id);
    try {
      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [id]);
      if ((salonRows as any[]).length === 0) return res.status(404).json({ error: 'Salon not found' });

      const salon = (salonRows as any[])[0];
      const newStatus = !salon.is_active;
      await db.execute('UPDATE salons SET is_active = ? WHERE id = ?', [newStatus, id]);
      res.json({ success: true, is_active: newStatus, salon: { ...salon, is_active: newStatus } });
    } catch (error) {
      console.error('Toggle active error:', error);
      res.status(500).json({ error: 'Server error toggling active status' });
    }
  });

  app.patch('/api/salons/:id/toggle-featured', async (req, res) => {
    const id = Number(req.params.id);
    try {
      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [id]);
      if ((salonRows as any[]).length === 0) return res.status(404).json({ error: 'Salon not found' });

      const salon = (salonRows as any[])[0];
      const newFeatured = !salon.featured;
      await db.execute('UPDATE salons SET featured = ? WHERE id = ?', [newFeatured, id]);
      res.json({ success: true, featured: newFeatured, salon: { ...salon, featured: newFeatured } });
    } catch (error) {
      console.error('Toggle featured error:', error);
      res.status(500).json({ error: 'Server error toggling featured status' });
    }
  });

  app.delete('/api/salons/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await db.execute('DELETE FROM salons WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete salon error:', error);
      res.status(500).json({ error: 'Server error deleting salon' });
    }
  });

  // Admin User Account Moderation
  app.patch('/api/users/:id/status', async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    try {
      const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      if ((userRows as any[]).length === 0) return res.status(404).json({ error: 'User not found' });

      await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
      const [updatedRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      res.json({ success: true, user: (updatedRows as any[])[0] });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Server error updating user status' });
    }
  });

  app.patch('/api/users/:id/role', async (req, res) => {
    const id = Number(req.params.id);
    const { user_type } = req.body;
    try {
      const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      if ((userRows as any[]).length === 0) return res.status(404).json({ error: 'User not found' });

      await db.execute('UPDATE users SET user_type = ? WHERE id = ?', [user_type, id]);
      const [updatedRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      res.json({ success: true, user: (updatedRows as any[])[0] });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Server error updating user role' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Server error deleting user' });
    }
  });

  // Admin Content Moderation (Reels & Reviews)
  app.delete('/api/reels/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await db.execute('DELETE FROM reels WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete reel error:', error);
      res.status(500).json({ error: 'Server error deleting reel' });
    }
  });

  app.delete('/api/reviews/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await db.execute('DELETE FROM reviews WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({ error: 'Server error deleting review' });
    }
  });

  // System Stats (Comprehensive Platform KPIs)
  app.get('/api/stats', async (req, res) => {
    try {
      const [usersRows] = await db.execute('SELECT * FROM users');
      const [salonsRows] = await db.execute('SELECT * FROM salons');
      const [appointmentsRows] = await db.execute('SELECT * FROM appointments');
      const [reviewsRows] = await db.execute('SELECT * FROM reviews');
      const [reelsRows] = await db.execute('SELECT * FROM reels');
      const [announcementsRows] = await db.execute('SELECT * FROM announcements');

      const users = usersRows as any[];
      const salons = salonsRows as any[];
      const appointments = appointmentsRows as any[];
      const reviews = reviewsRows as any[];
      const reels = reelsRows as any[];
      const announcements = announcementsRows as any[];

      const totalGmv = appointments.reduce((sum, a) => sum + (a.total_price || 850), 0);
      const pendingVerifications = salons.filter((s) => s.verification_status === 'pending').length;

      res.json({
        total_customers: users.filter((u) => u.user_type === 'customer').length,
        total_salon_owners: users.filter((u) => u.user_type === 'salon_owner').length,
        total_admins: users.filter((u) => u.user_type === 'admin').length,
        total_salons: salons.length,
        verified_salons: salons.filter((s) => s.verification_status === 'verified').length,
        pending_salons: pendingVerifications,
        total_appointments: appointments.length,
        pending_appointments: appointments.filter((a) => a.status === 'pending').length,
        confirmed_appointments: appointments.filter((a) => a.status === 'confirmed').length,
        completed_appointments: appointments.filter((a) => a.status === 'completed').length,
        total_reviews: reviews.length,
        total_reels: reels.length,
        total_announcements: announcements.length,
        active_announcements: announcements.length,
        estimated_gmv: totalGmv,
        platform_commission: Math.round(totalGmv * 0.1), // 10% platform take
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Server error fetching stats' });
    }
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE (Development) or STATIC (Production)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Nail Glam Hub server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
