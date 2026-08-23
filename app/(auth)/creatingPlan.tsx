import { View, Text, StyleSheet, Dimensions } from 'react-native';
import HydraS from '../../assets/hydra/Hydra.svg';
import { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../types';

const screenWidth = Dimensions.get('window').width;

export default function CreatingPlanScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        const increment = prev < 70 ? 0.5 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 10);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (progress >= 100) {
      timer = setTimeout(() => {
        router.replace('/(auth)/readyPlan');
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [progress, router]);

  const stopPropagation = () => {};

  return (
    <View style={styles.container} onTouchStart={stopPropagation} onTouchEnd={stopPropagation}>
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

      <View style={styles.innerContainer}>
        <HydraS width={screenWidth * 0.8} height={screenWidth * 0.8} />
        <Text style={styles.title}>{t('plan.createTitle')}</Text>
        <Text style={styles.subtitle}>{t('plan.createSubTitle')}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
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
      marginTop: 40,
    },
    progressFill: {
      height: '100%',
      borderTopRightRadius: 20,
    },
    title: {
      fontSize: 45,
      fontFamily: theme.regular,
      color: theme.colors.text,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
    },
    subtitle: {
      fontSize: 25,
      color: theme.colors.textSecondary,
      fontFamily: theme.regular,
      textAlign: 'center',
    },
  });
