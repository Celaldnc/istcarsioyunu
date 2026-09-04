import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { BOARD } from '@/constants/config';

export default function PlayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>İstanbul Çarşı Blok</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.subtitle}>
        {`Tahta ${BOARD.COLS}×${BOARD.ROWS} — oyun tahtası Sprint 2'de çizilecek`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
  separator: { marginVertical: 24, height: 1, width: '80%' },
});
