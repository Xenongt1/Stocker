import React, { useRef } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const ReceiptGenerator = ({ 
  receiptData,
  storeName = 'Stocker',
  storeAddress = '123 Store Street, City',
  storePhone = '(555) 123-4567',
  storeEmail = 'contact@stocker.com',
  currency = 'USD',
  taxRate = 7.5,
  receiptFooter = 'Thank you for your purchase!',
  onPrint,
  onClose
}) => {
  const receiptRef = useRef(null);
  
  const { 
    receiptNumber,
    date,
    items,
    subtotal,
    discount,
    cashier,
    customer = 'Customer',
    paymentMethod = 'Cash'
  } = receiptData;
  
  // Calculate tax and total
  const tax = ((subtotal - discount) * (taxRate / 100)).toFixed(2);
  const total = (parseFloat(subtotal) - parseFloat(discount) + parseFloat(tax)).toFixed(2);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      const content = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${receiptNumber}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                width: 300px;
                margin: 0 auto;
                padding: 10px;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .receipt-header h2 {
                margin: 5px 0;
              }
              .receipt-info {
                margin-bottom: 10px;
                border-top: 1px dashed #000;
                border-bottom: 1px dashed #000;
                padding: 5px 0;
              }
              .receipt-items {
                margin-bottom: 10px;
              }
              .item-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              }
              .receipt-summary {
                border-top: 1px dashed #000;
                padding-top: 5px;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              }
              .receipt-footer {
                text-align: center;
                margin-top: 10px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              @media print {
                body {
                  width: 100%;
                  max-width: 300px;
                }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Receipt / Invoice</h3>
            <button 
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div ref={receiptRef} className="receipt font-mono text-sm">
            <div className="receipt-header text-center mb-4">
              <h2 className="text-xl font-bold">{storeName}</h2>
              <p>{storeAddress}</p>
              <p>{storePhone}</p>
              <p>{storeEmail}</p>
            </div>
            
            <div className="receipt-info border-t border-b border-dashed border-gray-400 py-2 mb-4">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span>{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{customer}</span>
              </div>
            </div>
            
            <div className="receipt-items mb-4">
              <div className="font-bold flex justify-between border-b pb-1 mb-2">
                <span>Item</span>
                <div className="flex">
                  <span className="w-16 text-right">Qty</span>
                  <span className="w-20 text-right">Price</span>
                  <span className="w-24 text-right">Total</span>
                </div>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="flex justify-between mb-1">
                  <span className="truncate max-w-[150px]">{item.name}</span>
                  <div className="flex">
                    <span className="w-16 text-right">{item.quantity}</span>
                    <span className="w-20 text-right">{formatCurrency(item.price, currency)}</span>
                    <span className="w-24 text-right">{formatCurrency(item.total, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="receipt-summary border-t border-dashed border-gray-400 pt-2">
              <div className="flex justify-between mb-1">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between mb-1">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between mb-1">
                <span>Tax ({taxRate}%):</span>
                <span>{formatCurrency(tax, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total:</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
              
              <div className="mt-4 pt-2 border-t border-dashed border-gray-400">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{paymentMethod}</span>
                </div>
              </div>
            </div>
            
            <div className="receipt-footer text-center mt-6 pt-2 border-t border-dashed border-gray-400">
              <p>{receiptFooter}</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handlePrint}
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;