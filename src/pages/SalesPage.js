import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';

// Sales Page Component
const SalesPage = ({ isAdmin, onNavigate, onLogout }) => {
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
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount;
  
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
      alert("Users can only apply discounts up to $20. Please contact an admin for higher discounts.");
      setDiscount(20);
    }
    setDiscountApplied(true);
  };
  
  // Complete sale
  const completeSale = () => {
    alert(`Sale completed! Total: $${total.toFixed(2)}`);
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
      <Sidebar isAdmin={isAdmin} activePage="sales" onNavigate={onNavigate} onLogout={onLogout} />
      
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
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  className="w-full bg-green-600 text-white p-3 rounded font-bold"
                  onClick={completeSale}
                  disabled={cart.length === 0}
                >
                  Complete Sale
                </button>
                
                <button 
                  className="w-full border border-red-600 text-red-600 p-3 rounded font-bold"
                  onClick={() => {
                    setCart([]);
                    setDiscount(0);
                    setDiscountApplied(false);
                  }}
                  disabled={cart.length === 0}
                >
                  Cancel Sale
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold mb-2">Payment Method</h4>
                <div className="space-y-2">
                  <button className="w-full bg-blue-100 text-blue-700 p-2 rounded border border-blue-300">
                    Cash
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 p-2 rounded border border-gray-300">
                    Credit Card
                  </button>
                  <button className="w-full bg-gray-100 text-gray-700 p-2 rounded border border-gray-300">
                    Mobile Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default SalesPage;