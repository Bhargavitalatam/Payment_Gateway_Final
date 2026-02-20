// Validation Service - Payment validation logic

/**
 * Validate VPA (Virtual Payment Address) format
 * Format: ^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$
 */
const validateVPA = (vpa) => {
  if (!vpa || typeof vpa !== 'string') {
    return { valid: false, error: 'VPA is required' };
  }
  
  const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  
  if (!vpaRegex.test(vpa)) {
    return { 
      valid: false, 
      error: 'Invalid VPA format. VPA must be in format: username@bank' 
    };
  }
  
  return { valid: true };
};

/**
 * Validate card number using Luhn algorithm
 */
const validateCardNumber = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return { valid: false, error: 'Card number is required' };
  }
  
  // Remove spaces and dashes
  const cleanedNumber = cardNumber.replace(/[\s-]/g, '');
  
  // Check if contains only digits
  if (!/^\d+$/.test(cleanedNumber)) {
    return { valid: false, error: 'Card number must contain only digits' };
  }
  
  // Check length (13-19 digits)
  if (cleanedNumber.length < 13 || cleanedNumber.length > 19) {
    return { valid: false, error: 'Card number must be between 13 and 19 digits' };
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanedNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanedNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  if (sum % 10 !== 0) {
    return { valid: false, error: 'Invalid card number' };
  }
  
  return { valid: true };
};

/**
 * Detect card network from card number
 */
const detectCardNetwork = (cardNumber) => {
  if (!cardNumber) return 'unknown';
  
  // Remove spaces and dashes
  const cleanedNumber = cardNumber.replace(/[\s-]/g, '');
  
  // Get first digits for pattern matching
  const firstDigit = cleanedNumber.charAt(0);
  const firstTwo = cleanedNumber.substring(0, 2);
  
  // Visa: starts with 4
  if (firstDigit === '4') {
    return 'visa';
  }
  
  // Mastercard: starts with 51-55
  const firstTwoNum = parseInt(firstTwo, 10);
  if (firstTwoNum >= 51 && firstTwoNum <= 55) {
    return 'mastercard';
  }
  
  // Amex: starts with 34 or 37
  if (firstTwo === '34' || firstTwo === '37') {
    return 'amex';
  }
  
  // RuPay: starts with 60, 65, or 81-89
  if (firstTwo === '60' || firstTwo === '65' || (firstTwoNum >= 81 && firstTwoNum <= 89)) {
    return 'rupay';
  }
  
  return 'unknown';
};

/**
 * Validate card expiry date
 */
const validateExpiry = (month, year) => {
  if (!month || !year) {
    return { valid: false, error: 'Expiry month and year are required' };
  }
  
  // Parse month
  const monthNum = parseInt(month, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return { valid: false, error: 'Invalid expiry month' };
  }
  
  // Parse year (handle 2-digit and 4-digit formats)
  let yearNum = parseInt(year, 10);
  if (isNaN(yearNum)) {
    return { valid: false, error: 'Invalid expiry year' };
  }
  
  // Convert 2-digit year to 4-digit
  if (yearNum < 100) {
    yearNum += 2000;
  }
  
  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  
  // Check if expired
  if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }
  
  return { valid: true };
};

/**
 * Validate CVV
 */
const validateCVV = (cvv, cardNetwork) => {
  if (!cvv || typeof cvv !== 'string') {
    return { valid: false, error: 'CVV is required' };
  }
  
  // Remove spaces
  const cleanedCVV = cvv.replace(/\s/g, '');
  
  // Check if contains only digits
  if (!/^\d+$/.test(cleanedCVV)) {
    return { valid: false, error: 'CVV must contain only digits' };
  }
  
  // Amex has 4-digit CVV, others have 3-digit
  const expectedLength = cardNetwork === 'amex' ? 4 : 3;
  
  if (cleanedCVV.length !== expectedLength && cleanedCVV.length !== 3 && cleanedCVV.length !== 4) {
    return { valid: false, error: 'Invalid CVV length' };
  }
  
  return { valid: true };
};

/**
 * Get last 4 digits of card number
 */
const getCardLast4 = (cardNumber) => {
  if (!cardNumber) return null;
  const cleanedNumber = cardNumber.replace(/[\s-]/g, '');
  return cleanedNumber.slice(-4);
};

/**
 * Validate complete card details
 */
const validateCard = (card) => {
  if (!card) {
    return { valid: false, error: 'Card details are required' };
  }
  
  const { number, expiry_month, expiry_year, cvv, holder_name } = card;
  
  // Validate card number
  const cardValidation = validateCardNumber(number);
  if (!cardValidation.valid) {
    return { valid: false, error: cardValidation.error, code: 'INVALID_CARD' };
  }
  
  // Detect card network
  const cardNetwork = detectCardNetwork(number);
  
  // Validate expiry
  const expiryValidation = validateExpiry(expiry_month, expiry_year);
  if (!expiryValidation.valid) {
    return { valid: false, error: expiryValidation.error, code: 'EXPIRED_CARD' };
  }
  
  // Validate CVV
  const cvvValidation = validateCVV(cvv, cardNetwork);
  if (!cvvValidation.valid) {
    return { valid: false, error: cvvValidation.error, code: 'INVALID_CARD' };
  }
  
  // Validate holder name
  if (!holder_name || holder_name.trim().length === 0) {
    return { valid: false, error: 'Card holder name is required', code: 'INVALID_CARD' };
  }
  
  return { 
    valid: true, 
    cardNetwork, 
    cardLast4: getCardLast4(number) 
  };
};

module.exports = {
  validateVPA,
  validateCardNumber,
  detectCardNetwork,
  validateExpiry,
  validateCVV,
  validateCard,
  getCardLast4
};
