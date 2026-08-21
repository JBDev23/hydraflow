import React, { useRef } from 'react';
import { AuthProvider } from './AuthContext';
import { UserProvider } from './UserContext';
import { HydrationProvider } from './HydrationContext';
import { OfflineProvider } from './OfflineContext';
import { ThemeProvider } from './ThemeContext';

/**
 * Composes domain providers and wires cross-cutting callbacks via refs.
 * Nesting: Auth → User → Hydration → Offline → Theme
 */
export function AppProviders({ children }) {
  const userApiRef = useRef({});
  const hydrationApiRef = useRef({});
  const onSyncSuccessRef = useRef(null);

  onSyncSuccessRef.current = async () => {
    await userApiRef.current?.refreshUser?.();
    hydrationApiRef.current?.bumpHydrationEpoch?.();
  };

  return (
    <AuthProvider userApiRef={userApiRef} hydrationApiRef={hydrationApiRef}>
      <UserProvider userApiRef={userApiRef} hydrationApiRef={hydrationApiRef}>
        <HydrationProvider hydrationApiRef={hydrationApiRef}>
          <OfflineProvider onSyncSuccessRef={onSyncSuccessRef}>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </OfflineProvider>
        </HydrationProvider>
      </UserProvider>
    </AuthProvider>
  );
}
