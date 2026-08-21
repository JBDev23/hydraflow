import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { mapBackendToFrontend } from '../services/profileMapping';
import i18n from '../app/i18n';
import { STORAGE_KEYS } from './storageKeys';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, userApiRef, hydrationApiRef }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const logoutRef = useRef(null);
  const authTokenRef = useRef(null);
  authTokenRef.current = authToken;

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        await userApiRef.current?.bootstrapLocalProfile?.();

        if (token) {
          setAuthToken(token);
        }
      } catch (e) {
        console.error("Error carga local:", e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
    api.setupSessionInterceptor(() => {
      logoutRef.current?.();
    });
  }, [userApiRef]);

  useEffect(() => {
    if (authToken) {
      userApiRef.current?.refreshUser?.();
    }
  }, [authToken, userApiRef]);

  const login = async (credentials, provider = 'google', lang) => {
    setIsLoading(true);
    try {
      let payload;
      const manualName = userApiRef.current?.getManualName?.();

      if (provider === 'google') {
        payload = { token: credentials, manualName, provider: 'google', deviceLanguage: lang };
      } else {
        payload = { ...credentials, provider: 'test' };
      }

      const response = await api.login(payload);

      if (response.success) {
        const { token, user } = response;
        const mappedProfile = mapBackendToFrontend(user);

        if (mappedProfile.preferences?.language) {
          i18n.changeLanguage(mappedProfile.preferences.language);
        }

        // Persist token BEFORE setAuthToken so refreshUser / API calls
        // (triggered by the authToken effect) can read it from AsyncStorage.
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        await userApiRef.current?.applySessionProfile?.(mappedProfile);
        setAuthToken(token);

        const waterToday = await hydrationApiRef.current?.refreshDailyWater?.();
        await userApiRef.current?.syncNotificationsForProfile?.(mappedProfile, waterToday ?? 0);

        return mappedProfile;
      }
    } catch (error) {
      console.error("Login fallido:", error);
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

  logoutRef.current = logout;

  return (
    <AuthContext.Provider value={{ isLoading, authToken, login, logout, authTokenRef }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
