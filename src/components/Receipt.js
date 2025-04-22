import React, { useRef } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { Printer, Download, Mail } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Receipt component for displaying and printing sales receipts
 * @param {Object} props - Component props
 * @param {Object} props.sale - Sale data with items, totals, etc.
 * @param {string} props.storeName - Name of the store
 * @param {string} props.currency - Currency code (USD, EUR, etc.)
 * @param {string} props.footerText - Optional footer text for the receipt
 * @param {function} props.onClose - Function to close the receipt modal
 */
const Receipt = ({ sale, storeName = "Stocker Store", currency = "USD", footerText = "Thank you for your purchase!", onClose }) => {
  const receiptRef = useRef(null);
  
  // Get current date and time for receipt
  const today = new Date();
  const date = today.toLocaleDateString();
  const time = today.toLocaleTimeString();
  
  // Generate a random receipt number if not provided
  const receiptNumber = sale.id || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  
  // Calculate totals
  const subtotal = sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = sale.discount || 0;
  const tax = sale.tax || (subtotal - discount) * 0.075; // Default 7.5% tax if not specified
  const total = subtotal - discount + tax;
  
  // Print the receipt directly
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Reload the page after printing to restore the app state
    // You might want to use a more elegant solution in production
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  // Save the receipt as PDF
  const handleSaveAsPDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 250] // Receipt width and approximate height
      });
      
      // Calculate the correct width and height to maintain aspect ratio
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${receiptNumber}-${date.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    }
  };
  
  // Send the receipt via email
  const handleSendEmail = () => {
    // In a real application, you would:
    // 1. Generate the PDF on the server
    // 2. Send it via email using your backend
    // 3. Show a success message
    
    // For now, we'll simulate this with a prompt
    const email = prompt("Enter email address to send the receipt:");
    
    if (email && email.includes('@')) {
      alert(`Receipt sent to ${email} successfully!`);
    } else if (email) {
      alert("Please enter a valid email address.");
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">Receipt</h3>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrint}
              className="p-2 rounded hover:bg-gray-100"
              title="Print Receipt"
            >
              <Printer size={20} />
            </button>
            <button 
              onClick={handleSaveAsPDF}
              className="p-2 rounded hover:bg-gray-100"
              title="Save as PDF"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={handleSendEmail}
              className="p-2 rounded hover:bg-gray-100"
              title="Send via Email"
            >
              <Mail size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-100"
              title="Close"
            >
              &times;
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[70vh]" id="receipt-content">
          <div 
            ref={receiptRef} 
            className="w-full max-w-[300px] mx-auto bg-white p-4 font-mono text-sm"
            style={{ minHeight: '500px' }}
          >
            {/* Store Info */}
            <div className="text-center mb-4">
              <h2 className="font-bold text-lg">{storeName}</h2>
              <p className="text-xs">123 Store Street, City</p>
              <p className="text-xs">Tel: 123-456-7890</p>
            </div>
            
            <div className="border-t border-b border-dashed py-2 mb-2">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span>{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{date}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{time}</span>
              </div>
              {sale.cashier && (
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{sale.cashier}</span>
                </div>
              )}
            </div>
            
            {/* Items */}
            <div className="mb-4">
              <div className="font-bold mb-1 border-b">
                <div className="grid grid-cols-12">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
              </div>
              
              {sale.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 text-xs py-1">
                  <span className="col-span-6">{item.name}</span>
                  <span className="col-span-2 text-right">{item.quantity}</span>
                  <span className="col-span-2 text-right">{formatCurrency(item.price, currency)}</span>
                  <span className="col-span-2 text-right">{formatCurrency(item.price * item.quantity, currency)}</span>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="border-t border-dashed pt-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount, currency)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(tax, currency)}</span>
              </div>
              
              <div className="flex justify-between font-bold border-t border-dashed mt-1 pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
              
              {sale.paymentMethod && (
                <div className="flex justify-between mt-2">
                  <span>Payment Method:</span>
                  <span>{sale.paymentMethod}</span>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="text-center text-xs mt-6 pt-2 border-t">
              <p>{footerText}</p>
              <p className="mt-2">Visit us again soon!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;