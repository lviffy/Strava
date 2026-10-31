import { Palette, theme, ThemeColors } from './theme';

export const BrandColors: Record<string, string> = {
  primary: Palette.orange,
  primaryDark: Palette.orangeDark,
  primaryLight: Palette.orange,
  gpsGreen: Palette.gpsLocked,
  gpsYellow: Palette.gpsSearching,
  gpsRed: Palette.gpsLost,
  routeBlue: Palette.routeBlue,
  elevationOrange: Palette.orange,
  surfaceDark: Palette.darkSurface,
  surfaceCardDark: Palette.darkSurfaceSecondary,
  backgroundDark: Palette.darkBg,
  borderDark: Palette.darkBorder,
  textSecondaryDark: Palette.darkTextSecondary,
};

export type { ThemeColors };

export default theme;
