import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';
import ProfilePicture from '../components/ProfilePicture';
import { useNotification } from '../components/NotificationSystem';
import { LoadingButton } from '../components/LoadingState';
import { useAppSettings } from '../context/AppSettingsContext';
import Receipt from '../components/Receipt';

// Sales Page Component
const SalesPage = ({ isAdmin, onNavigate, onLogout, profileImage, onProfileUpdate }) => {
  const [cart, setCart] = useState([
    { id: 2, name: 'Headphones', price: 59.99, quantity: 2, total: 119.98 }
  ]);
  const { settings } = useAppSettings();
  
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
                  disabled
                    className={`w-full p-2 rounded border ${paymentMethod === 'Credit Card' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                    onClick={() => setPaymentMethod('Credit Card')}
                  >
                    Credit Card
                  </button>
                  <button 
                  disabled
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
      storeName={settings.storeName}
      currency={settings.currency}
      footerText={settings.receiptFooter}
      onClose={handleReceiptClose}
    />
  )}
    </div>
  );
};

// Receipt Component


export default SalesPage;