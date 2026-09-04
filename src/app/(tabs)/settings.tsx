import { StyleSheet } from 'react-native';

import { Heading, Separator, Text, View } from '@/components/Themed';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Heading>Ayarlar</Heading>
      <Separator />
      <Text style={styles.subtitle}>{"Ses, tema ve tercihler Sprint 5'te eklenecek"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
});
