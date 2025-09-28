// Backend Name validation utility functions

/**
 * Validates if a name contains only letters and spaces
 * Min 4 chars, Max 20 chars, No special chars, No numbers
 * @param {string} name - The name to validate
 * @returns {object} - {isValid: boolean, error: string}
 */
const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' };
  }
  
  const trimmedName = name.trim();
  
  // Check length (minimum 4 characters, maximum 20 characters)
  if (trimmedName.length < 4) {
    return { isValid: false, error: 'Name must be at least 4 characters long' };
  }
  
  if (trimmedName.length > 20) {
    return { isValid: false, error: 'Name must not exceed 20 characters' };
  }
  
  // Only allow letters (a-z, A-Z) and spaces - No special chars, No numbers
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(trimmedName)) {
    // Check for numbers specifically
    if (/\d/.test(trimmedName)) {
      return { isValid: false, error: 'Numbers are not allowed in name' };
    }
    // Check for special characters
    if (/[^a-zA-Z\s]/.test(trimmedName)) {
      return { isValid: false, error: 'Only letters and spaces are allowed' };
    }
  }
  
  // Check for consecutive spaces
  if (/\s{2,}/.test(trimmedName)) {
    return { isValid: false, error: 'Multiple consecutive spaces not allowed' };
  }
  
  // Name should not start or end with space
  if (trimmedName !== name.trim()) {
    return { isValid: false, error: 'Name cannot start or end with space' };
  }
  
  return { isValid: true, error: '' };
};

/**
 * Formats name: First letter capital, rest small, after space again capital
 * Example: "ashUtosh kuMAr" → "Ashutosh Kumar"
 * @param {string} name - The name to format
 * @returns {string} - Formatted name with proper capitalization
 */
const formatName = (name) => {
  if (!name) return '';
  
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Sanitizes name input by removing invalid characters
 * @param {string} name - The name to sanitize
 * @returns {string} - Sanitized name
 */
const sanitizeName = (name) => {
  if (!name) return '';
  
  // Remove numbers and special characters, keep only letters and single spaces
  return name
    .replace(/[^a-zA-Z\s]/g, '') // Remove everything except letters and spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
};

/**
 * Validates and formats name in one step
 * @param {string} name - The name to process
 * @returns {object} - {isValid: boolean, formattedName: string, error: string}
 */
const processName = (name) => {
  const sanitized = sanitizeName(name);
  const validation = validateName(sanitized);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      formattedName: sanitized,
      error: validation.error
    };
  }
  
  const formatted = formatName(sanitized);
  return {
    isValid: true,
    formattedName: formatted,
    error: ''
  };
};

export {
  validateName,
  formatName,
  sanitizeName,
  processName
};
