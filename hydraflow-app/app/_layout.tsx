import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts, Aldrich_400Regular } from '@expo-google-fonts/aldrich';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import CustomSplashScreen from '../components/CustomSplashScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppProviders } from '../context/AppProviders';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import ToastHost from '../components/ToastHost';
import './i18n';

SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const { isLoading: isGlobalLoading, authToken } = useAuth();
  const { userProfile } = useUser();

  const [progress, setProgress] = useState(0);
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Aldrich_400Regular,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (!isGlobalLoading && fontsLoaded) {
          return prev < 100 ? prev + 2 : 100;
        }
        if (prev < 90) {
          return prev + 0.1;
        }
        return prev;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [isGlobalLoading, fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        setIsSplashAnimationDone(true);
      }, 200);
    }
  }, [progress]);

  useEffect(() => {
    if (isGlobalLoading || !fontsLoaded || !isSplashAnimationDone) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboardingCompleted = userProfile?.onboardingCompleted;
    const isLoggedIn = Boolean(authToken);

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)');
      return;
    }

    if (isLoggedIn && !isOnboardingCompleted && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isLoggedIn && isOnboardingCompleted && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [
    userProfile,
    authToken,
    segments,
    isGlobalLoading,
    fontsLoaded,
    isSplashAnimationDone,
    router,
  ]);

  if (!isSplashAnimationDone) {
    return <CustomSplashScreen progress={Math.round(progress)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <Slot />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AppNavigator />
      <ToastHost />
    </AppProviders>
  );
}
