import { appConfig } from '@/config/appConfig';

const ACCESS_KEY = `${appConfig.tokenStorageKey}:access`;
const REFRESH_KEY = `${appConfig.tokenStorageKey}:refresh`;
const USER_KEY = `${appConfig.tokenStorageKey}:user`;
const REMEMBER_ME_KEY = `${appConfig.tokenStorageKey}:rememberMe`;

// Remember me durumunu kontrol et
const getStorage = () => {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const tokenStorage = {
  getAccessToken: () => {
    // Önce localStorage'dan kontrol et, yoksa sessionStorage'dan
    return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
  },
  
  setAccessToken: (token, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(ACCESS_KEY, token);
    // Remember me durumunu sakla
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  },
  
  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
  },
  
  setRefreshToken: (token, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(REFRESH_KEY, token);
  },
  
  setTokens: ({ accessToken, refreshToken }, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    if (accessToken) {
      storage.setItem(ACCESS_KEY, accessToken);
    }
    if (refreshToken) {
      storage.setItem(REFRESH_KEY, refreshToken);
    }
    
    // Remember me durumunu sakla
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
      // Eğer remember me false ise, localStorage'daki token'ları temizle
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  },
  
  getUser: () => {
    // Önce localStorage'dan kontrol et, yoksa sessionStorage'dan
    const user = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return safeParse(user);
  },
  
  setUser: (user, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  clear: () => {
    // Hem localStorage hem de sessionStorage'ı temizle
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
  
  isRememberMe: () => {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  },
};
