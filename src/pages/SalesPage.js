import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';
import ProfilePicture from '../components/ProfilePicture';
import { useNotification } from '../components/NotificationSystem';
import { LoadingButton } from '../components/LoadingState';

// Sales Page Component
const SalesPage = ({ isAdmin, onNavigate, onLogout, profileImage, onProfileUpdate }) => {
  const [cart, setCart] = useState([
    { id: 2, name: 'Headphones', price: 59.99, quantity: 2, total: 119.98 }
  ]);
  
  const [searchResults, setSearchResults] = useState([
    { id: 1, name: 'Laptop', price: 999.99, quantity: 15 },
    { id: 3, name: 'Office Chair', price: 149.99, quantity: 8 },
    { id: 4, name: 'Desk Lamp', price: 29.99, quantity: 5 },
    { id: 5, name: 'Wireless Mouse', price: 24.99, quantity: 3 },
  ]);
  
  const [discount, setDiscount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  
  // Show receipt state
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  // Use the notification context
  const notification = useNotification();
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.075; // 7.5% tax rate
  const taxAmount = (subtotal - discount) * taxRate;
  const total = subtotal - discount + taxAmount;
  
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleProfileImageChange = (newImage) => {
    // Call the parent handler to update the profile image in App.js
    if (onProfileUpdate) {
      onProfileUpdate(newImage);
      
      // Show success message briefly
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    }
  };
  
  const handleSaveSettings = () => {
    // In a real application, you would save these settings to a database
    // For now, just show a success message
    setUpdateSuccess(true);
    setTimeout(() => {
      setUpdateSuccess(false);
    }, 3000);
  };

  // Add product to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      const updatedCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } 
          : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1, total: product.price }]);
    }
  };
  
  // Remove product from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  // Update product quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price } 
        : item
    );
    
    setCart(updatedCart);
  };
  
  // Apply discount
  const applyDiscount = () => {
    if (!isAdmin && discount > 20) {
      notification.warning("Users can only apply discounts up to $20. Please contact an admin for higher discounts.");
      setDiscount(20);
    }
    setDiscountApplied(true);
  };
  
  // Generate receipt for a sale
  const generateReceipt = (saleData) => {
    setReceiptData(saleData);
    setShowReceipt(true);
  };
  
  // Complete sale
  const completeSale = () => {
    if (cart.length === 0) {
      notification.error("Cannot complete sale with an empty cart.");
      return;
    }
    
    setIsProcessingSale(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Generate a unique sale ID
      const saleId = `SALE-${Date.now().toString().slice(-6)}`;
      
      // Create sale data object
      const saleData = {
        id: saleId,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        discount: discount,
        tax: taxAmount,
        total: total,
        paymentMethod: paymentMethod,
        date: new Date(),
        cashier: isAdmin ? 'Admin' : 'User'
      };
      
      // In a real app, you would save this to your database
      console.log("Sale completed:", saleData);
      
      // Show success notification
      notification.success(`Sale completed! Total: $${total.toFixed(2)}`);
      
      // Generate receipt
      generateReceipt(saleData);
      
      setIsProcessingSale(false);
    }, 1000);
  };
  
  // Close the receipt and reset the sale
  const handleReceiptClose = () => {
    setShowReceipt(false);
    // Clear cart and reset after receipt is closed
    setCart([]);
    setDiscount(0);
    setDiscountApplied(false);
  };
  
  // Filter products based on search term
  const filteredProducts = searchTerm 
    ? searchResults.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : searchResults;
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar 
        isAdmin={isAdmin} 
        activePage="sales" 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        profileImage={profileImage}
      />
      
      <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Sales Terminal</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Product search and results */}
          <div className="lg:col-span-2">
            <div className="bg-white p-4 rounded shadow mb-4">
              <div className="flex flex-col sm:flex-row mb-4 gap-2">
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="flex-1 p-2 border rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded">
                  Search
                </button>
              </div>
              
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600">Price: ${product.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">In stock: {product.quantity}</p>
                      </div>
                      <button 
                        className="bg-green-500 text-white px-3 py-1 rounded"
                        onClick={() => addToCart(product)}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No products found</p>
              )}
            </div>
            
            {/* Cart */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-4">Current Cart</h3>
              
              {cart.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Quantity</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">${item.price.toFixed(2)}</td>
                          <td className="py-2">
                            <div className="flex items-center">
                              <button 
                                className="w-8 h-8 border rounded-l flex items-center justify-center"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                -
                              </button>
                              <input 
                                type="number" 
                                className="w-12 h-8 border-t border-b text-center" 
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                min="1"
                              />
                              <button 
                                className="w-8 h-8 border rounded-r flex items-center justify-center"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2">${item.total.toFixed(2)}</td>
                          <td className="py-2">
                            <button 
                              className="text-red-600"
                              onClick={() => removeFromCart(item.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Cart is empty</p>
              )}
            </div>
          </div>
          
          {/* Order summary */}
          <div>
            <div className="bg-white p-4 rounded shadow lg:sticky lg:top-6">
              <h3 className="font-bold border-b pb-2 mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span>Discount:</span>
                  <div className="flex items-center">
                    <span className="mr-2">$</span>
                    <input 
                      type="number" 
                      className="w-16 border rounded p-1 mr-1" 
                      value={discount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setDiscount(isNaN(value) ? 0 : value);
                        setDiscountApplied(false);
                      }}
                      disabled={discountApplied}
                    />
                    <button 
                      className={`text-xs px-2 py-1 rounded ${discountApplied ? 'bg-gray-300' : 'bg-blue-500 text-white'}`}
                      onClick={applyDiscount}
                      disabled={discountApplied}
                    >
                      Apply
                    </button>
                  </div>
                </div>
                
                {!isAdmin && discount > 20 && !discountApplied && (
                  <div className="text-red-500 text-sm">
                    You can only apply discounts up to $20. Admin approval needed.
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {!isProcessingSale ? (
                  <button 
                    className="w-full bg-green-600 text-white p-3 rounded font-bold"
                    onClick={completeSale}
                    disabled={cart.length === 0}
                  >
                    Complete Sale
                  </button>
                ) : (
                  <LoadingButton 
                    isLoading={true}
                    loadingText="Processing..."
                    className="w-full bg-green-600 text-white p-3 rounded font-bold"
                    disabled={true}
                  >
                    Complete Sale
                  </LoadingButton>
                )}
                
                <button 
                  className="w-full border border-red-600 text-red-600 p-3 rounded font-bold"
                  onClick={() => {
                    setCart([]);
                    setDiscount(0);
                    setDiscountApplied(false);
                  }}
                  disabled={cart.length === 0 || isProcessingSale}
                >
                  Cancel Sale
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold mb-2">Payment Method</h4>
                <div className="space-y-2">
                  <button 
                    className={`w-full p-2 rounded border ${paymentMethod === 'Cash' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                    onClick={() => setPaymentMethod('Cash')}
                  >
                    Cash
                  </button>
                  <button 
                    className={`w-full p-2 rounded border ${paymentMethod === 'Credit Card' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                    onClick={() => setPaymentMethod('Credit Card')}
                  >
                    Credit Card
                  </button>
                  <button 
                    className={`w-full p-2 rounded border ${paymentMethod === 'Mobile Payment' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                    onClick={() => setPaymentMethod('Mobile Payment')}
                  >
                    Mobile Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <Receipt 
          sale={receiptData}
          storeName="Stocker Store"
          currency="USD"
          footerText="Thank you for your purchase!"
          onClose={handleReceiptClose}
        />
      )}
    </div>
  );
};

// Receipt Component
const Receipt = ({ sale, storeName, currency, footerText, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const receiptRef = React.useRef(null);
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };
  
  // Get current date and time for receipt
  const today = new Date();
  const date = today.toLocaleDateString();
  const time = today.toLocaleTimeString();
  
  // Receipt number
  const receiptNumber = sale.id || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  
  // Calculate totals
  const subtotal = sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = sale.discount || 0;
  const tax = sale.tax || 0;
  const total = subtotal - discount + tax;
  
  // Print the receipt
  const handlePrint = () => {
    setIsPrinting(true);
    
    setTimeout(() => {
      const printContent = document.getElementById('receipt-content').innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      
      // Reload the page after printing to restore the app state
      window.location.reload();
    }, 500);
  };
  
  // Save the receipt as PDF
  const handleSaveAsPDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // Dynamically import the libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 250]
      });
      
      // Calculate the correct dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${receiptNumber}-${date.replace(/\//g, '-')}.pdf`);
      
      setIsGeneratingPDF(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
      setIsGeneratingPDF(false);
    }
  };
  
  // Send the receipt via email
  const handleSendEmail = () => {
    setIsSendingEmail(true);
    
    // Simulate email sending
    setTimeout(() => {
      const email = prompt("Enter email address to send the receipt:");
      
      if (email && email.includes('@')) {
        alert(`Receipt sent to ${email} successfully!`);
      } else if (email) {
        alert("Please enter a valid email address.");
      }
      
      setIsSendingEmail(false);
    }, 500);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">Receipt</h3>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrint}
              className="p-2 rounded hover:bg-gray-100 relative"
              title="Print Receipt"
              disabled={isPrinting}
            >
              {isPrinting ? (
                <div className="loader w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
              )}
            </button>
            <button 
              onClick={handleSaveAsPDF}
              className="p-2 rounded hover:bg-gray-100 relative"
              title="Save as PDF"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <div className="loader w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              )}
            </button>
            <button 
              onClick={handleSendEmail}
              className="p-2 rounded hover:bg-gray-100 relative"
              title="Send via Email"
              disabled={isSendingEmail}
            >
              {isSendingEmail ? (
                <div className="loader w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              )}
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
                  <span className="col-span-2 text-right">{formatCurrency(item.price)}</span>
                  <span className="col-span-2 text-right">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="border-t border-dashed pt-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              
              <div className="flex justify-between font-bold border-t border-dashed mt-1 pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(total)}</span>
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

export default SalesPage;