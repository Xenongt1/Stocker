// src/utils/formatCurrency.js
export const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'XOF': return 'CFA';
    case 'GHS': return '₵';
    default: return '$';
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return `${getCurrencySymbol(currency)}0.00`;
  }
  return `${getCurrencySymbol(currency)}${numericAmount.toFixed(2)}`;
};