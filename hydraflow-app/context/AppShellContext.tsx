import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import FooterTabBar, {
  type FooterTabBarHandle,
  type FooterTabBarProps,
} from '../components/FooterTabBar';
import TutorialOverlay from '../components/TutorialOverlay';
import CustomModal from '../components/CustomModal';
import LevelUpModal from '../components/LevelUpModal';
import GradientIcon from '../components/GradientIcon';
import { useTheme } from './ThemeContext';
import { useHydration } from './HydrationContext';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getLocalizedText } from '../utils/i18nHelpers';
import type {
  AppShellContextValue,
  CatalogAchievement,
  LevelUpModalConfig,
  Theme,
  TutorialStep,
} from '../types';

const screenHeight = Dimensions.get('window').height;

const AppShellContext = createContext<AppShellContextValue | null>(null);

const SCREENS_CONFIG = [
  { name: 'index', path: '/', title: 'Home', icon: 'house' },
  { name: 'stats', path: 'stats', title: 'screen.stats', icon: 'chart-simple' },
  { name: 'achievements', path: 'achievements', title: 'screen.achievements', icon: 'trophy' },
  { name: 'shop', path: 'shop', title: 'screen.shop', icon: 'basket-shopping' },
  { name: 'profile', path: 'profile', title: 'screen.profile', icon: 'user' },
  { name: 'settings', path: 'settings', title: 'screen.settings', icon: 'gear' },
] as const;

const GOLD_COLORS = ['#FFD700', 'rgba(255,215,0,0.4)'] as [string, string];

export function AppShellProvider() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const footerRef = useRef<FooterTabBarHandle | null>(null);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const { selectedDay } = useHydration();

  const TUTORIAL_STEPS = useMemo((): TutorialStep[] => {
    const steps = (t('tutorial.steps', { returnObjects: true }) as TutorialStep[]) || [];
    return steps.map((step, index) => {
      if (index === 4) return { ...step, tab: 1 };
      if (index === 5) return { ...step, tab: 2 };
      if (index === 6) return { ...step, tab: 3 };
      if (index === 7) return { ...step, tab: 4 };
      if (index === 8) return { ...step, tab: 0 };
      return step;
    });
  }, [t]);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [inicioX, setInicioX] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpModalConfig, setLevelUpModalConfig] = useState<LevelUpModalConfig>({
    level: 1,
    drops: 0,
  });

  const [achievementQueue, setAchievementQueue] = useState<CatalogAchievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<CatalogAchievement | null>(null);
  const [showAchModal, setShowAchModal] = useState(false);

  const currentScreenInfo = useMemo(() => {
    const index = SCREENS_CONFIG.findIndex(
      (s) =>
        pathname === s.path ||
        pathname.includes(`/${s.name}`) ||
        (s.name === 'index' && pathname === '/'),
    );

    const safeIndex = index !== -1 ? index : 0;

    return {
      ...SCREENS_CONFIG[safeIndex],
      step: safeIndex,
    };
  }, [pathname]);

  const changeTab = useCallback((index: number) => {
    footerRef.current?.onPress(index);
  }, []);

  const onTouchStart = (e: { nativeEvent: { pageX: number } }) => {
    setInicioX(e.nativeEvent.pageX);
  };

  const onTouchEnd = (e: { nativeEvent: { pageX: number } }) => {
    const finX = e.nativeEvent.pageX;
    const diferencia = inicioX - finX;
    const SWIPE_THRESHOLD = 50;
    const maxIndex = SCREENS_CONFIG.length - 1;

    if (diferencia > SWIPE_THRESHOLD) {
      let nextIndex = currentScreenInfo.step + 1;
      if (nextIndex > maxIndex) nextIndex = 0;
      footerRef.current?.onPress(nextIndex);
    } else if (finX - inicioX > SWIPE_THRESHOLD) {
      let nextIndex = currentScreenInfo.step - 1;
      if (nextIndex < 0) nextIndex = maxIndex;
      footerRef.current?.onPress(nextIndex);
    }
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const checkTutorial = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem(STORAGE_KEYS.USER_TUTORIAL);
        if (hasSeen !== 'true') {
          setTimeout(() => setShowTutorial(true), 1000);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkTutorial();
  }, []);

  const startTutorial = useCallback(() => {
    setShowTutorial(true);
    changeTab(0);
  }, [changeTab]);

  const closeTutorial = async () => {
    setShowTutorial(false);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_TUTORIAL, 'true');
    changeTab(0);
  };

  const levelUp = useCallback(
    (newLevel: number, dropsEarned: number) => {
      setLevelUpModalConfig({ level: newLevel, drops: dropsEarned });
      setShowLevelUpModal(true);
      changeTab(0);
    },
    [changeTab],
  );

  const newAch = useCallback((newAchs: CatalogAchievement[]) => {
    if (newAchs && newAchs.length > 0) {
      setAchievementQueue((prev) => [...prev, ...newAchs]);
    }
  }, []);

  useEffect(() => {
    if (!showAchModal && achievementQueue.length > 0) {
      queueMicrotask(() => {
        setCurrentAchievement(achievementQueue[0]);
        setShowAchModal(true);
        setAchievementQueue((prev) => prev.slice(1));
      });
    }
  }, [achievementQueue, showAchModal]);

  const shellValue = useMemo<AppShellContextValue>(
    () => ({
      changeTab,
      startTutorial,
      levelUp,
      newAch,
    }),
    [changeTab, startTutorial, levelUp, newAch],
  );

  return (
    <AppShellContext.Provider value={shellValue}>
      <View
        style={{ flex: 1, backgroundColor: 'white' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
        <View
          style={[styles.header, { paddingTop: insets.top }]}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setHeaderHeight(height);
          }}
        >
          {currentScreenInfo.step !== 0 && currentScreenInfo.step !== 5 && (
            <TouchableOpacity
              onPress={() => footerRef.current?.onPress(0)}
              style={{
                position: 'absolute',
                zIndex: 5,
                left: 0,
                paddingBottom: insets.top,
                top: insets.top + 5,
                paddingHorizontal: 20,
              }}
            >
              <FontAwesome6
                name="house"
                color={theme.colors.text}
                solid
                size={screenHeight * 0.025}
              />
            </TouchableOpacity>
          )}
          <Text style={styles.headerText}>HydraFlow</Text>
          <TouchableOpacity
            onPress={() => footerRef.current?.onPress(currentScreenInfo.step === 4 ? 5 : 4)}
            style={{
              position: 'absolute',
              zIndex: 5,
              right: 0,
              paddingBottom: insets.top,
              top: insets.top + 5,
              paddingHorizontal: 20,
            }}
          >
            <FontAwesome6
              name={currentScreenInfo.step === 4 ? 'gear' : 'user'}
              color={theme.colors.text}
              solid
              size={screenHeight * 0.025}
            />
          </TouchableOpacity>
        </View>
        <LinearGradient
          pointerEvents="none"
          colors={[theme.colors.background, 'transparent']}
          locations={[0, 0.5]}
          style={[styles.bottomfade2, { top: headerHeight }]}
        />
        <Tabs
          tabBar={(props) => (
            <FooterTabBar
              {...(props as unknown as FooterTabBarProps)}
              ref={footerRef}
              selectedDay={selectedDay}
            />
          )}
          screenOptions={{ headerShown: false }}
        >
          {SCREENS_CONFIG.map((screen) => (
            <Tabs.Screen
              key={screen.name}
              name={screen.name}
              options={{ title: t(screen.title) }}
            />
          ))}
        </Tabs>
        {!isKeyboardVisible && (
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', theme.colors.background]}
            locations={[0, 0.5]}
            style={styles.bottomfade}
          />
        )}
      </View>
      <TutorialOverlay
        visible={showTutorial}
        steps={TUTORIAL_STEPS}
        onFinish={closeTutorial}
        onSkip={closeTutorial}
        changeTab={changeTab}
      />
      <CustomModal
        visible={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        borderColor={'#FFD700'}
      >
        <LevelUpModal modalConfig={levelUpModalConfig} />
      </CustomModal>
      <CustomModal
        visible={showAchModal}
        onClose={() => setShowAchModal(false)}
        borderColor={'#FFD700'}
      >
        {currentAchievement && (
          <View style={{ alignItems: 'center', justifyContent: 'space-around', flex: 1 }}>
            <GradientIcon size={205} colors={GOLD_COLORS}>
              <FontAwesome6 size={200} name={currentAchievement.icon} />
            </GradientIcon>

            <Text
              style={{
                fontFamily: theme.regular,
                color: theme.colors.text,
                fontSize: 50,
                marginTop: 5,
              }}
            >
              {getLocalizedText(currentAchievement.name)}
            </Text>

            <Text
              style={{
                fontFamily: theme.regular,
                fontSize: 22,
                textAlign: 'center',
                color: theme.colors.textSecondary,
              }}
            >
              {getLocalizedText(currentAchievement.description)}
            </Text>

            <Text
              style={{
                fontFamily: theme.regular,
                fontSize: 18,
                textAlign: 'center',
                color: theme.colors.textSecondary,
              }}
            >
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        )}
      </CustomModal>
    </AppShellContext.Provider>
  );
}

export const useAppShell = (): AppShellContextValue => {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }
  return ctx;
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      flexDirection: 'column',
    },
    bottomfade: {
      height: '10%',
      width: '100%',
      position: 'absolute',
      bottom: '14%',
      zIndex: 0,
    },
    bottomfade2: {
      height: '5%',
      width: '100%',
      position: 'absolute',
      top: 70,
      zIndex: 1,
    },
    headerText: {
      fontSize: screenHeight * 0.025,
      color: theme.colors.text,
      fontFamily: theme.regular,
    },
  });
