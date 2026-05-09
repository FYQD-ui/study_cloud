import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { StudyThemeProvider, useStudyTheme } from '../src/theme/ThemeContext';

function RootStack() {
  const { colors, mode, ready } = useStudyTheme();

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: '返回',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleAlign: 'center',
          headerTitleStyle: {
            color: colors.text,
            fontSize: 17,
            fontWeight: '700',
          },
        }}>
        <Stack.Screen name="index" options={{ title: '学习资料' }} />
        <Stack.Screen name="add" options={{ title: '新增资料', presentation: 'card' }} />
        <Stack.Screen name="study/[id]" options={{ title: '资料详情' }} />
        <Stack.Screen name="study/[id]/edit" options={{ title: '编辑资料' }} />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <StudyThemeProvider>
      <RootStack />
    </StudyThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
