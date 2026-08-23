import { useLayoutEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../types';

type TimeWheelProps = {
  value: number;
  onValueChange: (value: number) => void;
  max: number;
  min?: number;
  loop?: boolean;
};

export default function TimeWheel({
  value,
  onValueChange,
  max,
  min = 0,
  loop = false,
}: TimeWheelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const valueRef = useRef(value);
  const onValueChangeRef = useRef(onValueChange);
  const animY = useMemo(() => new Animated.Value(0), []);

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  useLayoutEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  const format = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) return '00';
    return num.toString().padStart(2, '0');
  };

  const getSafeValue = (val: number) => {
    if (!loop) return val;
    const range = max - min + 1;
    return ((((val - min) % range) + range) % range) + min;
  };

  const smoothUpdate = (targetValue: number) => {
    const startVal = valueRef.current;
    const diff = targetValue - startVal;
    const steps = Math.abs(diff);
    const direction = diff > 0 ? 1 : -1;

    if (steps === 0) return;

    const speed = Math.max(20, 150 / steps);
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;

      const nextValRaw = startVal + direction * currentStep;

      let nextVal: number;

      if (loop) {
        nextVal = getSafeValue(nextValRaw);
      } else {
        nextVal = nextValRaw;
        if (nextVal > max) nextVal = max;
        if (nextVal < min) nextVal = min;
      }

      valueRef.current = nextVal;
      if (onValueChangeRef.current) {
        onValueChangeRef.current(nextVal);
      }

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, speed);
  };

  const smoothUpdateRef = useRef(smoothUpdate);
  useLayoutEffect(() => {
    smoothUpdateRef.current = smoothUpdate;
  });

  // PanResponder handlers run on touch events, not during render.
  const panResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- handler bodies execute outside render
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,

        onMoveShouldSetPanResponder: (_evt, gestureState) => {
          return (
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5
          );
        },
        onPanResponderGrant: () => {
          animY.stopAnimation();
          animY.setValue(0);
        },
        onPanResponderMove: (_evt, gestureState) => {
          let movement = gestureState.dy / 1.5;
          const MAX_LIMIT = 40;
          if (movement > MAX_LIMIT) movement = MAX_LIMIT;
          if (movement < -MAX_LIMIT) movement = -MAX_LIMIT;
          animY.setValue(movement);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const diff = gestureState.dy;
          const PIXELS_PER_STEP = 40;

          Animated.spring(animY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
            speed: 20,
          }).start();

          if (Math.abs(diff) < 10) return;

          const steps = Math.round(-diff / PIXELS_PER_STEP);

          let targetValue = valueRef.current + steps;

          if (!loop) {
            if (targetValue > max) targetValue = max;
            if (targetValue < min) targetValue = min;
          }

          if (targetValue !== valueRef.current) {
            smoothUpdateRef.current(targetValue);
          }
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [animY, loop, max, min],
  );

  const prevValue = getSafeValue(value - 1);
  const nextValue = getSafeValue(value + 1);

  const showPrev = loop || value > min;
  const showNext = loop || value < max;

  return (
    <View style={styles.wheelContainer} {...panResponder.panHandlers}>
      <Animated.View style={[styles.wheelInner, { transform: [{ translateY: animY }] }]}>
        <View style={styles.itemContainer}>
          <Text style={styles.textSecondary}>{showPrev ? format(prevValue) : '  '}</Text>
        </View>

        <View style={styles.itemContainer}>
          <Text style={styles.textPrimary}>{format(value)}</Text>
        </View>

        <View style={styles.itemContainer}>
          <Text style={styles.textSecondary}>{showNext ? format(nextValue) : '  '}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wheelContainer: {
      width: 60,
      height: 90,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    wheelInner: {},
    itemContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      margin: -5,
    },
    textPrimary: {
      fontSize: 30,
      fontFamily: theme.regular,
      color: theme.colors.text,
    },
    textSecondary: {
      fontSize: 20,
      fontFamily: theme.regular,
      color: theme.colors.textTertiary,
      lineHeight: 30,
    },
  });
