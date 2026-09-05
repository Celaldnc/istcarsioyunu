import { StyleSheet } from 'react-native';

import { Text, View } from './Themed';

interface ScoreBadgeProps {
  readonly score: number;
  readonly label?: string;
}

/** Skor gostergesi. Ekran okuyucuya tek parca halinde okunur. */
export function ScoreBadge({ score, label = 'Skor' }: ScoreBadgeProps) {
  return (
    <View accessible accessibilityLabel={`${label}: ${score}`} style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{score.toLocaleString('tr-TR')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  label: { fontSize: 12, opacity: 0.6, textTransform: 'none' },
  value: { fontSize: 28, fontWeight: 'bold' },
});
