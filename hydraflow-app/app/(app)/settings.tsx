import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ToggleButton from '../../components/ToggleButton';
import MultipleToggle from '../../components/MultipleToggle';
import VolumeSlider from '../../components/VolumeSlider';
import CustomModal from '../../components/CustomModal';
import { TERMS_AND_CONDITIONS, DATA_USAGE, PRIVACY_POLICY, ABOUT_US } from '../../utils/legalText';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useAppShell } from '../../context/AppShellContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { showToast } from '../../utils/toast';
import { getLocaleTag } from '../../utils/i18nHelpers';
import * as FileSystem from 'expo-file-system';
import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { APP_VERSION } from '../../constants/app';
import type {
  SettingsViewId,
  Theme,
  ThemeModePreference,
  UserProfile,
  UserProfilePatch,
} from '../../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type SettingsStyles = ReturnType<typeof createStyles>;

type ToggleOptionItem<T extends string | boolean> = {
  label: string;
  value: T;
};

type ToggleOptionProps<T extends string | boolean> = {
  title: string;
  options: ToggleOptionItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  styles: SettingsStyles;
  theme: Theme;
};

const ToggleOption = <T extends string | boolean>({
  title,
  options,
  value,
  onValueChange,
  styles,
  theme,
}: ToggleOptionProps<T>) => {
  const labels = options.map((opt) => opt.label);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const safeIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const handleToggleChange = (newIndex: number) => {
    const newValue = options[newIndex].value;
    onValueChange(newValue);
  };

  const isBinary = options.length === 2;

  return (
    <View style={styles.settingItem}>
      <View style={[styles.menuItemLabel, { width: screenWidth * 0.9 * 0.6 }]}>
        <Text
          style={styles.itemTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {title}
        </Text>
      </View>

      {isBinary ? (
        <View style={styles.binaryToggleContainer}>
          <ToggleButton
            value={safeIndex}
            onValueChange={handleToggleChange}
            labels={labels}
            optionWidth={screenWidth * 0.9 * 0.35 * 0.5}
            fontSize={22}
            borderRadius={30}
          />
        </View>
      ) : (
        <MultipleToggle
          width={screenWidth * 0.9 * 0.375}
          options={labels}
          value={safeIndex}
          onValueChange={handleToggleChange}
        />
      )}
    </View>
  );
};

type SettingsSubViewProps = {
  setCurrentView: (view: SettingsViewId) => void;
  styles: SettingsStyles;
  theme: Theme;
  userSettings?: UserProfile;
  updateSettings: (newSettings: Pick<UserProfilePatch, 'notifications' | 'preferences'>) => void;
};

const NotificationsView = ({
  setCurrentView,
  styles,
  theme,
  userSettings,
  updateSettings,
}: SettingsSubViewProps) => {
  const { t } = useTranslation();

  const REMINDER_OPTS: ToggleOptionItem<boolean>[] = [
    { label: t('settings.yes'), value: true },
    { label: t('settings.no'), value: false },
  ];

  const FREQUENCY_OPTS: ToggleOptionItem<string>[] = [
    { label: t('settings.smart'), value: 'smart' },
    { label: '30 min', value: '30' },
    { label: '1h', value: '60' },
    { label: '2h', value: '120' },
  ];

  const SOUND_OPTS: ToggleOptionItem<string>[] = [
    { label: t('settings.drop'), value: 'drop' },
    { label: t('settings.frog'), value: 'frog' },
    { label: t('settings.bird'), value: 'bird' },
    { label: t('settings.flute'), value: 'flute' },
  ];

  const [reminders, setReminders] = useState(userSettings?.notifications?.enabled ?? true);
  const [frequency, setFrequency] = useState(userSettings?.notifications?.frequency || 'smart');
  const [sound, setSound] = useState(userSettings?.notifications?.sound || 'drop');

  const handleSave = () => {
    updateSettings({
      notifications: {
        enabled: reminders,
        frequency,
        sound,
      },
    });
    setCurrentView('home');
  };

  return (
    <View style={styles.subViewContainer}>
      <ToggleOption
        styles={styles}
        theme={theme}
        value={reminders}
        onValueChange={setReminders}
        options={REMINDER_OPTS}
        title={t('settings.reminders')}
      />
      <ToggleOption
        styles={styles}
        theme={theme}
        value={frequency}
        onValueChange={setFrequency}
        options={FREQUENCY_OPTS}
        title={t('settings.frequency')}
      />
      <ToggleOption
        styles={styles}
        theme={theme}
        value={sound}
        onValueChange={setSound}
        options={SOUND_OPTS}
        title={t('settings.sound')}
      />

      <View style={{ flex: 1 }} />

      <TouchableOpacity onPress={handleSave} style={styles.menuItem}>
        <Text style={[styles.menuText, { color: '#32C843' }]}>{t('settings.saveChanges')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const PreferencesView = ({
  setCurrentView,
  styles,
  theme,
  userSettings,
  updateSettings,
}: SettingsSubViewProps) => {
  const { t } = useTranslation();

  const UNIT_OPTS: ToggleOptionItem<string>[] = [
    { label: 'CM', value: 'cm' },
    { label: 'FT', value: 'ft' },
  ];
  const WEIGHT_OPTS: ToggleOptionItem<string>[] = [
    { label: 'KG', value: 'kg' },
    { label: 'LB', value: 'lb' },
  ];
  const BOOL_OPTS: ToggleOptionItem<boolean>[] = [
    { label: t('settings.yes'), value: true },
    { label: t('settings.no'), value: false },
  ];
  const THEME_OPTS: ToggleOptionItem<ThemeModePreference>[] = [
    { label: t('settings.light'), value: 'light' },
    { label: t('settings.dark'), value: 'dark' },
    { label: t('settings.system'), value: 'system' },
  ];
  const LANG_OPTS: ToggleOptionItem<string>[] = [
    { label: t('settings.spanish'), value: 'es' },
    { label: t('settings.catalan'), value: 'ca' },
    { label: t('settings.english'), value: 'en' },
  ];

  const [unitDist, setUnitDist] = useState(userSettings?.preferences?.unitDist || 'cm');
  const [unitWeight, setUnitWeight] = useState(userSettings?.preferences?.unitWeight || 'kg');
  const [soundEffects, setSoundEffects] = useState(userSettings?.preferences?.soundEffects ?? true);
  const [volume, setVolume] = useState(userSettings?.preferences?.volume || 50);
  const [vibration, setVibration] = useState(userSettings?.preferences?.vibration ?? true);
  const [appTheme, setAppTheme] = useState<ThemeModePreference>(
    userSettings?.preferences?.theme ?? 'light',
  );
  const [language, setLanguage] = useState(userSettings?.preferences?.language || 'es');

  const handleSave = () => {
    updateSettings({
      preferences: {
        unitDist,
        unitWeight,
        soundEffects,
        volume,
        vibration,
        theme: appTheme,
        language,
      },
    });
    setCurrentView('home');
  };

  return (
    <View style={styles.subViewContainer}>
      <ToggleOption
        styles={styles}
        theme={theme}
        value={unitDist}
        onValueChange={setUnitDist}
        options={UNIT_OPTS}
        title={t('settings.unitMeasure')}
      />
      <ToggleOption
        styles={styles}
        theme={theme}
        value={unitWeight}
        onValueChange={setUnitWeight}
        options={WEIGHT_OPTS}
        title={t('settings.unitWeight')}
      />
      <ToggleOption
        styles={styles}
        theme={theme}
        value={soundEffects}
        onValueChange={setSoundEffects}
        options={BOOL_OPTS}
        title={t('settings.soundEffects')}
      />

      <View style={styles.sliderContainer}>
        <VolumeSlider volume={volume} setVolume={setVolume} />
      </View>

      <ToggleOption
        styles={styles}
        theme={theme}
        value={vibration}
        onValueChange={setVibration}
        options={BOOL_OPTS}
        title={t('settings.vibration')}
      />
      <ToggleOption
        styles={styles}
        theme={theme}
        value={appTheme}
        onValueChange={setAppTheme}
        options={THEME_OPTS}
        title={t('settings.theme')}
      />
      <ToggleOption
        styles={styles}
        theme={theme}
        value={language}
        onValueChange={setLanguage}
        options={LANG_OPTS}
        title={t('settings.language')}
      />

      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={handleSave} style={styles.menuItem}>
        <Text style={[styles.menuText, { color: '#32C843' }]}>{t('settings.saveChanges')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const SupportView = ({ styles, theme }: SettingsSubViewProps) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const INFO_PAGES = [
    { title: t('settings.privacyPolicy'), content: PRIVACY_POLICY },
    { title: t('settings.termsConditions'), content: TERMS_AND_CONDITIONS },
    { title: t('settings.legalNotice'), content: DATA_USAGE },
    { title: t('settings.aboutUs'), content: ABOUT_US },
  ];

  const openModal = (index: number) => {
    setPageIndex(index);
    setModalVisible(true);
  };

  const handleExport = async () => {
    try {
      const logs = await api.exportUserData();

      if (!logs || logs.length === 0) {
        showToast(t('toast.unavailableExport'));
        return;
      }

      const localeTag = getLocaleTag();
      const header = `${t('settings.exportCsvDate')},${t('settings.exportCsvTime')},${t('settings.exportCsvAmount')}\n`;
      const rows = logs
        .map((log) => {
          const dateObj = new Date(log.timestamp);
          const dateStr = dateObj.toLocaleDateString(localeTag);
          const timeStr = dateObj.toLocaleTimeString(localeTag, {
            hour: '2-digit',
            minute: '2-digit',
          });
          return `${dateStr},${timeStr},${log.amount}`;
        })
        .join('\n');

      const csvContent = header + rows;

      const fileName = `HydraFlow_Export_${new Date().getTime()}.csv`;

      const exportFile = new File(FileSystem.Paths.document, fileName);

      exportFile.create({ overwrite: true });

      await exportFile.write(csvContent);

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(exportFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: t('settings.exportDialogTitle'),
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        showToast(t('toast.unavailableShare'));
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      showToast(t('toast.generateError'));
    }
  };

  const handleFeedback = () => {
    const email = 'jordibarrachinam@gmail.com';
    const subject = t('settings.feedbackSubject');
    const body = t('settings.feedbackBody', { platform: Platform.OS, version: APP_VERSION });

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailtoUrl).catch((err) => {
      console.error('Error opening email app:', err);
      showToast(t('toast.unavailableEmail') + email, { duration: 'long' });
    });
  };

  const renderMenuItem = (label: string, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} style={[styles.menuItem, styles.menuItemRow]}>
      <Text style={styles.menuText}>{label}</Text>
      <FontAwesome6 name="angle-right" size={22} color={theme.colors.text} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.subViewContainer}>
      {renderMenuItem(t('settings.exportData'), handleExport)}
      {renderMenuItem(t('settings.feedback'), handleFeedback)}
      {renderMenuItem(t('settings.privacyPolicy'), () => openModal(0))}
      {renderMenuItem(t('settings.termsConditions'), () => openModal(1))}
      {renderMenuItem(t('settings.legalNotice'), () => openModal(2))}
      {renderMenuItem(t('settings.aboutUs'), () => openModal(3))}

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        borderColor={theme.colors.primary}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.legalText}>{INFO_PAGES[pageIndex].content}</Text>
        </ScrollView>
      </CustomModal>
    </View>
  );
};

const AccountView = ({ styles, theme }: SettingsSubViewProps) => {
  const { t } = useTranslation();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteDisabled, setDeleteDisabled] = useState(true);

  useEffect(() => {
    if (!deleteModalVisible) return;

    const timer = setTimeout(() => setDeleteDisabled(false), 3000);
    return () => clearTimeout(timer);
  }, [deleteModalVisible]);

  const openDeleteModal = () => {
    setDeleteDisabled(true);
    setDeleteModalVisible(true);
  };

  return (
    <View style={styles.subViewContainer}>
      <TouchableOpacity onPress={openDeleteModal} style={[styles.menuItem, styles.dangerItem]}>
        <Text style={[styles.menuText, { color: 'red' }]}>{t('settings.deleteAccount')}</Text>
      </TouchableOpacity>

      <CustomModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        borderColor="red"
      >
        <View style={styles.deleteModalContent}>
          <Text style={[styles.title, { color: 'red', fontSize: 25 }]}>
            {t('settings.deleteAllData')}
          </Text>
          <Text style={styles.subtitle}>{t('settings.deleteWarning')}</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setDeleteModalVisible(false)}
              style={styles.modalButton}
            >
              <Text style={styles.menuText}>{t('settings.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={deleteDisabled}
              onPress={() => api.deleteAccount()}
              style={[styles.modalButton, { opacity: deleteDisabled ? 0.3 : 1 }]}
            >
              <Text style={[styles.menuText, { color: 'red', fontWeight: 'bold' }]}>
                {deleteDisabled ? t('settings.wait') : t('settings.deleteButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>
    </View>
  );
};

const MainSettingsView = ({ setCurrentView, styles, theme }: SettingsSubViewProps) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { changeTab, startTutorial } = useAppShell();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteDisabled, setDeleteDisabled] = useState(true);

  useEffect(() => {
    if (!deleteModalVisible) return;

    const timer = setTimeout(() => setDeleteDisabled(false), 3000);
    return () => clearTimeout(timer);
  }, [deleteModalVisible]);

  const openLogoutModal = () => {
    setDeleteDisabled(true);
    setDeleteModalVisible(true);
  };

  return (
    <View style={styles.subViewContainer}>
      <TouchableOpacity onPress={() => changeTab(4)} style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.myProfile')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentView('notifications')} style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.notifications')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentView('preferences')} style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.preferences')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => changeTab(3)} style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.customize')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={startTutorial} style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.tutorial')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentView('support')} style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.support')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentView('account')} style={styles.menuItem}>
        <Text style={styles.menuText}>{t('settings.account')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={openLogoutModal} style={[styles.menuItem, styles.dangerItem]}>
        <Text style={[styles.menuText, { color: 'red' }]}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      <CustomModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        borderColor="red"
      >
        <View style={styles.deleteModalContent}>
          <Text style={[styles.title, { color: 'red', fontSize: 25 }]}>
            {t('settings.logoutQuestion')}
          </Text>
          <Text style={styles.subtitle}>{t('settings.logoutWarning')}</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => setDeleteModalVisible(false)}
              style={styles.modalButton}
            >
              <Text style={styles.menuText}>{t('settings.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={deleteDisabled}
              onPress={logout}
              style={[styles.modalButton, { opacity: deleteDisabled ? 0.3 : 1 }]}
            >
              <Text style={[styles.menuText, { color: 'red', fontWeight: 'bold' }]}>
                {deleteDisabled ? t('settings.wait') : t('settings.logoutButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>
    </View>
  );
};

export default function Settings() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [currentView, setCurrentView] = useState<SettingsViewId>('home');

  const { userProfile, updateUserProfile } = useUser();

  const updateSettings = (newSettings: Pick<UserProfilePatch, 'notifications' | 'preferences'>) => {
    const patch: UserProfilePatch = {};
    if (newSettings.notifications) {
      patch.notifications = {
        ...userProfile?.notifications,
        ...newSettings.notifications,
      };
    }
    if (newSettings.preferences) {
      patch.preferences = {
        ...userProfile?.preferences,
        ...newSettings.preferences,
      };
    }
    updateUserProfile(patch);
  };

  const { t } = useTranslation();

  const viewConfig = useMemo(() => {
    switch (currentView) {
      case 'notifications':
        return { title: t('settings.notifications') };
      case 'preferences':
        return { title: t('settings.preferences') };
      case 'support':
        return { title: t('settings.support') };
      case 'account':
        return { title: t('settings.account') };
      default:
        return { title: t('settings.settings') };
    }
  }, [currentView, t]);

  const renderContent = () => {
    const props: SettingsSubViewProps = {
      setCurrentView,
      styles,
      theme,
      userSettings: userProfile,
      updateSettings,
    };
    switch (currentView) {
      case 'notifications':
        return <NotificationsView {...props} />;
      case 'preferences':
        return <PreferencesView {...props} />;
      case 'support':
        return <SupportView {...props} />;
      case 'account':
        return <AccountView {...props} />;
      default:
        return <MainSettingsView {...props} />;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        {currentView !== 'home' && (
          <TouchableOpacity
            hitSlop={20}
            onPress={() => setCurrentView('home')}
            style={styles.backButton}
          >
            <FontAwesome6 name="angle-left" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {viewConfig.title}
        </Text>
      </View>

      {renderContent()}

      <Text
        style={styles.versionText}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {t('settings.appVersion', { version: APP_VERSION })}
      </Text>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      alignItems: 'center',
      flexGrow: 1,
      paddingVertical: '5%',
    },
    header: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      left: '8%',
      zIndex: 10,
      padding: 10,
    },
    headerTitle: {
      fontFamily: theme.regular,
      fontSize: 25,
      color: theme.colors.text,
      textAlign: 'center',
      width: '70%',
    },
    subViewContainer: {
      width: screenWidth * 0.9,
      flex: 1,
      alignItems: 'center',
    },
    menuItem: {
      width: '100%',
      borderRadius: 20,
      borderWidth: 5,
      borderColor: theme.colors.border,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.background,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      marginBottom: 15,
      justifyContent: 'center',
    },
    menuItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    menuText: {
      fontFamily: theme.regular,
      fontSize: 25,
      color: theme.colors.text,
      textAlign: 'center',
    },
    dangerItem: {
      borderColor: 'rgba(255,0,0,0.3)',
      marginTop: 10,
    },
    settingItem: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: screenHeight * 0.015,
    },
    menuItemLabel: {
      borderRadius: 20,
      borderWidth: 5,
      borderColor: theme.colors.border,
      paddingHorizontal: 10,
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    itemTitle: {
      fontFamily: theme.regular,
      fontSize: 22,
      color: theme.colors.text,
    },
    binaryToggleContainer: {
      borderRadius: 30,
      borderWidth: 3,
      borderColor: theme.colors.border || '#EEEEEE',
      overflow: 'hidden',
    },
    sliderContainer: {
      width: '100%',
      alignItems: 'center',
      marginVertical: 10,
    },
    title: {
      fontFamily: theme.regular,
      fontSize: 24,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontFamily: theme.regular,
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    legalText: {
      fontFamily: theme.regular,
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    versionText: {
      fontFamily: theme.regular,
      fontSize: 16,
      color: theme.colors.textSecondary,
      opacity: 0.6,
      width: '90%',
      textAlign: 'center',
    },
    deleteModalContent: {
      flex: 1,
      justifyContent: 'space-between',
      paddingVertical: 10,
    },
    modalButtons: {
      width: '100%',
      gap: 10,
      alignItems: 'center',
    },
    modalButton: {
      width: '100%',
      paddingVertical: 12,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
  });
