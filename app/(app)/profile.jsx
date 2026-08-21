import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Hydra from '../../components/Hydra';
import GradientIcon from '../../components/GradientIcon';
import { FontAwesome6 } from '@expo/vector-icons';
import Drop from "../../assets/Drop.svg"
import { useCallback, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileItem from '../../components/ProfileItem';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const PROFILE_FIELDS = [
  { key: 'name', label: 'profileApp.name' },
  { key: 'age', label: 'profileApp.age' },
  { key: 'weight', label: 'profileApp.weight' },
  { key: 'height', label: 'profileApp.height' },
  { key: 'gender', label: 'profileApp.gender' },
  { key: 'activity', label: 'profileApp.activity' },
  { key: 'wakeTime', label: 'profileApp.wakeTime' },
  { key: 'sleepTime', label: 'profileApp.sleepTime' },
  { key: 'goal', label: 'profileApp.goal' },
];

const StatBadge = ({ value, size, iconName, colors, CustomIcon, theme }) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.miscItem}>
      <Text style={styles.statText}>{value}</Text>
      {CustomIcon ? (
        <CustomIcon style={{marginLeft: 1}} width={22} height={22} />
      ) : (
        <GradientIcon size={27} colors={colors}>
          <FontAwesome6 size={size} name={iconName} />
        </GradientIcon>
      )}
    </View>
  )
};

export default function Profile() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userProfile, updateUserProfile, refreshUser } = useUser()
  const {t} = useTranslation()

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  const stats = userProfile?.stats || { level: 1, progress: 0, totalGoalsReached: 0, dropsBalance: 0, currentStreak: 0, totalVolume: 0 };
  const name = userProfile?.name || "";
  const level = stats.level || 1;
  const progress = userProfile?.stats.progress || 0;

  const changeUser = (id, newVal) => {
    updateUserProfile({ [id]: newVal })
  }

  const formatNum = (num) => {
    return (num || 0).toString().padStart(2, "0");
  };

  return (
    <View style={styles.container}>
      <View style={styles.upperContainer}>
        <View style={styles.hydraContainer}>
          <Hydra height={screenWidth * 0.35} showSkins={true} />
        </View>
        <View style={styles.statContainer}>
          <View style={{ width: "100%" }}>
            <Text style={styles.statText}>{t("greeting")} {name.length > 15 ? name.slice(0,15) + "..." : name}</Text>
          </View>
          <View style={{ width: "100%" }}>
            <Text style={styles.statText}>{t('profileApp.level')} {level}</Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              style={[styles.progressFill, { width: `${progress}%` }]}
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      </View>
      <View style={styles.miscBar}>
        <StatBadge
          value={formatNum(stats.currentStreak)}
          iconName="fire-flame-curved"
          colors={['#FF0000', '#F9F918']}
          size={25}
          theme={theme}
        />
        <StatBadge
          value={formatNum(stats.skinsCount)}
          iconName="shirt"
          colors={['#FF01AA', '#A099FF']}
          size={22}
          theme={theme}
        />
        <StatBadge
          value={formatNum(stats.dropsBalance)}
          CustomIcon={Drop}
          theme={theme}
        />
        <StatBadge
          value={formatNum(stats.totalGoalsReached)}
          iconName="droplet"
          colors={['#6989E2', '#79D8FE']}
          size={25}
          theme={theme}
        />
        <StatBadge
          value={formatNum(stats.achievementsCount)}
          iconName="medal"
          colors={['#FFD700', 'rgba(255,215,0,0.5)']}
          size={25}
          theme={theme}
        />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {PROFILE_FIELDS.map((field) => {
          return (
            <ProfileItem key={field.key} field={field} value={userProfile?.[field.key]} changeUser={changeUser} />
          )
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: "3%",
  },
  scrollContainer: {
    width: screenWidth * 0.9,
    alignSelf: "center",
    paddingBottom: "5%"
  },
  upperContainer: {
    flexDirection: "row",
    width: screenWidth * 0.9,
    alignSelf: "center",
    marginTop: "1%"
  },
  statContainer: {
    width: screenWidth * 0.9 * 0.52 - 10,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10
  },
  texto: {
    fontFamily: theme.regular,
    color: theme.colors.text,
    fontSize: 25
  },
  hydraContainer: {
    width: screenWidth * 0.9 * 0.42 + 10,
    height: screenWidth * 0.9 * 0.42 + 10,
    borderWidth: 5,
    borderRadius: screenWidth,
    borderColor: theme.colors.primaryDark,
    alignItems: "center",
    backgroundColor: "#e1e1e1",
    elevation: 5
  },
  statText: {
    fontFamily: theme.regular,
    color: theme.colors.text,
    fontSize: 27,
  },
  progressBar: {
    borderRadius: 20,
    borderWidth: 5,
    borderColor: theme.colors.border,
    width: "100%",
    height: screenHeight * 0.035,
    overflow: "hidden",
    backgroundColor: theme.colors.background,
    elevation: 5
  },
  progressFill: {
    width: "50%",
    height: "100%",
    borderTopRightRadius: 20,
  },
  miscBar: {
    width: screenWidth * 0.9,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 4,
    borderColor: theme.colors.primaryDark,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: theme.colors.background,
    elevation: 5,
    marginBottom: "5%"
  },
  miscItem: {
    width: "20%",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  profileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 5,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    width: "85%",
    backgroundColor: theme.colors.border,
    elevation: 5,
  },
  profileItemText: {
    fontFamily: theme.regular,
    color: theme.colors.text,
    fontSize: 25,
  },
  editButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10
  },

}); 