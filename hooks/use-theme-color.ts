/**
 * USE THEME COLOR
 * Returns the right color for the current theme (light or dark). Used by ThemedText and ThemedView.
 * - Pass a colorName from theme (e.g. 'text', 'background', 'icon') to get the theme's value.
 * - Optionally pass light/dark in props to override for this use (e.g. lightColor="#fff").
 * See: https://docs.expo.dev/guides/color-schemes/
 */
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
