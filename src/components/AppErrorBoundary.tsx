import type { ErrorBoundaryProps } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Heading, Text, View, useThemeColor } from './Themed';

/**
 * Uygulama genelinde beklenmedik hatalarda gosterilen ekran.
 *
 * expo-router'in varsayilan boundary'si tamamen Ingilizce ve stack trace
 * gosterir; tamamen Turkce bir uruncte kullanicinin production'da gorecegi
 * ekran budur. Teknik detay yalnizca gelistirme derlemesinde gosterilir.
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const linkColor = useThemeColor({}, 'link');

  return (
    <View style={styles.container}>
      <Heading>Bir şeyler ters gitti</Heading>
      <Text style={styles.body}>
        Uygulama beklenmedik bir hatayla karşılaştı. Tekrar denemek oyunu yeniden başlatır.
      </Text>

      <Pressable
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Tekrar dene"
        style={styles.action}
      >
        <Text style={[styles.actionText, { color: linkColor }]}>Tekrar dene</Text>
      </Pressable>

      {__DEV__ ? <Text style={styles.detail}>{error.message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  body: { fontSize: 14, opacity: 0.7, textAlign: 'center', marginTop: 12 },
  // Material dokunma hedefi 48dp
  action: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  actionText: { fontSize: 16, fontWeight: '600' },
  detail: { fontSize: 12, opacity: 0.5, marginTop: 24, textAlign: 'center' },
});
