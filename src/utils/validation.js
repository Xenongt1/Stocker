// src/utils/validation.js
export const validateRequired = (value) => {
    if (!value || value.trim() === '') return 'This field is required';
    return null;
  };
  
  export const validateEmail = (email) => {
    if (!email) return 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    
    return null;
  };
  
  export const validateNumber = (value, options = {}) => {
    const { required = true, min, max, integer = false } = options;
    
    if (required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }
    
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value);
      
      if (isNaN(num)) return 'Please enter a valid number';
      if (integer && !Number.isInteger(num)) return 'Please enter a whole number';
      if (min !== undefined && num < min) return `Value must be at least ${min}`;
      if (max !== undefined && num > max) return `Value must not exceed ${max}`;
    }
    
    return null;
  };
  
  export const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };
  
  export const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };
  
  export const validateSKU = (sku) => {
    if (!sku) return 'SKU is required';
    
    const skuRegex = /^[A-Za-z0-9\-_]+$/;
    if (!skuRegex.test(sku)) return 'SKU can only contain letters, numbers, hyphens, and underscores';
    
    return null;
  };
  
  // Function to validate an entire form
  export const validateForm = (values, validationRules) => {
    const errors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      
      for (const rule of rules) {
        const error = rule(values[field], values);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    });
    
    return { 
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };