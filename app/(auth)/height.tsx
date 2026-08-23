import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Text,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hydra from '../../components/Hydra';
import Slider from '@react-native-community/slider';
import ToggleButton from '../../components/ToggleButton';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import ScrollIndicator from '../../components/ScrollIndicator';
import type { Theme } from '../../types';

const screenWidth = Dimensions.get('window').width;

const RULER_HEIGHT = 400;
const SEGMENT_HEIGHT = 10;
const VISIBLE_ITEMS = Math.ceil(RULER_HEIGHT / SEGMENT_HEIGHT / 2) + 2;
const MIN_HEIGHT = 80;
const MAX_HEIGHT = 250;

export default function HeightScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { updateUserProfile, userProfile } = useUser();
  const { t } = useTranslation();

  const [measureUnit, setMeasureUnit] = useState(0);
  const [height, setHeight] = useState(userProfile?.height || 170);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const isScrollable = contentHeight > scrollViewHeight;
  const showIndicator = isScrollable && !isScrolledToBottom;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 40;

    const isBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsScrolledToBottom(isBottom);
  };

  const heightRef = useRef(height);

  useEffect(() => {
    heightRef.current = height;
  }, [height]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        updateUserProfile({ height: heightRef.current });
      };
    }, [updateUserProfile]),
  );

  const handleNext = () => {
    router.push('/(auth)/activity');
  };

  const changeMeasureUnit = (newIndex: number) => {
    if (newIndex === measureUnit) return;
    setMeasureUnit(newIndex);
  };

  const formatHeight = (cm: number) => {
    if (measureUnit === 0) return `${cm}`;

    const totalInches = cm / 2.54;
    let feet = Math.floor(totalInches / 12);
    let inches = Math.round(totalInches % 12);

    if (inches === 12) {
      feet += 1;
      inches = 0;
    }
    return `${feet}' ${inches}"`;
  };

  const renderTicks = () => {
    const ticks = [];
    const start = Math.floor(height - VISIBLE_ITEMS);
    const end = Math.ceil(height + VISIBLE_ITEMS);

    for (let i = start; i <= end; i++) {
      if (i < MIN_HEIGHT - 20 || i > MAX_HEIGHT + 1) continue;

      const translateY = (height - i) * SEGMENT_HEIGHT;
      const isMajor = i % 10 === 0;
      const isMedium = i % 5 === 0 && !isMajor;

      ticks.push(
        <View key={i} style={[styles.tickContainer, { transform: [{ translateY }] }]}>
          {isMajor && (
            <Text style={styles.tickText}>{measureUnit === 1 ? formatHeight(i) : i}</Text>
          )}

          <View
            style={[
              styles.tickLine,
              isMajor ? styles.tickMajor : isMedium ? styles.tickMedium : styles.tickMinor,
            ]}
          />
        </View>,
      );
    }
    return ticks;
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_w, h) => setContentHeight(h)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={{ position: 'relative' }}>
          <Hydra />
          {renderTicks()}
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{t('ask.height')}</Text>
        </View>
        <ToggleButton labels={['CM', 'FT']} value={measureUnit} onValueChange={changeMeasureUnit} />
        <View style={{ width: screenWidth * 0.8, marginBottom: 20 }}>
          <Text style={styles.number}>{formatHeight(height)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_HEIGHT}
            maximumValue={MAX_HEIGHT}
            step={1}
            value={height}
            onValueChange={setHeight}
            minimumTrackTintColor={theme.colors.primaryMid}
            maximumTrackTintColor={theme.colors.text}
            thumbTintColor={theme.colors.primaryDark}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          />
        </View>
        <TouchableOpacity onPress={handleNext} style={styles.button}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]}>
            <Text style={styles.buttonText}>{t('buttons.next')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      <ScrollIndicator visible={showIndicator} />
    </>
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
    button: {
      width: screenWidth * 0.5,
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
      textAlign: 'center',
    },
    slider: {
      width: '50%',
      alignSelf: 'center',
      transform: [{ scale: 2 }],
      marginTop: 20,
    },
    number: {
      fontSize: 70,
      fontFamily: theme.regular,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
    },
    tickContainer: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      width: '85%',
      right: screenWidth * -0.16,
      height: 20,
      marginTop: -10,
    },
    tickText: {
      fontSize: 17,
      fontFamily: theme.regular,
      color: theme.colors.textSecondary,
      marginRight: 8,
    },
    tickLine: {
      backgroundColor: theme.colors.textTertiary,
      borderTopLeftRadius: 2,
      borderBottomLeftRadius: 2,
    },
    tickMajor: {
      width: 40,
      height: 3,
      backgroundColor: theme.colors.textSecondary,
    },
    tickMedium: {
      width: 20,
      height: 3,
    },
    tickMinor: {
      width: 10,
      height: 3,
    },
  });
