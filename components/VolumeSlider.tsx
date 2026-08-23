import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../types';

const screenHeight = Dimensions.get('window').height;

type VolumeSliderProps = {
  volume: number;
  setVolume: (volume: number) => void;
};

export default function VolumeSlider({ volume, setVolume }: VolumeSliderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [startX, setStartX] = useState(0);

  const onTouchStart = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setStartX(e.nativeEvent.pageX);
  };

  const onTouchMove = (e: GestureResponderEvent) => {
    e.stopPropagation();
    const endX = e.nativeEvent.pageX;
    const diff = -(endX - startX);

    let targetValue = Math.round(volume - diff / 20);

    if (targetValue > 100) targetValue = 100;
    if (targetValue < 0) targetValue = 0;

    if (targetValue !== volume) {
      setVolume(targetValue);
    }
  };

  const onTouchEnd = (e: GestureResponderEvent) => {
    e.stopPropagation();
  };

  return (
    <View
      style={styles.container}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
    >
      <Text style={styles.text}>Volumen</Text>

      <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
        <Text style={[styles.text, { width: '18.5%', textAlign: 'right' }]}>0%</Text>

        <View style={styles.progressBar}>
          <LinearGradient
            style={[styles.progressFill, { width: `${volume}%` }]}
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        <Text style={[styles.text, { width: '18.5%' }]}>100%</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingBottom: screenHeight * 0.02,
    },
    progressBar: {
      borderRadius: 20,
      borderWidth: 5,
      borderColor: theme.colors.border,
      width: '60%',
      height: screenHeight * 0.035,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
      elevation: 5,
    },
    progressFill: {
      width: '50%',
      height: '100%',
      borderTopRightRadius: 20,
    },
    text: {
      fontFamily: theme.regular,
      color: theme.colors.text,
      fontSize: 22,
      alignSelf: 'center',
    },
  });
