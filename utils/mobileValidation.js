// Simple Indian Mobile Number Validation Utility for Backend (10 digits only)
export const validateIndianMobile = (mobile) => {
  if (!mobile) return false;
  
  // Simple 10-digit validation starting with 6-9
  return /^[6-9]\d{9}$/.test(mobile);
};

// Get normalized mobile number (same as input for 10-digit)
export const getNormalizedMobile = (mobile) => {
  if (!mobile) return '';
  
  // Return only digits, max 10
  const digits = mobile.replace(/\D/g, '');
  return digits.slice(0, 10);
};

// Check if mobile number is valid Indian format (10 digits, starts with 6-9)
export const isValidIndianMobile = (mobile) => {
  if (!mobile) return false;
  const cleaned = mobile.replace(/\D/g, '');
  return cleaned.length === 10 && /^[6-9]/.test(cleaned);
};
