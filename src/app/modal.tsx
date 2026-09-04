import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function AboutModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hakkında</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
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
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
  separator: { marginVertical: 24, height: 1, width: '80%' },
});
