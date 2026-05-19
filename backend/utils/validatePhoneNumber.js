// Philippine phone number validation
// Format: +63 followed by:
// - Landline: 1-2 digit area code + 7-digit subscriber number
// - Mobile: 3-digit prefix (starting with 9) + 7-digit subscriber number
// Total digits excluding +63: 10 for mobile, 8-9 for landline

export function validatePhilippinePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone number is required' };
  }

  // Remove all whitespace and common separators for validation
  const normalized = phone.trim().replace(/[\s\-\.]/g, '');

  // Pattern: +63 followed by 10 digits (mobile) or 8-9 digits (landline)
  // Mobile: +63 9XX XXX XXXX (10 digits after +63, starting with 9)
  // Landline: +63 XX XXX XXXX or +63 X XXX XXXX (8-9 digits after +63)
  const philippineRegex = /^\+63\d{8,10}$/;

  if (!philippineRegex.test(normalized)) {
    return {
      valid: false,
      message: 'Phone number must be in +63 format (e.g., +639171234567 for mobile or +6321234567 for landline)'
    };
  }

  // Extract the digits after +63
  const digitsAfterCode = normalized.substring(3); // After "+63"

  // Check if it's a mobile number (10 digits after +63, starting with 9)
  if (digitsAfterCode.length === 10) {
    if (!digitsAfterCode.startsWith('9')) {
      return {
        valid: false,
        message: 'Mobile numbers must start with 9 (e.g., +639171234567)'
      };
    }
    return {
      valid: true,
      type: 'mobile',
      formatted: `+63 ${digitsAfterCode.substring(0, 3)} ${digitsAfterCode.substring(3, 6)} ${digitsAfterCode.substring(6)}`,
      normalized: normalized
    };
  }

  // Landline: 8-9 digits after +63
  if (digitsAfterCode.length >= 8 && digitsAfterCode.length <= 9) {
    return {
      valid: true,
      type: 'landline',
      formatted: `+63 ${digitsAfterCode.substring(0, digitsAfterCode.length - 7)} ${digitsAfterCode.substring(digitsAfterCode.length - 7, digitsAfterCode.length - 4)} ${digitsAfterCode.substring(digitsAfterCode.length - 4)}`,
      normalized: normalized
    };
  }

  return {
    valid: false,
    message: 'Invalid Philippine phone number format'
  };
}

export function formatPhoneNumber(phone) {
  const result = validatePhilippinePhoneNumber(phone);
  return result.valid ? result.formatted : phone;
}
