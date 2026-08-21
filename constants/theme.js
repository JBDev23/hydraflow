const PALETTE = {
  blueLight: '#79D8FE',
  blueMid: '#7AACFE',
  blueDark: '#6989E2',
  black: '#000000',
  gold: '#FFD700',
  white: '#FFFFFF',
  lightWhite: 'rgba(255, 255, 255, 0.6)',
  black: '#120E1E',
  grayLight: '#EEEEEE',
  grayMedium: '#B9B9B9',
  grayDark: 'rgba(0,0,0,0.6)',
  darkSurface: '#1D172E',
  purpleLight: "#D9B8FF",
  purpleMid: "#B185FF",
  purpleDark: "#8357DE"
};

export const FONTS = {
  regular: 'Aldrich_400Regular',
};

export const lightTheme = {
  mode: 'light',
  colors: {
    primary: PALETTE.blueLight,
    primaryDark: PALETTE.blueDark,
    primaryMid: PALETTE.blueMid,
    background: PALETTE.white,
    surface: PALETTE.white,      
    text: PALETTE.black,      
    textSecondary: PALETTE.grayDark,
    textTertiary: PALETTE.grayMedium,
    contrast: PALETTE.white,
    contrastLight: PALETTE.lightWhite,
    border: PALETTE.grayLight,
    tint: PALETTE.white,
    transparentMain: "rgba(0,0,0,0.08)",
    semiTransparentMain: "rgba(0,0,0,0.7)"
  },
  ...FONTS
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    primary: PALETTE.purpleLight,
    primaryDark: PALETTE.purpleDark,
    primaryMid: PALETTE.purpleMid,
    background: PALETTE.black,
    surface: PALETTE.darkSurface,      
    text: PALETTE.white,      
    textSecondary: PALETTE.grayLight,
    textTertiary: PALETTE.grayMedium,
    contrast: PALETTE.black,
    contrastLight: PALETTE.grayDark,
    border: PALETTE.white,
    tint: PALETTE.black,
    transparentMain: "rgba(255,255,255,0.08)",
     semiTransparentMain: "rgba(255,255,255,0.7)"
  },
  ...FONTS
};