import { FontAwesome6 } from '@expo/vector-icons';
import {
  useEffect,
  useState,
  useImperativeHandle,
  useMemo,
  useRef,
  forwardRef,
  type Ref,
} from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { getFormattedDate } from '../utils/dateFormatter';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { audioService } from '../services/audioService';
import type { Theme } from '../types';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ICONS = ['house', 'chart-simple', 'trophy', 'basket-shopping', 'user', 'gear'] as const;

const WAVE_UP_DURATION = 350;
const WAVE_DOWN_DURATION = 350;
const WAVE_LIFT = -92;
const TEXT_FADE_DELAY = 60;
const TEXT_FADE_DURATION = 290;
const NAVIGATION_FALLBACK_TIMEOUT = WAVE_UP_DURATION + WAVE_DOWN_DURATION + 800;

type TabRoute = {
  key: string;
  name: string;
};

type TabNavigationState = {
  index: number;
  routes: TabRoute[];
};

type TabDescriptor = {
  options: {
    title?: string;
  };
};

type TabNavigation = {
  emit: (event: { type: string; target: string; canPreventDefault: boolean }) => {
    defaultPrevented: boolean;
  };
  navigate: (name: string, params?: { merge?: boolean }) => void;
};

export type FooterTabBarHandle = {
  onPress: (index: number) => void;
  isNavigating: () => boolean;
};

export type FooterTabBarProps = {
  wave1?: number;
  wave2?: number;
  state: TabNavigationState;
  descriptors: Record<string, TabDescriptor>;
  navigation: TabNavigation;
  selectedDay: Date;
};

const FooterTabBar = forwardRef(function FooterTabBar(
  { wave1 = 0, wave2 = 0, state, descriptors, navigation, selectedDay }: FooterTabBarProps,
  ref: Ref<FooterTabBarHandle>,
) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();

  const formatedDate = getFormattedDate(selectedDay);

  const [isChanging, setIsChanging] = useState(false);
  const isChangingRef = useRef(false);
  const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wave3 = useMemo(() => new Animated.Value(0), []);
  const textOpacity = useMemo(() => new Animated.Value(1), []);
  const overlayOpacity = useMemo(() => new Animated.Value(0), []);
  const swayAnim = useMemo(() => new Animated.Value(0), []);
  const waveAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const interactionHandleRef = useRef<{ cancel: () => void } | null>(null);
  const pendingIndexRef = useRef<number | null>(null);
  const routesRef = useRef<TabRoute[]>([]);
  const activeIndexRef = useRef(0);
  const handlePressRef = useRef<(route: TabRoute) => void>(() => {});

  const clearNavigationTimers = () => {
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = null;
    }
    interactionHandleRef.current?.cancel();
    interactionHandleRef.current = null;
  };

  const startNavigationLock = () => {
    isChangingRef.current = true;
    setIsChanging(true);
  };

  const flushPendingNavigation = () => {
    const pending = pendingIndexRef.current;
    if (pending == null) return;

    pendingIndexRef.current = null;
    const route = routesRef.current[pending];
    if (!route || activeIndexRef.current === pending) return;

    queueMicrotask(() => handlePressRef.current(route));
  };

  const endNavigationLock = () => {
    isChangingRef.current = false;
    setIsChanging(false);
    textOpacity.setValue(1);
    overlayOpacity.setValue(0);
    flushPendingNavigation();
  };

  const runWaveDownAnimation = () => {
    waveAnimationRef.current = Animated.parallel([
      Animated.timing(wave3, {
        toValue: 0,
        easing: Easing.inOut(Easing.exp),
        duration: WAVE_DOWN_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        delay: TEXT_FADE_DELAY,
        duration: TEXT_FADE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        delay: TEXT_FADE_DELAY,
        duration: TEXT_FADE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    waveAnimationRef.current.start(({ finished }) => {
      waveAnimationRef.current = null;
      if (finished) {
        endNavigationLock();
      }
    });
  };

  const runWaveAnimation = (onNavigate: () => void) => {
    waveAnimationRef.current?.stop();
    clearNavigationTimers();

    textOpacity.setValue(0);
    overlayOpacity.setValue(1);

    waveAnimationRef.current = Animated.timing(wave3, {
      toValue: WAVE_LIFT,
      easing: Easing.inOut(Easing.exp),
      duration: WAVE_UP_DURATION,
      useNativeDriver: true,
    });

    waveAnimationRef.current.start(({ finished }) => {
      waveAnimationRef.current = null;
      if (!finished) return;

      onNavigate();

      const idleId = requestIdleCallback(() => {
        interactionHandleRef.current = null;
        runWaveDownAnimation();
      });
      interactionHandleRef.current = {
        cancel: () => cancelIdleCallback(idleId),
      };
    });

    unlockTimeoutRef.current = setTimeout(() => {
      unlockTimeoutRef.current = null;
      if (isChangingRef.current) {
        endNavigationLock();
      }
    }, NAVIGATION_FALLBACK_TIMEOUT);
  };

  const activeIndex = state.index;
  const routes = state.routes;
  routesRef.current = routes;
  activeIndexRef.current = activeIndex;
  const currentRoute = routes[activeIndex];

  const { options } = descriptors[currentRoute.key];

  const prevIndex = (activeIndex - 1 + routes.length) % routes.length;
  const nextIndex = (activeIndex + 1) % routes.length;

  const prevRoute = routes[prevIndex];
  const nextRoute = routes[nextIndex];

  const currentIcon = ICONS[activeIndex % ICONS.length];
  const prevIcon = ICONS[prevIndex % ICONS.length];
  const nextIcon = ICONS[nextIndex % ICONS.length];

  const handlePress = (route: TabRoute) => {
    const routeIndex = routes.findIndex((r) => r.key === route.key);
    if (routeIndex === -1) return;

    if (isChangingRef.current) {
      pendingIndexRef.current = routeIndex;
      return;
    }

    const isFocused = state.index === routeIndex;
    if (isFocused) return;

    startNavigationLock();
    audioService.playSound('swipe');

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    runWaveAnimation(() => {
      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    });
  };

  handlePressRef.current = handlePress;

  useImperativeHandle(ref, () => ({
    onPress: (index: number) => {
      if (routes[index]) {
        handlePress(routes[index]);
      }
    },
    isNavigating: () => isChangingRef.current,
  }));

  useEffect(
    () => () => {
      waveAnimationRef.current?.stop();
      clearNavigationTimers();
    },
    [],
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [swayAnim]);

  const rotate1 = swayAnim.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const rotate2 = swayAnim.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '-2deg'] });

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        disabled={isChanging}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        onPress={() => handlePress(currentRoute)}
        activeOpacity={1}
        style={[styles.icon, { alignSelf: 'center', top: -screenHeight * 0.02 }]}
      >
        <FontAwesome6
          size={screenHeight * 0.035}
          name={currentIcon}
          color={theme.colors.contrast}
          solid
        />
      </TouchableOpacity>

      <TouchableOpacity
        disabled={isChanging}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        onPress={() => handlePress(prevRoute)}
        style={[styles.icon, { left: screenWidth * 0.1, top: screenHeight * 0.05 }]}
      >
        <FontAwesome6
          size={screenHeight * 0.03}
          name={prevIcon}
          color={theme.colors.contrastLight}
          solid
        />
      </TouchableOpacity>

      <TouchableOpacity
        disabled={isChanging}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        onPress={() => handlePress(nextRoute)}
        style={[styles.icon, { right: screenWidth * 0.1, top: screenHeight * 0.05 }]}
      >
        <FontAwesome6
          size={screenHeight * 0.03}
          name={nextIcon}
          color={theme.colors.contrastLight}
          solid
        />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.wave,
          styles.wave1,
          { transform: [{ translateX: wave1 || 0 }, { rotate: rotate1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          styles.wave2,
          { transform: [{ translateX: wave2 || 0 }, { rotate: rotate2 }] },
        ]}
      />

      <Animated.View
        style={[styles.wave, styles.wave3, { transform: [{ translateY: wave3 || 0 }] }]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.footerTextContainer,
          { transform: [{ translateY: wave3 || 0 }], opacity: textOpacity },
        ]}
      >
        {currentRoute.name === 'index' ? (
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatedDate}
          </Text>
        ) : (
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {options.title}
          </Text>
        )}
        <Text
          style={styles.subTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          ellipsizeMode="tail"
        >
          {'\u201C'}
          {t('main.motivator')}
          {'\u201D'}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.overlayBar, { opacity: overlayOpacity }]} />
      <Animated.View style={styles.bottomBar} />
    </View>
  );
});

export default FooterTabBar;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    footerContainer: {
      height: screenHeight * 0.2,
      width: '100%',
      backgroundColor: theme.colors.background,
      position: 'relative',
    },
    wave: {
      height: '100%',
      width: screenWidth * 1.2,
      alignSelf: 'center',
      borderTopLeftRadius: '100%',
      borderTopRightRadius: '100%',
      position: 'absolute',
    },
    wave1: {
      backgroundColor: theme.colors.primary,
      bottom: '0%',
      zIndex: 1,
    },
    wave2: {
      backgroundColor: theme.colors.primaryMid,
      bottom: '-25%',
      zIndex: 2,
    },
    wave3: {
      backgroundColor: theme.colors.primaryDark,
      bottom: '-50%',
      zIndex: 4,
    },
    footerTextContainer: {
      position: 'absolute',
      bottom: screenHeight * 0.02,
      left: screenWidth * 0.1,
      right: screenWidth * 0.1,
      alignItems: 'center',
      zIndex: 6,
    },
    icon: {
      zIndex: 3,
      position: 'absolute',
      padding: '5%',
    },
    title: {
      fontFamily: theme.regular,
      fontSize: screenHeight * 0.025,
      color: theme.colors.contrast,
      textAlign: 'center',
      width: '100%',
      marginBottom: screenHeight * 0.004,
    },
    subTitle: {
      fontFamily: theme.regular,
      fontSize: screenHeight * 0.018,
      lineHeight: screenHeight * 0.022,
      color: theme.colors.contrast,
      textAlign: 'center',
      width: '100%',
    },
    overlayBar: {
      position: 'absolute',
      height: '40%',
      bottom: -50,
      backgroundColor: theme.colors.primaryDark,
      width: screenWidth * 1.2,
      zIndex: 5,
    },
    bottomBar: {
      position: 'absolute',
      height: screenHeight * 0.2 * 0.3,
      bottom: -50,
      backgroundColor: theme.colors.primaryDark,
      width: screenWidth * 1.2,
      zIndex: 4,
    },
  });
