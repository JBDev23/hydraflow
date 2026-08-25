import { Slot, usePathname, useRouter, useSegments } from 'expo-router';
import { useFonts, Aldrich_400Regular } from '@expo-google-fonts/aldrich';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, StyleSheet, View } from 'react-native';
import AndroidNavigationBarBackground from '../components/AndroidNavigationBarBackground';
import CustomSplashScreen from '../components/CustomSplashScreen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProviders } from '../context/AppProviders';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useAppBootstrap } from '../context/AppBootstrapContext';
import { useTheme } from '../context/ThemeContext';
import ToastHost from '../components/ToastHost';
import * as SystemUI from 'expo-system-ui';
import './i18n';

void SplashScreen.preventAutoHideAsync().catch(() => {});

const FADE_DURATION = 450;
const FADE_DELAY = 150;
const SPLASH_MAX_WAIT_MS = 4_000;

function AppNavigator() {
  const { theme } = useTheme();
  const { isLoading: isGlobalLoading, authToken } = useAuth();
  const { userProfile } = useUser();
  const { isHomeLayoutReady, setHomeLayoutReady } = useAppBootstrap();

  const [progress, setProgress] = useState(0);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(false);
  const [forceSplashComplete, setForceSplashComplete] = useState(false);
  const hasStartedFadeRef = useRef(false);
  const [splashOpacity] = useState(() => new Animated.Value(1));
  const [appOpacity] = useState(() => new Animated.Value(0));

  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Aldrich_400Regular,
  });
  const fontsReady = fontsLoaded || Boolean(fontError);

  const isLoggedIn = Boolean(authToken);
  const isOnboardingCompleted = Boolean(userProfile?.onboardingCompleted);
  const needsAppShell = isLoggedIn && isOnboardingCompleted;

  const onAuthRoute = segments[0] === '(auth)' || pathname.startsWith('/(auth)');
  const onAppRoute = segments[0] === '(app)' || pathname.startsWith('/(app)');

  const isAppContentReady =
    forceSplashComplete ||
    (!isGlobalLoading && fontsReady && (needsAppShell ? onAppRoute && isHomeLayoutReady : true));

  const dismissSplash = useCallback(() => {
    if (hasStartedFadeRef.current) return;
    hasStartedFadeRef.current = true;
    setProgress(100);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(appOpacity, {
          toValue: 1,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) {
          splashOpacity.setValue(0);
          appOpacity.setValue(1);
        }
        setIsSplashVisible(false);
        setIsSplashAnimationDone(true);
      });
    }, FADE_DELAY);

    setTimeout(
      () => {
        splashOpacity.setValue(0);
        appOpacity.setValue(1);
        setIsSplashVisible(false);
        setIsSplashAnimationDone(true);
      },
      FADE_DELAY + FADE_DURATION + 100,
    );
  }, [appOpacity, splashOpacity]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  useEffect(() => {
    const timeout = setTimeout(() => setForceSplashComplete(true), SPLASH_MAX_WAIT_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!onAppRoute) {
      setHomeLayoutReady(false);
    }
  }, [onAppRoute, setHomeLayoutReady]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (isAppContentReady) {
          return 100;
        }
        if (prev < 90) {
          return prev + 0.1;
        }
        if (prev < 98) {
          return prev + 0.02;
        }
        return prev;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [isAppContentReady]);

  useEffect(() => {
    if (!fontsReady || isSplashAnimationDone) return;

    const frame = requestAnimationFrame(() => {
      void SplashScreen.hideAsync();
    });

    return () => cancelAnimationFrame(frame);
  }, [fontsReady, isSplashAnimationDone]);

  useEffect(() => {
    if (!isAppContentReady) return;
    dismissSplash();
  }, [isAppContentReady, dismissSplash]);

  useEffect(() => {
    if (isGlobalLoading || !fontsReady) return;

    if (!isLoggedIn && !onAuthRoute) {
      router.replace('/(auth)');
      return;
    }

    if (isLoggedIn && !isOnboardingCompleted) {
      if (!onAuthRoute) {
        router.replace('/(auth)/age');
        return;
      }

      const authScreen = (segments as readonly string[])[1];
      const onAuthEntry = !authScreen || authScreen === 'index' || authScreen === 'login';
      if (onAuthEntry) {
        router.replace('/(auth)/age');
      }
      return;
    }

    if (needsAppShell && !onAppRoute) {
      router.replace('/(app)');
    }
  }, [
    isGlobalLoading,
    fontsReady,
    isLoggedIn,
    isOnboardingCompleted,
    needsAppShell,
    onAuthRoute,
    onAppRoute,
    router,
    segments,
  ]);

  const isWaitingForContent =
    isGlobalLoading || !fontsReady || (needsAppShell && (!onAppRoute || !isHomeLayoutReady));

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.appContent, { opacity: appOpacity }]}>
        <SafeAreaView
          style={[styles.appContentInner, { backgroundColor: theme.colors.background }]}
          edges={['left', 'right', 'bottom']}
          pointerEvents={isSplashAnimationDone ? 'auto' : 'none'}
        >
          <Slot />
        </SafeAreaView>
      </Animated.View>
      <Modal
        visible={isSplashVisible}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <Animated.View
          pointerEvents={isSplashAnimationDone ? 'none' : 'auto'}
          style={[
            styles.splashOverlay,
            {
              opacity: splashOpacity,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <CustomSplashScreen progress={Math.round(progress)} isWaiting={isWaitingForContent} />
        </Animated.View>
      </Modal>
      {!isSplashVisible ? <AndroidNavigationBarBackground /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  appContent: {
    flex: 1,
  },
  appContentInner: {
    flex: 1,
  },
  splashOverlay: {
    flex: 1,
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <AppNavigator />
        <ToastHost />
      </AppProviders>
    </SafeAreaProvider>
  );
}
