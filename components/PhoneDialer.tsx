import { Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function formatUSPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  const normalized =
    digitsOnly.length === 11 && digitsOnly.startsWith('1')
      ? digitsOnly.slice(1)
      : digitsOnly;

  if (normalized.length === 10) {
    const area   = normalized.slice(0, 3);
    const prefix = normalized.slice(3, 6);
    const line   = normalized.slice(6, 10);
    return `(${area}) ${prefix}-${line}`;
  }

  return phone;
}

export function PhoneDialer({ phone }: { phone: string }) {
  const displayNumber = formatUSPhone(phone);
  
  const handlePress = () => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <MaterialIcons name="phone" size={20} color="#FF6B35" />
      <Text style={styles.text}>{displayNumber}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
});

