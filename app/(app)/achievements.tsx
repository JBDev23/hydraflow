import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import Hydra from '../../components/Hydra';
import GradientIcon from '../../components/GradientIcon';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Achievement from '../../components/Achievement';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { getLocalizedText } from '../../utils/i18nHelpers';
import type { CatalogAchievement, Theme } from '../../types';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const SKELETONS = Array.from({ length: 6 });

export default function Achievements() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userProfile } = useUser();
  const { t } = useTranslation();

  const [achievements, setAchievements] = useState<CatalogAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const stats = userProfile?.stats || { level: 1, progress: 0, achievementsCount: 0 };
  const userAchievements = userProfile?.achievements || [];
  const achievementCount = stats.achievementsCount || 0;
  const level = stats.level || 1;
  const progress = stats.progress || 0;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const catalogData = await api.getAchievements();
        if (!cancelled) {
          setAchievements(catalogData);
        }
      } catch (error) {
        console.error('Error loading catalog:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const getAchievementStatus = (achId: string) => {
    const found = userAchievements.find((ua) => ua.id === achId);
    if (!found) return { completed: false, date: '--/--/--' };

    const dateObj = new Date(found.date);
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear().toString().slice(-2)}`;
    return { completed: true, date: dateStr };
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.upperContainer}>
        <View style={{ width: '42%' }}>
          <Hydra height={screenWidth * 0.4} showSkins />
        </View>
        <View style={styles.levelContainer}>
          <View style={{ width: '100%' }}>
            <Text style={styles.statText}>
              {t('achievementsApp.level')} {level}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              style={[styles.progressFill, { width: `${progress}%` }]}
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statText}>{t('achievementsApp.achievements')}:</Text>
            <View style={styles.statContainer}>
              <Text style={styles.statText}>{achievementCount}</Text>
              <GradientIcon size={26} colors={['#FFD700', 'rgba(255,215,0,0.28)']}>
                <FontAwesome6 solid size={25} name="medal" />
              </GradientIcon>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.achievementsContainer}>
        {isLoading
          ? SKELETONS.map((_, index) => (
              <Achievement
                key={`skeleton-${index}`}
                width={screenWidth * 0.9 * 0.48}
                height={screenWidth * 0.9 * 0.48}
                isLoading
              />
            ))
          : achievements.map((ach) => {
              const { completed, date } = getAchievementStatus(ach.id);
              const achName = getLocalizedText(ach.name);
              const achDescription = getLocalizedText(ach.description);
              return (
                <Achievement
                  key={ach.id}
                  width={screenWidth * 0.9 * 0.48}
                  height={screenWidth * 0.9 * 0.48}
                  data={{
                    icon: ach.icon,
                    name: achName,
                    description: achDescription,
                  }}
                  isCompleted={completed}
                  date={date}
                />
              );
            })}
      </View>
    </ScrollView>
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
      paddingTop: '3%',
    },
    upperContainer: {
      flexDirection: 'row',
      width: screenWidth * 0.9,
      alignSelf: 'center',
    },
    levelContainer: {
      width: '58%',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-evenly',
    },
    statContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 5,
    },
    statItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 20,
      borderWidth: 4,
      borderColor: theme.colors.primaryDark,
      width: '100%',
      paddingHorizontal: 10,
    },
    statText: {
      fontFamily: theme.regular,
      color: theme.colors.text,
      fontSize: 27,
    },
    progressBar: {
      borderRadius: 20,
      borderWidth: 5,
      borderColor: theme.colors.border,
      width: '100%',
      height: screenHeight * 0.035,
      overflow: 'hidden',
    },
    progressFill: {
      width: '50%',
      height: '100%',
      borderTopRightRadius: 20,
    },
    achievementsContainer: {
      flex: 1,
      width: screenWidth * 0.9,
      alignSelf: 'center',
      marginTop: '10%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
  });
