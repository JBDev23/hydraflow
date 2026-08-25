import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
  useLayoutEffect,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { mapBackendToFrontend } from '../services/profileMapping';
import i18n from '../app/i18n';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { UserProfile } from '../types';
import type { UserApi } from './userApi';
import type { HydrationApi } from './hydrationApi';

export type AuthContextValue = {
  isLoading: boolean;
  authToken: string | null;
  login: (
    credentials: string | { manualEmail?: string; manualName?: string },
    provider?: string,
    lang?: string,
  ) => Promise<UserProfile | null | undefined>;
  logout: () => Promise<void>;
  authTokenRef: MutableRefObject<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  userApiRef: MutableRefObject<Partial<UserApi>>;
  hydrationApiRef: MutableRefObject<Partial<HydrationApi>>;
};

export const AuthProvider = ({ children, userApiRef, hydrationApiRef }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const logoutRef = useRef<(() => Promise<void>) | null>(null);
  const authTokenRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    const bootstrap = async () => {
      let token: string | null = null;

      try {
        await userApiRef.current?.bootstrapLocalProfile?.();
      } catch (e) {
        console.error('Error perfil local:', e);
      }

      try {
        token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          setAuthToken(token);
        }
      } catch (e) {
        console.error('Error carga local:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
    api.setupSessionInterceptor(() => {
      void logoutRef.current?.();
    });
  }, [userApiRef]);

  useEffect(() => {
    if (authToken) {
      void userApiRef.current?.refreshUser?.();
    }
  }, [authToken, userApiRef]);

  const login = async (
    credentials: string | { manualEmail?: string; manualName?: string },
    provider = 'google',
    lang?: string,
  ): Promise<UserProfile | null | undefined> => {
    setIsLoading(true);
    try {
      let payload;
      const manualName = userApiRef.current?.getManualName?.();

      if (provider === 'google') {
        payload = {
          token: credentials as string,
          manualName,
          provider: 'google' as const,
          deviceLanguage: lang,
        };
      } else {
        payload = {
          ...(credentials as { manualEmail?: string; manualName?: string }),
          provider: 'test' as const,
        };
      }

      const response = await api.login(payload);

      if (response.success) {
        const { token, user } = response;
        const mappedProfile = mapBackendToFrontend(user);

        if (mappedProfile.preferences?.language) {
          void i18n.changeLanguage(mappedProfile.preferences.language);
        }

        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        await userApiRef.current?.applySessionProfile?.(mappedProfile);
        setAuthToken(token);

        const waterToday = await hydrationApiRef.current?.refreshDailyWater?.();
        await userApiRef.current?.syncNotificationsForProfile?.(mappedProfile, waterToday ?? 0);

        return mappedProfile;
      }
    } catch (error) {
      console.error('Login fallido:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.USER_TUTORIAL,
    ]);

    await userApiRef.current?.onLogout?.();
    hydrationApiRef.current?.resetDailyWater?.();
    setAuthToken(null);
  };

  useLayoutEffect(() => {
    logoutRef.current = logout;
  });

  return (
    <AuthContext.Provider value={{ isLoading, authToken, login, logout, authTokenRef }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
