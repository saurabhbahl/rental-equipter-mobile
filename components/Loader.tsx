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

