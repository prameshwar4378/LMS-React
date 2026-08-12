import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginApi, getProfileApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      getProfileApi()
        .then((data) => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await loginApi(username, password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access);
      setUser(data.user);
      setLoading(false);
      return data.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (typeof allowedRoles === 'string') return user.role === allowedRoles;
    return allowedRoles.includes(user.role);
  };

  const isAdmin = Boolean(
    user && user.role !== 'RECEPTIONIST' && (user.is_superuser || user.role === 'SUPER_ADMIN' || user.role === 'MANAGER' || user.role === 'ADMIN')
  );

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
