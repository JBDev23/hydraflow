import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Hydra from '../../components/Hydra';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../types';

export const screenWidth = Dimensions.get('window').width;

export default function ReadyPlanScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userProfile, updateUserProfile, calculateIdealGoal } = useUser();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [goal, setGoal] = useState(userProfile?.goal || 2000);

  useEffect(() => {
    const idealGoal = calculateIdealGoal();
    setGoal(idealGoal);
  }, [calculateIdealGoal]);

  const handleFinish = () => {
    setIsLoading(true);
    updateUserProfile({ onboardingCompleted: true, goal });
  };

  return (
    <View style={styles.container}>
      <Hydra anim="joy" />
      <View style={styles.text}>
        <Text style={styles.title}>{t('plan.readyTitle')}</Text>
      </View>
      <View style={styles.goalContainer}>
        <Text style={styles.goalTitle}>{goal}</Text>
        <Text style={styles.goalSubTitle}>ml</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.subTitle}>{t('plan.readySubTitle')}</Text>
        {isLoading && <Text style={styles.subTitle}>{t('loading')}</Text>}
      </View>
      <TouchableOpacity onPress={handleFinish} style={styles.button}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]}>
          <Text style={styles.buttonText}>{t('buttons.startDrink')}</Text>
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.confContainer} pointerEvents="none">
        <ConfettiCannon
          count={200}
          origin={{ x: 0, y: 0 }}
          autoStart={true}
          fadeOut={true}
          fallSpeed={5000}
          explosionSpeed={350}
          colors={[theme.colors.primary, theme.colors.primaryDark, theme.colors.primaryMid]}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      flexGrow: 1,
      paddingBottom: '5%',
      paddingTop: '5%',
    },
    goalContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
    },
    goalTitle: {
      fontSize: 85,
      fontFamily: theme.regular,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
      color: theme.colors.primaryDark,
    },
    goalSubTitle: {
      fontSize: 65,
      fontFamily: theme.regular,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
      color: theme.colors.primaryDark,
    },
    button: {
      width: screenWidth * 0.8,
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
    text: {
      width: screenWidth * 0.8,
      margin: 10,
    },
    title: {
      fontSize: 30,
      fontFamily: theme.regular,
      color: theme.colors.text,
      textAlign: 'center',
    },
    subTitle: {
      fontSize: 21,
      fontFamily: theme.regular,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
    confContainer: {
      ...StyleSheet.absoluteFill,
      zIndex: 100,
      elevation: 100,
      justifyContent: 'flex-start',
    },
  });
