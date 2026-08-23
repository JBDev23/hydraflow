import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { formatDateForBackend } from '../utils/dateFormatter';
import { useUser } from '../context/UserContext';
import type { Theme } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type DayProps = {
  date: Date;
  isToday: boolean;
  isGoalReached: boolean;
  changeDay: () => void;
  isSelected: boolean;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
};

const Day = React.memo(function Day({
  date,
  isToday,
  isGoalReached,
  changeDay,
  isSelected,
  styles,
  theme,
}: DayProps) {
  const dayIndex = (date.getDay() + 6) % 7;
  const dayName = DAYS[dayIndex];
  const dayNumber = date.getDate();

  let backcolor = theme.colors.contrast;

  if (isGoalReached) backcolor = theme.colors.primaryMid;
  if (isSelected) backcolor = theme.colors.primaryDark;

  return (
    <View style={styles.dayContainer}>
      <Text style={[styles.text, { lineHeight: 21 }]}>{dayName}</Text>
      <TouchableOpacity
        onPress={changeDay}
        style={[styles.numberContainer, { backgroundColor: backcolor }]}
      >
        <Text
          style={[
            styles.text,
            { color: isGoalReached ? theme.colors.contrast : theme.colors.text },
          ]}
        >
          {dayNumber}
        </Text>
      </TouchableOpacity>
      {isToday && <View style={styles.actualDot} />}
    </View>
  );
});

type WeekCalendarProps = {
  onMonthChange: (month: number) => void;
  selectedDay: Date;
  onSelectedDayChange: (date: Date) => void;
};

export default function WeekCalendar({
  onMonthChange,
  selectedDay,
  onSelectedDayChange,
}: WeekCalendarProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userProfile } = useUser();

  const [currentMonday, setCurrentMonday] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [totals, setTotals] = useState<Record<string, number>>({});

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentMonday]);

  useEffect(() => {
    if (weekDays.length > 0) {
      onMonthChange(weekDays[0].getMonth());
    }
  }, [currentMonday, onMonthChange, weekDays]);

  const changeWeek = (direction: number) => {
    const newDate = new Date(currentMonday);
    newDate.setDate(currentMonday.getDate() + direction * 7);
    setCurrentMonday(newDate);
  };

  const changeDay = (date: Date) => {
    onSelectedDayChange(date);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const newTotals = await api.getRangeMetrics(weekDays[0], weekDays[6]);
      if (!cancelled) {
        setTotals(newTotals || {});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weekDays]);

  const safeSelectedDay = useMemo(() => {
    if (!selectedDay) return new Date();
    const d = new Date(selectedDay);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDay]);

  const goal = userProfile?.goal ?? 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        onPress={() => changeWeek(-1)}
        style={styles.icon}
      >
        <FontAwesome6 name="angle-left" size={screenHeight * 0.02} color={theme.colors.text} />
      </TouchableOpacity>

      <View style={styles.daysContainer}>
        {weekDays.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const dateKey = formatDateForBackend(day);
          const isGoalReached = dateKey != null && (totals[dateKey] ?? 0) >= goal;
          const isSelected = safeSelectedDay.toDateString() === day.toDateString();

          return (
            <Day
              key={day.toISOString()}
              date={day}
              isToday={isToday}
              isGoalReached={isGoalReached}
              changeDay={() => changeDay(day)}
              styles={styles}
              theme={theme}
              isSelected={isSelected}
            />
          );
        })}
      </View>

      <TouchableOpacity
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        onPress={() => changeWeek(1)}
        style={styles.icon}
      >
        <FontAwesome6 name="angle-right" size={screenHeight * 0.02} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: screenWidth * 0.9,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      alignSelf: 'center',
      position: 'relative',
      padding: 10,
      elevation: 5,
    },
    daysContainer: {
      width: screenWidth * 0.8,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    dayContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontFamily: theme.regular,
      color: theme.colors.text,
      fontSize: screenHeight * 0.025,
    },
    numberContainer: {
      borderRadius: 10,
      width: screenHeight * 0.04,
      height: screenHeight * 0.04,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    icon: {
      marginBottom: '2.5%',
    },
    actualDot: {
      height: 6,
      width: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.contrast,
      position: 'absolute',
      bottom: -8,
    },
  });
