/**
 * LOADER
 * A simple spinner (ActivityIndicator) used when something is loading (e.g. submitting the rental form).
 * Default size is small, default color is the app orange (#FF6B35).
 */

import { ActivityIndicator, StyleSheet } from 'react-native';

interface LoaderProps {
  size?: number | 'small' | 'large';
  color?: string;
}

export function Loader({ size = 'small', color = '#FF6B35' }: LoaderProps) {
  return (
    <ActivityIndicator size={size} color={color} />
  );
}

