import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { registerToastHost } from '../utils/toast';

export default function ToastHost() {
  const [message, setMessage] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    const unregister = registerToastHost((text, ms) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setMessage(text);
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, ms);
    });

    return () => {
      unregister();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [opacity]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View style={[styles.toast, { opacity }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
    paddingBottom: 96,
  },
  toast: {
    maxWidth: '86%',
    backgroundColor: 'rgba(30, 36, 50, 0.92)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
  },
});
