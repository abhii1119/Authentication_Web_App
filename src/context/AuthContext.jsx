import React, { createContext, useState, useContext } from 'react';
import * as db from '../data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => db.getCurrentUser());

  const login = (email, password) => {
    const result = db.login(email, password);
    if (result.error) return result;
    setUser(result.user);
    return result;
  };

  const register = (fields) => {
    const result = db.register(fields);
    if (result.error) return result;
    setUser(result.user);
    return result;
  };

  const logout = () => { db.logout(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
