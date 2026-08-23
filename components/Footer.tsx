import { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../types';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type FooterProps = {
  wave1?: Animated.Value | number;
  wave2?: Animated.Value | number;
  wave3?: Animated.Value | number;
};

export default function Footer({ wave1 = 0, wave2 = 0, wave3 = 0 }: FooterProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, [swayAnim]);

  const rotate1 = swayAnim.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const rotate2 = swayAnim.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '-2deg'] });
  const rotate3 = swayAnim.interpolate({ inputRange: [0, 1], outputRange: ['-1deg', '1deg'] });

  return (
    <View style={styles.footerContainer}>
      <Animated.View
        style={[
          styles.wave,
          styles.wave1,
          { transform: [{ translateX: wave1 }, { rotate: rotate1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          styles.wave2,
          { transform: [{ translateX: wave2 }, { rotate: rotate2 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          styles.wave3,
          { transform: [{ translateY: wave3 }, { rotate: rotate3 }] },
        ]}
      />
      <Animated.View style={styles.bottomBar} />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    footerContainer: {
      height: screenHeight * 0.2,
      width: screenWidth,
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
      zIndex: 3,
    },
    bottomBar: {
      position: 'absolute',
      height: screenHeight * 0.2 * 0.4,
      bottom: -50,
      backgroundColor: theme.colors.primaryDark,
      width: screenWidth * 1.2,
      zIndex: 4,
    },
  });
