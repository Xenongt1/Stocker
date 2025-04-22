import { useState } from 'react';

/**
 * Custom hook to handle receipt generation and display
 * @param {Object} options - Configuration options
 * @param {string} options.storeName - Name of the store for the receipt
 * @param {string} options.currency - Currency code (USD, EUR, etc.)
 * @param {string} options.footerText - Optional footer text for receipt
 * @returns {Object} - Receipt handler methods and state
 */
const useReceiptHandler = ({ 
  storeName = "Stocker Store", 
  currency = "USD", 
  footerText = "Thank you for your purchase!" 
} = {}) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  /**
   * Generate a receipt for a completed sale
   * @param {Object} saleData - Data for the completed sale
   */
  const generateReceipt = (saleData) => {
    // Make sure we have the required data
    if (!saleData || !saleData.items || saleData.items.length === 0) {
      console.error("Invalid sale data provided");
      return;
    }
    
    // Format the sale data for the receipt
    const formattedSale = {
      id: saleData.id || `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      items: saleData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      paymentMethod: saleData.paymentMethod || 'Cash',
      cashier: saleData.cashier || 'Staff'
    };
    
    // Set the receipt data and show the receipt
    setReceiptData(formattedSale);
    setShowReceipt(true);
  };
  
  /**
   * Close the receipt modal
   */
  const closeReceipt = () => {
    setShowReceipt(false);
  };
  
  return {
    showReceipt,
    receiptData,
    generateReceipt,
    closeReceipt,
    receiptProps: {
      storeName,
      currency,
      footerText
    }
  };
};

export default useReceiptHandler;