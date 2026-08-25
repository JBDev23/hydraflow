import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import type { Theme, TimeOfDay } from '../types';

type TimeSelectorProps = {
  time: TimeOfDay;
  onTimeChange: (time: TimeOfDay) => void;
};

const toDate = (time: TimeOfDay): Date => {
  const date = new Date();
  date.setHours(time?.hours ?? 0, time?.minutes ?? 0, 0, 0);
  return date;
};

const formatTime = (time: TimeOfDay): string => {
  const hours = String(time?.hours ?? 0).padStart(2, '0');
  const minutes = String(time?.minutes ?? 0).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const roundToFiveMinutes = (date: Date): TimeOfDay => {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.round(totalMinutes / 5) * 5;
  const normalized = ((rounded % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    hours: Math.floor(normalized / 60),
    minutes: normalized % 60,
  };
};

const resolvePickerDate = (maybeEventOrDate: unknown, maybeDate?: Date): Date | null => {
  if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) return maybeDate;
  if (maybeEventOrDate instanceof Date && !Number.isNaN(maybeEventOrDate.getTime())) {
    return maybeEventOrDate;
  }
  const timestamp = (maybeEventOrDate as { nativeEvent?: { timestamp?: number } })?.nativeEvent
    ?.timestamp;
  if (typeof timestamp === 'number') {
    const fromTimestamp = new Date(timestamp);
    if (!Number.isNaN(fromTimestamp.getTime())) return fromTimestamp;
  }
  return null;
};

export default function TimeSelector({ time, onTimeChange }: TimeSelectorProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showPicker, setShowPicker] = useState(false);

  const applyDate = (selected: Date) => {
    onTimeChange(roundToFiveMinutes(selected));
  };

  const openPicker = () => {
    // Imperative API on Android: the JSX component re-opens on every callback/value
    // identity change and resets the dialog to the original value.
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(time),
        mode: 'time',
        is24Hour: true,
        onValueChange: (event, selected) => {
          const date = resolvePickerDate(event, selected);
          if (date) applyDate(date);
        },
      });
      return;
    }
    setShowPicker(true);
  };

  const handleValueChange = (maybeEventOrDate: unknown, maybeDate?: Date) => {
    const selected = resolvePickerDate(maybeEventOrDate, maybeDate);
    if (selected) applyDate(selected);
  };

  const handleDismiss = () => {
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={openPicker}
        style={styles.timeButton}
        accessibilityRole="button"
        accessibilityLabel={formatTime(time)}
      >
        <Text style={styles.timeText}>{formatTime(time)}</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleDismiss}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleDismiss}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleDismiss} hitSlop={12}>
                  <Text style={styles.doneText}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={toDate(time)}
                mode="time"
                is24Hour
                display="spinner"
                minuteInterval={5}
                onValueChange={handleValueChange}
                themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeButton: {
      minWidth: 120,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
    },
    timeText: {
      fontSize: 36,
      fontFamily: theme.regular,
      color: theme.colors.text,
      letterSpacing: 1,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalSheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 24,
      alignItems: 'center',
    },
    modalHeader: {
      width: '100%',
      alignItems: 'flex-end',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 4,
    },
    doneText: {
      fontSize: 18,
      fontFamily: theme.regular,
      color: theme.colors.primaryDark,
    },
  });
