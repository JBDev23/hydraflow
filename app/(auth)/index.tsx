import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import Hydra from '../../components/Hydra';
import { useTheme } from '../../context/ThemeContext';
import { useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import ScrollIndicator from '../../components/ScrollIndicator';
import type { Theme } from '../../types';

const screenWidth = Dimensions.get('window').width;

export default function Onboarding() {
  const router = useRouter();
  const { updateUserProfile } = useUser();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { t } = useTranslation();

  const [name, setName] = useState('');
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

  const handleNext = () => {
    if (name.trim().length === 0) {
      wrong();
      return;
    }

    updateUserProfile({ name: name.trim() });

    router.push('/(auth)/login');
  };

  const wrongAnim = useMemo(() => new Animated.Value(0), []);

  const wrong = () => {
    Animated.sequence([
      Animated.timing(wrongAnim, {
        toValue: 10,
        duration: 100,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(wrongAnim, {
        toValue: -10,
        duration: 200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(wrongAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_w, h) => setContentHeight(h)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Hydra />
        <View style={styles.text}>
          <Text style={styles.title}>{t('indexAuth.title')}</Text>
          <Text style={styles.subtitle}>
            {t('indexAuth.subTitle1')}{' '}
            <Text style={{ color: theme.colors.primaryDark }}>Hydra</Text>,{' '}
            {t('indexAuth.subTitle2')}
          </Text>
        </View>
        <View style={styles.form}>
          <View style={styles.formElem}>
            <Text style={styles.label}>{t('ask.name')}</Text>
            <Animated.View style={{ transform: [{ translateX: wrongAnim }] }}>
              <TextInput
                defaultValue=""
                style={styles.input}
                onChangeText={setName}
                placeholder="ex: Hydra"
              />
            </Animated.View>
          </View>
        </View>
        <TouchableOpacity onPress={handleNext} style={styles.button}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]}>
            <Text style={styles.buttonText}>{t('buttons.start')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      <ScrollIndicator visible={showIndicator} />
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      flexGrow: 1,
      paddingBottom: '5%',
      paddingTop: '5%',
    },
    text: {
      width: screenWidth * 0.85,
      marginVertical: 10,
    },
    title: {
      fontSize: 45,
      fontFamily: theme.regular,
      textAlign: 'center',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 25,
      color: theme.colors.textSecondary,
      fontFamily: theme.regular,
      textAlign: 'center',
    },
    form: {
      width: screenWidth * 0.85,
    },
    formElem: {
      width: screenWidth * 0.75,
    },
    label: {
      marginLeft: 5,
      fontSize: 25,
      fontFamily: theme.regular,
      color: theme.colors.text,
    },
    input: {
      fontSize: 25,
      fontFamily: theme.regular,
      borderColor: theme.colors.textTertiary,
      color: theme.colors.text,
      borderWidth: 1,
      borderRadius: 10,
      height: 60,
      paddingLeft: 10,
      paddingVertical: 0,
      includeFontPadding: false,
      marginTop: 5,
      backgroundColor: theme.colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    button: {
      width: screenWidth * 0.5,
      borderRadius: 10,
      overflow: 'hidden',
      alignSelf: 'center',
      marginTop: 20,
      elevation: 5,
    },
    buttonText: {
      fontSize: 30,
      fontFamily: theme.regular,
      alignSelf: 'center',
      textAlign: 'center',
      color: theme.colors.contrast,
    },
  });
