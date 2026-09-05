import { Canvas, Path, Rect } from '@shopify/react-native-skia';
import { forwardRef } from 'react';
import { StyleSheet, Text as PlainText, View as PlainView } from 'react-native';

export const POSTCARD_TEST_ID = 'postcard-card';

export interface PostcardCardProps {
  /** "Eminönü" ya da "Rekor" gibi ust baslik. */
  readonly heading: string;
  readonly emoji: string;
  readonly score: number;
  /** Unvan (Cirak, Kalfa...) */
  readonly title: string;
  readonly dateText: string;
  readonly color: string;
}

const W = 320;
const H = 200;

/**
 * Istanbul silueti: Ayasofya/Sultanahmet kubbeleri, minareler, Galata,
 * Kiz Kulesi ve Bogaz Koprusu kulesi — tek bir kapali yol. Koordinatlar
 * 320x200 kart icin; oran korunur.
 */
export const SKYLINE_PATH = [
  `M 0 ${H}`,
  `L 0 150`,
  // Galata kulesi
  'L 24 150 L 24 96 L 20 96 L 30 78 L 40 96 L 36 96 L 36 150',
  'L 58 150',
  // minare
  'L 58 100 L 61 92 L 64 100 L 64 150',
  // kubbe (Sultanahmet)
  'L 76 150 L 76 132 Q 100 100 124 132 L 124 150',
  // minare
  'L 136 150 L 136 96 L 139 88 L 142 96 L 142 150',
  // buyuk kubbe (Ayasofya)
  'L 156 150 L 156 128 Q 190 92 224 128 L 224 150',
  // minare
  'L 236 150 L 236 100 L 239 92 L 242 100 L 242 150',
  // kopru kulesi + kablo
  'L 262 150 L 262 108 L 268 108 L 268 150 Q 290 126 312 150',
  // Kiz Kulesi
  'L 300 150 L 300 122 L 306 112 L 312 122 L 312 150',
  `L ${W} 150 L ${W} ${H} Z`,
].join(' ');

/**
 * Paylasilabilir kartpostal: skor + unvan + semt, altta Istanbul silueti.
 *
 * Yakalanabilmesi icin ref alir (react-native-view-shot). Metinler RN Text:
 * Skia'da yazi icin font dosyasi yuklemek gerekir; web'de CanvasKit'e font
 * vermeden metin cizilemez. Siluet Skia, yazi RN — ikisi de tek View'da.
 */
export const PostcardCard = forwardRef<PlainView, PostcardCardProps>(function PostcardCard(
  { heading, emoji, score, title, dateText, color },
  ref,
) {
  return (
    <PlainView
      ref={ref}
      collapsable={false}
      testID={POSTCARD_TEST_ID}
      accessible
      accessibilityLabel={`Kartpostal: ${heading}, ${score} puan, ${title}`}
      style={[styles.card, { backgroundColor: color }]}
    >
      <PlainView style={styles.header}>
        <PlainText style={styles.emoji}>{emoji}</PlainText>
        <PlainView style={styles.headerText}>
          <PlainText style={styles.heading}>{heading}</PlainText>
          <PlainText style={styles.sub}>{`İstanbul Çarşı Blok · ${dateText}`}</PlainText>
        </PlainView>
      </PlainView>

      <PlainText style={styles.score}>{score.toLocaleString('tr-TR')}</PlainText>
      <PlainText style={styles.title}>{`${title} · puan`}</PlainText>

      <Canvas style={styles.skyline}>
        <Rect x={0} y={0} width={W} height={H} color="#000000" opacity={0} />
        <Path path={SKYLINE_PATH} color="#000000" opacity={0.35} />
      </Canvas>
    </PlainView>
  );
});

const styles = StyleSheet.create({
  card: {
    width: W,
    height: H,
    borderRadius: 14,
    overflow: 'hidden',
    padding: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1 },
  emoji: { fontSize: 28 },
  heading: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  score: { color: '#FFFFFF', fontSize: 40, fontWeight: '900', marginTop: 6 },
  title: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  skyline: { position: 'absolute', left: 0, top: 0, width: W, height: H },
});
