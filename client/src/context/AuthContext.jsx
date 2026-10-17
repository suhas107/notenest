import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, clearToken, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check a saved token

  // On page load, if a token is saved, fetch the current user
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // The axios interceptor fires this event when the token expires
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (details) => {
    const data = await authApi.register(details);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
