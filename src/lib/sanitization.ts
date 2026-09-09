/**
 * Input sanitization utilities for security
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, '');
}

/**
 * Sanitize phone number input
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  return phone
    .replace(/[^\d+\-\s()]/g, '') // Keep only digits, spaces, hyphens, parentheses
    .trim();
}

/**
 * Sanitize text fields (names, descriptions, etc.)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validate and sanitize number input
 */
export function sanitizeNumber(input: unknown, defaultValue: number = 0): number {
  const num = Number(input);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Sanitize and validate boolean input
 */
export function sanitizeBoolean(input: unknown, defaultValue: boolean = false): boolean {
  if (typeof input === 'boolean') return input;
  if (input === 'true' || input === '1' || input === 1) return true;
  if (input === 'false' || input === '0' || input === 0) return false;
  return defaultValue;
}

/**
 * Sanitize array input
 */
export function sanitizeArray<T>(input: unknown): T[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is T => item !== null && item !== undefined);
}

/**
 * Sanitize object by removing potentially dangerous keys
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: unknown, allowedKeys: string[]): T {
  if (!obj || typeof obj !== 'object') return {} as T;

  const sanitized = {} as T;
  for (const key of allowedKeys) {
    if (obj && key in obj) {
      (sanitized as Record<string, unknown>)[key] = (obj as Record<string, unknown>)[key];
    }
  }
  return sanitized;
}