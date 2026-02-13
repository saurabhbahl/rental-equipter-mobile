/**
 * USE COLOR SCHEME (native)
 * Re-exports React Native's useColorScheme() so the app gets the device's light/dark preference.
 * On web we use use-color-scheme.web.ts instead, which waits for hydration before returning the scheme.
 */
export { useColorScheme } from 'react-native';
