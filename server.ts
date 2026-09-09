import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { Appointment, Review, Salon, Service, Technician, User, Reel, Announcement } from './src/types';
import db, { testConnection, healthCheck } from './src/config/db.js';
import { sanitizeString, sanitizeEmail, sanitizeNumber, sanitizeBoolean } from './src/lib/sanitization.js';

// Load environment variables
const PORT = process.env.PORT || 3001;
const ADMIN_CODES = process.env.ADMIN_CODES ? process.env.ADMIN_CODES.split(',') : ['ADMIN2025', 'GLAM_ADMIN', 'ADMIN', 'SUPERADMIN'];
let registrationRateLimitEnabled = !['false', '0', 'off'].includes(
  (process.env.ENABLE_REGISTRATION_RATE_LIMIT || 'true').trim().toLowerCase()
);

// Date validation utility
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date instanceof Date;
}

function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

async function getCategoryName(categoryId: number): Promise<string> {
  const [rows] = await db.execute(
    'SELECT category_name FROM business_categories WHERE id = ?',
    [categoryId]
  );
  return (rows as any[])[0]?.category_name || 'Nail Services';
}

async function startServer() {
  // Test database connection
  await testConnection();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '4mb' }));

  // Rate limiting for login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', (req, res, next) => {
    if (req.body?.role === 'admin') {
      return loginLimiter(req, res, next);
    }
    next();
  });

  // Rate limiting for registration attempts
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    message: 'Too many registration attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/register', (req, res, next) => {
    if (registrationRateLimitEnabled) {
      return registerLimiter(req, res, next);
    }
    next();
  });

  // General API rate limiting (for all other endpoints)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per 15 minutes
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', (req, res, next) => {
    if (
      req.path === '/auth/login' ||
      req.path === '/auth/register' ||
      req.path === '/settings/registration-rate-limit'
    ) {
      return next();
    }
    apiLimiter(req, res, next);
  });

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
  
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const dbHealth = await healthCheck();
      res.json({ 
        status: 'ok', 
        time: new Date().toISOString(),
        database: dbHealth 
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        time: new Date().toISOString(),
        error: 'Health check failed' 
      });
    }
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
      return res.status(500).json({ 
        error: 'Server error during login',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      admin_code,
    } = req.body;

    try {
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

      // Check duplicate email with sanitized email
      const sanitizedEmail = sanitizeEmail(email);
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
        [sanitizedEmail]
      );
      if ((existing as any[]).length > 0) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Set avatar based on user type (optional - can be removed if not desired)
      const avatar = null; // Set to null to avoid automatic profile image assignment

      // Insert new user with sanitized data
      const [result] = await db.execute(
        'INSERT INTO users (fullname, email, password, phone, user_type, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [sanitizeString(fullname), sanitizedEmail, hashedPassword, sanitizeString(phone || ''), user_type || 'customer', avatar, 'active']
      );
      const userId = (result as any).insertId;

      // Get the created user
      const [userRows] = await db.execute(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      const newUser = (userRows as any[])[0];

      return res.status(201).json({ success: true, user: newUser, salon: null });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ 
        error: 'Server error during registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      res.status(500).json({ 
        error: 'Server error fetching users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update User Profile
  app.put('/api/users/:id', async (req, res) => {
    const userId = Number(req.params.id);
    const { fullname, email, phone, avatar } = req.body;
    if (!fullname || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    try {
      const emailValidation = validateEmailFormat(email);
      if (!emailValidation.valid) return res.status(400).json({ error: emailValidation.message });

      const [existingRows] = await db.execute(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id <> ?',
        [sanitizeEmail(email), userId]
      );
      if ((existingRows as any[]).length > 0) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      await db.execute(
        'UPDATE users SET fullname = ?, email = ?, phone = ?, avatar = ? WHERE id = ?',
        [sanitizeString(fullname), sanitizeEmail(email), sanitizeString(phone || ''), avatar || null, userId]
      );
      const [updatedRows] = await db.execute(
        'SELECT id, fullname, email, phone, user_type, avatar, status, created_at FROM users WHERE id = ?',
        [userId]
      );
      const updatedUser = (updatedRows as any[])[0];
      if (!updatedUser) return res.status(404).json({ error: 'User not found' });
      res.json(updatedUser);
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({ error: 'Server error updating user profile' });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM business_categories ORDER BY id ASC');
      res.json(rows);
    } catch (error) {
      console.error('Categories error:', error);
      res.status(500).json({ 
        error: 'Server error fetching categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Salons List & Search
  app.get('/api/salons', async (req, res) => {
    const { category, search, owner_id, include_unpublished } = req.query;
    try {
      const canViewUnpublished = include_unpublished === 'true';
      let query = canViewUnpublished
        ? 'SELECT * FROM salons WHERE 1=1'
        : "SELECT * FROM salons WHERE is_active = 1 AND verification_status = 'verified'";
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
      
      // Ensure data is properly formatted
      const salons = (rows as any[]).map((salon: any) => ({
        ...salon,
        category_id: Number(salon.category_id),
        owner_id: Number(salon.owner_id),
        avg_rating: Number(salon.avg_rating) || 0,
        review_count: Number(salon.review_count) || 0,
        is_active: Boolean(salon.is_active),
      }));

      res.json(salons);
    } catch (error) {
      console.error('Salons list error:', error);
      res.status(500).json({ 
        error: 'Server error fetching salons',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

      // Validate foreign key relationships
      const services = (serviceRows as any[]).map((s: any) => ({
        ...s,
        salon_id: Number(s.salon_id),
        price: Number(s.price) || 0,
        duration: Number(s.duration) || 30,
      }));

      const technicians = (technicianRows as any[]).map((t: any) => ({
        ...t,
        salon_id: Number(t.salon_id),
      }));

      // Ensure all related data belongs to the correct salon
      const validServices = services.filter(s => s.salon_id === salonId);
      const validTechnicians = technicians.filter(t => t.salon_id === salonId);
      const validReviews = mappedReviews.filter(r => r.salon_id === salonId);
      const validHours = hoursRows.filter((h: any) => h.salon_id === salonId);

      res.json({
        salon: {
          ...salon,
          category_id: Number(salon.category_id),
          owner_id: Number(salon.owner_id),
          avg_rating: Number(salon.avg_rating) || 0,
          review_count: Number(salon.review_count) || 0,
          is_active: Boolean(salon.is_active),
        },
        services: validServices,
        technicians: validTechnicians,
        reviews: validReviews,
        working_hours: validHours,
      });
    } catch (error) {
      console.error('Salon details error:', error);
      res.status(500).json({ 
        error: 'Server error fetching salon details',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/working-hours', async (req, res) => {
    const salonId = Number(req.query.salon_id);
    if (!salonId) return res.status(400).json({ error: 'Salon ID is required' });
    try {
      const [rows] = await db.execute(
        'SELECT * FROM working_hours WHERE salon_id = ? ORDER BY id ASC',
        [salonId]
      );
      res.json(rows);
    } catch (error) {
      console.error('Working hours list error:', error);
      res.status(500).json({ error: 'Server error fetching working hours' });
    }
  });

  app.put('/api/working-hours', async (req, res) => {
    const salonId = Number(req.body.salon_id);
    const hours = Array.isArray(req.body.hours) ? req.body.hours : [];
    if (!salonId) return res.status(400).json({ error: 'Salon ID is required' });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('DELETE FROM working_hours WHERE salon_id = ?', [salonId]);
      for (const hour of hours) {
        await connection.execute(
          `INSERT INTO working_hours (salon_id, day_of_week, opening_time, closing_time, is_closed)
           VALUES (?, ?, ?, ?, ?)`,
          [
            salonId,
            String(hour.day_of_week || ''),
            hour.opening_time || '09:00',
            hour.closing_time || '19:00',
            hour.is_closed ? 1 : 0,
          ]
        );
      }
      await connection.commit();
      const [rows] = await connection.execute(
        'SELECT * FROM working_hours WHERE salon_id = ? ORDER BY id ASC',
        [salonId]
      );
      res.json({ success: true, working_hours: rows });
    } catch (error) {
      await connection.rollback();
      console.error('Working hours update error:', error);
      res.status(500).json({ error: 'Server error updating working hours' });
    } finally {
      connection.release();
    }
  });

  // Register New Salon
  app.post('/api/salons', async (req, res) => {
    const { owner_id, salon_name, address, phone, email, description, logo, category_id } = req.body;
    if (!salon_name || !address) {
      return res.status(400).json({ error: 'Salon name and address are required' });
    }

    try {
      if (!owner_id) {
        return res.status(400).json({ error: 'An owner account is required' });
      }
      const [ownerRows] = await db.execute(
        "SELECT id, user_type, status FROM users WHERE id = ? AND user_type = 'salon_owner' AND status = 'active'",
        [Number(owner_id)]
      );
      if ((ownerRows as any[]).length === 0) {
        return res.status(403).json({ error: 'Only an active salon owner can register a branch' });
      }

      const categoryId = category_id ? Number(category_id) : 1;
      const categoryName = await getCategoryName(categoryId);

      const [result] = await db.execute(
        `INSERT INTO salons (
          owner_id, salon_name, address, phone, email, description, logo,
          category_id, category_name, verification_status, is_active, avg_rating, review_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(owner_id),
          salon_name,
          address,
          phone || '',
          email || '',
          description || '',
          logo || null,
          categoryId,
          categoryName,
          'pending',
          1,
          0.0,
          0
        ]
      );
      const salonId = (result as any).insertId;

      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [salonId]);
      const newSalon = (salonRows as any[])[0];
      
      if (newSalon) {
        // Format the response data
        const formattedSalon = {
          ...newSalon,
          category_id: Number(newSalon.category_id),
          owner_id: Number(newSalon.owner_id),
          avg_rating: Number(newSalon.avg_rating) || 0,
          review_count: Number(newSalon.review_count) || 0,
          is_active: Boolean(newSalon.is_active),
        };
        res.status(201).json({ success: true, salon: formattedSalon });
      } else {
        res.status(500).json({ error: 'Failed to create salon' });
      }
    } catch (error) {
      console.error('Create salon error:', error);
      res.status(500).json({ 
        error: 'Server error creating salon',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      const updatedSalon = (updatedRows as any[])[0];
      
      // Format the response data
      const formattedSalon = {
        ...updatedSalon,
        category_id: Number(updatedSalon.category_id),
        owner_id: Number(updatedSalon.owner_id),
        avg_rating: Number(updatedSalon.avg_rating) || 0,
        review_count: Number(updatedSalon.review_count) || 0,
        is_active: Boolean(updatedSalon.is_active),
      };
      
      res.json(formattedSalon);
    } catch (error) {
      console.error('Update salon error:', error);
      res.status(500).json({ 
        error: 'Server error updating salon',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Services List
  app.get('/api/services', async (req, res) => {
    const { salon_id } = req.query;
    try {
      if (salon_id) {
        const [rows] = await db.execute('SELECT * FROM services WHERE salon_id = ?', [Number(salon_id)]);
        return res.json((rows as any[]).map((service) => ({
          ...service,
          salon_id: Number(service.salon_id),
          category: service.category_name,
          duration: Number(service.duration_minutes),
          price: Number(service.price),
          is_active: Boolean(service.is_active),
        })));
      }
      const [rows] = await db.execute('SELECT * FROM services');
      res.json((rows as any[]).map((service) => ({
        ...service,
        salon_id: Number(service.salon_id),
        category: service.category_name,
        duration: Number(service.duration_minutes),
        price: Number(service.price),
        is_active: Boolean(service.is_active),
      })));
    } catch (error) {
      console.error('Services list error:', error);
      res.status(500).json({ error: 'Server error fetching services' });
    }
  });

  // Add Service
  app.post('/api/services', async (req, res) => {
    const { salon_id, service_name, description, duration_minutes, category_name, image } = req.body;
    if (!service_name) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    try {
      const [result] = await db.execute(
        `INSERT INTO services (salon_id, service_name, description, price, duration_minutes, category_name, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(salon_id) || 1,
          service_name,
          description || '',
          0,
          Number(duration_minutes) || 45,
          category_name || 'Nail Services',
          image || null
        ]
      );
      const serviceId = (result as any).insertId;

      const [serviceRows] = await db.execute('SELECT * FROM services WHERE id = ?', [serviceId]);
      const newService = (serviceRows as any[])[0];
      
      if (newService) {
        // Format the response data
        const formattedService = {
          ...newService,
          salon_id: Number(newService.salon_id),
          price: Number(newService.price) || 0,
          duration_minutes: Number(newService.duration_minutes) || 45,
          is_active: Boolean(newService.is_active),
        };
        res.status(201).json(formattedService);
      } else {
        res.status(500).json({ error: 'Failed to create service' });
      }
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ 
        error: 'Server error creating service',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
          // Add server-side validation
          if (key === 'price') {
            const sanitizedPrice = sanitizeNumber(value, 0);
            if (sanitizedPrice < 0) {
              return res.status(400).json({ error: 'Price must be a positive number' });
            }
            updateFields.push(`${key} = ?`);
            updateValues.push(sanitizedPrice);
          } else if (key === 'duration_minutes') {
            const sanitizedDuration = sanitizeNumber(value, 45);
            if (sanitizedDuration < 5 || sanitizedDuration > 480) {
              return res.status(400).json({ error: 'Duration must be between 5 and 480 minutes' });
            }
            updateFields.push(`${key} = ?`);
            updateValues.push(sanitizedDuration);
          } else if (key === 'service_name' || key === 'description' || key === 'category_name') {
            updateFields.push(`${key} = ?`);
            updateValues.push(sanitizeString(value));
          } else if (key === 'is_active') {
            updateFields.push(`${key} = ?`);
            updateValues.push(sanitizeBoolean(value, true) ? 1 : 0);
          } else {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
          }
        }
      }

      if (updateFields.length > 0) {
        await db.execute(
          `UPDATE services SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, id]
        );
      }

      const [updatedRows] = await db.execute('SELECT * FROM services WHERE id = ?', [id]);
      const updatedService = (updatedRows as any[])[0];
      
      // Format the response data
      const formattedService = {
        ...updatedService,
        salon_id: Number(updatedService.salon_id),
        price: Number(updatedService.price) || 0,
        duration_minutes: Number(updatedService.duration_minutes) || 45,
        is_active: Boolean(updatedService.is_active),
      };
      
      res.json(formattedService);
    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({ 
        error: 'Server error updating service',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete / Toggle Service
  app.delete('/api/services/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      // Check if service has any appointments
      const [apptCheck] = await db.execute(
        'SELECT COUNT(*) as count FROM appointments WHERE service_id = ?',
        [id]
      );
      const appointmentCount = (apptCheck as any[])[0].count;
      
      if (appointmentCount > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete service with existing appointments',
          details: 'Please cancel all appointments for this service first'
        });
      }

      await db.execute('DELETE FROM services WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete service error:', error);
      res.status(500).json({ 
        error: 'Server error deleting service',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Technicians List
  app.get('/api/technicians', async (req, res) => {
    const { salon_id } = req.query;
    try {
      if (salon_id) {
        const [rows] = await db.execute('SELECT * FROM technicians WHERE salon_id = ?', [Number(salon_id)]);
        // Format data properly
        const technicians = (rows as any[]).map((tech: any) => ({
          ...tech,
          name: tech.fullname,
          salon_id: Number(tech.salon_id),
          rating: Number(tech.rating) || 0,
          experience_years: Number(tech.experience_years) || 0,
          is_available: Boolean(tech.is_available),
        }));
        return res.json(technicians);
      }
      const [rows] = await db.execute('SELECT * FROM technicians');
      // Format data properly
      const technicians = (rows as any[]).map((tech: any) => ({
        ...tech,
        name: tech.fullname,
        salon_id: Number(tech.salon_id),
        rating: Number(tech.rating) || 0,
        experience_years: Number(tech.experience_years) || 0,
        is_available: Boolean(tech.is_available),
      }));
      res.json(technicians);
    } catch (error) {
      console.error('Technicians list error:', error);
      res.status(500).json({ 
        error: 'Server error fetching technicians',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add Technician
  app.post('/api/technicians', async (req, res) => {
    const { salon_id, fullname, specialties, rating, is_available, avatar, experience_years } = req.body;
    try {
      // Validate required fields
      if (!salon_id || !fullname) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: 'Salon ID and fullname are required'
        });
      }

      const [result] = await db.execute(
        `INSERT INTO technicians (salon_id, fullname, specialties, rating, is_available, avatar, experience_years)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(salon_id),
          fullname,
          specialties || 'Nail Artist',
          rating !== undefined && rating !== null ? Number(rating) : null,
          is_available !== undefined ? is_available : 1,
          avatar || null,
          Number(experience_years) || 2
        ]
      );
      const techId = (result as any).insertId;

      const [techRows] = await db.execute('SELECT * FROM technicians WHERE id = ?', [techId]);
      const newTech = (techRows as any[])[0];
      
      if (newTech) {
        // Format the response data
        const formattedTech = {
          ...newTech,
          salon_id: Number(newTech.salon_id),
          rating: Number(newTech.rating) || 0,
          experience_years: Number(newTech.experience_years) || 0,
          is_available: Boolean(newTech.is_available),
        };
        res.status(201).json(formattedTech);
      } else {
        res.status(500).json({ error: 'Failed to create technician' });
      }
    } catch (error) {
      console.error('Create technician error:', error);
      res.status(500).json({ 
        error: 'Server error creating technician',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update Technician
  app.put('/api/technicians/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      const [techRows] = await db.execute('SELECT * FROM technicians WHERE id = ?', [id]);
      if ((techRows as any[]).length === 0) return res.status(404).json({ error: 'Technician not found' });

      // Whitelist of allowed fields to prevent SQL injection
      const allowedFields = [
        'fullname', 'specialties', 'rating', 'is_available', 'avatar', 'experience_years'
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
          `UPDATE technicians SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, id]
        );
      }

      const [updatedRows] = await db.execute('SELECT * FROM technicians WHERE id = ?', [id]);
      const updatedTech = (updatedRows as any[])[0];
      
      // Format the response data
      const formattedTech = {
        ...updatedTech,
        salon_id: Number(updatedTech.salon_id),
        rating: Number(updatedTech.rating) || 0,
        experience_years: Number(updatedTech.experience_years) || 0,
        is_available: Boolean(updatedTech.is_available),
      };
      
      res.json(formattedTech);
    } catch (error) {
      console.error('Update technician error:', error);
      res.status(500).json({ 
        error: 'Server error updating technician',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete Technician
  app.delete('/api/technicians/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      // Check if technician has any appointments
      const [apptCheck] = await db.execute(
        'SELECT COUNT(*) as count FROM appointments WHERE technician_id = ?',
        [id]
      );
      const appointmentCount = (apptCheck as any[])[0].count;
      
      if (appointmentCount > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete technician with existing appointments',
          details: 'Please reassign or cancel all appointments for this technician first'
        });
      }

      await db.execute('DELETE FROM technicians WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete technician error:', error);
      res.status(500).json({ 
        error: 'Server error deleting technician',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      
      // Format data properly
      const appointments = (rows as any[]).map((appt: any) => ({
        ...appt,
        customer_id: Number(appt.customer_id),
        salon_id: Number(appt.salon_id),
        service_id: Number(appt.service_id),
        technician_id: appt.technician_id ? Number(appt.technician_id) : null,
        total_price: Number(appt.total_price) || 0,
      }));

      res.json(appointments);
    } catch (error) {
      console.error('Appointments list error:', error);
      res.status(500).json({ 
        error: 'Server error fetching appointments',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      if (!customer_id || !salon_id || !service_id || !customer_name || !appointment_date || !appointment_time) {
        return res.status(400).json({
          error: 'Customer, salon, service, date, time, and customer name are required',
        });
      }

      const [customerRows] = await db.execute(
        'SELECT id, fullname, email, phone, user_type, status FROM users WHERE id = ?',
        [Number(customer_id)]
      );
      const customer = (customerRows as any[])[0];
      if (!customer || customer.user_type !== 'customer' || customer.status !== 'active') {
        return res.status(400).json({ error: 'A valid active customer account is required' });
      }

      // Validate foreign key relationships
      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [Number(salon_id)]);
      const salon = (salonRows as any[])[0];
      
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }
      
      const [serviceRows] = await db.execute('SELECT * FROM services WHERE id = ? AND salon_id = ?', [Number(service_id), Number(salon_id)]);
      const service = (serviceRows as any[])[0];
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found or does not belong to this salon' });
      }
      
      // Validate date and time
      if (!isValidDate(appointment_date)) {
        return res.status(400).json({ 
          error: 'Invalid date format',
          details: 'Please provide a valid date'
        });
      }

      if (!isFutureDate(appointment_date)) {
        return res.status(400).json({ 
          error: 'Date must be in the future',
          details: 'Appointments can only be scheduled for future dates'
        });
      }

      // Validate time format (basic check)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(appointment_time)) {
        return res.status(400).json({ 
          error: 'Invalid time format',
          details: 'Please provide a valid time in HH:MM format'
        });
      }
      
      let technician = null;
      if (technician_id) {
        const [techRows] = await db.execute('SELECT * FROM technicians WHERE id = ? AND salon_id = ?', [Number(technician_id), Number(salon_id)]);
        technician = (techRows as any[])[0];
        
        if (!technician) {
          return res.status(404).json({ error: 'Technician not found or does not belong to this salon' });
        }
      }

        const [conflictRows] = await db.execute(
          `SELECT id FROM appointments
           WHERE salon_id = ? AND appointment_date = ? AND appointment_time = ?
             AND status IN ('pending', 'confirmed')
             AND (? IS NULL OR technician_id = ?)
           LIMIT 1`,
          [Number(salon_id), appointment_date, appointment_time, technician_id ? Number(technician_id) : null, technician_id ? Number(technician_id) : null]
        );
        if ((conflictRows as any[]).length > 0) {
          return res.status(409).json({ error: 'That appointment time is already reserved' });
        }

      const [result] = await db.execute(
        `INSERT INTO appointments (
          customer_id, customer_name, customer_phone, customer_email,
          salon_id, salon_name, service_id, service_name, total_price,
          technician_id, technician_name, appointment_date, appointment_time, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(customer.id),
          customer.fullname,
          customer.phone || customer_phone || '',
          customer.email,
          Number(salon_id),
          salon.salon_name,
          Number(service_id),
          service.service_name,
          Number(service.price) || 0,
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
      
      // Format the response data
      const formattedAppointment = {
        ...newAppt,
        customer_id: Number(newAppt.customer_id),
        salon_id: Number(newAppt.salon_id),
        service_id: Number(newAppt.service_id),
        technician_id: newAppt.technician_id ? Number(newAppt.technician_id) : null,
        total_price: Number(newAppt.total_price) || 0,
      };
      
      res.status(201).json({ success: true, appointment: formattedAppointment });
    } catch (error) {
      console.error('Book appointment error:', error);
      res.status(500).json({ 
        error: 'Server error booking appointment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update Appointment Status
  app.patch('/api/appointments/:id/status', async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        details: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    try {
      const [apptRows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [id]);
      if ((apptRows as any[]).length === 0) return res.status(404).json({ error: 'Appointment not found' });

      await db.execute('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
      const [updatedRows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [id]);
      const updatedAppt = (updatedRows as any[])[0];
      
      // Format the response data
      const formattedAppointment = {
        ...updatedAppt,
        customer_id: Number(updatedAppt.customer_id),
        salon_id: Number(updatedAppt.salon_id),
        service_id: Number(updatedAppt.service_id),
        technician_id: updatedAppt.technician_id ? Number(updatedAppt.technician_id) : null,
        total_price: Number(updatedAppt.total_price) || 0,
      };
      
      res.json({ success: true, appointment: formattedAppointment });
    } catch (error) {
      console.error('Update appointment status error:', error);
      res.status(500).json({ 
        error: 'Server error updating appointment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Assign Appointment Technician
  app.patch('/api/appointments/:id/technician', async (req, res) => {
    const appointmentId = Number(req.params.id);
    const technicianId = Number(req.body.technician_id);
    if (!Number.isInteger(technicianId) || technicianId <= 0) {
      return res.status(400).json({ error: 'A valid technician ID is required' });
    }

    try {
      const [appointmentRows] = await db.execute(
        'SELECT id, salon_id FROM appointments WHERE id = ?',
        [appointmentId]
      );
      const appointment = (appointmentRows as any[])[0];
      if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

      const [technicianRows] = await db.execute(
        'SELECT id, fullname FROM technicians WHERE id = ? AND salon_id = ? AND is_available = 1',
        [technicianId, appointment.salon_id]
      );
      const technician = (technicianRows as any[])[0];
      if (!technician) {
        return res.status(400).json({ error: 'Technician is unavailable or belongs to another salon' });
      }

      await db.execute(
        'UPDATE appointments SET technician_id = ?, technician_name = ? WHERE id = ?',
        [technician.id, technician.fullname, appointmentId]
      );
      res.json({ success: true, technician_id: technician.id, technician_name: technician.fullname });
    } catch (error) {
      console.error('Assign appointment technician error:', error);
      res.status(500).json({ error: 'Server error assigning technician' });
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
    const { user_id, user_name, salon_id, technician_id, technician_name, rating, comment, service_name } = req.body;
    try {
      if (!user_id || !salon_id || !comment || !String(comment).trim()) {
        return res.status(400).json({ error: 'Customer, salon, rating, and review comment are required' });
      }

      const [userRows] = await db.execute(
        'SELECT id, fullname, user_type, status FROM users WHERE id = ?',
        [Number(user_id)]
      );
      const user = (userRows as any[])[0];
      if (!user || user.user_type !== 'customer' || user.status !== 'active') {
        return res.status(400).json({ error: 'A valid active customer account is required' });
      }

      // Validate rating
      const sanitizedRating = sanitizeNumber(rating, 5);
      if (sanitizedRating < 1 || sanitizedRating > 5) {
        return res.status(400).json({ 
          error: 'Invalid rating',
          details: 'Rating must be between 1 and 5'
        });
      }

      const [salonRows] = await db.execute('SELECT * FROM salons WHERE id = ?', [Number(salon_id)]);
      const salon = (salonRows as any[])[0];

      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }

      const [result] = await db.execute(
        `INSERT INTO reviews (salon_id, technician_id, technician_name, user_id, user_name, rating, comment, service_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(salon_id),
          technician_id ? Number(technician_id) : null,
          technician_name || null,
          Number(user.id),
          sanitizeString(user.fullname || user_name || 'Verified Client'),
          sanitizedRating,
          sanitizeString(comment),
          sanitizeString(service_name || 'Nail Service')
        ]
      );
      const reviewId = (result as any).insertId;

      if (technician_id) {
        await db.execute(
          `UPDATE technicians t
           SET rating = (SELECT AVG(r.rating) FROM reviews r WHERE r.technician_id = ?)
           WHERE t.id = ?`,
          [Number(technician_id), Number(technician_id)]
        );
      }

      // Update salon average rating with improved calculation
      if (salon) {
        const [allReviews] = await db.execute('SELECT * FROM reviews WHERE salon_id = ?', [Number(salon_id)]);
        const reviews = allReviews as any[];
        
        if (reviews.length > 0) {
          const total = reviews.reduce((sum, r) => sum + Number(r.rating), 0);
          const avgRating = Math.round((total / reviews.length) * 10) / 10; // Round to 1 decimal place
          
          await db.execute(
            'UPDATE salons SET avg_rating = ?, review_count = ? WHERE id = ?',
            [avgRating, reviews.length, Number(salon_id)]
          );
        }
      }

      const [reviewRows] = await db.execute('SELECT * FROM reviews WHERE id = ?', [reviewId]);
      const newReview = (reviewRows as any[])[0];
      
      // Format the response data
      const formattedReview = {
        ...newReview,
        salon_id: Number(newReview.salon_id),
        user_id: Number(newReview.user_id),
        rating: Number(newReview.rating),
      };
      
      res.status(201).json(formattedReview);
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ 
        error: 'Server error creating review',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Runtime registration rate-limit control for the admin console
  app.get('/api/settings/registration-rate-limit', (req, res) => {
    res.json({ enabled: registrationRateLimitEnabled });
  });

  app.put('/api/settings/registration-rate-limit', (req, res) => {
    if (typeof req.body.enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    registrationRateLimitEnabled = req.body.enabled;
    res.json({ enabled: registrationRateLimitEnabled });
  });

  app.post('/api/announcements', async (req, res) => {
    const { title, message, type, is_active, target_audience, link_url, link_text } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    try {
      const [result] = await db.execute(
        `INSERT INTO announcements (title, message, priority, is_active, target_audience, link_url, link_text, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title.trim(),
          message.trim(),
          type || 'normal',
          is_active !== false ? 1 : 0,
          target_audience || 'all',
          link_url || null,
          link_text || null,
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

      const totalGmv = appointments.reduce((sum, a) => sum + Number(a.total_price || 0), 0);
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
        active_announcements: announcements.filter((a) => Boolean(a.is_active)).length,
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

  // Error and 404 handlers must be registered after all routes.
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global error handler:', err);

    if (err.name === 'RateLimitError') {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        details: err.message,
      });
    }

    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        error: 'Invalid JSON in request body',
        details: err.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.path,
      method: req.method,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Nail Glam Hub server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
