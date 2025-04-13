import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import InventoryItem from '../components/InventoryItem';

const InventoryPage  = ({ isAdmin, onNavigate, onLogout }) => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Laptop', sku: 'TECH001', price: 999.99, costPrice: 750, quantity: 15, category: 'Electronics' },
    { id: 2, name: 'Headphones', sku: 'TECH002', price: 59.99, costPrice: 35, quantity: 30, category: 'Electronics' },
    { id: 3, name: 'Office Chair', sku: 'FURN001', price: 149.99, costPrice: 100, quantity: 8, category: 'Furniture' },
    { id: 4, name: 'Desk Lamp', sku: 'HOME001', price: 29.99, costPrice: 15, quantity: 5, category: 'Home' },
    { id: 5, name: 'Wireless Mouse', sku: 'TECH003', price: 24.99, costPrice: 12, quantity: 3, category: 'Electronics' },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    costPrice: '',
    quantity: '',
    category: ''
  });
  
  const handleAddProduct = () => {
    const productToAdd = {
      ...newProduct,
      id: products.length + 1,
      price: parseFloat(newProduct.price),
      costPrice: parseFloat(newProduct.costPrice),
      quantity: parseInt(newProduct.quantity)
    };
    
    setProducts([...products, productToAdd]);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      sku: '',
      price: '',
      costPrice: '',
      quantity: '',
      category: ''
    });
  };
  
  return (
    <div className="flex">
      <Sidebar isAdmin={isAdmin} activePage="inventory" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            onClick={() => setShowAddModal(true)}
          >
            <span>Add New Product</span>
          </button>
        </div>
        
        {/* Filters and search */}
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <select className="p-2 border rounded">
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Home">Home</option>
                <option value="Soap">Soap</option>
              </select>
            </div>
            <div>
              <select className="p-2 border rounded">
                <option value="">Sort By</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="quantity">Quantity</option>
              </select>
            </div>
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
              Filter
            </button>
          </div>
        </div>
        
        {/* Products table */}
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2 px-2">Name</th>
                <th className="pb-2 px-2">SKU</th>
                <th className="pb-2 px-2">Price</th>
                {isAdmin && (
                  <th className="pb-2 px-2">Cost</th>
                )}
                <th className="pb-2 px-2">Quantity</th>
                <th className="pb-2 px-2">Category</th>
                <th className="pb-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{product.name}</td>
                  <td className="py-2 px-2">{product.sku}</td>
                  <td className="py-2 px-2">${product.price.toFixed(2)}</td>
                  {isAdmin && (
                    <td className="py-2 px-2">${product.costPrice.toFixed(2)}</td>
                  )}
                  <td className={`py-2 px-2 ${product.quantity <= 5 ? 'text-red-500 font-bold' : ''}`}>
                    {product.quantity}
                  </td>
                  <td className="py-2 px-2">{product.category}</td>
                  <td className="py-2 px-2">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:underline">
                        {isAdmin ? 'Edit' : 'View'}
                      </button>
                      {isAdmin && (
                        <button className="text-red-600 hover:underline">
                          Delete
                        </button>
                      )}
                      <button className="text-green-600 hover:underline">
                        {product.quantity > 0 ? 'Sell' : 'Restock'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-4 flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">Showing 1 to {products.length} of {products.length} entries</span>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border rounded bg-gray-100">Previous</button>
              <button className="px-3 py-1 border rounded bg-blue-500 text-white">1</button>
              <button className="px-3 py-1 border rounded">2</button>
              <button className="px-3 py-1 border rounded">3</button>
              <button className="px-3 py-1 border rounded bg-gray-100">Next</button>
            </div>
          </div>
        </div>
        
        {/* Add Product Modal */}
        <Modal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)}
          title="Add New Product"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={newProduct.sku}
                onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded" 
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              />
            </div>
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded" 
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({...newProduct, costPrice: e.target.value})}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded" 
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="w-full p-2 border rounded"
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Home">Home</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button 
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleAddProduct}
            >
              Add Product
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default InventoryPage;