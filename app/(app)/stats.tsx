import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  type GestureResponderEvent,
} from 'react-native';
import ToggleButton from '../../components/ToggleButton';
import Chart from '../../components/Chart';
import { getWeeksForMonth, getWeekDays } from '../../utils/weekCalculator';
import { getFormattedDate } from '../../utils/dateFormatter';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Hydra from '../../components/Hydra';
import GradientIcon from '../../components/GradientIcon';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { getTranslatedLongMonthsArray } from '../../utils/i18nHelpers';
import type { StatsChartData, Theme } from '../../types';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const DATA_NAME = ['statsApp.total', 'statsApp.average', 'statsApp.average'];
const MONTHS = getTranslatedLongMonthsArray();

type ChartState = StatsChartData & { goal: number };

type StatItemProps = {
  label: string;
  value: number;
  icon: ComponentProps<typeof FontAwesome6>['name'];
  colors: [string, string];
  theme: Theme;
};

const StatItem = ({ label, value, icon, colors, theme }: StatItemProps) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.statItem}>
      <Text style={styles.statText}>{label}</Text>
      <View style={styles.statValueContainer}>
        <Text style={styles.statText}>{value}</Text>
        <GradientIcon size={27} colors={colors}>
          <FontAwesome6 size={25} name={icon} width={20} solid />
        </GradientIcon>
      </View>
    </View>
  );
};

export default function Stats() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userProfile } = useUser();
  const { t } = useTranslation();

  const TOGGLE_LABELS = [
    t('statsApp.toggleLabels.day'),
    t('statsApp.toggleLabels.week'),
    t('statsApp.toggleLabels.month'),
  ];

  const goal = userProfile?.goal || 2000;

  const stats = userProfile?.stats || {
    level: 1,
    progress: 0,
    totalGoalsReached: 0,
    dropsBalance: 0,
    currentStreak: 0,
    totalVolume: 0,
  };
  const streak = stats?.currentStreak || 0;
  const goals = stats?.totalGoalsReached || 0;
  const totalVolume = Math.floor(stats.totalVolume / 1000) || 0;

  const [period, setPeriod] = useState(1);
  const [date, setDate] = useState(new Date());
  const [chartConfig, setChartConfig] = useState<ChartState>({
    rows: 7,
    columns: 7,
    values: [],
    colNames: [],
    goal,
    ceil: 100,
  });

  const translateA = useRef(new Animated.Value(0)).current;
  const [touchStartX, setTouchStartX] = useState(0);

  const week = useMemo(() => getWeekDays(date), [date]);
  const monthWeeks = useMemo(() => getWeeksForMonth(date.getMonth(), date.getFullYear()), [date]);

  const [metric, setMetric] = useState<number | string>(0);

  const setNewStats = async () => {
    let newStats: ChartState | null = null;
    switch (period) {
      case 0: {
        const dayStats = await api.getStats('day', date);
        if (dayStats) newStats = { ...dayStats, goal: goal / 8 };
        break;
      }
      case 1: {
        const weekStats = await api.getStats('week', date);
        if (weekStats) newStats = { ...weekStats, goal };
        break;
      }
      case 2: {
        const monthStats = await api.getStats('month', date);
        if (monthStats) newStats = { ...monthStats, goal: goal * 7 };
        break;
      }
      default: {
        const defaultStats = await api.getStats('day', date);
        if (defaultStats) newStats = { ...defaultStats, goal: goal / 8 };
        break;
      }
    }
    if (newStats) {
      setChartConfig(newStats);
      setMetric(newStats.metric ?? 0);
    }
  };

  useEffect(() => {
    setNewStats();
  }, [period, date, goal, monthWeeks]);

  const handleDateChange = (direction: number) => {
    animChart(direction);
    const newDate = new Date(date);
    if (period === 0) {
      newDate.setDate(date.getDate() + direction);
    } else if (period === 1) {
      newDate.setDate(date.getDate() + direction * 7);
    } else {
      newDate.setMonth(date.getMonth() + direction);
    }
    setDate(newDate);
  };

  const resetToToday = () => setDate(new Date());

  useFocusEffect(
    useCallback(() => {
      resetToToday();
    }, []),
  );

  const onTouchStart = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setTouchStartX(e.nativeEvent.pageX);
  };

  const animChart = (direction: number) => {
    Animated.sequence([
      Animated.timing(translateA, {
        toValue: direction * -100,
        duration: 200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(translateA, {
        toValue: 0,
        duration: 200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onTouchEnd = (e: GestureResponderEvent) => {
    e.stopPropagation();
    const touchEndX = e.nativeEvent.pageX;
    const diff = touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      const direction = diff > 0 ? 1 : -1;
      handleDateChange(direction);
    }
  };

  const renderDateLabel = () => {
    if (period === 0) return getFormattedDate(date);
    if (period === 1) return `${week[0].toLocaleDateString()} - ${week[6].toLocaleDateString()}`;
    return `${MONTHS[date.getMonth()].toUpperCase()} - ${date.getFullYear()}`;
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.toggleContainer}>
        <ToggleButton
          labels={TOGGLE_LABELS}
          value={period}
          onValueChange={(i) => setTimeout(() => setPeriod(i), 200)}
          optionWidth={(screenWidth * 0.9) / 3}
          fontSize={30}
          borderRadius={50}
        />
      </View>
      <View onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <View style={styles.headerData}>
          <Text style={styles.texto}>{t(DATA_NAME[period])}: </Text>
          <Text style={[styles.texto, { color: theme.colors.primaryDark }]}>{metric}</Text>
        </View>
        <Animated.View style={{ transform: [{ translateX: translateA }] }}>
          <Chart width={screenWidth * 0.85} height={screenHeight * 0.35} {...chartConfig} />
        </Animated.View>

        <View style={styles.downContainer}>
          <TouchableOpacity onPress={() => handleDateChange(-1)} hitSlop={20}>
            <FontAwesome6 name="angle-left" size={17} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.upText}>{renderDateLabel()}</Text>

          <TouchableOpacity onPress={() => handleDateChange(1)} hitSlop={20}>
            <FontAwesome6 name="angle-right" size={17} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomSection}>
        <View style={{ width: '42%' }}>
          <Hydra height={screenWidth * 0.4} showSkins />
        </View>

        <View style={styles.statGrid}>
          <StatItem
            label={t('statsApp.streak')}
            value={streak}
            icon="fire-flame-curved"
            colors={['#FF0000', '#F9F918']}
            theme={theme}
          />
          <StatItem
            label={t('statsApp.goal')}
            value={goals}
            icon="droplet"
            colors={['#79D8FE', '#6989E2']}
            theme={theme}
          />
          <StatItem
            label={t('statsApp.liters')}
            value={totalVolume}
            icon="water"
            colors={['#79D8FE', '#7AACFE']}
            theme={theme}
          />
        </View>
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
    texto: {
      fontFamily: theme.regular,
      color: theme.colors.text,
      fontSize: 25,
    },
    upText: {
      marginTop: '3%',
      marginBottom: '2%',
      fontFamily: theme.regular,
      fontSize: 17,
      color: theme.colors.textSecondary,
    },
    downContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: screenWidth * 0.8,
      alignSelf: 'center',
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
    toggleContainer: {
      borderRadius: 50,
      borderWidth: 3,
      borderColor: theme.colors.border,
    },
    headerData: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    bottomSection: {
      flexDirection: 'row',
      width: screenWidth * 0.9,
      alignSelf: 'center',
      marginTop: '1%',
    },
    statGrid: {
      width: '58%',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statValueContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 5,
    },
  });
