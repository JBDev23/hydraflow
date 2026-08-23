import { Dimensions, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import GradientIcon from './GradientIcon';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';
import type { Theme } from '../types';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type DrinkModalProps = {
  value: number;
  setValue: (value: number) => void;
  drinkWater: (amount: number) => void;
  min?: number;
  max?: number;
  svg?: 'glass' | 'drop' | 'bottle' | string;
};

export default function DrinkModal({
  value,
  setValue,
  drinkWater,
  min = 1,
  max = 250,
  svg = 'glass',
}: DrinkModalProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const stopPropagation = () => {};

  return (
    <View style={styles.container}>
      <View style={styles.goalContainer}>
        <Text style={styles.goalTitle}>{value}</Text>
        <Text style={styles.goalSubTitle}>ml</Text>
      </View>
      {svg === 'glass' && (
        <GradientIcon size={screenHeight * 0.275} colors={[theme.colors.primary, theme.colors.primaryDark]}>
          <FontAwesome6 name="glass-water" size={screenHeight * 0.25} solid />
        </GradientIcon>
      )}
      {svg === 'drop' && (
        <GradientIcon size={screenHeight * 0.275} colors={[theme.colors.primary, theme.colors.primaryDark]}>
          <FontAwesome6 name="droplet" size={screenHeight * 0.25} solid />
        </GradientIcon>
      )}
      {svg === 'bottle' && (
        <GradientIcon size={screenHeight * 0.275} colors={[theme.colors.primary, theme.colors.primaryDark]}>
          <FontAwesome6 name="bottle-water" size={screenHeight * 0.25} solid />
        </GradientIcon>
      )}

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={25}
        value={value}
        onValueChange={setValue}
        minimumTrackTintColor={theme.colors.primaryMid}
        maximumTrackTintColor={theme.colors.text}
        thumbTintColor={theme.colors.primaryDark}
        onTouchStart={stopPropagation}
        onTouchEnd={stopPropagation}
      />
      <TouchableOpacity onPress={() => drinkWater(value)} style={styles.mButton}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]}>
          <Text style={styles.buttonText}>Beber</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalTitle: {
      fontSize: 64,
      fontFamily: theme.regular,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
      color: theme.colors.primaryDark,
      lineHeight: 69,
      paddingTop: 10,
    },
    goalSubTitle: {
      fontSize: 40,
      fontFamily: theme.regular,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
      color: theme.colors.primaryDark,
    },
    goalContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginLeft: 10,
      paddingRight: 20,
      marginTop: -20,
    },
    slider: {
      width: '50%',
      height: '50%',
      position: 'absolute',
      alignSelf: 'center',
      transform: [{ scale: 2 }, { rotate: '-90deg' }],
      marginTop: 20,
      right: -50,
      top: 70,
    },
    mButton: {
      width: screenWidth * 0.4,
      borderRadius: 10,
      overflow: 'hidden',
      alignSelf: 'center',
      marginTop: 20,
    },
    buttonText: {
      fontSize: 30,
      fontFamily: theme.regular,
      alignSelf: 'center',
      textAlign: 'center',
      color: theme.colors.contrast,
    },
  });
