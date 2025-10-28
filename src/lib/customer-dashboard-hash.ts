/**
 * Simple phone number validation for customer dashboard access
 * No database storage required - direct validation approach
 */

/**
 * Create a customer dashboard link with phone number as hash
 * This creates a URL that contains the phone number in a simple encoded form
 */
export function createCustomerDashboardLink(phone: string): string {
  // Clean phone number format
  const cleanPhone = phone.startsWith('+') ? phone : '+' + phone.replace(/\D/g, '');

  // Simple encoding: just use base64-like encoding that's URL-safe
  const encoded = btoa(cleanPhone)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `/customer-dashboard/${encoded}`;
}

/**
 * Extract phone number from dashboard hash
 * Decodes the phone number from the URL parameter
 */
export function extractPhoneFromHash(hash: string): { phone: string; valid: boolean } {
  if (!hash || typeof hash !== 'string') {
    return { phone: '', valid: false };
  }

  try {
    // Reverse the base64-like encoding
    const paddedHash = hash + '='.repeat((4 - hash.length % 4) % 4);
    const base64Hash = paddedHash.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64Hash);

    // Basic validation - check if it looks like a phone number (with + prefix)
    if (decoded && decoded.startsWith('+') && decoded.length >= 12 && /^\+\d+$/.test(decoded)) {
      return { phone: decoded, valid: true };
    }

    return { phone: '', valid: false };
  } catch (error) {
    console.error('Error decoding phone from hash:', error);
    return { phone: '', valid: false };
  }
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  return typeof phone === 'string' &&
         phone.startsWith('+') &&
         phone.length >= 12 &&
         /^\+\d+$/.test(phone);
}

// Legacy exports for backward compatibility
export function generatePhoneHash(phone: string): string {
  console.warn('generatePhoneHash is deprecated, use createCustomerDashboardLink instead');
  return createCustomerDashboardLink(phone);
}

export function validateAndExtractPhone(hash: string): { phone: string; valid: boolean } {
  console.warn('validateAndExtractPhone is deprecated, use extractPhoneFromHash instead');
  return extractPhoneFromHash(hash);
}