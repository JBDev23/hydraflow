import { FontAwesome6 } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type AnimatedDropletProps = {
  isActive: boolean;
  color: string;
};

function AnimatedDroplet({ isActive, color }: AnimatedDropletProps) {
  const animY = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    let loopAnimation: Animated.CompositeAnimation | undefined;

    if (isActive) {
      animY.setValue(0);

      const duration = 800;

      loopAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(animY, {
            toValue: -5,
            duration,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animY, {
            toValue: 0,
            duration,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animY, {
            toValue: 5,
            duration,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animY, {
            toValue: 0,
            duration,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      loopAnimation.start();
    } else {
      animY.stopAnimation();
      Animated.spring(animY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    }

    return () => {
      loopAnimation?.stop();
    };
  }, [isActive, animY]);

  return (
    <Animated.View style={{ transform: [{ translateY: animY }] }}>
      <FontAwesome6 size={20} name="droplet" color={color} solid={true} />
    </Animated.View>
  );
}

type AuthProgressBarProps = {
  totalSteps: number;
  currentStep: number;
};

export default function AuthProgressBar({ totalSteps, currentStep }: AuthProgressBarProps) {
  const getProgressColor = (index: number) => {
    if (index > currentStep) {
      return '#00000040';
    }
    if (index === currentStep) {
      return '#79D8FE';
    }
    return '#6989E2';
  };

  return (
    <View style={styles.progressBar}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isActive = i === currentStep - 1;

        return <AnimatedDroplet key={i} isActive={isActive} color={getProgressColor(i + 1)} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 10,
    zIndex: 10,
  },
});
