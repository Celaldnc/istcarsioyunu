import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import { Heading, Separator, Text, View } from '@/components/Themed';

export default function AboutModalScreen() {
  return (
    <View style={styles.container}>
      <Heading>Hakkında</Heading>
      <Separator />
      <Text style={styles.subtitle}>
        {'İstanbul esnaf mahallesinden ilham alan bir blok bulmaca oyunu.'}
      </Text>

      {/* iOS'ta modalin ustundeki siyah alan icin acik status bar */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
});
