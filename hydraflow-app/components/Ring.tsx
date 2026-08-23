import { useEffect, useMemo, type ReactNode } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RingProps = {
  percentage?: number;
  radius?: number;
  strokeWidth?: number;
  colors?: [string, string];
  children?: ReactNode;
};

export default function Ring({
  percentage = 0,
  radius = 80,
  strokeWidth = 15,
  colors,
  children,
}: RingProps) {
  const { theme } = useTheme();

  const activeColors = colors || [theme.colors.primary, theme.colors.primaryDark];

  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const containerPadding = 3;
  const discRadius = radius + containerPadding;

  const shadowBlur = 15;
  const svgSize = (discRadius + shadowBlur) * 2;
  const center = svgSize / 2;

  const angle = ((clampedPercentage * 360) / 100) * (Math.PI / 180);
  const endX = 50 + 50 * Math.cos(angle);
  const endY = 50 + 50 * Math.sin(angle);

  const animatedValue = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clampedPercentage,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [clampedPercentage, animatedValue]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={{
        width: svgSize,
        height: svgSize,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <Defs>
          <LinearGradient id="progressGrad" x1="100%" y1="50%" x2={`${endX}%`} y2={`${endY}%`}>
            <Stop offset="0%" stopColor={activeColors[0]} />
            <Stop offset="100%" stopColor={activeColors[1]} />
          </LinearGradient>

          <RadialGradient
            id="shadowGrad"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="80%" stopColor={theme.colors.transparentMain} stopOpacity="1" />
            <Stop offset="100%" stopColor={theme.colors.text} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle cx={center} cy={center + 6} r={discRadius + 2} fill="url(#shadowGrad)" />

        <Circle
          cx={center}
          cy={center}
          r={discRadius}
          fill={theme.colors.contrast}
          stroke={theme.colors.textTertiary || '#EEEEEE'}
          strokeWidth={1}
        />

        <Circle
          cx={center}
          cy={center}
          r={discRadius - strokeWidth}
          fill={theme.colors.contrast}
          stroke={theme.colors.textTertiary || '#EEEEEE'}
          strokeWidth={1}
        />

        <Circle
          cx={center}
          cy={center}
          r={innerRadius + 3}
          stroke={theme.colors.background}
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.5}
        />

        <AnimatedCircle
          cx={center}
          cy={center}
          r={innerRadius + 3}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View style={StyleSheet.absoluteFill}>
        <View style={styles.centerContent}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
