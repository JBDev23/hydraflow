import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AppBootstrapContextValue = {
  isHomeLayoutReady: boolean;
  setHomeLayoutReady: (ready: boolean) => void;
};

const AppBootstrapContext = createContext<AppBootstrapContextValue | null>(null);

export function AppBootstrapProvider({ children }: { children: ReactNode }) {
  const [isHomeLayoutReady, setIsHomeLayoutReadyState] = useState(false);

  const setHomeLayoutReady = useCallback((ready: boolean) => {
    setIsHomeLayoutReadyState(ready);
  }, []);

  const value = useMemo(
    () => ({
      isHomeLayoutReady,
      setHomeLayoutReady,
    }),
    [isHomeLayoutReady, setHomeLayoutReady],
  );

  return <AppBootstrapContext.Provider value={value}>{children}</AppBootstrapContext.Provider>;
}

export const useAppBootstrap = (): AppBootstrapContextValue => {
  const ctx = useContext(AppBootstrapContext);
  if (!ctx) {
    throw new Error('useAppBootstrap must be used within AppBootstrapProvider');
  }
  return ctx;
};
