/**
 * ROOT LAYOUT (_layout.tsx)
 * This is the main layout for the whole app. It wraps every screen with shared providers.
 * - SafeAreaProvider: makes content avoid the notch and status bar
 * - QueryClientProvider: used for React Query (API data caching) if needed
 * - AppContextProvider: our app's global state (e.g. equipment models)
 * - ThemeProvider: light/dark theme for navigation
 * - Stack: defines the list of screens (index = home, rental = form, modal)
 */

// Import crypto polyfill FIRST - must be before any other imports that use crypto
import 'react-native-get-random-values';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppContextProvider } from '@/context/AppContext';

// One shared client for all React Query requests
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppContextProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="rental" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
          </ThemeProvider>
        </AppContextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
