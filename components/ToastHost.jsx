import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { registerToastHost } from '../utils/toast';

const BOTTOM_OFFSET = 96;

export default function ToastHost() {
  const [message, setMessage] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const durationRef = useRef(2200);

  useEffect(() => {
    const unregister = registerToastHost((text, ms) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      durationRef.current = ms;
      opacity.setValue(0);
      setMessage(text);
    });

    return () => {
      unregister();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [opacity]);

  const handleShow = () => {
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
    }, durationRef.current);
  };

  return (
    <Modal
      visible={Boolean(message)}
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={handleShow}
      onRequestClose={() => {}}
    >
      <View pointerEvents="none" style={styles.wrap}>
        <Animated.View style={[styles.toast, { opacity }]}>
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    bottom: BOTTOM_OFFSET,
    alignSelf: 'center',
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
