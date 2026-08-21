import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Vibration, Animated, Easing } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WeekCalendar from '../../components/WeekCalendar';
import Hydra from "../../components/Hydra";
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
import { api } from '../../services/api';
import { useFocusEffect } from 'expo-router';
import { getTranslatedLongMonthsArray } from '../../utils/i18nHelpers';
import { useTranslation } from 'react-i18next';
import { audioService } from '../../services/audioService';
import { showToast } from '../../utils/toast';
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;



const DRINK_TYPES = { GLASS: 'glass', CUSTOM: 'custom', BOTTLE: 'bottle' };

const DrinkButton = ({ icon, onPress, onLongPress, isDisabled, theme }) => {
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity disabled={isDisabled} onPress={() => { Vibration.vibrate(10); onPress() }} onLongPress={onLongPress} style={[styles.button, { opacity: isDisabled ? 0.5 : 1 }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.gradientButton}
      >
        <FontAwesome6 style={{ padding: screenHeight*0.009 }} color={theme.colors.contrast} name={icon} size={screenHeight*0.04} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function Home() {
  const MONTHS = getTranslatedLongMonthsArray()
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userProfile, updateUserProfile } = useUser();
  const { updateDailyWater, selectedDay, setSelectedDay, hydrationEpoch } = useHydration();
  const { authToken } = useAuth();
  const { levelUp, newAch } = useAppShell();
  const { t } = useTranslation()

  const todayStr = new Date().toDateString();
  const selectedStr = new Date(selectedDay).toDateString();
  const isToday = todayStr === selectedStr;

  const [month, setMonth] = useState(new Date().getMonth())
  const [drinked, setDrinked] = useState(0)
  const [anim, setAnim] = useState("default")

  const [lastDrankAmount, setLastDrankAmount] = useState(null);

  const [modalVisible, setModalVisible] = useState(false)
  const [modalValue, setModalValue] = useState(0)
  const [modalConfig, setModalConfig] = useState({
    min: 1,
    max: 250,
    svg: "glass"
  })

  const [isLoadingReset, setIsLoadingReset] = useState(false)

  const [isLoadingApi, setIsLoadingApi] = useState(false)
  const isProcessing = useRef(false);

  const isMounted = useRef(false)

  const resetRotateAnim = useRef(new Animated.Value(0)).current;
  const isResettingRef = useRef(false);
  const isAnimatingRef = useRef(false);

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
        startRotation();
      } else {
        isAnimatingRef.current = false;
        resetRotateAnim.setValue(0);
      }
    });
  }, [resetRotateAnim]);

  useEffect(() => {
    isResettingRef.current = isLoadingReset;
    if (isLoadingReset && !isAnimatingRef.current) {
      startRotation();
    }
  }, [isLoadingReset, startRotation]);

  const resetSpin = resetRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg']
  });

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    setAnim("joy");
    const timer = setTimeout(() => {
      setAnim("default");
    }, 3000);

    return () => clearTimeout(timer);
  }, [drinked]);

  const goal = userProfile?.goal
  const percentage = (drinked / goal) * 100
  const remaining = Math.max(0, goal - drinked)

  const handleDrink = async (amount) => {    
    isProcessing.current = true;
    setIsLoadingApi(true);

    audioService.playSound("drink")

    const newTotal = drinked + amount;
    setDrinked(newTotal);
    updateDailyWater(newTotal);

    setLastDrankAmount(amount);
    setModalValue(0);
    setModalVisible(false);

    try {
      const response = await api.logWater(amount);

      if (response?.gamification?.xpGained != null) {
        showToast(`+ ${response.gamification.xpGained} ${t("toast.experience")}`);
      }

      if (response?.gamification && !response.gamification.offlineOptimistic) {
        const formattedNewAchievements = (response.gamification.newAchievements || []).map(ach => ({
          id: ach.id,
          date: new Date().toISOString()
        }));
        const currentAchievements = userProfile.achievements || [];
        const updatedAchievements = [...currentAchievements, ...formattedNewAchievements];
        await updateUserProfile({
          stats: {
            ...userProfile.stats,
            level: response.gamification.newLevel,
            progress: response.gamification.progress,
            dropsBalance: response.gamification.dropsBalance,
            currentStreak: response.gamification.currentStreak,
            totalGoalsReached: response.gamification.totalGoalsReached,
            totalVolume: response.gamification.totalVolume,
            achievementsCount: response.gamification.achievementsCount
          },
          achievements: updatedAchievements
        });

        if (response.gamification.newAchievements && response.gamification.newAchievements.length > 0) {
          audioService.playSound("achievement")
          await newAch(response.gamification.newAchievements);
        }

        if (response?.gamification.leveledUp) {
          audioService.playSound("levelUp")
          await levelUp(response?.gamification.newLevel, response?.gamification.dropsEarned)
        }

        if (response?.gamification.isGoalReached) {
          showToast(t("toast.goalCompleted"))
          audioService.playSound("goalReached")
        }

        if (response?.gamification.isNewStreak) {
          showToast(t("toast.newStreak"))
          audioService.playSound("goalReached")
        }
      }

      if (!response) {
        await refreshDrinked();
        setLastDrankAmount(null);
      }
    } catch (error) {
      console.warn(error)
    } finally {
      setIsLoadingApi(false);
      isProcessing.current = false;
    }    
  };

  const handleReset = async () => {
    if (isProcessing.current || isLoadingReset) return;
    
    isProcessing.current = true;
    setIsLoadingReset(true);

    try {
      if (lastDrankAmount) {
        const newTotal = Math.max(0, drinked - lastDrankAmount);
        setDrinked(newTotal);
        updateDailyWater(newTotal);
        setLastDrankAmount(null);
        setIsLoadingApi(false)
      }

      const response = await api.revertLog()

      if (!response?.cancelledPending) {
        await refreshDrinked()
      }

      if (response?.gamification) {
        await updateUserProfile({
          stats: {
            ...userProfile.stats,
            level: response.gamification.level ?? response.gamification.newLevel,
            progress: response.gamification.progress,
            dropsBalance: response.gamification.dropsBalance,
            currentStreak: response.gamification.currentStreak ?? userProfile.stats?.currentStreak,
            totalGoalsReached: response.gamification.goalsReached ?? response.gamification.totalGoalsReached,
            totalVolume: response.gamification.totalVolume
          }
        });
      }
    } catch (error) {
      console.warn(error)
    } finally {
      isProcessing.current = false;
      setTimeout(() => setIsLoadingReset(false), 500)
    }
  };

  const refreshDrinked = async () => {
    if (!authToken) return;
    setIsLoadingApi(true)
    const date = selectedDay || new Date()
    try {
      const total = await api.getDailyMetrics(date);
      if (total === null) return;
      setDrinked(total);
      updateDailyWater(total)
    } catch (e) {
      console.error("Error cargando métricas:", e);
    } finally {
      setIsLoadingApi(false)
    }
  };

  useEffect(() => {
    refreshDrinked()
  }, [selectedDay, hydrationEpoch, authToken])

  const openModal = (type) => {
    let config = { min: 0, max: 250, svg: "glass" };
    let initialValue = 0;

    switch (type) {
      case DRINK_TYPES.GLASS:
        config = { min: 0, max: 250, svg: "glass" };
        initialValue = 250;
        break;
      case DRINK_TYPES.CUSTOM:
        config = { min: 0, max: goal, svg: "drop" };
        initialValue = 100;
        break;
      case DRINK_TYPES.BOTTLE:
        config = { min: 0, max: 1000, svg: "bottle" };
        initialValue = 1000;
        break;
    }

    setModalConfig(config);
    setModalValue(initialValue);
    setModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      setSelectedDay(new Date())
    }, [])
  );

  const areButtonsDisabled = !isToday || isLoadingReset || isLoadingApi;

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.month}>{MONTHS[month].toUpperCase()}</Text>
      <WeekCalendar onSelectedDayChange={setSelectedDay} onMonthChange={(newMonth) => setMonth(newMonth)} selectedDay={selectedDay} />
      <View style={[styles.container]}>
        <Ring
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          percentage={percentage}
          radius={screenHeight * 0.15}
        >
          <Hydra height={screenHeight * 0.225} anim={anim} showSkins={true}></Hydra>
        </Ring>
        <View style={styles.drinkedContainer}>
          <TouchableOpacity disabled={areButtonsDisabled || drinked == 0} onPress={handleReset} style={[styles.button, { opacity: isToday && drinked != 0 ? 1 : 0.5 }]}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={{ borderRadius: 10 }}>
              <Animated.View style={{ transform: [{ rotate: resetSpin }] }}>
                <FontAwesome6 color={theme.colors.contrast} style={{ padding: screenHeight*0.01 }} name="arrow-rotate-left" size={screenHeight*0.04} />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.goalContainer}>
            <Text style={styles.goalTitle}>{drinked}</Text>
            <Text style={styles.goalSubTitle}>ml</Text>
          </View>
        </View>
        <View style={{ marginTop: -screenHeight * 0.005 }}>
          <Text style={styles.restText}>{remaining > 0 ? `${remaining} ml ${t("indexApp.remaining")}` : t("indexApp.goalCompleted")}</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <DrinkButton
            icon="glass-water"
            isDisabled={!isToday || isLoadingReset}
            onPress={() => handleDrink(250)}
            onLongPress={() => openModal(DRINK_TYPES.GLASS)}
            theme={theme}
          />
          <DrinkButton
            icon="droplet"
            isDisabled={!isToday || isLoadingReset}
            onPress={() => openModal(DRINK_TYPES.CUSTOM)}
            theme={theme}
          />
          <DrinkButton
            icon="bottle-water"
            isDisabled={!isToday || isLoadingReset}
            onPress={() => handleDrink(1000)}
            onLongPress={() => openModal(DRINK_TYPES.BOTTLE)}
            theme={theme}
          />
        </View>
        <View style={styles.buttonsContainer}>
          <Text style={styles.restText}>250ml</Text>
          <Text style={styles.restText}></Text>
          <Text style={styles.restText}>1000ml</Text>
        </View>
      </View>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <DrinkModal value={modalValue} setValue={setModalValue} drinkWater={handleDrink} min={modalConfig.min} max={modalConfig.max} svg={modalConfig.svg} />
      </CustomModal>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  mainContainer: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  month: {
    fontFamily: theme.regular,
    fontSize: screenHeight*0.025,
    marginTop: "2%",
    alignSelf: "center",
    color: theme.colors.text
  },
  drinkedContainer: {
    flexDirection: "row",
    width: screenWidth * 0.8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  goalTitle: {
    fontSize: screenHeight*0.08,
    fontFamily: theme.regular,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 5,
    color: theme.colors.primaryDark,
    lineHeight: screenHeight*0.08,
    paddingTop: 10,
  },
  goalSubTitle: {
    fontSize: screenHeight*0.05,
    fontFamily: theme.regular,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 5,
    color: theme.colors.primaryDark,
  },
  goalContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    paddingRight: 20,
  },
  restText: {
    fontSize: screenHeight*0.017,
    fontFamily: theme.regular,
    color: theme.colors.textSecondary,
    textAlign: "center"
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: screenWidth * 0.8,
    marginTop: 5
  },
  button: {
    width: screenHeight*0.06,
    height: screenHeight*0.06,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
}); 