import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('solisboard_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authApi.me();
      setUser({ ...res.data.user, brand: res.data.brand });
    } catch {
      localStorage.removeItem('solisboard_token');
      localStorage.removeItem('solisboard_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('solisboard_token', res.data.token);
    localStorage.setItem('solisboard_user', JSON.stringify(res.data.user));
    setUser({ ...res.data.user });
    await loadUser();
    return res.data;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem('solisboard_token', res.data.token);
    localStorage.setItem('solisboard_user', JSON.stringify(res.data.user));
    setUser({ ...res.data.user });
    await loadUser();
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('solisboard_token');
    localStorage.removeItem('solisboard_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
