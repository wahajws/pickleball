import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // Get token as plain string (not JSON parsed)
      const token = localStorage.getItem('accessToken');
      const userData = storage.get('user');
      
      if (token && userData) {
        try {
          // Verify token is still valid
          const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
          const user = response.data.data?.user || response.data.data;
          if (user) {
            setUser(user);
            setIsAuthenticated(true);
            storage.set('user', user);
          } else {
            // Invalid response, but don't clear if we have token and userData
            // Just use the stored userData
            setUser(userData);
            setIsAuthenticated(true);
          }
        } catch (error) {
          // Only clear if it's a 401 (unauthorized), not network errors
          if (error.response?.status === 401) {
            console.error('Auth verification failed - token invalid:', error);
            storage.clear();
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // Network error or other issue - keep existing auth state
            console.warn('Auth verification failed - keeping existing state:', error);
            setUser(userData);
            setIsAuthenticated(true);
          }
        }
      } else {
        // No token or user data, ensure clean state
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        identifier,
        password,
      });

      // Backend returns: { user, session, token, refreshToken }
      const data = response.data.data;
      const accessToken = data.token || data.accessToken;
      const refreshToken = data.refreshToken;
      const userData = data.user;
      
      // Store tokens as plain strings (not JSON)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      storage.set('user', userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const signup = async (data) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed',
      };
    }
  };

  const requestOtp = async (identifier, purpose = 'login') => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.OTP_REQUEST, {
        identifier,
        purpose,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'OTP request failed',
      };
    }
  };

  const verifyOtp = async (identifier, code, purpose = 'login') => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.OTP_VERIFY, {
        identifier,
        code,
        purpose,
      });

      // Backend returns: { user, session, token, refreshToken }
      const data = response.data.data;
      const accessToken = data.token || data.accessToken;
      const refreshToken = data.refreshToken;
      const userData = data.user;
      
      // Store tokens as plain strings (not JSON)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      storage.set('user', userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, data: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'OTP verification failed',
      };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storage.clear();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    storage.set('user', userData);
  };

  const getUserRole = () => {
    if (!user?.roles || user.roles.length === 0) return null;
    // Return the highest priority role
    const rolePriority = {
      platform_super_admin: 1,
      company_admin: 2,
      branch_manager: 3,
      branch_staff: 4,
      staff: 4,
      customer: 5,
    };
    
    return user.roles.sort((a, b) => 
      (rolePriority[a.name] || 99) - (rolePriority[b.name] || 99)
    )[0];
  };

  const hasRole = (roleName) => {
    if (!user?.roles || user.roles.length === 0) return false;
    return user.roles.some(r => r.name === roleName);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    requestOtp,
    verifyOtp,
    logout,
    updateUser,
    getUserRole,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

