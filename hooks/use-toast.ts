import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export function useToast() {
  const toast = useCallback(({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    Alert.alert(
      title,
      description,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  }, []);

  return { toast };
}

