import { View, Text, StyleSheet, Dimensions, type StyleProp, type ViewStyle } from 'react-native';
import Footer from './Footer';
import { LinearGradient } from 'expo-linear-gradient';
import HydraS from '../assets/hydra/Hydra.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';
import type { Theme } from '../types';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type CustomSplashScreenProps = {
  progress: number;
  style?: StyleProp<ViewStyle>;
};

export default function CustomSplashScreen({ progress }: CustomSplashScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <LinearGradient
            style={[styles.progressFill, { width: `${progress}%` }]}
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>
      <View style={styles.centerSection}>
        <View style={styles.logoContainer}>
          <HydraS width={screenWidth * 0.8} height={screenWidth * 0.8} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>HydraFlow</Text>
          <Text style={styles.subtitle}>Hidratación inteligente</Text>
        </View>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    progressBar: {
      width: screenWidth * 0.9,
      height: 20,
      backgroundColor: theme.colors.background,
      borderRadius: 40,
      borderColor: theme.colors.border,
      borderWidth: 3,
      overflow: 'hidden',
      alignSelf: 'center',
    },
    header: {
      width: screenWidth,
      alignItems: 'center',
      marginTop: screenHeight * 0.025,
    },
    progressFill: {
      height: '100%',
      borderTopRightRadius: 20,
    },
    centerSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: screenHeight * 0.05,
      width: screenWidth,
    },
    logoContainer: {
      marginBottom: 20,
    },
    textContainer: {
      width: '100%',
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 45,
      fontFamily: theme.regular,
      color: theme.colors.text,
      textAlign: 'center',
      width: '100%',
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
      includeFontPadding: false,
      paddingHorizontal: 5,
    },
    subtitle: {
      fontSize: 25,
      color: theme.colors.textSecondary,
      fontFamily: theme.regular,
      textAlign: 'center',
      width: '100%',
      includeFontPadding: false,
      paddingHorizontal: 5,
    },
  });
