import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// In local dev, VITE_API_URL is not set → axios uses relative /api paths (Vite proxy handles it).
// In production (GitHub Pages), VITE_API_URL is set to the deployed backend URL (e.g. Render).
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vg_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('vg_token'); delete axios.defaults.headers.common['Authorization']; })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('vg_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, name, phone) => {
    const { data } = await axios.post('/api/auth/register', { email, password, name, phone });
    localStorage.setItem('vg_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  };

  const setRole = async (role) => {
    await axios.post('/api/auth/role', { role });
    setUser(u => ({ ...u, role }));
  };

  const logout = () => {
    localStorage.removeItem('vg_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await axios.get('/api/auth/me');
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, setRole, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
