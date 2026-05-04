import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setEchoToken } from '../lib/echo';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate state from localStorage on startup
  useEffect(() => {
    const storedToken = localStorage.getItem('apex_token');
    const storedUser = localStorage.getItem('apex_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setEchoToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user session');
        localStorage.removeItem('apex_token');
        localStorage.removeItem('apex_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setEchoToken(newToken);
    localStorage.setItem('apex_token', newToken);
    localStorage.setItem('apex_user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('apex_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, updateUser, loading }}>
        {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
