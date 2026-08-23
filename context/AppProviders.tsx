import React, { useRef, useLayoutEffect, type ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { UserProvider } from './UserContext';
import { HydrationProvider } from './HydrationContext';
import { OfflineProvider } from './OfflineContext';
import { ThemeProvider } from './ThemeContext';
import type { UserApi } from './userApi';
import type { HydrationApi } from './hydrationApi';

/**
 * Composes domain providers and wires cross-cutting callbacks via refs.
 * Nesting: Auth → User → Hydration → Offline → Theme
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const userApiRef = useRef<Partial<UserApi>>({});
  const hydrationApiRef = useRef<Partial<HydrationApi>>({});
  const onSyncSuccessRef = useRef<(() => Promise<void>) | null>(null);

  useLayoutEffect(() => {
    onSyncSuccessRef.current = async () => {
      await userApiRef.current?.refreshUser?.();
      hydrationApiRef.current?.bumpHydrationEpoch?.();
    };
  });

  return (
    <AuthProvider userApiRef={userApiRef} hydrationApiRef={hydrationApiRef}>
      <UserProvider userApiRef={userApiRef} hydrationApiRef={hydrationApiRef}>
        <HydrationProvider hydrationApiRef={hydrationApiRef}>
          <OfflineProvider onSyncSuccessRef={onSyncSuccessRef}>
            <ThemeProvider>{children}</ThemeProvider>
          </OfflineProvider>
        </HydrationProvider>
      </UserProvider>
    </AuthProvider>
  );
}
