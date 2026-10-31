import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, borders } from '../../constants/theme';

interface MetricGridProps extends ViewProps {
  children: React.ReactNode;
  bordered?: boolean;
}

export function MetricGrid({ children, bordered = true, style, ...props }: MetricGridProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const items = React.Children.toArray(children);

  return (
    <View
      style={[
        styles.grid,
        bordered && [styles.bordered, { borderColor: colors.borderSubtle }],
        style,
      ]}
      {...props}
    >
      {items.map((child, index) => (
        <React.Fragment key={index}>
          <View style={styles.column}>{child}</View>
          {index < items.length - 1 && (
            <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  bordered: {
    borderTopWidth: borders.thin,
    borderBottomWidth: borders.thin,
    marginVertical: spacing.sm,
  },
  column: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: spacing.sm,
  },
});
