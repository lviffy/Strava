export const BrandColors = {
  primary: '#FC5200',        // Strava iconic orange
  primaryDark: '#E04800',
  primaryLight: '#FF6B26',
  gpsGreen: '#00D084',       // Excellent GPS lock
  gpsYellow: '#FFB800',      // Fair GPS / Paused
  gpsRed: '#FF3B30',         // Poor GPS / Discard
  routeBlue: '#007AFF',      // Polyline line
  elevationOrange: '#FF9500',
  surfaceDark: '#1C1C1E',
  surfaceCardDark: '#2C2C2E',
  backgroundDark: '#121214',
  borderDark: '#38383A',
  textSecondaryDark: '#98989F',
};

export default {
  light: {
    text: '#1C1C1E',
    background: '#F8F9FA',
    tint: BrandColors.primary,
    tabIconDefault: '#8E8E93',
    tabIconSelected: BrandColors.primary,
    card: '#FFFFFF',
    cardBorder: '#E5E5EA',
    textSecondary: '#666668',
  },
  dark: {
    text: '#FFFFFF',
    background: BrandColors.backgroundDark,
    tint: BrandColors.primary,
    tabIconDefault: '#636366',
    tabIconSelected: BrandColors.primary,
    card: BrandColors.surfaceDark,
    cardBorder: BrandColors.borderDark,
    textSecondary: BrandColors.textSecondaryDark,
  },
};
