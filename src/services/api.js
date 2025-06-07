import axios from 'axios';

// Create an axios instance with a base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with error
      if (error.response.status === 401) {
        console.log('Unauthorized access, clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw error.response.data;
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server:', error.request);
      throw new Error('No response from server');
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
      throw new Error('Error setting up request');
    }
  }
);

// Authentication Services
export const authService = {
  // Login user
  login: async (username, password) => {
    try {
      console.log('Attempting login for user:', username);
      const response = await api.post('/auth/login', { username, password });
      
      // Store the token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      console.log('Login successful, token stored');
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw new Error('Login failed. Please try again.');
    }
  },
  
  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get user info:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw new Error('Failed to get user info');
    }
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('User logged out, auth data cleared');
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    const token = localStorage.getItem('token');
    console.log('Checking login status:', !!token);
    return token !== null;
  },
  
  // Check if user is admin
  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
  }
};

// Product Services
export const productService = {
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch products');
    }
  },
  
  // Get single product
  getProduct: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch product');
    }
  },
  
  // Add new product
  addProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to add product');
    }
  },
  
  // Update product
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update product');
    }
  },
  
  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to delete product');
    }
  },
  
  // Update stock
  updateStock: async (id, adjustment) => {
    try {
      const response = await api.put(`/products/stock/${id}`, { adjustment });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update stock');
    }
  }
};

// Sales Services
export const salesService = {
  // Record a new sale
  recordSale: async (saleData) => {
    try {
      const response = await api.post('/sales', {
        items: saleData.items.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        })),
        subtotal: parseFloat(saleData.subtotal),
        discount: parseFloat(saleData.discount || 0),
        tax: parseFloat(saleData.tax || 0),
        total: parseFloat(saleData.total),
        payment_method: saleData.payment_method || 'Cash'
      });
      
      return {
        ...response.data,
        total: parseFloat(response.data.total),
        subtotal: parseFloat(response.data.subtotal),
        tax: parseFloat(response.data.tax),
        discount: parseFloat(response.data.discount)
      };
    } catch (error) {
      console.error('Error in recordSale:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        throw error.response.data;
      }
      throw new Error('Failed to record sale: ' + error.message);
    }
  },
  
  // Get sales history
  getSales: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/sales?${params.toString()}`);
      
      return response.data.map(sale => ({
        ...sale,
        subtotal: parseFloat(sale.subtotal),
        tax: parseFloat(sale.tax),
        discount: parseFloat(sale.discount),
        total: parseFloat(sale.total),
        items: Array.isArray(sale.items) ? sale.items.map(item => ({
          ...item,
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        })) : []
      }));
    } catch (error) {
      console.error('Error in getSales:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        throw error.response.data;
      }
      throw new Error('Failed to fetch sales: ' + error.message);
    }
  },
  
  // Get a single sale
  getSale: async (id) => {
    try {
      const response = await api.get(`/sales/${id}`);
      return {
        ...response.data,
        subtotal: parseFloat(response.data.subtotal),
        tax: parseFloat(response.data.tax),
        discount: parseFloat(response.data.discount),
        total: parseFloat(response.data.total),
        items: Array.isArray(response.data.items) ? response.data.items.map(item => ({
          ...item,
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        })) : []
      };
    } catch (error) {
      console.error('Error in getSale:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        throw error.response.data;
      }
      throw new Error('Failed to fetch sale: ' + error.message);
    }
  },
  
  // Get sales statistics
  getSalesStats: async (period = 'daily') => {
    try {
      const response = await api.get(`/sales/stats/summary?period=${period}`);
      return {
        ...response.data,
        totalSales: parseFloat(response.data.totalSales),
        totalTax: parseFloat(response.data.totalTax),
        totalDiscount: parseFloat(response.data.totalDiscount),
        averageSale: parseFloat(response.data.averageSale)
      };
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch sales statistics');
    }
  }
};

// Categories Services
export const categoryService = {
    // Get all categories with stats
    getAllCategories: async (period = 'all') => {
        try {
            const response = await api.get(`/categories?period=${period}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error('Failed to fetch categories');
        }
    },
    
    // Get single category with stats
    getCategory: async (id, period = 'all') => {
        try {
            const response = await api.get(`/categories/${id}?period=${period}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error('Failed to fetch category');
        }
    },
    
    // Create new category
    createCategory: async (categoryData) => {
        try {
            const response = await api.post('/categories', categoryData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error('Failed to create category');
        }
    },
    
    // Update category
    updateCategory: async (id, categoryData) => {
        try {
            const response = await api.put(`/categories/${id}`, categoryData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error('Failed to update category');
        }
    },
    
    // Delete category
    deleteCategory: async (id) => {
        try {
            const response = await api.delete(`/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error('Failed to delete category');
        }
    }
};

export default {
  auth: authService,
  products: productService,
  sales: salesService,
  categories: categoryService
};