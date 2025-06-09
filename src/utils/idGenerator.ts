/**
 * Utility functions for generating unique identifiers
 */

/**
 * Generates a unique product ID with admin prefix
 * Uses timestamp + random string for collision resistance
 */
export function generateAdminProductId(): string {
  const timestamp = Date.now();
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
  return `admin-${timestamp}-${randomPart}`;
}

/**
 * Generates a unique product code
 * Uses timestamp + random string for collision resistance
 */
export function generateProductCode(): string {
  const timestamp = Date.now();
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();
  return `PROD-${timestamp}-${randomPart}`;
}

/**
 * Generates a unique ID with custom prefix
 * Uses timestamp + random string for collision resistance
 */
export function generateUniqueId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * Alternative UUID-style generator (without external dependencies)
 * Creates a UUID-like string using crypto.randomUUID if available, 
 * otherwise falls back to timestamp + random
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  const timestamp = Date.now().toString(16);
  const randomPart = Math.random().toString(16).substring(2);
  const randomPart2 = Math.random().toString(16).substring(2);
  
  return `${timestamp.substring(0, 8)}-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}-${randomPart2.substring(0, 4)}-${randomPart2.substring(4, 12)}`;
}
