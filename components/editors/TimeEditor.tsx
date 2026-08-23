import { useMemo, type ComponentProps } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import GradientIcon from '../GradientIcon';
import TimeSelector from '../TimeSelector';
import { useTheme } from '../../context/ThemeContext';
import type { Theme, TimeOfDay } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

type TimeEditorProps = {
  value: TimeOfDay;
  onChange: (time: TimeOfDay) => void;
  icon: ComponentProps<typeof FontAwesome6>['name'];
  colors: [string, string];
};

export default function TimeEditor({ value, onChange, icon, colors }: TimeEditorProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <GradientIcon size={40} colors={colors}>
        <FontAwesome6 name={icon} size={35} solid />
      </GradientIcon>
      <TimeSelector time={value} onTimeChange={onChange} />
    </View>
  );
}

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      width: screenWidth * 0.8,
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },
  });
