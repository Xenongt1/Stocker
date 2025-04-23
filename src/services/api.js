import axios from 'axios';

// Create an axios instance with a base URL
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

// Authentication Services
export const authService = {
  // Login user
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Store the token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Login failed');
    }
  },
  
  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/user');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to get user');
    }
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    return localStorage.getItem('token') !== null;
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
      const response = await api.post('/sales', saleData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to record sale');
    }
  },
  
  // Get sales history
  getSales: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/sales?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch sales');
    }
  },
  
  // Get a single sale
  getSale: async (id) => {
    try {
      const response = await api.get(`/sales/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch sale');
    }
  },
  
  // Get sales statistics
  getSalesStats: async (period = 'daily') => {
    try {
      const response = await api.get(`/sales/stats/summary?period=${period}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch sales statistics');
    }
  }
};

export default {
  auth: authService,
  products: productService,
  sales: salesService
};