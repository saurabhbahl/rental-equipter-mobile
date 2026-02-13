/**
 * USE COLOR SCHEME (web)
 * On web, we need to wait until the app has "hydrated" (JavaScript has run) before reading the color scheme.
 * Otherwise we might get a mismatch between server-rendered HTML and client. Returns 'light' until then.
 */
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
