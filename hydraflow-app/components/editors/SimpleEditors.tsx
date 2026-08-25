import { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

type NameEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type SliderEditorProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
};

type WeightEditorProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
};

export const NameEditor = ({ value, onChange }: NameEditorProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.formElem}>
      <TextInput
        style={styles.input}
        onChangeText={onChange}
        placeholder={t('namePlaceholder')}
        value={value}
        placeholderTextColor={theme.colors.textSecondary}
      />
    </View>
  );
};

export const SliderEditor = ({ value, onChange, min, max, step, unit }: SliderEditorProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const displayValue = useMemo(() => {
    const val = typeof value === 'number' ? value : min;
    if (unit === 'ft') {
      const ft = Math.floor(val / 12);
      const inc = val % 12;
      return `${ft}' ${inc}"`;
    }
    return val;
  }, [value, unit, min]);

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.number}>{displayValue}</Text>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={typeof value === 'number' ? value : min}
        onValueChange={onChange}
        minimumTrackTintColor={theme.colors.primaryMid}
        maximumTrackTintColor={theme.colors.text}
        thumbTintColor={theme.colors.primaryDark}
      />
    </View>
  );
};

export const WeightEditor = ({ value, onChange, min, max }: WeightEditorProps) => (
  <SliderEditor value={value} onChange={onChange} min={min} max={max} step={1} />
);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    formElem: {
      width: '90%',
      alignSelf: 'center',
    },
    input: {
      fontSize: 25,
      lineHeight: 25,
      fontFamily: theme.regular,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      borderWidth: 2,
      borderRadius: 15,
      height: 50,
      paddingHorizontal: 15,
      backgroundColor: theme.colors.background,
      textAlignVertical: 'center',
    },
    sliderContainer: {
      width: screenWidth * 0.7,
      alignItems: 'center',
    },
    number: {
      fontSize: 50,
      fontFamily: theme.regular,
      textAlign: 'center',
      color: theme.colors.text,
    },
    slider: {
      width: '50%',
      transform: [{ scale: 2 }],
    },
  });
