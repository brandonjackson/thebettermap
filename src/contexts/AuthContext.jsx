import { createContext, useContext, useState, useCallback } from 'react';
import * as auth from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => auth.getCurrentUser());

  const login = useCallback(({ email, password }) => {
    const u = auth.login({ email, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(({ email, displayName, password }) => {
    const u = auth.register({ email, displayName, password });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
