import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../services/api';
import i18n from '../app/i18n';
import { showToast } from '../utils/toast';
import { useAuth } from './AuthContext';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children, onSyncSuccessRef }) => {
  const { authTokenRef } = useAuth();
  const [isOffline, setIsOffline] = useState(false);

  const handleSyncRef = useRef(null);

  const handleSync = async () => {
    try {
      const synced = await api.syncOfflineQueue();
      if (synced) {
        await onSyncSuccessRef.current?.();
      }
    } catch (e) {
      console.error("❌ Error en auto-sync:", e);
    }
  };

  handleSyncRef.current = handleSync;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline =
        state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);

      const token = authTokenRef?.current;
      if (!offline && token) {
        handleSyncRef.current?.();
      }

      if (offline) {
        showToast(i18n.t("toast.offlineMode"));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [authTokenRef]);

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return ctx;
};
