import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Linking, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ToggleButton from '../../components/ToogleButton';
import MultipleToggle from '../../components/MultipleToggle';
import VolumeSlider from '../../components/VolumeSlider';
import CustomModal from '../../components/CustomModal';
import { TERMS_AND_CONDITIONS, DATA_USAGE, PRIVACY_POLICY, ABOUT_US } from "../../utils/legalText";
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useAppShell } from '../../context/AppShellContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { showToast } from '../../utils/toast';

import * as FileSystem from 'expo-file-system';
import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


const ToggleOption = ({ title, options, value, onValueChange, styles, theme }) => {
  const labels = options.map(opt => opt.label);

  const selectedIndex = options.findIndex(opt => opt.value === value);
  const safeIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const handleToggleChange = (newIndex) => {
    const newValue = options[newIndex].value;
    onValueChange(newValue);
  };

  const isBinary = options.length === 2;

  return (
    <View style={styles.settingItem}>
      <View style={[styles.menuItemLabel, { width: screenWidth * 0.9 * 0.60 }]}>
        <Text style={styles.itemTitle}>{title}</Text>
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

const NotificationsView = ({ setCurrentView, styles, theme, userSettings, updateSettings }) => {
  const { t } = useTranslation();

  const REMINDER_OPTS = [
    { label: t("settings.yes"), value: true },
    { label: t("settings.no"), value: false }
  ];

  const FREQUENCY_OPTS = [
    { label: t("settings.smart"), value: "smart" },
    { label: "30 min", value: "30" },
    { label: "1h", value: "60" },
    { label: "2h", value: "120" }
  ];

  const SOUND_OPTS = [
    { label: t("settings.drop"), value: "drop" },
    { label: t("settings.frog"), value: "frog" },
    { label: t("settings.bird"), value: "bird" },
    { label: t("settings.flute"), value: "flute" }
  ];

  const [reminders, setReminders] = useState(userSettings?.notifications?.enabled ?? true);
  const [frequency, setFrequency] = useState(userSettings?.notifications?.frequency || "smart");
  const [sound, setSound] = useState(userSettings?.notifications?.sound || "drop");

  const handleSave = () => {
    updateSettings({
      notifications: {
        enabled: reminders,
        frequency: frequency,
        sound: sound
      }
    });
    setCurrentView("home");
  };

  return (
    <View style={styles.subViewContainer}>
      <ToggleOption styles={styles} theme={theme} value={reminders} onValueChange={setReminders} options={REMINDER_OPTS} title={t("settings.reminders")} />
      <ToggleOption styles={styles} theme={theme} value={frequency} onValueChange={setFrequency} options={FREQUENCY_OPTS} title={t("settings.frequency")} />
      <ToggleOption styles={styles} theme={theme} value={sound} onValueChange={setSound} options={SOUND_OPTS} title={t("settings.sound")} />

      <View style={{ flex: 1 }} />

      <TouchableOpacity onPress={handleSave} style={styles.menuItem}>
        <Text style={[styles.menuText, { color: theme.colors.success || "#32C843" }]}>{t("settings.saveChanges")}</Text>
      </TouchableOpacity>
    </View>
  );
};

const PreferencesView = ({ setCurrentView, styles, theme, userSettings, updateSettings }) => {
  const { t } = useTranslation();

  const UNIT_OPTS = [
    { label: "CM", value: "cm" },
    { label: "FT", value: "ft" }
  ];
  const WEIGHT_OPTS = [
    { label: "KG", value: "kg" },
    { label: "LB", value: "lb" }
  ];
  const BOOL_OPTS = [
    { label: t("settings.yes"), value: true },
    { label: t("settings.no"), value: false }
  ];
  const THEME_OPTS = [
    { label: t("settings.light"), value: "light" },
    { label: t("settings.dark"), value: "dark" },
    { label: t("settings.system"), value: "system" }
  ];
  const LANG_OPTS = [
    { label: t("settings.spanish"), value: "es" },
    { label: t("settings.catalan"), value: "ca" },
    { label: t("settings.english"), value: "en" }
  ];

  const [unitDist, setUnitDist] = useState(userSettings?.preferences?.unitDist || "cm");
  const [unitWeight, setUnitWeight] = useState(userSettings?.preferences?.unitWeight || "kg");
  const [soundEffects, setSoundEffects] = useState(userSettings?.preferences?.soundEffects ?? true);
  const [volume, setVolume] = useState(userSettings?.preferences?.volume || 50);
  const [vibration, setVibration] = useState(userSettings?.preferences?.vibration ?? true);
  const [appTheme, setAppTheme] = useState(userSettings?.preferences?.theme ?? "light");
  const [language, setLanguage] = useState(userSettings?.preferences?.language || "es");

  const handleSave = () => {
    updateSettings({
      preferences: {
        unitDist,
        unitWeight,
        soundEffects,
        volume,
        vibration,
        theme: appTheme,
        language
      }
    });
    setCurrentView("home");
  };

  return (
    <View style={styles.subViewContainer}>
      <ToggleOption styles={styles} theme={theme} value={unitDist} onValueChange={setUnitDist} options={UNIT_OPTS} title={t("settings.unitMeasure")} />
      <ToggleOption styles={styles} theme={theme} value={unitWeight} onValueChange={setUnitWeight} options={WEIGHT_OPTS} title={t("settings.unitWeight")} />
      <ToggleOption styles={styles} theme={theme} value={soundEffects} onValueChange={setSoundEffects} options={BOOL_OPTS} title={t("settings.soundEffects")} />

      <View style={styles.sliderContainer}>
        <VolumeSlider volume={volume} setVolume={setVolume} />
      </View>

      <ToggleOption styles={styles} theme={theme} value={vibration} onValueChange={setVibration} options={BOOL_OPTS} title={t("settings.vibration")} />
      <ToggleOption styles={styles} theme={theme} value={appTheme} onValueChange={setAppTheme} options={THEME_OPTS} title={t("settings.theme")} />
      <ToggleOption styles={styles} theme={theme} value={language} onValueChange={setLanguage} options={LANG_OPTS} title={t("settings.language")} />

      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={handleSave} style={styles.menuItem}>
        <Text style={[styles.menuText, { color: theme.colors.success || "#32C843" }]}>{t("settings.saveChanges")}</Text>
      </TouchableOpacity>
    </View>
  );
};

const SupportView = ({ setCurrentView, styles, theme }) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const INFO_PAGES = [
    { title: t("settings.privacyPolicy"), content: PRIVACY_POLICY },
    { title: t("settings.termsConditions"), content: TERMS_AND_CONDITIONS },
    { title: t("settings.legalNotice"), content: DATA_USAGE },
    { title: t("settings.aboutUs"), content: ABOUT_US }
  ];

  const openModal = (index) => {
    setPageIndex(index);
    setModalVisible(true);
  };

  const handleExport = async () => {
    try {
      // 1. Obtener historial del backend
      const logs = await api.exportUserData();

      if (!logs || logs.length === 0) {
        showToast(t("toast.unavailableExport"));
        return;
      }

      // 2. Construir el contenido del archivo CSV
      const header = "Fecha,Hora,Cantidad (ml)\n";
      const rows = logs.map(log => {
        const dateObj = new Date(log.timestamp);
        const dateStr = dateObj.toLocaleDateString('es-ES');
        const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `${dateStr},${timeStr},${log.amount}`;
      }).join("\n");

      const csvContent = header + rows;

      // 3. Crear el archivo temporal usando la API moderna (new File().write())
      const fileName = `HydraFlow_Export_${new Date().getTime()}.csv`;
      
      const exportFile = new File(FileSystem.Paths.document, fileName);
      
      exportFile.create({ overwrite: true });
      
      await exportFile.write(csvContent);

      // 4. Abrir la hoja de compartir nativa (iOS/Android)
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(exportFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar datos de hidratación',
          UTI: 'public.comma-separated-values-text' // Para compatibilidad iOS
        });
      } else {
        showToast(t("toast.unavailableShare"));
      }

    } catch (error) {
      console.error("Error al exportar:", error);
      showToast(t("toast.generateError"));
    }
  };

  const handleFeedback = () => {
    const email = "jordibarrachinam@gmail.com"; 
    const subject = "Feedback HydraFlow";
    const body = `Hola equipo de HydraFlow,\n\n[Escribe aquí tu sugerencia, idea o error encontrado]\n\n\n---\nDetalles técnicos:\nPlataforma: ${Platform.OS}\nVersión: 1.0.0`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Linking intentará abrir la app de correo nativa
    Linking.openURL(mailtoUrl).catch((err) => {
      console.error("Error opening email app:", err);
      showToast(t("toast.unavailableEmail") + email, { duration: 'long' });
    });
  };

  const renderMenuItem = (label, onPress) => (
    <TouchableOpacity onPress={onPress} style={[styles.menuItem, styles.menuItemRow]}>
      <Text style={styles.menuText}>{label}</Text>
      <FontAwesome6 name="angle-right" size={22} color={theme.colors.text} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.subViewContainer}>
      {renderMenuItem(t("settings.exportData"), handleExport)}
      {renderMenuItem(t("settings.feedback"), handleFeedback)}
      {renderMenuItem(t("settings.privacyPolicy"), () => openModal(0))}
      {renderMenuItem(t("settings.termsConditions"), () => openModal(1))}
      {renderMenuItem(t("settings.legalNotice"), () => openModal(2))}
      {renderMenuItem(t("settings.aboutUs"), () => openModal(3))}

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={INFO_PAGES[pageIndex].title}
        borderColor={theme.colors.primary}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.legalText}>{INFO_PAGES[pageIndex].content}</Text>
        </ScrollView>
      </CustomModal>
    </View>
  );
};

const AccountView = ({ styles, theme }) => {
  const { t } = useTranslation();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteDisabled, setDeleteDisabled] = useState(true);

  useEffect(() => {
    let timer;
    if (deleteModalVisible) {
      setDeleteDisabled(true);
      timer = setTimeout(() => setDeleteDisabled(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [deleteModalVisible]);

  return (
    <View style={styles.subViewContainer}>
      <TouchableOpacity onPress={() => setDeleteModalVisible(true)} style={[styles.menuItem, styles.dangerItem]}>
        <Text style={[styles.menuText, { color: theme.colors.error || "red" }]}>{t("settings.deleteAccount")}</Text>
      </TouchableOpacity>

      <CustomModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title={t("settings.dangerZone")}
        borderColor={theme.colors.error || "red"}
      >
        <View style={styles.deleteModalContent}>
          <Text style={[styles.title, { color: theme.colors.error || "red", fontSize: 25 }]}>
            {t("settings.deleteAllData")}
          </Text>
          <Text style={styles.subtitle}>
            {t("settings.deleteWarning")}
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.menuText}>{t("settings.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={deleteDisabled}
              onPress={() => api.deleteAccount()}
              style={[styles.modalButton, { opacity: deleteDisabled ? 0.3 : 1 }]}
            >
              <Text style={[styles.menuText, { color: theme.colors.error || "red", fontWeight: 'bold' }]}>
                {deleteDisabled ? t("settings.wait") : t("settings.deleteButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>
    </View>

  )
}

const MainSettingsView = ({ setCurrentView, styles, theme }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { changeTab, startTutorial } = useAppShell();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteDisabled, setDeleteDisabled] = useState(true);

  useEffect(() => {
    let timer;
    if (deleteModalVisible) {
      setDeleteDisabled(true);
      timer = setTimeout(() => setDeleteDisabled(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [deleteModalVisible]);

  return (
    <View style={styles.subViewContainer}>
      <TouchableOpacity onPress={() => changeTab(4)} style={styles.menuItem}>
        <Text style={styles.menuText}>{t("settings.myProfile")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentView("notifications")} style={styles.menuItem}>
        <Text style={styles.menuText}>{t("settings.notifications")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentView("preferences")} style={styles.menuItem}>
        <Text style={styles.menuText}>{t("settings.preferences")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => changeTab(3)} style={styles.menuItem}>
        <Text style={styles.menuText}>{t("settings.customize")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={startTutorial} style={styles.menuItem}>
        <Text style={styles.menuText}>{t("settings.tutorial")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentView("support")} style={styles.menuItem}>
        <Text style={styles.menuText}>{t("settings.support")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentView("account")} style={styles.menuItem}>
        <Text style={styles.menuText}>{t("settings.account")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setDeleteModalVisible(true)} style={[styles.menuItem, styles.dangerItem]}>
        <Text style={[styles.menuText, { color: theme.colors.error || "red" }]}>{t("settings.logout")}</Text>
      </TouchableOpacity>

      <CustomModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        borderColor={theme.colors.error || "red"}
      >
        <View style={styles.deleteModalContent}>
          <Text style={[styles.title, { color: theme.colors.error || "red", fontSize: 25 }]}>
            {t("settings.logoutQuestion")}
          </Text>
          <Text style={styles.subtitle}>
            {t("settings.logoutWarning")}
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.modalButton}>
              <Text style={styles.menuText}>{t("settings.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={deleteDisabled}
              onPress={logout}
              style={[styles.modalButton, { opacity: deleteDisabled ? 0.3 : 1 }]}
            >
              <Text style={[styles.menuText, { color: theme.colors.error || "red", fontWeight: 'bold' }]}>
                {deleteDisabled ? t("settings.wait") : t("settings.logoutButton")}
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
  const [currentView, setCurrentView] = useState("home");

  const { userProfile, updateUserProfile } = useUser();

  const updateSettings = (newSettings) => {
    const patch = {};
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
      case "notifications": return { title: t("settings.notifications") };
      case "preferences": return { title: t("settings.preferences") };
      case "support": return { title: t("settings.support") };
      case "account": return { title: t("settings.account") };
      default: return { title: t("settings.settings") };
    }
  }, [currentView, t]);

  const renderContent = () => {
    const props = {
      setCurrentView,
      styles,
      theme,
      userSettings: userProfile,
      updateSettings
    };
    switch (currentView) {
      case "notifications": return <NotificationsView {...props} />;
      case "preferences": return <PreferencesView {...props} />;
      case "support": return <SupportView {...props} />;
      case "account": return <AccountView {...props} />;
      default: return <MainSettingsView {...props} />;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {currentView !== "home" && (
          <TouchableOpacity
            hitSlop={20}
            onPress={() => setCurrentView("home")}
            style={styles.backButton}
          >
            <FontAwesome6 name="angle-left" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{viewConfig.title}</Text>
      </View>

      {renderContent()}

      <Text style={styles.versionText}>HydraFlow v1.0.0</Text>
    </ScrollView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    alignItems: "center",
    flexGrow: 1,
    paddingVertical: "5%",
  },
  header: {
    width: "100%",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative'
  },
  backButton: {
    position: "absolute",
    left: "8%",
    zIndex: 10,
    padding: 10
  },
  headerTitle: {
    fontFamily: theme.regular,
    fontSize: 25,
    color: theme.colors.text,
    textAlign: "center"
  },
  subViewContainer: {
    width: screenWidth * 0.9,
    flex: 1,
    alignItems: 'center'
  },
  menuItem: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 5,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.background,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 15,
    justifyContent: 'center'
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  menuText: {
    fontFamily: theme.regular,
    fontSize: 25,
    color: theme.colors.text,
    textAlign: "center"
  },
  dangerItem: {
    borderColor: theme.colors.error || "rgba(255,0,0,0.3)",
    marginTop: 10
  },
  // Toggles y Settings
  settingItem: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: screenHeight * 0.015
  },
  menuItemLabel: {
    borderRadius: 20,
    borderWidth: 5,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: theme.colors.background
  },
  itemTitle: {
    fontFamily: theme.regular,
    fontSize: 22,
    color: theme.colors.text
  },
  binaryToggleContainer: {
    borderRadius: 30,
    borderWidth: 3,
    borderColor: theme.colors.border || "#EEEEEE",
    overflow: 'hidden'
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 10
  },
  // Textos Generales
  title: {
    fontFamily: theme.bold || theme.regular,
    fontSize: 24,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 10
  },
  subtitle: {
    fontFamily: theme.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22
  },
  legalText: {
    fontFamily: theme.regular,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20
  },
  versionText: {
    fontFamily: theme.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  // Modal Eliminar
  deleteModalContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 10
  },
  modalButtons: {
    width: '100%',
    gap: 10,
    alignItems: 'center'
  },
  modalButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center'
  }
});