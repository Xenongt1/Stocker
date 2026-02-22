import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';
import ProfilePicture from '../components/ProfilePicture';
import { useNotification } from '../components/NotificationSystem';
import { LoadingButton, ComponentLoader } from '../components/LoadingState';
import { useAppSettings } from '../context/AppSettingsContext';
import { useCurrency } from '../hooks/useCurrency';
import { getCurrencySymbol } from '../utils/formatCurrency';
import Receipt from '../components/Receipt';
import BarcodeScanner from '../components/BarcodeScanner';
import { Camera } from '../components/Icons';
import { salesService, productService } from '../services/api';

// Sales Page Component
const SalesPage = ({ isAdmin, onNavigate, onLogout, profileImage, onProfileUpdate }) => {
  const [cart, setCart] = useState([]);
  const { settings } = useAppSettings();
  const { currency, formatCurrency } = useCurrency();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [discount, setDiscount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false); // Scanner state

  // Show receipt state
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Past sales state
  const [pastSales, setPastSales] = useState([]);
  const [showPastSales, setShowPastSales] = useState(false);
  const [isFetchingSales, setIsFetchingSales] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Get notification functions with correct names
  const {
    success: showNotification,
    error: showError,
    warning: showWarning
  } = useNotification();

  // Fetch products from API when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching products from API...');
      const response = await productService.getAllProducts();
      console.log('Products fetched successfully:', response.length, 'items');
      setProducts(response);
    } catch (err) {
      console.error('Error fetching products:', err);
      showError(err.message || 'Failed to fetch products. Please check your connection.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch past sales
  const fetchPastSales = async () => {
    setIsFetchingSales(true);
    setShowPastSales(true);
    try {
      const sales = await salesService.getSales();
      setPastSales(sales);
    } catch (err) {
      console.error('Error fetching sales:', err);
      showError(err.message || 'Failed to fetch sales history');
    } finally {
      setIsFetchingSales(false);
    }
  };

  // View a specific sale receipt
  const viewSaleReceipt = async (saleId) => {
    try {
      console.log('Fetching sale details for ID:', saleId);
      const sale = await salesService.getSale(saleId);
      console.log('Sale details fetched:', sale);

      const receiptData = {
        id: sale.id,
        items: sale.items.map(item => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total
        })),
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: sale.total,
        payment_method: sale.payment_method,
        date: new Date(sale.created_at),
        cashier: sale.cashier_name || 'Admin'
      };

      setReceiptData(receiptData);
      setShowReceipt(true);
      setShowPastSales(false);
    } catch (err) {
      console.error('Error fetching sale details:', err);
      showError(err.message || 'Failed to fetch receipt details');
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

  // Add product to cart logic (defined before effect to avoid hoisting issues)
  const handleAddToCart = (product, currentCart) => {
    const existingItem = currentCart.find(item => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > product.quantity) {
        showWarning(`Only ${product.quantity} units available in stock`);
        return currentCart;
      }

      return currentCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      );
    } else {
      if (product.quantity < 1) {
        showWarning('This product is out of stock');
        return currentCart;
      }

      return [...currentCart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }];
    }
  };

  // Handler for barcode scan (both camera and hardware)
  const handleBarcodeScan = (code) => {
    console.log('Barcode scanned:', code);
    const product = products.find(p => p.sku === code);

    if (product) {
      if (product.quantity > 0) {
        setCart(prevCart => {
          const newCart = handleAddToCart(product, prevCart);
          // Notify only if actually added (logic inside handleAddToCart handles warnings but returns cart)
          // We can just notify here for simplicity
          showNotification(`Added ${product.name} to cart`);
          return newCart;
        });
      } else {
        showWarning(`${product.name} is out of stock`);
      }
    } else {
      showWarning(`Product with SKU "${code}" not found`);
    }
    setShowBarcodeScanner(false);
  };

  // Handle hardware barcode scanner (keyboard input)
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = 0;
    const BARCODE_DELAY = 50;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 2) {
          handleBarcodeScan(barcodeBuffer);
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        if (currentTime - lastKeyTime > BARCODE_DELAY) {
          barcodeBuffer = '';
        }
        barcodeBuffer += e.key;
      }
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]); // Re-bind when products change so we have latest list

  // Allow manual add to cart (button click)
  const addToCart = (product) => {
    setCart(prevCart => handleAddToCart(product, prevCart));
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Update product quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    // Find the product to check stock
    const product = products.find(p => p.id === productId);

    if (product && newQuantity > product.quantity) {
      showWarning(`Only ${product.quantity} units available in stock`);
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
      showWarning("Users can only apply discounts up to $20. Please contact an admin for higher discounts.");
      setDiscount(20);
    }

    if (discount > subtotal) {
      showWarning("Discount cannot exceed subtotal amount.");
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
      showError("Cannot complete sale with an empty cart.");
      return;
    }

    setIsProcessingSale(true);

    try {
      console.log('Starting sale completion process...');

      // Format sale data for the API
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        })),
        subtotal: subtotal,
        discount: discount,
        tax: taxAmount,
        total: total,
        payment_method: paymentMethod
      };

      console.log('Attempting to send sale data to API:', JSON.stringify(saleData));

      // Send to the API
      const response = await salesService.recordSale(saleData);

      console.log('Sale completed successfully, server response:', response);

      // Create receipt data object for display
      const receiptData = {
        id: response.id,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.quantity * item.price
        })),
        subtotal: subtotal,
        discount: discount,
        tax: taxAmount,
        total: total,
        payment_method: paymentMethod,
        date: new Date(response.created_at),
        cashier: isAdmin ? 'Admin' : 'User'
      };

      showNotification(`Sale completed! Total: ${formatCurrency(total)}`);

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

      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      showError(errorMessage);
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
                <button
                  className="bg-purple-600 text-white px-4 py-2 rounded flex items-center justify-center whitespace-nowrap"
                  onClick={() => setShowBarcodeScanner(true)}
                >
                  <Camera className="w-5 h-5 mr-1" />
                  <span>Scan</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <ComponentLoader size="medium" text="Loading products..." />
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-600">Price: {formatCurrency(product.price)}</p>
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
                          <td className="py-2">{formatCurrency(item.price)}</td>
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
                          <td className="py-2">{formatCurrency(item.total)}</td>
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
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span>Discount:</span>
                  <div className="flex items-center">
                    <span className="mr-2">{getCurrencySymbol(currency)}</span>
                    <input
                      type="number"
                      className="w-16 border rounded p-1 mr-1"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        // Check max discount if set (0 means no limit)
                        const maxDiscount = settings.maxDiscount !== undefined && settings.maxDiscount !== null ? settings.maxDiscount : 0;

                        if (maxDiscount > 0 && val > maxDiscount) {
                          showError(`Maximum discount allowed is ${getCurrencySymbol(currency)}${maxDiscount}`);
                          return;
                        }
                        setDiscount(val);
                      }}
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
                  <span>{formatCurrency(taxAmount)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
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
          footerText={settings.receiptFooter}
          onClose={handleReceiptClose}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Past Sales Modal */}
      <Modal
        isOpen={showPastSales}
        onClose={() => setShowPastSales(false)}
        title="Sales History"
        maxWidth="max-w-4xl"
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              if (!pastSales || pastSales.length === 0) return;
              const headers = ['Sale ID', 'Date', 'Items', 'Total', 'Cashier'];
              const csvContent = [
                headers.join(','),
                ...pastSales.map(sale => [
                  sale.id,
                  new Date(sale.created_at).toLocaleDateString(),
                  sale.items.length,
                  sale.total,
                  sale.cashier_name || 'System'
                ].join(','))
              ].join('\n');

              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `sales_history_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
            disabled={!pastSales || pastSales.length === 0}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download CSV
          </button>
        </div>

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
                  <th className="p-2">Cashier</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastSales.map(sale => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{sale.id}</td>
                    <td className="p-2">{new Date(sale.created_at).toLocaleDateString()}</td>
                    <td className="p-2">{sale.items.length}</td>
                    <td className="p-2">{formatCurrency(parseFloat(sale.total))}</td>
                    <td className="p-2">{sale.cashier_name || 'System'}</td>
                    <td className="p-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => viewSaleReceipt(sale.id)}
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