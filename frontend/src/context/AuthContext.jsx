import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  installAxiosAuthInterceptors,
  subscribeAdminSession,
  subscribeCustomerSession,
} from '../api/setupAxios';

installAxiosAuthInterceptors();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Customer user
  const [adminUser, setAdminUser] = useState(null); // Admin / Worker user
  const [loading, setLoading] = useState(true);

  // Initialize customer and admin sessions from localStorage
  useEffect(() => {
    try {
      const storedCustomer = localStorage.getItem('customerInfo') || localStorage.getItem('userInfo');
      if (storedCustomer) {
        const parsed = JSON.parse(storedCustomer);
        // If parsed is a customer
        if (parsed.role === 'customer' || !parsed.role) {
          setUser(parsed);
        } else {
          // If legacy admin was in userInfo
          setAdminUser(parsed);
        }
      }

      const storedAdmin = localStorage.getItem('adminInfo');
      if (storedAdmin) {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdminUser(parsedAdmin);
      }
    } catch (e) {
      console.error('Error loading stored auth session:', e);
    } finally {
      setLoading(false);
    }

    const unsubCustomer = subscribeCustomerSession((session) => {
      setUser(session);
    });
    const unsubAdmin = subscribeAdminSession((session) => {
      setAdminUser(session);
    });

    return () => {
      unsubCustomer();
      unsubAdmin();
    };
  }, []);

  // --------------------------------------------------------------------------
  // CUSTOMER AUTHENTICATION FLOWS (Storefront)
  // --------------------------------------------------------------------------
  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/api/v1/auth/customer/login', { email, password });
      setUser(data);
      localStorage.setItem('customerInfo', JSON.stringify(data));
      localStorage.setItem('userInfo', JSON.stringify(data)); // Legacy compatibility
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message || 'Customer login failed. Please check your credentials.'
      };
    }
  };

  const register = async (name, email, password, phone, address) => {
    try {
      const { data } = await axios.post('/api/v1/auth/customer/register', { name, email, password, phone, address });
      setUser(data);
      localStorage.setItem('customerInfo', JSON.stringify(data));
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const { data } = await axios.post('/api/v1/auth/customer/google', { credential });
      setUser(data);
      localStorage.setItem('customerInfo', JSON.stringify(data));
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google Sign-in failed.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('customerInfo');
    localStorage.removeItem('userInfo');
  };

  const updateProfile = async (name, phone, address) => {
    try {
      const { data } = await axios.put('/api/v1/auth/customer/profile', { name, phone, address });
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('customerInfo', JSON.stringify(updatedUser));
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return { success: true, data: updatedUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed.'
      };
    }
  };

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION FLOWS (Restricted Dashboard & 2FA)
  // --------------------------------------------------------------------------
  const adminLogin = async (email, password) => {
    try {
      const { data } = await axios.post('/api/v1/auth/admin/login', { email, password });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message || 'Admin authentication failed.'
      };
    }
  };

  const adminVerify2FA = async (tempToken, code) => {
    try {
      const { data } = await axios.post('/api/v1/auth/admin/verify-2fa', { tempToken, code });
      setAdminUser(data);
      localStorage.setItem('adminInfo', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.message || '2FA code verification failed.'
      };
    }
  };

  const adminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminInfo');
  };

  return (
    <AuthContext.Provider value={{
      user,
      adminUser,
      loading,
      login,
      register,
      logout,
      updateProfile,
      loginWithGoogle,
      adminLogin,
      adminVerify2FA,
      adminLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
