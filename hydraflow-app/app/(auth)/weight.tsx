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
import Slider from '@react-native-community/slider';
import Hydra from '../../components/Hydra';
import ToggleButton from '../../components/ToggleButton';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import ScrollIndicator from '../../components/ScrollIndicator';
import type { Theme } from '../../types';

export const screenWidth = Dimensions.get('window').width;

export default function WeightScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { updateUserProfile, userProfile } = useUser();
  const { t } = useTranslation();

  const [measureUnit, setMeasureUnit] = useState(0);
  const [weight, setWeight] = useState(userProfile?.weight || 70);
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

  const weightRef = useRef(weight);

  useEffect(() => {
    weightRef.current = weight;
  }, [weight]);

  const changeMeasureUnit = (newIndex: number) => {
    if (newIndex === measureUnit) return;

    setMeasureUnit(newIndex);

    if (newIndex === 1) {
      setWeight(Math.round(weight * 2.205));
    } else {
      setWeight(Math.round(weight / 2.205));
    }
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        let weightToSave = weightRef.current;

        if (measureUnit === 1) {
          weightToSave = Math.round(weightRef.current / 2.205);
        }
        updateUserProfile({ weight: weightToSave });
      };
    }, [measureUnit, updateUserProfile]),
  );

  const handleNext = () => {
    router.push('/(auth)/height');
  };

  const minVal = measureUnit === 0 ? 30 : 66;
  const maxVal = measureUnit === 0 ? 200 : 440;

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
        <Hydra />
        <View style={styles.text}>
          <Text style={styles.title}>{t('ask.weight')}</Text>
        </View>
        <ToggleButton labels={['KG', 'LB']} value={measureUnit} onValueChange={changeMeasureUnit} />
        <View style={styles.sliderBlock}>
          <Text style={styles.number}>{weight}</Text>
          <Slider
            style={styles.slider}
            minimumValue={minVal}
            maximumValue={maxVal}
            step={1}
            value={Math.min(maxVal, Math.max(minVal, weight))}
            onValueChange={setWeight}
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
      color: theme.colors.text,
    },
    title: {
      fontSize: 30,
      fontFamily: theme.regular,
      textAlign: 'center',
    },
    sliderBlock: {
      width: screenWidth * 0.8,
      marginBottom: 20,
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
      color: theme.colors.text,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
    },
  });
