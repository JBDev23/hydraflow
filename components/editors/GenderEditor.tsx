import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { Gender, Theme } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

type GenderEditorProps = {
  value: string;
  onChange: (gender: Gender) => void;
};

export default function GenderEditor({ value, onChange }: GenderEditorProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const getColor = (gen: Gender) => (value === gen ? theme.colors.primaryDark : theme.colors.textTertiary);

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          onPress={() => onChange('male')}
          style={[styles.genderbutton, { borderColor: getColor('male') }]}
        >
          <FontAwesome6 size={50} color={getColor('male')} name="mars" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange('female')}
          style={[styles.genderbutton, { borderColor: getColor('female') }]}
        >
          <FontAwesome6 size={50} color={getColor('female')} name="venus" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => onChange('other')}
        style={[styles.otherbutton, { borderColor: getColor('other') }]}
      >
        <Text style={styles.othertext}>Otro / Prefiero no decirlo</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      width: '100%',
    },
    buttonsContainer: {
      flexDirection: 'row',
      width: screenWidth * 0.7,
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    genderbutton: {
      width: screenWidth * 0.3,
      height: screenWidth * 0.2,
      borderRadius: 20,
      borderWidth: 3,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    otherbutton: {
      width: screenWidth * 0.7,
      borderRadius: 15,
      borderWidth: 3,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      backgroundColor: theme.colors.background,
    },
    othertext: {
      fontSize: 16,
      fontFamily: theme.regular,
      color: theme.colors.text,
    },
  });
