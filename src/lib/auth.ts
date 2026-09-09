/**
 * Centralized authentication utilities
 */

import { User } from '../types';
import { API_BASE } from './api';

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  details?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: 'customer' | 'salon_owner' | 'admin';
}

export interface RegisterData {
  fullname: string;
  email: string;
  password: string;
  phone?: string;
  user_type: 'customer' | 'salon_owner' | 'admin';
  salon_name?: string;
  salon_address?: string;
  salon_phone?: string;
  salon_category_id?: number;
  salon_description?: string;
  admin_code?: string;
}

async function readAuthResponse(response: Response): Promise<{ error?: string; details?: string; user?: User }> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }

  const message = (await response.text()).trim();
  return message ? { error: message } : {};
}

/**
 * Centralized login function with consistent error handling
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await readAuthResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: response.status === 429
          ? 'Too many login attempts'
          : data.error || 'Login failed',
        details: response.status === 429
          ? 'Please wait and try again later.'
          : data.details || 'Please check your credentials and try again',
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Network error',
      details: 'Unable to connect to the server. Please check your internet connection.',
    };
  }
}

/**
 * Centralized registration function with consistent error handling
 */
export async function register(userData: RegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await readAuthResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: response.status === 429
          ? 'Too many registration attempts'
          : data.error || 'Registration failed',
        details: response.status === 429
          ? 'Please wait up to an hour before trying again.'
          : data.details || 'Please check your information and try again',
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Network error',
      details: 'Unable to connect to the server. Please check your internet connection.',
    };
  }
}

/**
 * Validate authentication state
 */
export function validateAuthState(user: User | null): boolean {
  if (!user) return false;
  
  // Check if user has required fields
  if (!user.id || !user.email || !user.user_type) {
    return false;
  }
  
  // Check if user status is active
  if (user.status === 'suspended' || user.status === 'banned') {
    return false;
  }
  
  return true;
}

/**
 * Format user-friendly error messages
 */
export function formatAuthError(error: string, details?: string): string {
  const errorMessages: Record<string, string> = {
    'Email and password are required': 'Please enter both email and password.',
    'No account found with this email address': 'No account found with this email. Please check your email or create a new account.',
    'Incorrect password': 'Incorrect password. Please check your password and try again.',
    'This account is registered as a salon_owner': 'This account is registered as a salon owner. Please use the salon owner portal.',
    'This account is registered as a admin': 'This account is registered as an admin. Please use the admin portal.',
    'Full name, email, and password are required': 'Please provide your full name, email, and password.',
    'An account with this email already exists': 'An account with this email already exists. Please use a different email or try logging in.',
    'Invalid Administrator Security Authorization Code': 'Invalid admin code. Please enter the correct administrator authorization code.',
    'Network error': 'Network error. Please check your internet connection and try again.',
  };

  const baseMessage = errorMessages[error] || error;
  return details ? `${baseMessage} ${details}` : baseMessage;
}