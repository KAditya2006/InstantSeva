import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { getCurrentUser, setAuthToken } from '../services/api';
import i18n from '../i18n';
import { LANGUAGE_STORAGE_KEY } from '../i18n/languages';

const AuthContext = createContext();

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getStoredUser);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((nextUser) => {
    setUserState((previousUser) => {
      const resolvedUser = typeof nextUser === 'function' ? nextUser(previousUser) : nextUser;

      if (resolvedUser) {
        localStorage.setItem('user', JSON.stringify(resolvedUser));
      } else {
        localStorage.removeItem('user');
      }

      return resolvedUser;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      if (!token) {
        setAuthToken(null);
        if (isMounted) setLoading(false);
        return;
      }

      setAuthToken(token);

      try {
        const { data } = await getCurrentUser();
        if (!isMounted) return;
        setUser(data.user);
      } catch {
        if (!isMounted) return;
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        setAuthToken(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [setUser, token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    setAuthToken(userToken);

    if (userData?.preferredLanguage && !localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
      i18n.changeLanguage(userData.preferredLanguage);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
