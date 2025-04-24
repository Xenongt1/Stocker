import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';
import ProfilePicture from '../components/ProfilePicture';
import { useNotification } from '../components/NotificationSystem';
import { LoadingButton, ComponentLoader } from '../components/LoadingState';
import { useAppSettings } from '../context/AppSettingsContext';
import Receipt from '../components/Receipt';
import axios from 'axios';

// Create axios instance with base URL and better error handling
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Sending request to:', config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error Response:', error.response ? error.response.data : error.message);
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
  
  // Past sales state
  const [pastSales, setPastSales] = useState([]);
  const [showPastSales, setShowPastSales] = useState(false);
  const [isFetchingSales, setIsFetchingSales] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
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
      console.log('Fetching products from API...');
      const response = await api.get('/products');
      console.log('Products fetched successfully:', response.data.length, 'items');
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      notification.error(err.response?.data?.msg || 'Failed to fetch products. Please check your connection.');
      
      // Set empty products array as fallback
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch past sales
  const fetchPastSales = async () => {
    setIsFetchingSales(true);
    try {
      const response = await api.get('/sales');
      console.log('Past sales fetched:', response.data);
      setPastSales(response.data.sales);
      setShowPastSales(true);
    } catch (err) {
      console.error('Error fetching sales:', err);
      notification.error(err.response?.data?.msg || 'Failed to fetch past sales');
      setPastSales([]);
    } finally {
      setIsFetchingSales(false);
    }
  };
  
  // View a specific sale receipt
  const viewSaleReceipt = async (saleId) => {
    try {
      const response = await api.get(`/sales/${saleId}`);
      const sale = response.data;
      
      const receiptData = {
        id: sale.saleNumber || sale._id,
        items: sale.items.map(item => ({
          id: item.product,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        discount: sale.discount,
        tax: sale.tax,
        subtotal: sale.subtotal,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        date: new Date(sale.date),
        cashier: sale.userName || (sale.userRole === 'admin' ? 'Admin' : 'User')
      };
      
      setReceiptData(receiptData);
      setShowReceipt(true);
      setShowPastSales(false);
    } catch (err) {
      console.error('Error fetching sale details:', err);
      notification.error('Failed to fetch receipt details');
    }
  };
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxRate = settings.taxRate ? settings.taxRate / 100 : 0.075; // Use settings or default to 7.5%
  const taxAmount = (subtotal - discount) * taxRate;
  const total = subtotal - discount + taxAmount;
  
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleProfileImageChange = (newImage) => {
    if (onProfileUpdate) {
      onProfileUpdate(newImage);
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    }
  };
  
  const handleSaveSettings = () => {
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
    
    if (discount > subtotal) {
      notification.warning("Discount cannot exceed subtotal amount.");
      setDiscount(subtotal);
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
      console.log('Starting sale completion process...');
      
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
      
      console.log('Attempting to send sale data to API:', JSON.stringify(saleData));
      
      // Send to the API with explicit timeout
      const response = await api.post('/sales', saleData, { 
        timeout: 10000  // 10 second timeout
      });
      
      console.log('Sale completed successfully, server response:', response.data);
      
      // Create receipt data object for display
      const receiptData = {
        id: response.data.saleNumber || response.data._id || 'SALE-' + Date.now(),
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
      
      // Clear cart
      setCart([]);
      setDiscount(0);
      setDiscountApplied(false);
    } catch (err) {
      console.error('Error completing sale:', err);
      let errorMessage = 'Failed to complete sale';
      
      if (err.response && err.response.data && err.response.data.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      notification.error(errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  };
  
  // Close the receipt and reset the sale
  const handleReceiptClose = () => {
    setShowReceipt(false);
    
    // Only clear cart if it wasn't a past sale being viewed
    if (!selectedSale) {
      // Clear cart and reset after receipt is closed
      setCart([]);
      setDiscount(0);
      setDiscountApplied(false);
    }
    
    setSelectedSale(null);
  };
  
  // Filter products based on search term
  const filteredProducts = searchTerm 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Sales Terminal</h2>
          <button
            onClick={fetchPastSales}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            View Sales History
          </button>
        </div>
        
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
                <div className="flex justify-center py-8">
                  <ComponentLoader size="medium" text="Loading products..." />
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <div key={product._id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-600">Price: ${product.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          In stock: 
                          <span className={product.quantity <= 0 ? "text-red-600 font-bold ml-1" : 
                                          product.quantity <= product.minStockLevel ? "text-yellow-600 font-bold ml-1" : "ml-1"}>
                            {product.quantity}
                          </span>
                        </p>
                      </div>
                      <button 
                        className={`px-3 py-1 rounded ${product.quantity > 0 ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        onClick={() => addToCart(product)}
                        disabled={product.quantity <= 0}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No products found</p>
                  {searchTerm && (
                    <button 
                      className="mt-2 text-blue-600 hover:underline"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear search
                    </button>
                  )}
                </div>
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
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value)) {
                                    updateQuantity(item.id, value);
                                  }
                                }}
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
                              className="text-red-600 hover:text-red-800"
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
                      min="0"
                      max={isAdmin ? subtotal : 20}
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
                    className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                  className="w-full border border-red-600 text-red-600 p-3 rounded font-bold hover:bg-red-50"
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
      
      {/* Past Sales Modal */}
      <Modal
        isOpen={showPastSales}
        onClose={() => setShowPastSales(false)}
        title="Sales History"
      >
        {isFetchingSales ? (
          <div className="flex justify-center py-8">
            <ComponentLoader size="medium" text="Loading sales history..." />
          </div>
        ) : pastSales && pastSales.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left">
                  <th className="p-2">Sale #</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Items</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastSales.map(sale => (
                  <tr key={sale._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{sale.saleNumber || sale._id.substring(0, 8)}</td>
                    <td className="p-2">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="p-2">{sale.items.length}</td>
                    <td className="p-2">${sale.total.toFixed(2)}</td>
                    <td className="p-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => viewSaleReceipt(sale._id)}
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No sales records found</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesPage;