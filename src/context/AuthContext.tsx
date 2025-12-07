import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types/auth';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/utils/tokenStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => tokenStorage.getUser());
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
        tokenStorage.setUser(profile);
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    tokenStorage.setTokens(response.tokens);
    tokenStorage.setUser(response.user);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
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
    tokenStorage.setUser(profile);
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
    }),
    [user, isInitializing, login, register, logout, refreshProfile]
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

