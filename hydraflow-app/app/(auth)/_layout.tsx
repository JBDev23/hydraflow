import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  Easing,
  Animated,
  Dimensions,
} from 'react-native';
import Footer from '../../components/Footer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AuthProgressBar from '../../components/AuthProgressBar';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../types';

const screenWidth = Dimensions.get('window').width;

const PAGES_ORDER = [
  '',
  'login',
  'age',
  'gender',
  'weight',
  'height',
  'activity',
  'sleep',
  'creatingPlan',
  'readyPlan',
];

export default function AuthLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [inicioX, setInicioX] = useState(0);

  const lastIndex = useRef(0);

  const fade = useMemo(() => new Animated.Value(1), []);
  const wave1 = useMemo(() => new Animated.Value(0), []);
  const wave2 = useMemo(() => new Animated.Value(0), []);
  const wave3 = useMemo(() => new Animated.Value(0), []);

  const getScreenInfo = () => {
    if (pathname === '/' || pathname.endsWith('/(auth)')) return { title: 'index', step: 0 };
    if (pathname.includes('login')) return { title: 'login', step: 1 };
    if (pathname.includes('age')) return { title: 'age', step: 2 };
    if (pathname.includes('gender')) return { title: 'gender', step: 3 };
    if (pathname.includes('weight')) return { title: 'weight', step: 4 };
    if (pathname.includes('height')) return { title: 'height', step: 5 };
    if (pathname.includes('activity')) return { title: 'activity', step: 6 };
    if (pathname.includes('sleep')) return { title: 'sleep', step: 7 };
    if (pathname.includes('creatingPlan')) return { title: 'creatingPlan', step: 8 };
    if (pathname.includes('readyPlan')) return { title: 'readyPlan', step: 9 };
    return { title: 'index', step: 0 };
  };

  const currentScreenInfo = getScreenInfo();

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
    const actualIndex = currentScreenInfo.step;

    setTimeout(() => {
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 250);

    if (actualIndex > lastIndex.current) {
      Animated.parallel([
        Animated.timing(wave1, {
          toValue: -screenWidth * 1.1,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.exp),
        }),
        Animated.timing(wave2, {
          toValue: -screenWidth * 1.1,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.exp),
        }),
        Animated.timing(wave3, {
          toValue: -65,
          easing: Easing.inOut(Easing.exp),
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        wave1.setValue(screenWidth * 1.1);
        wave2.setValue(screenWidth * 1.1);
        Animated.parallel([
          Animated.timing(wave1, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.exp),
          }),
          Animated.timing(wave2, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.exp),
          }),
          Animated.timing(wave3, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.exp),
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(wave1, {
          toValue: screenWidth * 1.1,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.exp),
        }),
        Animated.timing(wave2, {
          toValue: screenWidth * 1.1,
          duration: 450,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.exp),
        }),
        Animated.timing(wave3, {
          toValue: -65,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.exp),
        }),
      ]).start(() => {
        wave1.setValue(-screenWidth * 1.1);
        wave2.setValue(-screenWidth * 1.1);
        Animated.parallel([
          Animated.timing(wave1, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.exp),
          }),
          Animated.timing(wave2, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.exp),
          }),
          Animated.timing(wave3, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.exp),
          }),
        ]).start();
      });
    }

    lastIndex.current = actualIndex;
  }, [pathname, currentScreenInfo.step, fade, wave1, wave2, wave3]);

  const handleBack = () => {
    Animated.timing(fade, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  const handleNext = () => {
    const nextStepIndex = currentScreenInfo.step + 1;
    if (nextStepIndex < PAGES_ORDER.length && nextStepIndex !== 1) {
      router.push('/(auth)/' + PAGES_ORDER[nextStepIndex]);
      Animated.timing(fade, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const onTouchStart = (e: { nativeEvent: { pageX: number } }) => {
    if (pathname.includes('(app)')) return;
    setInicioX(e.nativeEvent.pageX);
  };

  const onTouchEnd = (e: { nativeEvent: { pageX: number } }) => {
    if (pathname.includes('(app)')) return;

    const finX = e.nativeEvent.pageX;
    const diferencia = inicioX - finX;

    if (diferencia > 50) {
      handleNext();
    } else if (finX - inicioX > 50) {
      if (currentScreenInfo.step > 0 && currentScreenInfo.step !== 8) {
        handleBack();
      }
    }
  };

  const showNav =
    currentScreenInfo.title !== 'index' &&
    currentScreenInfo.title !== 'creatingPlan' &&
    currentScreenInfo.title !== 'readyPlan';

  return (
    <View style={styles.container} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <StatusBar style="dark" />
      <View
        style={[styles.header, { paddingTop: insets.top }]}
        onLayout={(event) => {
          setHeaderHeight(event.nativeEvent.layout.height);
        }}
      >
        {showNav && currentScreenInfo.title !== 'age' && (
          <TouchableOpacity hitSlop={20} onPress={handleBack} style={styles.backButton}>
            <FontAwesome6 name="angle-left" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        )}

        <Text style={styles.headerText}>HydraFlow</Text>

        {showNav && <AuthProgressBar currentStep={currentScreenInfo.step} totalSteps={7} />}
      </View>
      <LinearGradient
        colors={[theme.colors.background, 'transparent']}
        locations={[0, 0.5]}
        style={[styles.topFade, { top: headerHeight }]}
      />
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 1000,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          {PAGES_ORDER.map((pageName) => (
            <Stack.Screen key={pageName || 'index'} name={pageName || 'index'} />
          ))}
        </Stack>
      </Animated.View>

      {!isKeyboardVisible && (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', theme.colors.background]}
            locations={[0, 0.5]}
            style={styles.bottomfade}
          />
          <Footer wave1={wave1} wave2={wave2} wave3={wave3} />
        </>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      flexDirection: 'column',
      zIndex: 10,
    },
    bottomfade: {
      height: '10%',
      width: '100%',
      position: 'absolute',
      bottom: '15%',
      zIndex: 0,
    },
    topFade: {
      height: '5%',
      width: '100%',
      position: 'absolute',
      zIndex: 1,
    },
    headerText: {
      fontSize: 20,
      fontFamily: theme.regular,
      color: theme.colors.text,
    },
    backButton: {
      position: 'absolute',
      zIndex: 5,
      left: 0,
      paddingHorizontal: 20,
    },
  });
