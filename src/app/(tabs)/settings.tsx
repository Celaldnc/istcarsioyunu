import { StyleSheet, Switch } from 'react-native';

import { Heading, Separator, Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useGameStore } from '@/game/store/gameStore';

export default function SettingsScreen() {
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const setSoundEnabled = useGameStore((state) => state.setSoundEnabled);
  const hapticsEnabled = useGameStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useGameStore((state) => state.setHapticsEnabled);
  const highScore = useGameStore((state) => state.highScore);
  const theme = Colors[useColorScheme()];

  return (
    <View style={styles.container}>
      <Heading>Ayarlar</Heading>
      <Separator />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Ses efektleri</Text>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          accessibilityLabel="Ses efektleri"
          accessibilityRole="switch"
          trackColor={{ true: theme.tint, false: theme.tabIconDefault }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Titreşim</Text>
        <Switch
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
          accessibilityLabel="Titreşim"
          accessibilityRole="switch"
          trackColor={{ true: theme.tint, false: theme.tabIconDefault }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>En iyi skor</Text>
        <Text style={styles.rowValue}>{highScore.toLocaleString('tr-TR')}</Text>
      </View>

      <Text style={styles.note}>{"Tema seçimi ve oyun modları Sprint 5'te eklenecek"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    // Material dokunma hedefi 48dp
    minHeight: 48,
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 16 },
  rowValue: { fontSize: 16, fontWeight: '600' },
  note: { fontSize: 13, opacity: 0.6, textAlign: 'center', marginTop: 24 },
});
