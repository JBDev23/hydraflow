import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../constants/theme';
import { useUser } from './UserContext';
import type { Theme, ThemeModePreference } from '../types';

export type ThemeContextValue = {
  theme: Theme;
  themeMode: ThemeModePreference;
  toggleTheme: (newMode: ThemeModePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const { userProfile, updateUserProfile } = useUser();
  const preferences = userProfile?.preferences || {};

  const getThemeMode = (): ThemeModePreference => {
    if (preferences.theme) return preferences.theme;
    return 'system';
  };

  const themeMode = getThemeMode();
  const [theme, setTheme] = useState<Theme>(lightTheme);

  useEffect(() => {
    let activeMode: string | null | undefined = themeMode;

    if (themeMode === 'system') {
      activeMode = systemScheme;
    }

    setTheme(activeMode === 'dark' ? darkTheme : lightTheme);
  }, [themeMode, systemScheme]);

  const toggleTheme = (newMode: ThemeModePreference) => {
    updateUserProfile({
      preferences: {
        ...preferences,
        theme: newMode,
        darkMode: newMode === 'dark',
      } as Partial<typeof preferences>,
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
