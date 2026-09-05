import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { BOARD } from '@/constants/config';
import { cellOrigin, type BoardLayout } from '@/game/core/layout';
import type { Point } from '@/game/core/types';
import type { Theme } from '@/game/data/themes';

export const GHOST_TEST_ID = 'drag-ghost';

interface GhostOverlayProps {
  /** Parcanin kaplayacagi hucreler. */
  readonly cells: readonly Point[];
  /** Yerlestirme kabul edilir mi? Renk buna gore secilir. */
  readonly valid: boolean;
  readonly layout: BoardLayout;
  readonly theme: Theme;
}

/**
 * Surukleme sirasinda tahtanin uzerinde gosterilen yerlestirme onizlemesi.
 *
 * Gecersiz konumda da cizilir (kirmizi): oyuncunun neden kabul edilmedigini
 * gormesi, parcanin sessizce geri donmesinden iyidir.
 */
export function GhostOverlay({ cells, valid, layout, theme }: GhostOverlayProps) {
  return (
    <View style={[styles.overlay, { height: layout.height }]} testID={GHOST_TEST_ID}>
      <Canvas style={StyleSheet.absoluteFill}>
        {cells.map((cell) => {
          const origin = cellOrigin(layout, cell.x, cell.y);

          return (
            <RoundedRect
              key={`${cell.x}-${cell.y}`}
              x={origin.x}
              y={origin.y}
              width={layout.cellSize}
              height={layout.cellSize}
              r={BOARD.CELL_RADIUS}
              opacity={0.65}
              color={valid ? theme.ghostValid : theme.ghostInvalid}
            />
          );
        })}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  // pointerEvents style icinde: props olarak vermek RN 0.86'da deprecated.
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, pointerEvents: 'none' },
});
