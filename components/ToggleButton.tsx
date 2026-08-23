import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Animated, Easing, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../types';

type ToggleButtonProps = {
  value: number;
  onValueChange: (index: number) => void;
  labels?: string[];
  optionWidth?: number;
  fontSize?: number;
  borderRadius?: number;
};

export default function ToggleButton({
  value,
  onValueChange,
  labels = ['OPT1', 'OPT2'],
  optionWidth = 75,
  fontSize = 25,
  borderRadius = 10,
}: ToggleButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, optionWidth, fontSize, borderRadius),
    [theme, optionWidth, fontSize, borderRadius],
  );

  // Animated value is initialized once from the first `value` prop.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-time init
  const animProgress = useMemo(() => new Animated.Value(value), []);

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: value,
      duration: 450,
      easing: Easing.inOut(Easing.poly(3)),
      useNativeDriver: false,
    }).start();
  }, [value, animProgress]);

  const { widthInterp, leftInterp } = useMemo(() => {
    const input: number[] = [];
    const widthOutput: number[] = [];
    const leftOutput: number[] = [];

    for (let i = 0; i < labels.length; i++) {
      input.push(i);
      widthOutput.push(optionWidth);
      leftOutput.push(i * optionWidth);
      if (i < labels.length - 1) {
        input.push(i + 0.5);
        widthOutput.push(optionWidth * 2);
        leftOutput.push(i * optionWidth);
      }
    }

    return {
      widthInterp: { inputRange: input, outputRange: widthOutput },
      leftInterp: { inputRange: input, outputRange: leftOutput },
    };
  }, [labels.length, optionWidth]);

  const animWidth = animProgress.interpolate(widthInterp);
  const animLeft = animProgress.interpolate(leftInterp);

  const animRadius = animProgress.interpolate({
    inputRange: Array.from({ length: labels.length * 2 - 1 }, (_, i) => i * 0.5),
    outputRange: Array.from({ length: labels.length * 2 - 1 }, (_, i) =>
      i % 2 === 0 ? borderRadius : borderRadius / 2,
    ),
  });

  return (
    <View style={[styles.container, { width: optionWidth * labels.length }]}>
      <Animated.View
        style={[
          styles.gradient,
          {
            width: animWidth,
            left: animLeft,
            borderRadius: animRadius,
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {labels.map((label, index) => {
        const textColor = animProgress.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [
            theme.colors.textSecondary,
            theme.colors.contrast,
            theme.colors.textSecondary,
          ],
          extrapolate: 'clamp',
        });

        return (
          <Pressable key={index} onPress={() => onValueChange(index)} style={styles.option}>
            <Animated.Text style={[styles.text, { color: textColor }]}>{label}</Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme, optionWidth: number, fontSize: number, borderRadius: number) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      borderColor: theme.colors.textTertiary,
      borderWidth: 1,
      overflow: 'hidden',
      zIndex: 3,
      borderRadius,
    },
    option: {
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
      width: optionWidth,
    },
    text: {
      fontFamily: theme.regular,
      zIndex: 2,
      fontSize,
    },
    gradient: {
      height: '100%',
      position: 'absolute',
      top: 0,
      overflow: 'hidden',
      zIndex: 1,
    },
  });
