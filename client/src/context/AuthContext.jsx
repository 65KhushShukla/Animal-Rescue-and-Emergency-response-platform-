import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const demoAccounts = {
  citizen: { email: 'citizen@example.com', password: 'password123', label: 'Citizen', icon: '👤', desc: 'Report & Track Emergencies' },
  rescue_team: { email: 'rescue@example.com', password: 'password123', label: 'Rescue Team', icon: '🚑', desc: 'Dispatch & Field Rescue' },
  veterinarian: { email: 'vet@example.com', password: 'password123', label: 'Veterinarian', icon: '🩺', desc: 'Clinical Care & Prescriptions' },
  shelter: { email: 'shelter@example.com', password: 'password123', label: 'Shelter / Sanctuary', icon: '🏡', desc: 'Kennel Housing & Adoptions' },
  volunteer: { email: 'volunteer@example.com', password: 'password123', label: 'Volunteer', icon: '🙋', desc: 'Community Tasks & Fostering' },
  admin: { email: 'admin@example.com', password: 'password123', label: 'Administrator', icon: '⚡', desc: 'Analytics & System Control' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pawsome_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pawsome_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('pawsome_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('pawsome_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Auth token verification failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('pawsome_token', res.data.token);
      localStorage.setItem('pawsome_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('pawsome_token', res.data.token);
      localStorage.setItem('pawsome_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pawsome_token');
    localStorage.removeItem('pawsome_user');
  };

  const updateUserProfile = async (updateData) => {
    const res = await api.put('/auth/profile', updateData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('pawsome_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
  };

  const switchDemoRole = async (roleKey) => {
    const demo = demoAccounts[roleKey];
    if (!demo) return;
    return await login(demo.email, demo.password);
  };

  const getDashboardRoute = (role = user?.role) => {
    switch (role) {
      case 'citizen':
        return '/dashboard/citizen';
      case 'rescue_team':
        return '/dashboard/rescue';
      case 'veterinarian':
        return '/dashboard/vet';
      case 'shelter':
        return '/dashboard/shelter';
      case 'volunteer':
        return '/dashboard/volunteer';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        switchDemoRole,
        getDashboardRoute,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
