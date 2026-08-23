import { NavigationBar } from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const ANDROID_NAV_BAR_FALLBACK = 48;

export default function AndroidNavigationBarBackground() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navBarHeight = Platform.OS === 'android' ? insets.bottom || ANDROID_NAV_BAR_FALLBACK : 0;

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    void SystemUI.setBackgroundColorAsync(theme.colors.background);
    NavigationBar.setStyle('light');
  }, [theme.colors.background]);

  if (Platform.OS !== 'android' || navBarHeight <= 0) {
    return null;
  }

  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: navBarHeight,
          backgroundColor: theme.colors.primaryDark,
          zIndex: 9999,
          elevation: 9999,
        }}
      />
      <NavigationBar style="light" />
    </>
  );
}
