import { Canvas, Circle, Group, Rect } from '@shopify/react-native-skia';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { burstParticles, type Particle } from './burstParticles';

import { FX } from '@/constants/config';
import { cellOrigin, type BoardLayout } from '@/game/core/layout';
import type { FullLines } from '@/game/core/types';
import { colorFor, type Theme } from '@/game/data/themes';

export const CLEAR_BURST_TEST_ID = 'clear-burst';

interface ClearBurstProps {
  /** Son hamlede temizlenen cizgiler. Bos ise hicbir sey cizilmez. */
  readonly lines: FullLines;
  /**
   * Hamle kimligi. Degistiginde (ve lines doluysa) patlama yeniden
   * tetiklenir. lines nesnesinin kimligi her render'da degisebilecegi icin
   * tetikleyici olarak kullanilamaz.
   */
  readonly token: string;
  readonly layout: BoardLayout;
  readonly theme: Theme;
}

interface Burst {
  readonly token: string;
  readonly lines: FullLines;
  readonly particles: readonly Particle[];
}

/** Dizgeden deterministik bir tohum (ayni hamle ayni patlama). */
function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Temizleme "juice"i: temizlenen cizgiler beyaz parlar, hucrelerden tema
 * renginde kiriklar ucusur.
 *
 * Block Blast analizlerinde tutunmayi getiren sey kural degil, bu tur
 * abartili geri bildirim. Ayri bir Skia tuvali: tahta tuvali memo'lu ve
 * animasyon yuzunden 80 hucreyi yeniden diff'lememeli.
 *
 * Animasyon UI thread'inde (Reanimated shared value -> Skia prop); JS
 * thread'i yalnizca baslangicta parcacik listesini uretir.
 */
export function ClearBurst({ lines, token, layout, theme }: ClearBurstProps) {
  const progress = useSharedValue(1);
  const [burst, setBurst] = useState<Burst | null>(null);
  const lastToken = useRef<string | null>(null);

  useEffect(() => {
    if (lastToken.current === token || lines.rows.length + lines.cols.length === 0) {
      return undefined;
    }
    lastToken.current = token;

    setBurst({ token, lines, particles: burstParticles(lines, layout, hashToken(token)) });
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: FX.CLEAR_BURST_MS,
      easing: Easing.out(Easing.quad),
    });

    // Bitince tuval kaldirilir: bos bir Skia yuzeyi bile her karede cizilir.
    const timer = setTimeout(() => setBurst(null), FX.CLEAR_BURST_MS + 50);
    return () => clearTimeout(timer);
  }, [token, lines, layout, progress]);

  const flashOpacity = useDerivedValue(() => (1 - progress.value) * 0.85);

  if (burst === null) {
    return null;
  }

  return (
    <View style={[styles.overlay, { height: layout.height }]} testID={CLEAR_BURST_TEST_ID}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group opacity={flashOpacity}>
          {burst.lines.rows.map((y) => (
            <Rect
              key={`r${y}`}
              x={layout.originX}
              y={cellOrigin(layout, 0, y).y}
              width={layout.width}
              height={layout.cellSize}
              color={theme.flash}
            />
          ))}
          {burst.lines.cols.map((x) => (
            <Rect
              key={`c${x}`}
              x={cellOrigin(layout, x, 0).x}
              y={0}
              width={layout.cellSize}
              height={layout.height}
              color={theme.flash}
            />
          ))}
        </Group>
        {burst.particles.map((particle, index) => (
          <Shard
            key={`${burst.token}-${index}`}
            particle={particle}
            progress={progress}
            color={colorFor(theme, particle.colorId)}
          />
        ))}
      </Canvas>
    </View>
  );
}

interface ShardProps {
  readonly particle: Particle;
  readonly progress: SharedValue<number>;
  readonly color: string;
}

/** Tek bir "cini kirigi": disari ucar, kuculur, solar. */
function Shard({ particle, progress, color }: ShardProps) {
  const cx = useDerivedValue(() => particle.x + particle.dx * progress.value);
  // progress^2: once hizli, sonra yavaslayan dogal bir savrulma.
  const cy = useDerivedValue(
    () => particle.y + particle.dy * progress.value * (0.6 + 0.4 * progress.value),
  );
  const r = useDerivedValue(() => particle.size * (1 - progress.value * 0.6));
  const opacity = useDerivedValue(() => 1 - progress.value);

  return (
    <Group opacity={opacity}>
      <Circle cx={cx} cy={cy} r={r} color={color} />
    </Group>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, pointerEvents: 'none' },
});
