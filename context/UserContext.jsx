import React, { createContext, useState, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { notificationService } from '../services/notifications';
import i18n from '../app/i18n';
import { audioService } from '../services/audioService';
import {
  INITIAL_USER_PROFILE,
  DEFAULT_STATS,
  normalizeLocalProfile,
  mapBackendToFrontend,
  createEmptyProfile,
  mergeProfilePatch,
  calculateIdealGoal as calcIdealGoal,
} from '../services/profileMapping';
import { syncNotifications } from '../services/syncNotifications';
import { STORAGE_KEYS } from './storageKeys';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export const UserProvider = ({ children, userApiRef, hydrationApiRef }) => {
  const { authToken, authTokenRef } = useAuth();
  const [userProfile, setUserProfile] = useState(() => ({
    ...INITIAL_USER_PROFILE,
    stats: { ...DEFAULT_STATS },
    skins: { ...INITIAL_USER_PROFILE.skins, owned: [...INITIAL_USER_PROFILE.skins.owned], equipped: [] },
    notifications: { ...INITIAL_USER_PROFILE.notifications },
    preferences: { ...INITIAL_USER_PROFILE.preferences },
  }));

  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;

  const bootstrapLocalProfile = async () => {
    const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    let parsedData = {};

    if (profile) {
      parsedData = normalizeLocalProfile(JSON.parse(profile));
      if (parsedData.preferences?.language) {
        i18n.changeLanguage(parsedData.preferences.language);
      }
      setUserProfile(parsedData);
      AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(parsedData));
    }

    const soundOn = parsedData?.preferences?.soundEffects !== false;
    const isSoundMuted = !soundOn;
    const initialVolume = parsedData?.preferences?.volume !== undefined
      ? parsedData.preferences.volume
      : 50;

    await audioService.init(isSoundMuted, initialVolume);

    audioService.loadSound('drink', require('../assets/sounds/drop.mp3'));
    audioService.loadSound('swipe', require('../assets/sounds/swoosh.mp3'));
    audioService.loadSound('levelUp', require('../assets/sounds/levelUp.mp3'));
    audioService.loadSound('achievement', require('../assets/sounds/achievement.mp3'));
    audioService.loadSound('goalReached', require('../assets/sounds/goalReached.mp3'));
    audioService.loadSound('equipItem', require('../assets/sounds/equipItem.mp3'));
    audioService.loadSound('buyItem', require('../assets/sounds/buyItem.mp3'));
  };

  const applySessionProfile = async (mappedProfile) => {
    setUserProfile(mappedProfile);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mappedProfile));
  };

  const syncNotificationsForProfile = async (profile, currentWater) => {
    await syncNotifications(profile, currentWater);
  };

  const refreshUser = async () => {
    const token = authTokenRef?.current ?? authToken;
    if (!token) return;

    try {
      const backendUser = await api.getUser();

      if (backendUser) {
        const mappedProfile = mapBackendToFrontend(backendUser);

        if (mappedProfile.preferences?.language) {
          i18n.changeLanguage(mappedProfile.preferences.language);
        }

        setUserProfile(mappedProfile);
        AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mappedProfile));

        const waterToday = await hydrationApiRef.current?.refreshDailyWater?.();
        await syncNotifications(mappedProfile, waterToday ?? 0);
      }
    } catch (e) {
      console.error("Error refreshing user:", e);
    }
  };

  const onLogout = async () => {
    try {
      await notificationService.cancelAll();
    } catch (e) {
      console.warn("Error cancelando notificaciones");
    }
    setUserProfile(createEmptyProfile());
  };

  userApiRef.current = {
    bootstrapLocalProfile,
    applySessionProfile,
    syncNotificationsForProfile,
    refreshUser,
    onLogout,
    getManualName: () => userProfileRef.current?.name,
    getProfile: () => userProfileRef.current,
  };

  const updateUserProfile = async (newData) => {
    const prev = userProfileRef.current;
    const updatedProfile = mergeProfilePatch(prev, newData);

    setUserProfile(updatedProfile);

    if (newData.preferences?.language) {
      i18n.changeLanguage(newData.preferences.language);
    }

    if (newData.preferences) {
      if (newData.preferences.soundEffects !== undefined) {
        audioService.toggleMute(!newData.preferences.soundEffects);
      }
      if (newData.preferences.volume !== undefined) {
        audioService.setVolume(newData.preferences.volume);
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));

    const token = authTokenRef?.current ?? authToken;
    if (token) {
      api.updateUser(newData);
    }

    if (newData.notifications || newData.wakeTime || newData.sleepTime) {
      const water = hydrationApiRef.current?.getDailyWater?.() ?? 0;
      syncNotifications(updatedProfile, water);
    }
  };

  const calculateIdealGoal = () => calcIdealGoal(userProfileRef.current);

  const updateIdealGoal = async () => {
    const newGoal = calculateIdealGoal();
    updateUserProfile({ goal: newGoal });
  };

  return (
    <UserContext.Provider value={{
      userProfile,
      updateUserProfile,
      refreshUser,
      calculateIdealGoal,
      updateIdealGoal,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within UserProvider');
  }
  return ctx;
};
