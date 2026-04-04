import { createContext, useContext, useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('dw_auth');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { sessionStorage.removeItem('dw_auth'); }
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const staff = await sbFetch(`staff?username=eq.${encodeURIComponent(username)}&select=*`);
    if (!staff?.length) throw new Error('帳號不存在');
    const s = staff[0];
    if (s.password !== password) throw new Error('密碼錯誤');
    const userData = {
      id: s.id,
      display_name: s.display_name,
      username: s.username,
      isAdmin: s.role === 'admin',
      permissions: s.permissions || {}
    };
    setUser(userData);
    sessionStorage.setItem('dw_auth', JSON.stringify(userData));
    return userData;
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem('dw_auth');
  }

  function hasPerm(module, action) {
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.permissions?.[module]?.[action] || false;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPerm }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
