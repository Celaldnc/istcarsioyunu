import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Heading, Text, View, useThemeColor } from '@/components/Themed';

export default function NotFoundScreen() {
  const linkColor = useThemeColor({}, 'link');

  return (
    <>
      <Stack.Screen options={{ title: 'Bulunamadı' }} />
      <View style={styles.container}>
        <Heading>Bu ekran bulunamadı.</Heading>

        <Link href="/" style={styles.link} accessibilityRole="link">
          <Text style={[styles.linkText, { color: linkColor }]}>Ana ekrana dön</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  // Material dokunma hedefi 48dp; yatay padding olmadan hedef yalnizca metin genisligi kadardi.
  link: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  linkText: { fontSize: 14 },
});
