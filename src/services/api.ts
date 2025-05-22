import axios from 'axios';

// Get base URL from environment variables or use a default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in headers if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response?.status === 401 && !error.response?.data?.requiresVerification) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Register a new user
  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Verify email with OTP
  verifyEmail: async (userId: string, otp: string) => {
    try {
      const response = await api.post('/auth/verify-email', { userId, otp });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Resend verification OTP
  resendVerification: async (userId: string) => {
    try {
      const response = await api.post('/auth/resend-verification', { userId });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Login user
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error: any) {
      // Don't throw error for email verification required case
      if (error.response?.status === 200 && error.response?.data?.requiresVerification) {
        return error.response.data;
      }
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Forgot password - request reset
  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Reset password with OTP
  resetPassword: async (userId: string, otp: string, password: string) => {
    try {
      const response = await api.post('/auth/reset-password', { userId, otp, password });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Check username availability
  checkUsername: async (username: string) => {
    try {
      const response = await api.post('/auth/check-username', { username });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Validate password strength
  validatePassword: async (password: string) => {
    try {
      const response = await api.post('/auth/validate-password', { password });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Update user profile
  updateProfile: async (userData: any) => {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Verify email change with OTP
  verifyEmailChange: async (userId: string, otp: string) => {
    try {
      const response = await api.post('/auth/verify-email', { 
        userId,
        otp 
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  }
};

// Transaction API
export const transactionAPI = {
  // Check if a phone number belongs to a registered user
  checkPhoneNumber: async (phoneNumber: string) => {
    try {
      const response = await api.get(`/transactions/check-phone/${phoneNumber}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },
  
  // Add other transaction-related API calls here
};

export default api; 