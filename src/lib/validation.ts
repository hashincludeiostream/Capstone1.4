/**
 * Centralized form validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationRules {
  email?: {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
  };
  password?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecialChar?: boolean;
  };
  fullname?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  };
  phone?: {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
  };
  salonName?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  };
  address?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  return { isValid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
};

/**
 * Validate full name
 */
export const validateFullname = (fullname: string): { isValid: boolean; error?: string } => {
  if (!fullname || fullname.trim() === '') {
    return { isValid: false, error: 'Full name is required' };
  }

  if (fullname.trim().length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters long' };
  }

  if (fullname.length > 100) {
    return { isValid: false, error: 'Full name is too long' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(fullname.trim())) {
    return { isValid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const cleanedPhone = phone.replace(/\D/g, '');

  if (cleanedPhone.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' };
  }

  if (cleanedPhone.length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }

  return { isValid: true };
};

/**
 * Validate salon name
 */
export const validateSalonName = (salonName: string): { isValid: boolean; error?: string } => {
  if (!salonName || salonName.trim() === '') {
    return { isValid: false, error: 'Salon name is required' };
  }

  if (salonName.trim().length < 3) {
    return { isValid: false, error: 'Salon name must be at least 3 characters long' };
  }

  if (salonName.length > 100) {
    return { isValid: false, error: 'Salon name is too long' };
  }

  return { isValid: true };
};

/**
 * Validate address
 */
export const validateAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || address.trim() === '') {
    return { isValid: false, error: 'Address is required' };
  }

  if (address.trim().length < 5) {
    return { isValid: false, error: 'Address must be at least 5 characters long' };
  }

  if (address.length > 200) {
    return { isValid: false, error: 'Address is too long' };
  }

  return { isValid: true };
};

/**
 * Validate form data based on rules
 */
export const validateForm = (
  data: Record<string, string>,
  rules: ValidationRules
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate email
  if (rules.email?.required || data.email) {
    const emailResult = validateEmail(data.email || '');
    if (!emailResult.isValid) {
      errors.email = emailResult.error || 'Invalid email';
    }
  }

  // Validate password
  if (rules.password?.required || data.password) {
    const passwordResult = validatePassword(data.password || '');
    if (!passwordResult.isValid) {
      errors.password = passwordResult.error || 'Invalid password';
    }
  }

  // Validate fullname
  if (rules.fullname?.required || data.fullname) {
    const fullnameResult = validateFullname(data.fullname || '');
    if (!fullnameResult.isValid) {
      errors.fullname = fullnameResult.error || 'Invalid full name';
    }
  }

  // Validate phone
  if (rules.phone?.required || data.phone) {
    const phoneResult = validatePhone(data.phone || '');
    if (!phoneResult.isValid) {
      errors.phone = phoneResult.error || 'Invalid phone number';
    }
  }

  // Validate salon name
  if (rules.salonName?.required || data.salonName) {
    const salonNameResult = validateSalonName(data.salonName || '');
    if (!salonNameResult.isValid) {
      errors.salonName = salonNameResult.error || 'Invalid salon name';
    }
  }

  // Validate address
  if (rules.address?.required || data.address) {
    const addressResult = validateAddress(data.address || '');
    if (!addressResult.isValid) {
      errors.address = addressResult.error || 'Invalid address';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};