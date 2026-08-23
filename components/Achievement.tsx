import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GradientIcon from './GradientIcon';
import { FontAwesome6 } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import CustomModal from './CustomModal';
import { useTheme } from '../context/ThemeContext';
import type { AchievementDisplayData, Theme } from '../types';

const GOLD_COLORS: [string, string] = ['#FFD700', 'rgba(255,215,0,0.4)'];

type AchievementProps = {
  width?: number;
  height?: number;
  data?: AchievementDisplayData;
  isCompleted?: boolean;
  date?: string;
  isLoading?: boolean;
};

export default function Achievement({
  width = 200,
  height = 200,
  data = {
    icon: 'droplet',
    name: 'Hydra',
    description: 'Registra tu primer vaso de agua',
  },
  isCompleted = false,
  date = 'xx/xx/xx',
  isLoading = false,
}: AchievementProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [modalVisible, setModalVisible] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [isLoading, pulseAnim]);

  const iconName = data.icon as ComponentProps<typeof FontAwesome6>['name'];

  if (isLoading) {
    return (
      <Animated.View style={{ opacity: pulseAnim }}>
        <View style={[styles.skeleton, { width, height, backgroundColor: theme.colors.border, borderRadius: 20 }]}>
          <View
            style={[
              styles.archInt,
              { width: width - 8, height: height - 8, backgroundColor: theme.colors.background, opacity: 0.5 },
            ]}
          />
        </View>
      </Animated.View>
    );
  }

  if (isCompleted) {
    return (
      <View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <LinearGradient style={[styles.archievement, { width, height }]} colors={GOLD_COLORS}>
            <View style={[styles.archInt, { width: width - 8, height: height - 8 }]}>
              <GradientIcon size={82} colors={GOLD_COLORS}>
                <FontAwesome6 size={80} name={iconName} />
              </GradientIcon>
              <Text style={styles.title}>{data.name}</Text>
              <Text style={styles.date}>{date}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)} borderColor="#FFD700">
          <View style={{ alignItems: 'center', justifyContent: 'space-around', flex: 1 }}>
            <GradientIcon size={205} colors={GOLD_COLORS}>
              <FontAwesome6 size={200} name={iconName} />
            </GradientIcon>
            <Text style={[styles.title, { fontSize: 50 }]}>{data.name}</Text>
            <Text style={[styles.date, { fontSize: 22, textAlign: 'center' }]}>{data.description}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
        </CustomModal>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={triggerShake}>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <LinearGradient
          style={[styles.archievement, { width, height }]}
          colors={[theme.colors.border, theme.colors.border]}
        >
          <View style={[styles.archInt, { width: width - 8, height: height - 8, backgroundColor: theme.colors.textTertiary }]}>
            <FontAwesome6 size={72} name="trophy" color={theme.colors.contrast} />
            <Text style={styles.title}>????</Text>
            <Text style={styles.date}>xx/xx/xx</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    skeleton: {
      marginBottom: '5%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    archievement: {
      marginBottom: '5%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 15,
    },
    archInt: {
      backgroundColor: theme.colors.background,
      paddingVertical: 5,
      alignItems: 'center',
      justifyContent: 'space-around',
      borderRadius: 10,
    },
    title: {
      fontFamily: theme.regular,
      color: theme.colors.text,
      fontSize: 25,
      marginTop: 5,
    },
    date: {
      fontFamily: theme.regular,
      fontSize: 18,
      color: theme.colors.textSecondary,
    },
  });
