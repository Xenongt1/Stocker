import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';
import ProfilePicture from '../components/ProfilePicture';
import { useNotification } from '../components/NotificationSystem';
import { LoadingButton } from '../components/LoadingState';
import { useAppSettings } from '../context/AppSettingsContext';
import Receipt from '../components/Receipt';
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add a request interceptor to include the auth token with every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Sales Page Component
const SalesPage = ({ isAdmin, onNavigate, onLogout, profileImage, onProfileUpdate }) => {
  const [cart, setCart] = useState([]);
  const { settings } = useAppSettings();
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // Fetch products from API when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Fetch products from API
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      setIsLoading(false);
    } catch (err) {
      notification.error(err.response?.data?.msg || 'Failed to fetch products. Please check your connection.');
      setIsLoading(false);
    }
  };
  
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
    const existingItem = cart.find(item => item.id === product._id);
    
    if (existingItem) {
      // Make sure we don't exceed available quantity
      if (existingItem.quantity + 1 > product.quantity) {
        notification.warning(`Only ${product.quantity} units available in stock`);
        return;
      }
      
      const updatedCart = cart.map(item => 
        item.id === product._id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } 
          : item
      );
      setCart(updatedCart);
    } else {
      if (product.quantity < 1) {
        notification.warning('This product is out of stock');
        return;
      }
      
      setCart([...cart, { 
        id: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        total: product.price 
      }]);
    }
  };
  
  // Remove product from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  // Update product quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Find the product to check stock
    const product = products.find(p => p._id === productId);
    
    if (product && newQuantity > product.quantity) {
      notification.warning(`Only ${product.quantity} units available in stock`);
      return;
    }
    
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
  const completeSale = async () => {
    if (cart.length === 0) {
      notification.error("Cannot complete sale with an empty cart.");
      return;
    }
    
    setIsProcessingSale(true);
    
    try {
      // Format sale data for the API
      const saleData = {
        items: cart.map(item => ({
          product: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal: subtotal,
        discount: discount,
        tax: taxAmount,
        total: total,
        paymentMethod: paymentMethod
      };
      
      // Send to the API
      const response = await api.post('/sales', saleData);
      
      // Create receipt data object for display
      const receiptData = {
        id: response.data._id || `SALE-${Date.now().toString().slice(-6)}`,
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
      
      notification.success(`Sale completed! Total: $${total.toFixed(2)}`);
      
      // Generate receipt
      generateReceipt(receiptData);
      
      // Refresh products to get updated stock
      fetchProducts();
    } catch (err) {
      notification.error(err.response?.data?.msg || 'Failed to complete sale');
    } finally {
      setIsProcessingSale(false);
    }
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
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;
  
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
              
              {isLoading ? (
                <p className="text-center py-4">Loading products...</p>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <div key={product._id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600">Price: ${product.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">In stock: {product.quantity}</p>
                      </div>
                      <button 
                        className={`px-3 py-1 rounded ${product.quantity > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        onClick={() => addToCart(product)}
                        disabled={product.quantity <= 0}
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
          storeName={settings.storeName}
          currency={settings.currency}
          footerText={settings.receiptFooter}
          onClose={handleReceiptClose}
        />
      )}
    </div>
  );
};

export default SalesPage;