export type ThemeMode = 'light' | 'dark';
export type ThemeModePreference = ThemeMode | 'system';

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryMid: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  contrast: string;
  contrastLight: string;
  border: string;
  tint: string;
  transparentMain: string;
  semiTransparentMain: string;
};

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
  regular: string;
};
