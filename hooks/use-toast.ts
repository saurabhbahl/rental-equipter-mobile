/**
 * USE TOAST
 * Provides a simple "toast" that shows an alert dialog (title + optional description).
 * Currently implemented with Alert.alert(); you could replace this with a real toast library later.
 */
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

