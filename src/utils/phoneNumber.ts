/**
 * Phone number utility functions for consistent formatting and validation
 * Ensures all phone numbers are properly formatted for Indian numbers (+91)
 */

export interface PhoneNumberFormat {
  raw: string;
  formatted: string;
  isValid: boolean;
  countryCode: string;
  localNumber: string;
}

/**
 * Validates and formats a phone number for Indian format
 * @param phone - Raw phone number input
 * @returns Formatted phone number object
 */
export const formatIndianPhoneNumber = (phone: string): PhoneNumberFormat => {
  if (!phone) {
    return {
      raw: "",
      formatted: "",
      isValid: false,
      countryCode: "",
      localNumber: "",
    };
  }

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");

  // Handle different input formats
  if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
    // Already in correct format: 919876543210
    const localNumber = cleanPhone.substring(2);
    return {
      raw: phone,
      formatted: `+91-${localNumber}`,
      isValid: true,
      countryCode: "91",
      localNumber,
    };
  } else if (cleanPhone.length === 10) {
    // Local number: 9876543210 -> add country code
    return {
      raw: phone,
      formatted: `+91-${cleanPhone}`,
      isValid: true,
      countryCode: "91",
      localNumber: cleanPhone,
    };
  } else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
    // Number starting with 0: 09876543210 -> remove 0 and add country code
    const localNumber = cleanPhone.substring(1);
    return {
      raw: phone,
      formatted: `+91-${localNumber}`,
      isValid: true,
      countryCode: "91",
      localNumber,
    };
  } else if (cleanPhone.startsWith("91") && cleanPhone.length > 12) {
    // Number with extra digits after country code
    const localNumber = cleanPhone.substring(2);
    if (localNumber.length === 10) {
      return {
        raw: phone,
        formatted: `+91-${localNumber}`,
        isValid: true,
        countryCode: "91",
        localNumber,
      };
    }
  }

  // Invalid format
  return {
    raw: phone,
    formatted: phone,
    isValid: false,
    countryCode: "",
    localNumber: "",
  };
};

/**
 * Converts a phone number to the format expected by the WhatsApp API
 * @param phone - Phone number in any format
 * @returns Phone number in 919876543210 format for API
 */
export const toWhatsAppFormat = (phone: string): string => {
  const formatted = formatIndianPhoneNumber(phone);
  if (!formatted.isValid) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }
  return `91${formatted.localNumber}`;
};

/**
 * Validates if a phone number is in valid Indian format
 * @param phone - Phone number to validate
 * @returns True if valid Indian phone number
 */
export const isValidIndianPhoneNumber = (phone: string): boolean => {
  return formatIndianPhoneNumber(phone).isValid;
};

/**
 * Gets the display format for a phone number
 * @param phone - Phone number in any format
 * @returns Formatted display string
 */
export const getDisplayFormat = (phone: string): string => {
  const formatted = formatIndianPhoneNumber(phone);
  return formatted.isValid ? formatted.formatted : phone;
};

/**
 * Cleans a phone number input to only allow valid characters
 * @param input - Raw input value
 * @returns Cleaned phone number string
 */
export const cleanPhoneInput = (input: string): string => {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, "");

  // Limit to 10 digits (local number only)
  return digits.slice(0, 10);
};

/**
 * Validates phone number length for input fields
 * @param phone - Phone number to validate
 * @returns Validation result object
 */
export const validatePhoneInput = (
  phone: string
): { isValid: boolean; error?: string } => {
  if (!phone.trim()) {
    return { isValid: false, error: "Phone number is required" };
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return {
      isValid: false,
      error: "Enter valid phone number (10 digits required)",
    };
  }

  if (digits.length > 10) {
    return { isValid: false, error: "Phone number must be exactly 10 digits" };
  }

  return { isValid: true };
};
