import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveSession = useCallback((sessionData, userData) => {
    localStorage.setItem('session', JSON.stringify(sessionData));
    setSession(sessionData);
    setUser(userData);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('session');
    setSession(null);
    setUser(null);
  }, []);

  // On mount, restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('session');
    if (!stored) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(({ data }) => {
        const parsed = JSON.parse(stored);
        setSession(parsed);
        setUser(data.user);
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    saveSession(data.session, data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    saveSession(data.session, data.user);
    return data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearSession();
  };

  const updateUser = async (payload) => {
    const { data } = await authApi.updateMe(payload);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
