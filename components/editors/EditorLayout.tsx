import { useMemo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Hydra from '../Hydra';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

type EditorLayoutProps = {
  hydraHeight: number;
  title?: string;
  subtitle?: string;
  onSave: () => void;
  children: ReactNode;
};

export default function EditorLayout({ hydraHeight, title, subtitle, onSave, children }: EditorLayoutProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.hydraContainer}>
        <Hydra height={hydraHeight} />
      </View>

      {(title || subtitle) && (
        <View style={styles.textContainer}>
          {title && <Text style={[styles.title, title.length > 17 && { fontSize: 28 }]}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}

      <View style={styles.content}>{children}</View>

      <TouchableOpacity onPress={onSave} style={styles.button}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.gradientButton}>
          <Text style={styles.buttonText}>CAMBIAR</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
    },
    hydraContainer: {
      width: '100%',
      alignItems: 'center',
    },
    textContainer: {
      width: screenWidth * 0.8,
      alignSelf: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    title: {
      fontSize: 32,
      fontFamily: theme.regular,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      fontFamily: theme.regular,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    button: {
      width: screenWidth * 0.5,
      borderRadius: 10,
      overflow: 'hidden',
      alignSelf: 'center',
      marginTop: 15,
      marginBottom: -10,
    },
    gradientButton: {
      paddingVertical: 8,
    },
    buttonText: {
      fontSize: 30,
      fontFamily: theme.regular,
      alignSelf: 'center',
      textAlign: 'center',
      color: theme.colors.contrast,
    },
  });
