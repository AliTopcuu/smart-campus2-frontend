import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/utils/tokenStorage';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      if (!tokenStorage.getAccessToken()) {
        setIsInitializing(false);
        return;
      }
      try {
        const profile = await userService.getProfile();
        setUser(profile);
        // Remember me durumunu koru
        const rememberMe = tokenStorage.isRememberMe();
        tokenStorage.setUser(profile, rememberMe);
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };
    initialize();
  }, []);

  const login = useCallback(async (payload) => {
    const { rememberMe = false, ...loginPayload } = payload;
    // Backend'e sadece email ve password gönder (token süreleri backend'de sabit)
    const response = await authService.login(loginPayload);
    
    // Remember me durumuna göre token'ları sakla (localStorage vs sessionStorage)
    tokenStorage.setTokens(response.tokens, rememberMe);
    tokenStorage.setUser(response.user, rememberMe);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload) => {
    const response = await authService.register(payload);
    return response.message;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout errors (user could already be logged out)
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await userService.getProfile();
    setUser(profile);
    // Remember me durumunu koru
    const rememberMe = tokenStorage.isRememberMe();
    tokenStorage.setUser(profile, rememberMe);
  }, []);

  const setUserState = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      register,
      logout,
      refreshProfile,
      setUserState,
    }),
    [user, isInitializing, login, register, logout, refreshProfile, setUserState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

