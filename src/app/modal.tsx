import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { Heading, Separator, Text, View, useThemeColor } from '@/components/Themed';

interface Tip {
  readonly emoji: string;
  readonly title: string;
  readonly text: string;
}

/** Kisa, tarayabilir kurallar: oyuncu ekrani 20 saniyede kavrasin. */
const TIPS: readonly Tip[] = [
  {
    emoji: '🧱',
    title: 'Temel',
    text: 'Parçayı tahtaya sürükle. Dolu satır veya sütun temizlenir. Hiçbir parça sığmazsa oyun biter.',
  },
  {
    emoji: '🎨',
    title: 'Çini',
    text: 'Bir çizgi tek renkse +50. Aynı renkleri yan yana biriktir.',
  },
  {
    emoji: '🔗',
    title: 'Seri ve Makam',
    text: 'Üst üste temizle: çarpan büyür, her adım bir nota çalar. 8 notada makam tamamlanır.',
  },
  {
    emoji: '🥯',
    title: 'Sinerji',
    text: 'Simit + çay yan yana temizlenirse kahvaltı, lokum + fıstık ekstra puan.',
  },
  {
    emoji: '🐈',
    title: 'Tekir',
    text: 'Kedinin hücresine parça konmaz. Bitişik çizgi temizlenince taşınır. Dokun: 3 hamle yerinde kalır. Her 3. okşamada hediye getirir!',
  },
  {
    emoji: '🕊️',
    title: 'Martı',
    text: 'Bir sütuna konar, 2 hamle sonra o sütundan bir parça çalar. Sütununa simit koyarsan +30 alır gider.',
  },
  {
    emoji: '🧿',
    title: 'Nazar',
    text: 'Kararan hücreyi 6 hamlede temizle, yoksa yayılır. Nazar boncuğu komşuları korur. Temizlersen +60.',
  },
  {
    emoji: '🏮',
    title: 'Kapılar',
    text: 'Üst, alt, sol, sağ kenar çizgilerini temizle: fenerler yanar. Dördü yanınca Çarşı Şenliği: 3 hamle puan ×2.',
  },
  {
    emoji: '🤝',
    title: 'Pazarlık',
    text: 'Parçayı beğenmedin mi? Pazarlık: ibreyi yeşilde durdur. Tutturursan bedava değişir, kaçırırsan -30.',
  },
  {
    emoji: '☕',
    title: 'Çay molası',
    text: 'Oyun bitince bir kez ücretsiz: en dolu 2 satır + 2 sütun boşalır.',
  },
  {
    emoji: '🗺️',
    title: 'Yolculuk',
    text: 'Semt semt ilerle; şekilli tahtalar, Boğaz köprüsü, akıntı. Kartpostal topla, esnafları aç.',
  },
];

export default function AboutModalScreen() {
  const surface = useThemeColor({}, 'surface');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Heading>Nasıl oynanır?</Heading>
      <Text style={styles.subtitle}>
        {'İstanbul esnaf mahallesinden ilham alan bir blok bulmaca. Reklamsız, çevrimdışı.'}
      </Text>
      <Separator />

      {TIPS.map((tip) => (
        <View key={tip.title} style={[styles.tip, { backgroundColor: surface }]}>
          <Text style={styles.emoji}>{tip.emoji}</Text>
          <View style={styles.body}>
            <Text style={styles.title}>{tip.title}</Text>
            <Text style={styles.text}>{tip.text}</Text>
          </View>
        </View>
      ))}

      {/* iOS'ta modalin ustundeki siyah alan icin acik status bar */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10 },
  subtitle: { fontSize: 14, opacity: 0.7 },
  tip: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, alignItems: 'flex-start' },
  emoji: { fontSize: 22 },
  body: { flex: 1, backgroundColor: 'transparent', gap: 2 },
  title: { fontSize: 15, fontWeight: '700' },
  text: { fontSize: 13, opacity: 0.85 },
});
