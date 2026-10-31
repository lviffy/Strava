/**
 * Strava Design System Tokens
 * Strict athletic minimalism:
 * - 0 Drop shadows (shadowOpacity: 0, elevation: 0)
 * - 0 Gradients
 * - 1px crisp structural borders
 * - 8-point spacing grid
 * - High-contrast typography & tabular numbers
 */

export const Palette = {
  // Brand Athletic Accent
  orange: '#FC5200',
  orangeDark: '#D64600',
  orangeSubtleLight: '#FFF2EB',
  orangeSubtleDark: '#2A1308',

  // Status & Telemetry
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  gpsLocked: '#16A34A',
  gpsSearching: '#D97706',
  gpsLost: '#DC2626',
  routeBlue: '#2563EB',

  // Light Palette
  lightBg: '#F8F9FA',
  lightSurface: '#FFFFFF',
  lightSurfaceSecondary: '#F1F3F5',
  lightSurfaceSubtle: '#E9ECEF',
  lightBorder: '#E5E7EB',
  lightBorderSubtle: '#F0F2F5',
  lightBorderFocus: '#111827',
  lightTextPrimary: '#111827',
  lightTextSecondary: '#4B5563',
  lightTextMuted: '#9CA3AF',

  // Dark Palette
  darkBg: '#0F1012',
  darkSurface: '#18191C',
  darkSurfaceSecondary: '#222327',
  darkSurfaceSubtle: '#2B2D32',
  darkBorder: '#2E3036',
  darkBorderSubtle: '#24252A',
  darkBorderFocus: '#F9FAFB',
  darkTextPrimary: '#F9FAFB',
  darkTextSecondary: '#9CA3AF',
  darkTextMuted: '#6B7280',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceSubtle: string;
  border: string;
  borderSubtle: string;
  borderFocus: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  tint: string;
  tintSubtle: string;
  accent: string;
  tabIconDefault: string;
  tabIconSelected: string;
  card: string;
  cardBorder: string;
  cardSecondary: string;
  text: string;
  success: string;
  warning: string;
  error: string;
  gpsLocked: string;
  gpsSearching: string;
  gpsLost: string;
  routeColor: string;
}

export const lightTheme: ThemeColors = {
  background: Palette.lightBg,
  surface: Palette.lightSurface,
  surfaceSecondary: Palette.lightSurfaceSecondary,
  surfaceSubtle: Palette.lightSurfaceSubtle,
  border: Palette.lightBorder,
  borderSubtle: Palette.lightBorderSubtle,
  borderFocus: Palette.lightBorderFocus,
  textPrimary: Palette.lightTextPrimary,
  textSecondary: Palette.lightTextSecondary,
  textMuted: Palette.lightTextMuted,
  tint: Palette.orange,
  tintSubtle: Palette.orangeSubtleLight,
  accent: Palette.orange,
  tabIconDefault: Palette.lightTextMuted,
  tabIconSelected: Palette.orange,
  card: Palette.lightSurface,
  cardBorder: Palette.lightBorder,
  cardSecondary: Palette.lightSurfaceSecondary,
  text: Palette.lightTextPrimary,
  success: Palette.success,
  warning: Palette.warning,
  error: Palette.error,
  gpsLocked: Palette.gpsLocked,
  gpsSearching: Palette.gpsSearching,
  gpsLost: Palette.gpsLost,
  routeColor: Palette.routeBlue,
};

export const darkTheme: ThemeColors = {
  background: Palette.darkBg,
  surface: Palette.darkSurface,
  surfaceSecondary: Palette.darkSurfaceSecondary,
  surfaceSubtle: Palette.darkSurfaceSubtle,
  border: Palette.darkBorder,
  borderSubtle: Palette.darkBorderSubtle,
  borderFocus: Palette.darkBorderFocus,
  textPrimary: Palette.darkTextPrimary,
  textSecondary: Palette.darkTextSecondary,
  textMuted: Palette.darkTextMuted,
  tint: Palette.orange,
  tintSubtle: Palette.orangeSubtleDark,
  accent: Palette.orange,
  tabIconDefault: Palette.darkTextMuted,
  tabIconSelected: Palette.orange,
  card: Palette.darkSurface,
  cardBorder: Palette.darkBorder,
  cardSecondary: Palette.darkSurfaceSecondary,
  text: Palette.darkTextPrimary,
  success: Palette.success,
  warning: Palette.warning,
  error: Palette.error,
  gpsLocked: Palette.gpsLocked,
  gpsSearching: Palette.gpsSearching,
  gpsLost: Palette.gpsLost,
  routeColor: Palette.routeBlue,
};

export const theme = {
  light: lightTheme,
  dark: darkTheme,
};

export const typography = {
  displayHero: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '800' as const,
  },
  displayLarge: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800' as const,
  },
  displayMedium: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  heading1: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
  },
  heading2: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  heading3: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const borders = {
  thin: 1,
  thick: 2,
} as const;

/**
 * Strict Zero Drop Shadows:
 * All surfaces must use borders and tonal contrast.
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export default {
  theme,
  typography,
  spacing,
  radii,
  borders,
  shadows,
  Palette,
};
