import React from 'react';
import { StyleSheet, View, ViewProps, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../useColorScheme';
import theme from '../../constants/theme';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  safeBottom?: boolean;
}

export function ScreenContainer({
  children,
  style,
  safeBottom = true,
  ...props
}: ScreenContainerProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.content, { backgroundColor: colors.background }, style]} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
