import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Hydra from '../../components/Hydra';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import type { Theme } from '../../types';
import type { ComponentProps } from 'react';

WebBrowser.maybeCompleteAuthSession();

const { height: screenHeight } = Dimensions.get('window');

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

type SocialButtonProps = {
  icon: ComponentProps<typeof FontAwesome6>['name'];
  text: string;
  color: string;
  textColor: string;
  onPress: () => void;
  theme: Theme;
};

const SocialButton = ({ icon, text, color, textColor, onPress, theme }: SocialButtonProps) => {
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.socialButton, { backgroundColor: color, borderColor: theme.colors.border }]}
    >
      <View style={styles.iconWrapper}>
        <FontAwesome6 name={icon} size={24} color={textColor} />
      </View>
      <Text style={[styles.socialButtonText, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
};

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();

  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!WEB_CLIENT_ID) {
      console.error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
      return;
    }
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const showGoogleError = (detail?: string) => {
    const message = t('alerts.googleAlert');
    if (__DEV__ && detail) {
      console.error('Google login error:', detail);
      Alert.alert(t('alerts.errorTitle'), `${message}\n\n${detail}`);
      return;
    }
    Alert.alert(t('alerts.errorTitle'), message);
  };

  const handleBackendHandshake = async (googleToken: string, lang: string) => {
    const profile = await login(googleToken, 'google', lang);

    if (profile) {
      if (profile.onboardingCompleted) {
        router.replace('/(app)');
      } else {
        router.replace('/(auth)/age');
      }
    } else {
      showGoogleError('Backend login failed');
    }
  };

  const handleGoogleLogin = async () => {
    if (!WEB_CLIENT_ID) {
      showGoogleError('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
      return;
    }
    if (isSigningIn || isLoading) return;

    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      try {
        await GoogleSignin.signOut();
      } catch {
        // No session yet — ignore
      }

      const userInfo = await GoogleSignin.signIn();
      const googleToken = userInfo.data?.idToken ?? (userInfo as { idToken?: string }).idToken;

      if (googleToken) {
        await handleBackendHandshake(googleToken, i18n.language);
      } else {
        showGoogleError('No idToken returned (check webClientId + Android SHA-1)');
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const code = err?.code;
      const message = String(err?.message || '');
      const isBenign =
        code === statusCodes.SIGN_IN_CANCELLED ||
        code === statusCodes.IN_PROGRESS ||
        code === 'SIGN_IN_CANCELLED' ||
        code === 'IN_PROGRESS' ||
        /sign-?in in progress/i.test(message) ||
        /cancelled/i.test(message);

      if (isBenign) return;

      const detail = err?.message || err?.code || String(error);
      showGoogleError(detail);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Hydra />
        <Text style={[styles.title, { color: theme.colors.text }]}>HydraFlow</Text>
        <Text style={styles.subtitle}>{t('main.slogan')}</Text>
      </View>

      <View style={styles.footer}>
        {isLoading || isSigningIn ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 10, color: theme.colors.textSecondary }}>
              {t('loginAuth.serverConnect')}
            </Text>
          </View>
        ) : (
          <SocialButton
            icon="google"
            text={t('loginAuth.googleButton')}
            color="#FFFFFF"
            textColor="#000000"
            onPress={handleGoogleLogin}
            theme={theme}
          />
        )}

        <Text style={styles.termsText}>{t('loginAuth.terms')}</Text>
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
    },
    header: {
      alignItems: 'center',
      marginTop: 40,
    },
    title: {
      fontSize: 42,
      fontFamily: theme.regular,
      marginTop: 20,
    },
    subtitle: {
      fontSize: 18,
      fontFamily: theme.regular,
      color: theme.colors.textSecondary,
      marginTop: 5,
    },
    footer: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      paddingHorizontal: 30,
      gap: 15,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderRadius: 15,
      borderWidth: 2,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    iconWrapper: {
      position: 'absolute',
      left: 20,
    },
    socialButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    termsText: {
      textAlign: 'center',
      fontSize: 15,
      color: theme.colors.textSecondary,
      paddingHorizontal: 20,
      paddingTop: screenHeight * 0.025,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
  });
