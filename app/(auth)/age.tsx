import { Dimensions, StyleSheet, TouchableOpacity, ScrollView, View, Text, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hydra from '../../components/Hydra';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import ScrollIndicator from '../../components/ScrollIndicator';
import type { Theme } from '../../types';

const screenWidth = Dimensions.get('window').width;

export default function AgeScreen() {
  const router = useRouter();
  const { updateUserProfile, userProfile } = useUser();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();

  const [age, setAge] = useState(userProfile?.age || 25);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const isScrollable = contentHeight > scrollViewHeight;
  const showIndicator = isScrollable && !isScrolledToBottom;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 40;

    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsScrolledToBottom(isBottom);
  };

  const handleNext = () => {
    router.push('/(auth)/weight');
  };

  const ageRef = useRef(age);

  useEffect(() => {
    ageRef.current = age;
  }, [age]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        updateUserProfile({ age: ageRef.current });
      };
    }, [updateUserProfile]),
  );

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
          <Text style={styles.title}>{t('ask.age')}</Text>
        </View>

        <View style={{ width: screenWidth * 0.8, marginBottom: 20 }}>
          <Text style={styles.number}>{age}</Text>
          <Slider
            style={styles.slider}
            minimumValue={12}
            maximumValue={99}
            step={1}
            value={age}
            onValueChange={setAge}
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
      color: theme.colors.text,
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
      color: theme.colors.text,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
    },
  });
