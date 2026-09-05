import { Pressable, ScrollView, StyleSheet, Switch } from 'react-native';

import { Heading, Separator, Text, View, useThemeColor } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { linesToNextTitle, titleFor } from '@/game/core/titles';
import { ESNAFLAR, isEsnafUnlocked } from '@/game/data/esnaflar';
import { useGameStore } from '@/game/store/gameStore';

export default function SettingsScreen() {
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const setSoundEnabled = useGameStore((state) => state.setSoundEnabled);
  const hapticsEnabled = useGameStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useGameStore((state) => state.setHapticsEnabled);
  const highScore = useGameStore((state) => state.highScore);
  const stats = useGameStore((state) => state.stats);
  const postcards = useGameStore((state) => state.postcards);
  const selectedEsnafId = useGameStore((state) => state.selectedEsnafId);
  const setEsnaf = useGameStore((state) => state.setEsnaf);
  const theme = Colors[useColorScheme()];
  const surface = useThemeColor({}, 'surface');
  const accent = useThemeColor({}, 'accent');

  const title = titleFor(stats);
  const toNext = linesToNextTitle(stats);

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Unvan</Text>
        <Text style={[styles.rowValue, { color: accent }]}>
          {toNext === null ? title.name : `${title.name} · sonrakine ${toNext} çizgi`}
        </Text>
      </View>

      <Separator />
      <Text style={styles.section}>Esnaf</Text>
      <Text style={styles.note}>Kim olarak oynuyorsun? Perk’ler yeni oyunda uygulanır.</Text>

      {ESNAFLAR.map((esnaf) => {
        const unlocked = isEsnafUnlocked(esnaf, postcards);
        const selected = esnaf.id === selectedEsnafId;
        return (
          <Pressable
            key={esnaf.id}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: !unlocked }}
            accessibilityLabel={`${esnaf.name}${unlocked ? '' : ', kilitli'}`}
            disabled={!unlocked}
            onPress={() => setEsnaf(esnaf.id)}
            style={[
              styles.esnaf,
              { backgroundColor: surface, opacity: unlocked ? 1 : 0.45 },
              selected ? { borderColor: theme.tint, borderWidth: 2 } : null,
            ]}
          >
            <Text style={styles.esnafEmoji}>{unlocked ? esnaf.emoji : '🔒'}</Text>
            <View style={styles.esnafBody}>
              <Text style={styles.esnafName}>{esnaf.name}</Text>
              <Text style={styles.esnafPerk}>
                {unlocked ? esnaf.perkText : `${esnaf.unlockLevelId} kartpostalıyla açılır`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    // Material dokunma hedefi 48dp
    minHeight: 48,
    paddingVertical: 8,
    gap: 12,
  },
  rowLabel: { fontSize: 16 },
  rowValue: { fontSize: 16, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  note: { fontSize: 13, opacity: 0.6, marginBottom: 8 },
  esnaf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 12,
    minHeight: 60,
    marginBottom: 8,
  },
  esnafEmoji: { fontSize: 26 },
  esnafBody: { flex: 1, backgroundColor: 'transparent' },
  esnafName: { fontSize: 15, fontWeight: '700' },
  esnafPerk: { fontSize: 12, opacity: 0.75 },
});
