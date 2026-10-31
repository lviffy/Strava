import React from 'react';
import { StyleSheet, View, Text, TextStyle } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, typography } from '../../constants/theme';

export type MetricSize = 'hero' | 'large' | 'medium' | 'small';

interface MetricItemProps {
  label: string;
  value: string | number;
  unit?: string;
  size?: MetricSize;
  align?: 'left' | 'center' | 'right';
  icon?: React.ReactNode;
}

export function MetricItem({
  label,
  value,
  unit,
  size = 'medium',
  align = 'left',
  icon,
}: MetricItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  let valueStyle: TextStyle = typography.displayMedium;
  let labelStyle: TextStyle = typography.label;

  if (size === 'hero') {
    valueStyle = typography.displayHero;
  } else if (size === 'large') {
    valueStyle = typography.displayLarge;
  } else if (size === 'small') {
    valueStyle = { ...typography.heading3, fontWeight: '700' };
  }

  const alignmentStyle =
    align === 'center' ? styles.alignCenter : align === 'right' ? styles.alignRight : styles.alignLeft;

  return (
    <View style={[styles.container, alignmentStyle]}>
      <Text
        style={[styles.label, labelStyle, { color: colors.textSecondary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label.toUpperCase()}
      </Text>
      <View style={styles.valueRow}>
        <Text
          style={[styles.value, valueStyle, { color: colors.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        {unit ? (
          <Text style={[styles.unit, { color: colors.textSecondary }]}> {unit}</Text>
        ) : null}
        {icon ? <View style={{ marginLeft: 4 }}>{icon}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    width: '100%',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  label: {
    marginBottom: spacing.xs,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...typography.caption,
    fontWeight: '500',
  },
});
