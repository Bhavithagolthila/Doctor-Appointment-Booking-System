import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);
const KEY = 'medicare_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  });
  // FIX: on a fresh page load, the stored user object could be stale — the
  // token may have expired, or an admin may have deactivated the account,
  // since the last time this browser fetched anything. Previously the app
  // just trusted whatever was in localStorage until the next API call
  // happened to 401. This verifies the session against the backend once on
  // mount and logs out silently if it's no longer valid.
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!user?.token) { setCheckingSession(false); return; }
    let cancelled = false;
    getMe()
      .then(fresh => {
        if (cancelled) return;
        // Merge in case the backend has newer profile data (name/phone edits
        // made elsewhere), but keep the token since /me doesn't return it.
        setUser(prev => {
          const merged = { ...prev, name: fresh.name, phone: fresh.phone, email: fresh.email, role: fresh.role };
          localStorage.setItem(KEY, JSON.stringify(merged));
          return merged;
        });
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(KEY);
        setUser(null);
      })
      .finally(() => { if (!cancelled) setCheckingSession(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (userData) => {
    localStorage.setItem(KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (patch) => {
    setUser(prev => {
      const merged = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoggedIn: !!user, checkingSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
