import { createContext, useContext, useState } from 'react';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    const token = sessionStorage.getItem('adminToken');
    const user = sessionStorage.getItem('adminUser');
    return token && user ? JSON.parse(user) : null;
  });

  const adminLogin = (token, user) => {
    sessionStorage.setItem('adminToken', token);
    sessionStorage.setItem('adminUser', JSON.stringify(user));
    setAdminUser(user);
  };

  const adminLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminLogin, adminLogout, isAdminLoggedIn: !!adminUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
