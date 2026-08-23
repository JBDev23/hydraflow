import { FontAwesome6 } from '@expo/vector-icons';
import { useEffect, useState, useImperativeHandle, useMemo, forwardRef, type Ref } from 'react';
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
  const wave3 = useMemo(() => new Animated.Value(0), []);
  const swayAnim = useMemo(() => new Animated.Value(0), []);

  const activeIndex = state.index;
  const routes = state.routes;
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
    if (isChanging) return;

    setIsChanging(true);
    audioService.playSound('swipe');
    const isFocused = state.index === routes.indexOf(route);

    Animated.sequence([
      Animated.timing(wave3, {
        toValue: -92,
        easing: Easing.inOut(Easing.exp),
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(wave3, {
        toValue: 0,
        easing: Easing.inOut(Easing.exp),
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    setTimeout(() => {
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      } else {
        navigation.navigate(route.name, { merge: true });
      }
    }, 200);

    setTimeout(() => {
      setIsChanging(false);
    }, 700);
  };

  useImperativeHandle(ref, () => ({
    onPress: (index: number) => {
      if (routes[index]) {
        handlePress(routes[index]);
      }
    },
  }));

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
      >
        <Animated.View style={{ opacity: isChanging ? 0 : 1 }}>
          {options.title === 'Home' ? (
            <Text style={styles.title}>{formatedDate}</Text>
          ) : (
            <Text style={styles.title}>{options.title}</Text>
          )}
          <Text style={styles.subTitle}>
            {'\u201C'}
            {t('main.motivator')}
            {'\u201D'}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.overlayBar, { opacity: isChanging ? 1 : 0 }]} />
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
    icon: {
      zIndex: 3,
      position: 'absolute',
      padding: '5%',
    },
    title: {
      fontFamily: theme.regular,
      fontSize: screenHeight * 0.025,
      alignSelf: 'center',
      color: theme.colors.contrast,
      top: '10%',
      marginBottom: screenHeight * 0.02,
    },
    subTitle: {
      fontFamily: theme.regular,
      fontSize: screenHeight * 0.02,
      alignSelf: 'center',
      color: theme.colors.contrast,
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
