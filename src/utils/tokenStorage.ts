import { appConfig } from '@/config/appConfig';
import type { AuthTokens, AuthUser } from '@/types/auth';

const ACCESS_KEY = `${appConfig.tokenStorageKey}:access`;
const REFRESH_KEY = `${appConfig.tokenStorageKey}:refresh`;
const USER_KEY = `${appConfig.tokenStorageKey}:user`;

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  setAccessToken: (token: string) => localStorage.setItem(ACCESS_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  setTokens: ({ accessToken, refreshToken }: AuthTokens) => {
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
  },
  getUser: () => safeParse<AuthUser>(localStorage.getItem(USER_KEY)),
  setUser: (user: AuthUser) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

