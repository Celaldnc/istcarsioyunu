import { StyleSheet } from 'react-native';

import { Heading, Separator, Text, View } from '@/components/Themed';
import { BOARD } from '@/constants/config';

export default function PlayScreen() {
  return (
    <View style={styles.container}>
      <Heading>İstanbul Çarşı Blok</Heading>
      <Separator />
      <Text style={styles.subtitle}>
        {`Tahta ${BOARD.COLS}×${BOARD.ROWS} — oyun tahtası Sprint 2'de çizilecek`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
});
