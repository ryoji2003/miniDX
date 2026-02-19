// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // スタッフ認証状態
  const [staffToken, setStaffToken] = useState(() => localStorage.getItem('auth_token'));
  const [staffUser, setStaffUser] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 管理者認証状態
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('admin_token'));
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const staffLogin = useCallback((token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setStaffToken(token);
    setStaffUser(user);
  }, []);

  const staffLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setStaffToken(null);
    setStaffUser(null);
  }, []);

  const adminLogin = useCallback((token, user) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    setAdminToken(token);
    setAdminUser(user);
  }, []);

  const adminLogout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdminToken(null);
    setAdminUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        staffUser,
        staffToken,
        staffLogin,
        staffLogout,
        isStaffLoggedIn: !!staffToken && !!staffUser,
        adminUser,
        adminToken,
        adminLogin,
        adminLogout,
        isAdminLoggedIn: !!adminToken && !!adminUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
