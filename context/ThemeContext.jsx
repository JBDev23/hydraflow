import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../constants/theme.js';
import { useUser } from './UserContext';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();

  const { userProfile, updateUserProfile } = useUser();
  const preferences = userProfile?.preferences || {};

  const getThemeMode = () => {
    if (preferences.theme) return preferences.theme;
    return 'system';
  };

  const themeMode = getThemeMode();
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    let activeMode = themeMode;

    if (themeMode === 'system') {
      activeMode = systemScheme;
    }

    setTheme(activeMode === 'dark' ? darkTheme : lightTheme);
  }, [themeMode, systemScheme]);

  const toggleTheme = (newMode) => {
    updateUserProfile({
      preferences: {
        ...preferences,
        theme: newMode,
        darkMode: newMode === 'dark'
      }
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
