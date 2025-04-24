import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import InventoryItem from '../components/InventoryItem';
import SearchBar from '../components/SearchBar';
import Breadcrumbs from '../components/Breadcrumbs';
import { Plus } from '../components/Icons';
import { useNotification } from '../components/NotificationSystem';
import { validateForm, validateRequired, validateNumber, validateSKU } from '../utils/validation';
import { Form, FormInput, FormSelect, FormTextarea, FormRow, FormGroup } from '../components/FormComponents';
import { exportAsCSV } from '../utils/dataImportExport';
import ConfirmationDialog from '../components/ConfirmationDialog';
import BarcodeScanner from '../components/BarcodeScanner';
import { ComponentLoader } from '../components/LoadingState';
import ProfilePicture from '../components/ProfilePicture';
import axios from 'axios';

// Enhanced API connection and error handling code
// Add this to your InventoryPage.js file

// Create axios instance with correct error handling
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add request interceptor with better error logging
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

// Add response interceptor for better error handling
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

// Updated fetch products function with better error handling
const fetchProducts = async () => {
  setIsLoading(true);
  try {
    console.log('Fetching products from API...');
    const response = await api.get('/products');
    console.log('Products fetched successfully:', response.data.length, 'items');
    setProducts(response.data);
    setFilteredProducts(response.data);
    setIsLoading(false);
  } catch (err) {
    console.error('Error fetching products:', err);
    showError(err.response?.data?.msg || 'Failed to fetch products. Please check your connection to the backend server.');
    
    // Even if there's an error, we should stop loading
    setIsLoading(false);
    
    // If the API is not available, let's show an empty products list instead of hanging on loading
    setProducts([]);
    setFilteredProducts([]);
  }
};

// Enhanced add product function with better validation and error handling
const handleAddProduct = async (e) => {
  e.preventDefault();
  
  if (!validateProductForm()) {
    showError('Please fix the form errors before submitting.');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    console.log('Form data before conversion:', productForm);
    
    // Sanitize and convert the numeric values
    const newProduct = {
      name: productForm.name,
      sku: productForm.sku,
      price: parseFloat(productForm.price.replace(',', '.')),
      costPrice: parseFloat((productForm.costPrice || '0').replace(',', '.')),
      quantity: parseInt(productForm.quantity),
      category: productForm.category,
      description: productForm.description,
      minStockLevel: productForm.minStockLevel ? parseInt(productForm.minStockLevel) : 5
    };
    
    console.log('Sending new product to API:', newProduct);
    
    const response = await api.post('/products', newProduct);
    console.log('Product added successfully, server response:', response.data);
    
    // Update products with the response from server
    setProducts([...products, response.data]);
    
    // Apply current filters to new products list
    if (searchQuery || Object.keys(searchFilters).length > 0) {
      // Re-apply current search
      handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
    } else {
      // If no active filters, update filtered products directly
      setFilteredProducts([...filteredProducts, response.data]);
    }
    
    setShowAddModal(false);
    success('Product added successfully!');
  } catch (err) {
    console.error('Add product error:', err);
    let errorMessage = 'Failed to add product. Please try again.';
    
    if (err.response) {
      console.error('Server error details:', err.response.data);
      errorMessage = err.response.data.msg || errorMessage;
    }
    
    showError(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

const InventoryPage = ({ isAdmin, onNavigate, onLogout, profileImage, onProfileUpdate }) => {
  // STATE
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState({});
  
  // MODAL STATE
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // FORM STATE
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    price: '',
    costPrice: '',
    quantity: '',
    category: '',
    description: '',
    minStockLevel: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // REFS
  const searchTimeoutRef = useRef(null);
  const isSearchingRef = useRef(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // NOTIFICATION
  const { success, error: showError } = useNotification();
  
  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Fetch products from API
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      setFilteredProducts(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      showError(err.response?.data?.msg || 'Failed to fetch products. Please check your connection.');
      setIsLoading(false);
    }
  };
  
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
  
  // SEARCH HANDLING
  const handleSearch = (searchData) => {
    let filtered = [...products];
    
    // Process simple search
    if (typeof searchData === 'string') {
      const term = searchData.toLowerCase();
      if (term) {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(term) || 
          product.sku.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
        );
      }
    } 
    // Process advanced search
    else if (searchData && typeof searchData === 'object') {
      const { searchTerm, filters } = searchData;
      
      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(term) || 
          product.sku.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
        );
      }
      
      // Apply additional filters if they exist
      if (filters) {
        const { category, stockStatus, sortBy } = filters;
        
        // Category filter
        if (category) {
          filtered = filtered.filter(product => product.category === category);
        }
        
        // Stock status filter
        if (stockStatus) {
          switch (stockStatus) {
            case 'inStock':
              filtered = filtered.filter(product => product.quantity > product.minStockLevel);
              break;
            case 'lowStock':
              filtered = filtered.filter(product => 
                product.quantity <= product.minStockLevel && product.quantity > 0
              );
              break;
            case 'outOfStock':
              filtered = filtered.filter(product => product.quantity <= 0);
              break;
          }
        }
        
        // Sorting
        if (sortBy) {
          switch (sortBy) {
            case 'name':
              filtered.sort((a, b) => a.name.localeCompare(b.name));
              break;
            case 'nameDesc':
              filtered.sort((a, b) => b.name.localeCompare(a.name));
              break;
            case 'priceLow':
              filtered.sort((a, b) => a.price - b.price);
              break;
            case 'priceHigh':
              filtered.sort((a, b) => b.price - a.price);
              break;
            case 'quantityLow':
              filtered.sort((a, b) => a.quantity - b.quantity);
              break;
            case 'quantityHigh':
              filtered.sort((a, b) => b.quantity - a.quantity);
              break;
          }
        }
      }
    }
    
    // Update filtered products
    setFilteredProducts(filtered);
  };
  
  // Initialize form for adding a new product
  const initializeAddForm = () => {
    setProductForm({
      name: '',
      sku: '',
      price: '',
      costPrice: '',
      quantity: '',
      category: '',
      description: '',
      minStockLevel: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };
  
  // Initialize form for editing a product
  const initializeEditForm = (product) => {
    setCurrentProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      quantity: product.quantity.toString(),
      category: product.category,
      description: product.description || '',
      minStockLevel: product.minStockLevel ? product.minStockLevel.toString() : ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };
  
  // Handle showing delete confirmation
  const handleShowDeleteModal = (product) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear the specific error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validate product form
  const validateProductForm = () => {
    // Define validation rules
    const validationRules = {
      name: [validateRequired],
      sku: [validateRequired, validateSKU],
      price: [(value) => validateNumber(value, { min: 0.01 })],
      quantity: [(value) => validateNumber(value, { min: 0, integer: true })],
      category: [validateRequired]
    };
    
    // Add cost price validation for admin
    if (isAdmin) {
      validationRules.costPrice = [(value) => validateNumber(value, { min: 0.01 })];
    }
    
    // Add min stock level validation if provided
    if (productForm.minStockLevel !== '') {
      validationRules.minStockLevel = [(value) => validateNumber(value, { required: false, min: 0, integer: true })];
    }
    
    // Run validation
    const result = validateForm(productForm, validationRules);
    setFormErrors(result.errors);
    return result.isValid;
  };
  
  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!validateProductForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    const newProduct = {
      name: productForm.name,
      sku: productForm.sku,
      price: parseFloat(productForm.price),
      costPrice: parseFloat(productForm.costPrice || 0),
      quantity: parseInt(productForm.quantity),
      category: productForm.category,
      description: productForm.description,
      minStockLevel: productForm.minStockLevel ? parseInt(productForm.minStockLevel) : 5
    };
    
    try {
      const response = await api.post('/products', newProduct);
      
      // Update products with the response from server
      setProducts([...products, response.data]);
      
      // Apply current filters to new products list
      if (searchQuery || Object.keys(searchFilters).length > 0) {
        // Re-apply current search
        handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
      } else {
        // If no active filters, update filtered products directly
        setFilteredProducts([...filteredProducts, response.data]);
      }
      
      setShowAddModal(false);
      success('Product added successfully!');
    } catch (err) {
      showError(err.response?.data?.msg || 'Failed to add product. Please try again.');
      console.error('Add product error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Edit existing product
  const handleEditProduct = async (e) => {
    e.preventDefault();
    
    if (!validateProductForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    const updatedProduct = {
      name: productForm.name,
      sku: productForm.sku,
      price: parseFloat(productForm.price),
      costPrice: parseFloat(productForm.costPrice || 0),
      quantity: parseInt(productForm.quantity),
      category: productForm.category,
      description: productForm.description,
      minStockLevel: productForm.minStockLevel ? parseInt(productForm.minStockLevel) : currentProduct.minStockLevel
    };
    
    try {
      const response = await api.put(`/products/${currentProduct._id}`, updatedProduct);
      
      // Update products with the response from server
      setProducts(products.map(product => 
        product._id === currentProduct._id ? response.data : product
      ));
      
      // Apply current filters to updated products list
      if (searchQuery || Object.keys(searchFilters).length > 0) {
        // Re-apply current search
        handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
      } else {
        // If no active filters, update filtered products directly
        setFilteredProducts(filteredProducts.map(product => 
          product._id === currentProduct._id ? response.data : product
        ));
      }
      
      setShowEditModal(false);
      setCurrentProduct(null);
      success('Product updated successfully!');
    } catch (err) {
      showError(err.response?.data?.msg || 'Failed to update product. Please try again.');
      console.error('Update product error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete product
  const handleDeleteProduct = async () => {
    setIsLoading(true);
    
    try {
      await api.delete(`/products/${currentProduct._id}`);
      
      // Update products
      const updatedProducts = products.filter(product => product._id !== currentProduct._id);
      setProducts(updatedProducts);
      
      // Apply current filters to updated products list
      if (searchQuery || Object.keys(searchFilters).length > 0) {
        // Re-apply current search
        handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
      } else {
        // If no active filters, update filtered products directly
        setFilteredProducts(filteredProducts.filter(product => product._id !== currentProduct._id));
      }
      
      setShowDeleteModal(false);
      setCurrentProduct(null);
      success('Product deleted successfully!');
    } catch (err) {
      showError(err.response?.data?.msg || 'Failed to delete product. Please try again.');
      console.error('Delete product error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update product stock quantity
  const handleUpdateStock = async (productId, adjustmentAmount) => {
    if (!adjustmentAmount) return;
    
    try {
      const response = await api.put(`/products/stock/${productId}`, { adjustment: adjustmentAmount });
      
      // Update products with the response from server
      setProducts(products.map(product => 
        product._id === productId ? response.data : product
      ));
      
      // Apply current filters to updated products list
      if (searchQuery || Object.keys(searchFilters).length > 0) {
        // Re-apply current search
        handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
      } else {
        // If no active filters, update filtered products directly
        setFilteredProducts(filteredProducts.map(product => 
          product._id === productId ? response.data : product
        ));
      }
      
      success(`Stock updated successfully! Adjustment: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount}`);
    } catch (err) {
      showError(err.response?.data?.msg || 'Failed to update stock. Please try again.');
      console.error('Update stock error:', err);
    }
  };
  
  // Handle export data
  const handleExportData = () => {
    try {
      exportAsCSV(filteredProducts, 'inventory.csv');
      success('Inventory data exported successfully!');
    } catch (err) {
      showError('Failed to export data. Please try again.');
      console.error('Export error:', err);
    }
  };
  
  // Handle barcode scan
  const handleBarcodeScan = (barcode) => {
    success(`Barcode scanned: ${barcode}`);
    
    // Find product by SKU (simulating barcode = SKU for this demo)
    const found = products.find(p => p.sku === barcode);
    
    if (found) {
      setCurrentProduct(found);
      setShowBarcodeScanner(false);
      initializeEditForm(found);
    } else {
      // If not found, initialize a new product with the scanned barcode as SKU
      setProductForm(prev => ({
        ...prev,
        sku: barcode
      }));
      setShowBarcodeScanner(false);
      setShowAddModal(true);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts when component unmounts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // Available product categories
  const categories = [
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Home', label: 'Home' },
    { value: 'Office Supplies', label: 'Office Supplies' },
    { value: 'Accessories', label: 'Accessories' }
  ];
  
  // Filter parameters for search
  const searchFilterOptions = [
    { 
      id: 'category', 
      label: 'Category', 
      type: 'select', 
      options: [
        { value: '', label: 'All Categories' },
        ...categories
      ],
      defaultValue: ''
    },
    {
      id: 'stockStatus',
      label: 'Stock Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'inStock', label: 'In Stock' },
        { value: 'lowStock', label: 'Low Stock' },
        { value: 'outOfStock', label: 'Out of Stock' }
      ],
      defaultValue: ''
    },
    {
      id: 'sortBy',
      label: 'Sort By',
      type: 'select',
      options: [
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'nameDesc', label: 'Name (Z-A)' },
        { value: 'priceLow', label: 'Price (Low to High)' },
        { value: 'priceHigh', label: 'Price (High to Low)' },
        { value: 'quantityLow', label: 'Quantity (Low to High)' },
        { value: 'quantityHigh', label: 'Quantity (High to Low)' }
      ],
      defaultValue: 'name'
    }
  ];
  
  // Breadcrumbs data
  const breadcrumbsItems = [
    { label: 'Dashboard', path: isAdmin ? 'adminDashboard' : 'userDashboard' },
    { label: 'Inventory Management', path: 'inventory' }
  ];
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar 
        isAdmin={isAdmin} 
        activePage="inventory" 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        profileImage={profileImage}
      />
      
      <div className="flex-1 p-6 bg-gray-50">
        <Breadcrumbs items={breadcrumbsItems} onNavigate={onNavigate} />
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center"
              onClick={initializeAddForm}
            >
              <Plus className="w-5 h-5 mr-1" />
              <span>Add Product</span>
            </button>
            
            <button 
              className="bg-purple-600 text-white px-4 py-2 rounded flex items-center justify-center"
              onClick={() => setShowBarcodeScanner(true)}
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Scan Barcode</span>
            </button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="bg-white p-4 rounded shadow mb-4">
          <SearchBar 
            placeholder="Search products by name, SKU, or category..."
            onSearch={handleSearch}
            advancedSearch={true}
            filters={searchFilterOptions}
            className="mb-2"
          />
          
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>
            
            <button 
              className="text-blue-600 text-sm hover:underline flex items-center"
              onClick={handleExportData}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export to CSV
            </button>
          </div>
        </div>
        
        {/* Products grid */}
        <div className="bg-white p-4 rounded shadow">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <ComponentLoader size="large" text="Loading products..." />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <InventoryItem 
                  key={product._id}
                  item={{
                    id: product._id, // Use _id from MongoDB
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    costPrice: product.costPrice,
                    quantity: product.quantity,
                    category: product.category,
                    description: product.description,
                    minStockLevel: product.minStockLevel
                  }}
                  isAdmin={isAdmin}
                  onEdit={() => initializeEditForm({
                    ...product,
                    id: product._id // Ensure id is available for the form
                  })}
                  onDelete={() => handleShowDeleteModal({
                    ...product,
                    id: product._id // Ensure id is available for deletion
                  })}
                  onUpdateStock={handleUpdateStock}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="mt-2 text-gray-500">No products found</p>
              <button 
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded inline-flex items-center"
                onClick={initializeAddForm}
              >
                <Plus className="w-5 h-5 mr-1" />
                Add Your First Product
              </button>
            </div>
          )}
          
          {filteredProducts.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">Showing 1 to {filteredProducts.length} of {filteredProducts.length} entries</span>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border rounded bg-gray-100 text-gray-800">Previous</button>
                <button className="px-3 py-1 border rounded bg-blue-500 text-white">1</button>
                <button className="px-3 py-1 border rounded text-gray-600">2</button>
                <button className="px-3 py-1 border rounded text-gray-600">3</button>
                <button className="px-3 py-1 border rounded bg-gray-100 text-gray-800">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Product Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add New Product"
      >
        <Form 
          onSubmit={handleAddProduct} 
          resetButton={true}
          isSubmitting={isSubmitting}
        >
          <FormRow>
            <FormInput
              label="Product Name"
              id="name"
              name="name"
              value={productForm.name}
              onChange={handleInputChange}
              error={formErrors.name}
              required
            />
            <FormInput
              label="SKU"
              id="sku"
              name="sku"
              value={productForm.sku}
              onChange={handleInputChange}
              error={formErrors.sku}
              required
              helpText="Unique product identifier"
            />
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Selling Price"
              id="price"
              name="price"
              type="text" 
              value={productForm.price}
              onChange={handleInputChange}
              error={formErrors.price}
              required
              helpText="Numbers only (e.g., 19.99)"
            />
            {isAdmin && (
              <FormInput
                label="Cost Price"
                id="costPrice"
                name="costPrice"
                type="text" 
                value={productForm.costPrice}
                onChange={handleInputChange}
                error={formErrors.costPrice}
                required={isAdmin}
                helpText="Numbers only (e.g., 10.99)"
              />
            )}
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Quantity"
              id="quantity"
              name="quantity"
              type="text"
              value={productForm.quantity}
              onChange={handleInputChange}
              error={formErrors.quantity}
              required
              helpText="Whole numbers only (e.g., 100)"
            />
            <FormSelect
              label="Category"
              id="category"
              name="category"
              value={productForm.category}
              onChange={handleInputChange}
              options={categories}
              error={formErrors.category}
              required
            />
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Min Stock Level"
              id="minStockLevel"
              name="minStockLevel"
              type="text"
              value={productForm.minStockLevel}
              onChange={handleInputChange}
              error={formErrors.minStockLevel}
              helpText="Whole numbers only (e.g., 10)"
            />
          </FormRow>
          
          <FormTextarea
            label="Description"
            id="description"
            name="description"
            value={productForm.description}
            onChange={handleInputChange}
            error={formErrors.description}
            rows={3}
          />
        </Form>
      </Modal>
      
      {/* Edit Product Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Edit Product"
      >
        <Form 
          onSubmit={handleEditProduct} 
          resetButton={false}
          isSubmitting={isSubmitting}
          submitText="Update Product"
        >
          <FormRow>
            <FormInput
              label="Product Name"
              id="edit-name"
              name="name"
              value={productForm.name}
              onChange={handleInputChange}
              error={formErrors.name}
              required
            />
            <FormInput
              label="SKU"
              id="edit-sku"
              name="sku"
              value={productForm.sku}
              onChange={handleInputChange}
              error={formErrors.sku}
              required
              helpText="Unique product identifier"
            />
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Selling Price"
              id="edit-price"
              name="price"
              type="text"
              value={productForm.price}
              onChange={handleInputChange}
              error={formErrors.price}
              required
              helpText="Numbers only (e.g., 19.99)"
            />
            {isAdmin && (
              <FormInput
                label="Cost Price"
                id="edit-costPrice"
                name="costPrice"
                type="text"
                value={productForm.costPrice}
                onChange={handleInputChange}
                error={formErrors.costPrice}
                required={isAdmin}
                helpText="Numbers only (e.g., 10.99)"
              />
            )}
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Quantity"
              id="edit-quantity"
              name="quantity"
              type="text"
              value={productForm.quantity}
              onChange={handleInputChange}
              error={formErrors.quantity}
              required
              helpText="Whole numbers only (e.g., 100)"
            />
            <FormSelect
              label="Category"
              id="edit-category"
              name="category"
              value={productForm.category}
              onChange={handleInputChange}
              options={categories}
              error={formErrors.category}
              required
            />
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Min Stock Level"
              id="edit-minStockLevel"
              name="minStockLevel"
              type="text"
              value={productForm.minStockLevel}
              onChange={handleInputChange}
              error={formErrors.minStockLevel}
              helpText="Whole numbers only (e.g., 10)"
            />
          </FormRow>
          
          <FormTextarea
            label="Description"
            id="edit-description"
            name="description"
            value={productForm.description}
            onChange={handleInputChange}
            error={formErrors.description}
            rows={3}
          />
        </Form>
      </Modal>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${currentProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
      
      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  );
};

export default InventoryPage;