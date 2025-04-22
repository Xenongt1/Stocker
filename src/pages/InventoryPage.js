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
const InventoryPage = ({ isAdmin, onNavigate, onLogout,profileImage, onProfileUpdate }) => {
  // INITIAL PRODUCTS DATA
  const initialProducts = [
    { id: 1, name: 'Laptop', sku: 'TECH001', price: 999.99, costPrice: 750, quantity: 15, category: 'Electronics', description: 'High performance laptop with SSD', minStockLevel: 10 },
    { id: 2, name: 'Headphones', sku: 'TECH002', price: 59.99, costPrice: 35, quantity: 30, category: 'Electronics', description: 'Noise cancelling wireless headphones', minStockLevel: 15 },
    { id: 3, name: 'Office Chair', sku: 'FURN001', price: 149.99, costPrice: 100, quantity: 8, category: 'Furniture', description: 'Ergonomic office chair with lumbar support', minStockLevel: 5 },
    { id: 4, name: 'Desk Lamp', sku: 'HOME001', price: 29.99, costPrice: 15, quantity: 5, category: 'Home', description: 'LED desk lamp with adjustable brightness', minStockLevel: 8 },
    { id: 5, name: 'Wireless Mouse', sku: 'TECH003', price: 24.99, costPrice: 12, quantity: 3, category: 'Electronics', description: 'Bluetooth wireless mouse', minStockLevel: 10 },
  ];
  
  // STATE
  const [products, setProducts] = useState(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
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
  
  // NOTIFICATION
  const { success, error: showError } = useNotification();
  
  // SEARCH HANDLING - completely rewritten
  // Replace your handleSearch function with this simplified version
const handleSearch = (searchData) => {
  // Don't set loading state at all - just do the filtering synchronously
  
  // Apply filtering
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
  
  // Update filtered products directly - no loading state
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
      price: product.price,
      costPrice: product.costPrice,
      quantity: product.quantity,
      category: product.category,
      description: product.description || '',
      minStockLevel: product.minStockLevel || ''
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
  const handleAddProduct = (e) => {
    e.preventDefault();
    
    if (!validateProductForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newProduct = {
        ...productForm,
        id: Date.now(),
        price: parseFloat(productForm.price),
        costPrice: parseFloat(productForm.costPrice || 0),
        quantity: parseInt(productForm.quantity),
        minStockLevel: productForm.minStockLevel ? parseInt(productForm.minStockLevel) : 5
      };
      
      // Update products
      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      
      // Apply current filters to new products list
      if (searchQuery || Object.keys(searchFilters).length > 0) {
        // Re-apply current search
        handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
      } else {
        // If no active filters, update filtered products directly
        setFilteredProducts(updatedProducts);
      }
      
      setShowAddModal(false);
      setIsSubmitting(false);
      success('Product added successfully!');
    }, 500);
  };
  
  // Edit existing product
  const handleEditProduct = (e) => {
    e.preventDefault();
    
    if (!validateProductForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedProducts = products.map(product => 
        product.id === currentProduct.id
          ? {
              ...product,
              name: productForm.name,
              sku: productForm.sku,
              price: parseFloat(productForm.price),
              costPrice: parseFloat(productForm.costPrice),
              quantity: parseInt(productForm.quantity),
              category: productForm.category,
              description: productForm.description,
              minStockLevel: productForm.minStockLevel ? parseInt(productForm.minStockLevel) : product.minStockLevel
            }
          : product
      );
      
      // Update products
      setProducts(updatedProducts);
      
      // Apply current filters to new products list
      if (searchQuery || Object.keys(searchFilters).length > 0) {
        // Re-apply current search
        handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
      } else {
        // If no active filters, update filtered products directly
        setFilteredProducts(updatedProducts);
      }
      
      setShowEditModal(false);
      setIsSubmitting(false);
      setCurrentProduct(null);
      success('Product updated successfully!');
    }, 500);
  };
  
  // Delete product
  const handleDeleteProduct = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedProducts = products.filter(product => product.id !== currentProduct.id);
      
      // Update products
      setProducts(updatedProducts);
      
      // Apply current filters to new products list
      if (searchQuery || Object.keys(searchFilters).length > 0) {
        // Re-apply current search
        handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
      } else {
        // If no active filters, update filtered products directly
        setFilteredProducts(updatedProducts);
      }
      
      setShowDeleteModal(false);
      setIsLoading(false);
      setCurrentProduct(null);
      success('Product deleted successfully!');
    }, 500);
  };
  
  // Update product stock quantity
  const handleUpdateStock = (productId, adjustmentAmount) => {
    if (!adjustmentAmount) return;
    
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        const newQuantity = product.quantity + adjustmentAmount;
        if (newQuantity < 0) {
          showError('Cannot reduce stock below zero');
          return product;
        }
        return { ...product, quantity: newQuantity };
      }
      return product;
    });
    
    // Update products
    setProducts(updatedProducts);
    
    // Apply current filters to updated products list
    if (searchQuery || Object.keys(searchFilters).length > 0) {
      // Re-apply current search
      handleSearch(typeof searchQuery === 'string' ? searchQuery : { searchTerm: searchQuery, filters: searchFilters });
    } else {
      // If no active filters, update filtered products directly
      setFilteredProducts(
        filteredProducts.map(product => 
          updatedProducts.find(p => p.id === product.id) || product
        )
      );
    }
    
    success(`Stock updated successfully! Adjustment: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount}`);
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
                  key={product.id}
                  item={product}
                  isAdmin={isAdmin}
                  onEdit={() => initializeEditForm(product)}
                  onDelete={() => handleShowDeleteModal(product)}
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
              type="number"
              min="0.01"
              step="0.01"
              value={productForm.price}
              onChange={handleInputChange}
              error={formErrors.price}
              required
            />
            {isAdmin && (
              <FormInput
                label="Cost Price"
                id="costPrice"
                name="costPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={productForm.costPrice}
                onChange={handleInputChange}
                error={formErrors.costPrice}
                required={isAdmin}
              />
            )}
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Quantity"
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={productForm.quantity}
              onChange={handleInputChange}
              error={formErrors.quantity}
              required
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
              type="number"
              min="0"
              value={productForm.minStockLevel}
              onChange={handleInputChange}
              error={formErrors.minStockLevel}
              helpText="Alert threshold for low stock"
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
              type="number"
              min="0.01"
              step="0.01"
              value={productForm.price}
              onChange={handleInputChange}
              error={formErrors.price}
              required
            />
            {isAdmin && (
              <FormInput
                label="Cost Price"
                id="edit-costPrice"
                name="costPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={productForm.costPrice}
                onChange={handleInputChange}
                error={formErrors.costPrice}
                required={isAdmin}
              />
            )}
          </FormRow>
          
          <FormRow>
            <FormInput
              label="Quantity"
              id="edit-quantity"
              name="quantity"
              type="number"
              min="0"
              value={productForm.quantity}
              onChange={handleInputChange}
              error={formErrors.quantity}
              required
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
              type="number"
              min="0"
              value={productForm.minStockLevel}
              onChange={handleInputChange}
              error={formErrors.minStockLevel}
              helpText="Alert threshold for low stock"
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