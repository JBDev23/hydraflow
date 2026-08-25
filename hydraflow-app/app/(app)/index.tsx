import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Vibration,
  Animated,
  Easing,
  InteractionManager,
} from 'react-native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import WeekCalendar from '../../components/WeekCalendar';
import Hydra, { type HydraAnim } from '../../components/Hydra';
import Ring from '../../components/Ring';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomModal from '../../components/CustomModal';
import DrinkModal from '../../components/DrinkModal';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useHydration } from '../../context/HydrationContext';
import { useAuth } from '../../context/AuthContext';
import { useAppShell } from '../../context/AppShellContext';
import { useAppBootstrap } from '../../context/AppBootstrapContext';
import { api } from '../../services/api';
import { useFocusEffect } from 'expo-router';
import { getTranslatedLongMonthsArray } from '../../utils/i18nHelpers';
import { useTranslation } from 'react-i18next';
import { audioService } from '../../services/audioService';
import { showToast } from '../../utils/toast';
import type { CatalogAchievement, GamificationResult, Theme } from '../../types';
import type { ComponentProps } from 'react';

type LayoutSize = {
  width: number;
  height: number;
};

type HomeMetrics = {
  ringRadius: number;
  hydraHeight: number;
  buttonSize: number;
  iconSize: number;
  resetPadding: number;
  goalTitleSize: number;
  goalSubTitleSize: number;
  restTextSize: number;
  monthFontSize: number;
  monthMarginTop: number;
  calendarScale: number;
};

function getHomeMetrics(
  mainLayout: LayoutSize,
  contentLayout: LayoutSize,
  windowHeight: number,
): HomeMetrics {
  const contentHeight = Math.max(contentLayout.height, 1);
  const mainHeight = Math.max(mainLayout.height, 1);

  const buttonSize = windowHeight * 0.06;
  const iconSize = windowHeight * 0.04;
  const restTextSize = windowHeight * 0.017;
  const goalTitleSize = Math.min(windowHeight * 0.08, contentHeight * 0.12);
  const goalSubTitleSize = windowHeight * 0.05;

  const reservedHeight =
    goalTitleSize * 1.2 + restTextSize * 3 + buttonSize * 2.2 + contentHeight * 0.03;

  const ringAvailableHeight = Math.max(contentHeight - reservedHeight, contentHeight * 0.32);
  const ringRadius = Math.min(
    contentLayout.width * 0.36,
    ringAvailableHeight * 0.48,
    windowHeight * 0.15,
  );

  return {
    ringRadius,
    hydraHeight: ringRadius * 1.45,
    buttonSize,
    iconSize,
    resetPadding: windowHeight * 0.01,
    goalTitleSize,
    goalSubTitleSize,
    restTextSize,
    monthFontSize: mainHeight * 0.032,
    monthMarginTop: mainHeight * 0.006,
    calendarScale: Math.min(1, mainHeight / 720),
  };
}

const DRINK_TYPES = { GLASS: 'glass', CUSTOM: 'custom', BOTTLE: 'bottle' } as const;

type DrinkType = (typeof DRINK_TYPES)[keyof typeof DRINK_TYPES];

type ModalConfig = {
  min: number;
  max: number;
  svg: string;
};

type DrinkButtonProps = {
  icon: ComponentProps<typeof FontAwesome6>['name'];
  onPress: () => void;
  onLongPress?: () => void;
  isDisabled: boolean;
  theme: Theme;
  buttonSize: number;
  iconSize: number;
};

const DrinkButton = ({
  icon,
  onPress,
  onLongPress,
  isDisabled,
  theme,
  buttonSize,
  iconSize,
}: DrinkButtonProps) => (
  <TouchableOpacity
    disabled={isDisabled}
    onPress={() => {
      Vibration.vibrate(10);
      onPress();
    }}
    onLongPress={onLongPress}
    style={{ width: buttonSize, height: buttonSize, opacity: isDisabled ? 0.5 : 1 }}
  >
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark]}
      style={{
        flex: 1,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <FontAwesome6
        style={{ padding: iconSize * 0.225 }}
        color={theme.colors.contrast}
        name={icon}
        size={iconSize}
      />
    </LinearGradient>
  </TouchableOpacity>
);

export default function Home() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const MONTHS = getTranslatedLongMonthsArray();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, windowWidth), [theme, windowWidth]);
  const { userProfile, updateUserProfile } = useUser();
  const { dailyWater, updateDailyWater, selectedDay, setSelectedDay, hydrationEpoch } =
    useHydration();
  const { authToken } = useAuth();
  const { levelUp, newAch } = useAppShell();
  const { setHomeLayoutReady } = useAppBootstrap();
  const { t } = useTranslation();

  const [mainLayout, setMainLayout] = useState<LayoutSize | null>(null);
  const [contentLayout, setContentLayout] = useState<LayoutSize | null>(null);

  const effectiveMainLayout = useMemo(
    () => (mainLayout ? { ...mainLayout, width: windowWidth } : null),
    [mainLayout, windowWidth],
  );
  const effectiveContentLayout = useMemo(
    () => (contentLayout ? { ...contentLayout, width: windowWidth } : null),
    [contentLayout, windowWidth],
  );

  const metrics = useMemo(() => {
    if (!effectiveMainLayout || !effectiveContentLayout) {
      return getHomeMetrics(
        { width: windowWidth, height: windowHeight * 0.72 },
        { width: windowWidth, height: windowHeight * 0.52 },
        windowHeight,
      );
    }
    return getHomeMetrics(effectiveMainLayout, effectiveContentLayout, windowHeight);
  }, [effectiveMainLayout, effectiveContentLayout, windowHeight, windowWidth]);

  const todayStr = new Date().toDateString();
  const selectedStr = new Date(selectedDay).toDateString();
  const isToday = todayStr === selectedStr;

  const [month, setMonth] = useState(new Date().getMonth());
  const [drinked, setDrinked] = useState(() => dailyWater);
  const [anim, setAnim] = useState<HydraAnim>('default');

  const [lastDrankAmount, setLastDrankAmount] = useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalValue, setModalValue] = useState(0);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    min: 1,
    max: 250,
    svg: 'glass',
  });

  const [isLoadingReset, setIsLoadingReset] = useState(false);

  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const isProcessing = useRef(false);

  const isMounted = useRef(false);

  const resetRotateAnim = useMemo(() => new Animated.Value(0), []);
  const isResettingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const startRotationRef = useRef<() => void>(() => {});

  const startRotation = useCallback(() => {
    isAnimatingRef.current = true;
    resetRotateAnim.setValue(0);
    Animated.timing(resetRotateAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      if (isResettingRef.current) {
        startRotationRef.current();
      } else {
        isAnimatingRef.current = false;
        resetRotateAnim.setValue(0);
      }
    });
  }, [resetRotateAnim]);

  useLayoutEffect(() => {
    startRotationRef.current = startRotation;
  }, [startRotation]);

  useEffect(() => {
    isResettingRef.current = isLoadingReset;
    if (isLoadingReset && !isAnimatingRef.current) {
      startRotation();
    }
  }, [isLoadingReset, startRotation]);

  const resetSpin = resetRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    setAnim('joy');
    const timer = setTimeout(() => {
      setAnim('default');
    }, 3000);

    return () => clearTimeout(timer);
  }, [drinked]);

  const goal = userProfile?.goal ?? 1;
  const percentage = (drinked / goal) * 100;
  const remaining = Math.max(0, goal - drinked);

  const handleDrink = async (amount: number) => {
    if (!userProfile) return;

    isProcessing.current = true;
    setIsLoadingApi(true);

    audioService.playSound('drink');

    const newTotal = drinked + amount;
    setDrinked(newTotal);
    updateDailyWater(newTotal);

    setLastDrankAmount(amount);
    setModalValue(0);
    setModalVisible(false);

    try {
      const response = await api.logWater(amount);

      if (response && 'gamification' in response && response.gamification?.xpGained != null) {
        showToast(`+ ${response.gamification.xpGained} ${t('toast.experience')}`);
      }

      if (
        response &&
        'gamification' in response &&
        response.gamification &&
        !('offlineOptimistic' in response.gamification && response.gamification.offlineOptimistic)
      ) {
        const gamification = response.gamification as GamificationResult;
        const rawAchievements = (gamification.newAchievements ?? []) as CatalogAchievement[];
        const formattedNewAchievements = rawAchievements.map((ach) => ({
          id: ach.id,
          date: new Date().toISOString(),
        }));
        const currentAchievements = userProfile.achievements || [];
        const updatedAchievements = [...currentAchievements, ...formattedNewAchievements];
        await updateUserProfile({
          stats: {
            ...userProfile.stats,
            level: gamification.newLevel ?? userProfile.stats.level,
            progress: gamification.progress ?? userProfile.stats.progress,
            dropsBalance: gamification.dropsBalance ?? userProfile.stats.dropsBalance,
            currentStreak: gamification.currentStreak ?? userProfile.stats.currentStreak,
            totalGoalsReached:
              gamification.totalGoalsReached ?? userProfile.stats.totalGoalsReached,
            totalVolume: gamification.totalVolume ?? userProfile.stats.totalVolume,
            achievementsCount:
              gamification.achievementsCount ?? userProfile.stats.achievementsCount,
          },
          achievements: updatedAchievements,
        });

        if (rawAchievements.length > 0) {
          audioService.playSound('achievement');
          await newAch(rawAchievements);
        }

        if (gamification.leveledUp) {
          audioService.playSound('levelUp');
          await levelUp(
            gamification.newLevel ?? userProfile.stats.level,
            gamification.dropsEarned ?? 0,
          );
        }

        if (gamification.isGoalReached) {
          showToast(t('toast.goalCompleted'));
          audioService.playSound('goalReached');
        }

        if (gamification.isNewStreak) {
          showToast(t('toast.newStreak'));
          audioService.playSound('goalReached');
        }
      }

      if (!response) {
        await refreshDrinked();
        setLastDrankAmount(null);
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setIsLoadingApi(false);
      isProcessing.current = false;
    }
  };

  const handleReset = async () => {
    if (!userProfile || isProcessing.current || isLoadingReset) return;

    isProcessing.current = true;
    setIsLoadingReset(true);

    try {
      if (lastDrankAmount) {
        const newTotal = Math.max(0, drinked - lastDrankAmount);
        setDrinked(newTotal);
        updateDailyWater(newTotal);
        setLastDrankAmount(null);
        setIsLoadingApi(false);
      }

      const response = await api.revertLog();

      if (response) {
        if (!('cancelledPending' in response && response.cancelledPending)) {
          await refreshDrinked();
        }

        if ('gamification' in response && response.gamification) {
          const g = response.gamification;
          await updateUserProfile({
            stats: {
              ...userProfile.stats,
              level: g.newLevel ?? userProfile.stats.level,
              progress: g.progress ?? userProfile.stats.progress,
              dropsBalance: g.dropsBalance ?? userProfile.stats.dropsBalance,
              currentStreak: g.currentStreak ?? userProfile.stats.currentStreak,
              totalGoalsReached: g.totalGoalsReached ?? userProfile.stats.totalGoalsReached,
              totalVolume: g.totalVolume ?? userProfile.stats.totalVolume,
            },
          });
        }
      }
    } catch (error) {
      console.warn(error);
    } finally {
      isProcessing.current = false;
      setTimeout(() => setIsLoadingReset(false), 500);
    }
  };

  const refreshDrinked = async () => {
    if (!authToken) {
      return;
    }

    const date = selectedDay || new Date();
    const viewingToday = date.toDateString() === new Date().toDateString();

    if (viewingToday && dailyWater > 0) {
      setDrinked(dailyWater);
    }

    setIsLoadingApi(true);
    try {
      const total = await api.getDailyMetrics(date);
      if (total === null) return;
      setDrinked(total);
      if (viewingToday) {
        updateDailyWater(total);
      }
    } catch (e) {
      console.error('Error cargando métricas:', e);
    } finally {
      setIsLoadingApi(false);
    }
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHomeLayoutReady(true);
        });
      });
    });

    return () => {
      task.cancel();
    };
  }, [setHomeLayoutReady]);

  useEffect(() => {
    return () => {
      setHomeLayoutReady(false);
    };
  }, [setHomeLayoutReady]);

  useEffect(() => {
    refreshDrinked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, hydrationEpoch, authToken]);

  useEffect(() => {
    if (isToday && !isProcessing.current) {
      setDrinked(dailyWater);
    }
  }, [dailyWater, isToday]);

  const openModal = (type: DrinkType) => {
    let config: ModalConfig = { min: 0, max: 250, svg: 'glass' };
    let initialValue = 0;

    switch (type) {
      case DRINK_TYPES.GLASS:
        config = { min: 0, max: 250, svg: 'glass' };
        initialValue = 250;
        break;
      case DRINK_TYPES.CUSTOM:
        config = { min: 0, max: goal, svg: 'drop' };
        initialValue = 100;
        break;
      case DRINK_TYPES.BOTTLE:
        config = { min: 0, max: 1000, svg: 'bottle' };
        initialValue = 1000;
        break;
    }

    setModalConfig(config);
    setModalValue(initialValue);
    setModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      setSelectedDay(new Date());
    }, [setSelectedDay]),
  );

  const areButtonsDisabled = !isToday || isLoadingReset || isLoadingApi;

  return (
    <View
      style={styles.mainContainer}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setMainLayout({ width, height });
      }}
    >
      <View style={styles.topSection}>
        <Text
          style={[
            styles.month,
            { fontSize: metrics.monthFontSize, marginTop: metrics.monthMarginTop },
          ]}
        >
          {MONTHS[month].toUpperCase()}
        </Text>
        <WeekCalendar
          onSelectedDayChange={setSelectedDay}
          onMonthChange={(newMonth) => setMonth(newMonth)}
          selectedDay={selectedDay}
          scale={metrics.calendarScale}
        />
      </View>

      <View
        style={styles.contentSection}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContentLayout({ width, height });
        }}
      >
        <Ring
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          percentage={percentage}
          radius={metrics.ringRadius}
        >
          <Hydra height={metrics.hydraHeight} anim={anim} showSkins={true} />
        </Ring>

        <View style={styles.drinkedContainer}>
          <TouchableOpacity
            disabled={areButtonsDisabled || drinked === 0}
            onPress={handleReset}
            style={[
              styles.button,
              {
                width: metrics.buttonSize,
                height: metrics.buttonSize,
                opacity: isToday && drinked !== 0 ? 1 : 0.5,
              },
            ]}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={{ borderRadius: 10 }}
            >
              <Animated.View style={{ transform: [{ rotate: resetSpin }] }}>
                <FontAwesome6
                  color={theme.colors.contrast}
                  style={{ padding: metrics.resetPadding }}
                  name="arrow-rotate-left"
                  size={metrics.iconSize}
                />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.goalContainer}>
            <Text
              style={[
                styles.goalTitle,
                {
                  fontSize: metrics.goalTitleSize,
                  lineHeight: metrics.goalTitleSize,
                  paddingTop: metrics.goalTitleSize * 0.12,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {drinked}
            </Text>
            <Text
              style={[styles.goalSubTitle, { fontSize: metrics.goalSubTitleSize }]}
              numberOfLines={1}
            >
              ml
            </Text>
          </View>
        </View>

        <Text
          style={[styles.restText, { fontSize: metrics.restTextSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {remaining > 0
            ? `${remaining} ml ${t('indexApp.remaining')}`
            : t('indexApp.goalCompleted')}
        </Text>

        <View style={styles.buttonsContainer}>
          <View style={styles.buttonColumn}>
            <DrinkButton
              icon="glass-water"
              isDisabled={!isToday || isLoadingReset}
              onPress={() => handleDrink(250)}
              onLongPress={() => openModal(DRINK_TYPES.GLASS)}
              theme={theme}
              buttonSize={metrics.buttonSize}
              iconSize={metrics.iconSize}
            />
            <Text
              style={[styles.restText, styles.buttonLabel, { fontSize: metrics.restTextSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              250ml
            </Text>
          </View>
          <View style={styles.buttonColumn}>
            <DrinkButton
              icon="droplet"
              isDisabled={!isToday || isLoadingReset}
              onPress={() => openModal(DRINK_TYPES.CUSTOM)}
              theme={theme}
              buttonSize={metrics.buttonSize}
              iconSize={metrics.iconSize}
            />
            <Text
              style={[styles.restText, styles.buttonLabel, { fontSize: metrics.restTextSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {t('indexApp.custom')}
            </Text>
          </View>
          <View style={styles.buttonColumn}>
            <DrinkButton
              icon="bottle-water"
              isDisabled={!isToday || isLoadingReset}
              onPress={() => handleDrink(1000)}
              onLongPress={() => openModal(DRINK_TYPES.BOTTLE)}
              theme={theme}
              buttonSize={metrics.buttonSize}
              iconSize={metrics.iconSize}
            />
            <Text
              style={[styles.restText, styles.buttonLabel, { fontSize: metrics.restTextSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              1000ml
            </Text>
          </View>
        </View>
      </View>

      <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <DrinkModal
          value={modalValue}
          setValue={setModalValue}
          drinkWater={handleDrink}
          min={modalConfig.min}
          max={modalConfig.max}
          svg={modalConfig.svg}
        />
      </CustomModal>
    </View>
  );
}

const createStyles = (theme: Theme, screenWidth: number) =>
  StyleSheet.create({
    mainContainer: {
      backgroundColor: theme.colors.background,
      flex: 1,
      overflow: 'hidden',
    },
    topSection: {
      flexShrink: 0,
    },
    contentSection: {
      flex: 1,
      minHeight: 0,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      paddingBottom: 4,
    },
    month: {
      fontFamily: theme.regular,
      alignSelf: 'center',
      color: theme.colors.text,
    },
    drinkedContainer: {
      flexDirection: 'row',
      width: screenWidth * 0.8,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    goalTitle: {
      fontFamily: theme.regular,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
      color: theme.colors.primaryDark,
      flexShrink: 1,
    },
    goalSubTitle: {
      fontFamily: theme.regular,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
      color: theme.colors.primaryDark,
      flexShrink: 1,
      marginLeft: 4,
    },
    goalContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
      paddingRight: 20,
      minWidth: 0,
    },
    restText: {
      fontFamily: theme.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    buttonColumn: {
      alignItems: 'center',
      gap: 4,
    },
    buttonLabel: {
      textAlign: 'center',
    },
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: screenWidth * 0.8,
      alignItems: 'flex-start',
    },
    button: {},
  });
