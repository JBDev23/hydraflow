import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Dimensions,
  type GestureResponderEvent,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../types';

const screenWidth = Dimensions.get('window').width;

type HorizontalSelectorProps = {
  max?: number;
  min?: number;
  value: number;
  onValueChange: (value: number) => void;
  fontSize?: number;
  width1?: number;
  width2?: number;
};

export default function HorizontalSelector({
  max = 220,
  min = 30,
  value,
  onValueChange,
  fontSize = 70,
  width1 = screenWidth * 0.95,
  width2 = screenWidth * 0.82,
}: HorizontalSelectorProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, fontSize), [theme, fontSize]);

  const startX = useRef(0);
  const valueRef = useRef(value);
  const onValueChangeRef = useRef(onValueChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  const moveX = useRef(new Animated.Value(0)).current;
  const moveYCenter = useRef(new Animated.Value(0)).current;

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
      const nextVal = value + direction * currentStep;

      if (onValueChangeRef.current) {
        onValueChangeRef.current(nextVal);
      }

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, speed);
  };

  const onResponderGrant = (e: GestureResponderEvent) => {
    e.stopPropagation();
    startX.current = e.nativeEvent.pageX;
  };

  const onResponderMove = (e: GestureResponderEvent) => {
    e.stopPropagation();
    const currentX = e.nativeEvent.pageX;
    const diff = currentX - startX.current;

    let movement = diff / 1.5;
    const MAX_LIMIT = 50.0;

    if (movement > MAX_LIMIT) movement = MAX_LIMIT;
    if (movement < -MAX_LIMIT) movement = -MAX_LIMIT;

    const yMovement = -Math.abs(movement);
    moveYCenter.setValue(yMovement);

    moveX.setValue(movement);
  };

  const onResponderRelease = (e: GestureResponderEvent) => {
    e.stopPropagation();
    const endX = e.nativeEvent.pageX;
    const diff = endX - startX.current;

    const PIXELS_PER_STEP = 50;

    Animated.parallel([
      Animated.spring(moveX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 10,
        speed: 20,
      }),
      Animated.spring(moveYCenter, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 10,
        speed: 20,
      }),
    ]).start();

    if (Math.abs(diff) < 10) return;

    const steps = Math.round(diff / PIXELS_PER_STEP);

    let targetValue = valueRef.current - steps;

    if (targetValue > max) targetValue = max;
    if (targetValue < min) targetValue = min;

    if (targetValue !== valueRef.current) {
      smoothUpdate(targetValue);
    }
  };

  const stopBubble = (e: GestureResponderEvent) => {
    e.stopPropagation();
  };

  return (
    <View
      style={[styles.container, { width: width1 }]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onResponderGrant}
      onResponderMove={onResponderMove}
      onResponderRelease={onResponderRelease}
      onResponderTerminate={onResponderRelease}
      onTouchStart={stopBubble}
      onTouchEnd={stopBubble}
    >
      <Animated.View style={[styles.layer]}>
        <Animated.View
          style={[
            styles.textWrapper,
            { transform: [{ translateX: moveX }, { translateY: moveX }] },
          ]}
        >
          <Text style={styles.firstLayerText}>{value - 2 >= min ? value - 2 : ''}</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.textWrapper,
            { transform: [{ translateX: moveX }, { translateY: Animated.multiply(moveX, -1) }] },
          ]}
        >
          <Text style={[styles.firstLayerText, { fontSize: fontSize * 0.4285 }]}>
            {value + 2 <= max ? value + 2 : ''}
          </Text>
        </Animated.View>
      </Animated.View>
      <View style={[styles.layer, styles.secondLayer, { width: width2 }]}>
        <Animated.View
          style={[
            styles.textWrapper,
            { transform: [{ translateX: moveX }, { translateY: moveX }] },
          ]}
        >
          <Text style={styles.secondLayerText}>{value - 1 >= min ? value - 1 : ''}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.textWrapper,
            { transform: [{ translateX: moveX }, { translateY: Animated.multiply(moveX, -1) }] },
          ]}
        >
          <Text style={styles.secondLayerText}>{value + 1 <= max ? value + 1 : ''}</Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.layer, styles.thirdLayer]}>
        <Animated.View
          style={[
            styles.textWrapperCenter,
            { transform: [{ translateX: moveX }, { translateY: moveYCenter }] },
          ]}
        >
          <Text style={styles.thirdLayerText}>{value}</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const createStyles = (theme: Theme, fontSize: number) =>
  StyleSheet.create({
    container: {
      alignSelf: 'center',
      marginTop: -20,
    },
    layer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    secondLayer: {
      alignSelf: 'center',
    },
    thirdLayer: {
      alignSelf: 'center',
      marginTop: '-15%',
      justifyContent: 'center',
    },
    firstLayerText: {
      fontFamily: theme.regular,
      fontSize: fontSize * 0.4285,
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
    secondLayerText: {
      fontFamily: theme.regular,
      fontSize: fontSize * 0.6425,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    thirdLayerText: {
      fontFamily: theme.regular,
      fontSize: fontSize,
      color: theme.colors.text,
    },
    textWrapper: {
      width: 98,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrapperCenter: {
      width: 160,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
