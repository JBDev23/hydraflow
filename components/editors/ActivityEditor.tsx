import { useMemo, type ComponentProps } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { ActivityLevel, Theme } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

type ActivityOption = {
  id: ActivityLevel;
  label: string;
  icon: ComponentProps<typeof FontAwesome6>['name'];
};

const OPTIONS: ActivityOption[] = [
  { id: 'sedentary', label: 'Sedentario', icon: 'bed' },
  { id: 'moderate', label: 'Moderado (1-2 días)', icon: 'person-walking' },
  { id: 'active', label: 'Activo (3-4 días)', icon: 'person-running' },
  { id: 'highActive', label: 'Muy Activo (5+ días)', icon: 'trophy' },
];

type ActivityEditorProps = {
  value: string;
  onChange: (activity: ActivityLevel) => void;
};

export default function ActivityEditor({ value, onChange }: ActivityEditorProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const isActive = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[
              styles.optionContainer,
              { borderColor: isActive ? theme.colors.primaryDark : theme.colors.textTertiary },
            ]}
          >
            <LinearGradient
              style={styles.option}
              colors={
                isActive
                  ? [theme.colors.primary, theme.colors.primaryDark]
                  : [theme.colors.background, theme.colors.background]
              }
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isActive ? theme.colors.contrast : theme.colors.text },
                ]}
              >
                {opt.label}
              </Text>
              <View style={styles.iconWrapper}>
                <FontAwesome6
                  size={20}
                  name={opt.icon}
                  color={isActive ? theme.colors.contrast : theme.colors.primary}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      alignItems: 'center',
    },
    optionContainer: {
      width: screenWidth * 0.7,
      borderRadius: 10,
      borderWidth: 2,
      marginBottom: 8,
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    optionText: {
      fontSize: 16,
      fontFamily: theme.regular,
    },
    iconWrapper: { width: 25, alignItems: 'center' },
  });
