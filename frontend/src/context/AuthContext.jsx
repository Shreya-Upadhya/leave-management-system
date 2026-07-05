import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log('🔍 Checking localStorage on mount:', storedToken ? 'Token found' : 'No token');
    
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUser(response.data);
      console.log('✅ Token verified, user:', response.data.name);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      console.log('📦 Login response received:', response.data);
      
      const { token, user } = response.data;
      
      // ✅ STORE TOKEN IN LOCALSTORAGE
      localStorage.setItem('token', token);
      console.log('✅ Token stored in localStorage:', token.substring(0, 30) + '...');
      
      // ✅ Verify it was stored
      const storedToken = localStorage.getItem('token');
      console.log('🔍 Verifying storage:', storedToken ? '✅ Successfully stored' : '❌ Storage failed');
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
      
      return { success: true, token, user };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      console.log('📦 Register response received:', response.data);
      
      const { token, user } = response.data;
      
      // ✅ STORE TOKEN IN LOCALSTORAGE
      localStorage.setItem('token', token);
      console.log('✅ Token stored in localStorage:', token.substring(0, 30) + '...');
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    console.log('👋 Logged out');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user || !!token,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};