import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { BOARD } from '@/constants/config';
import { cellOrigin, type BoardLayout } from '@/game/core/layout';
import type { Board } from '@/game/core/types';
import { colorFor, type Theme } from '@/game/data/themes';

interface GameCanvasProps {
  readonly board: Board;
  readonly layout: BoardLayout;
  readonly theme: Theme;
}

/**
 * Tahtayi Skia ile cizer.
 *
 * Neden Skia: 8x10 = 80 hucre her karede yeniden cizilecek. RN View'lariyla
 * bu 80 ayri native gorunum demek; Skia'da tek bir GPU yuzeyi.
 *
 * Bu bilesen DURUM TUTMAZ ve oyun mantigi ICERMEZ; aldigi tahtayi ciz, o kadar.
 * Mantik src/game/core icinde ve oradan RN import etmek eslint ile yasak.
 */
export function GameCanvas({ board, layout, theme }: GameCanvasProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Oyun tahtası, ${BOARD.COLS} sütun ${BOARD.ROWS} satır`}
      style={[styles.container, { height: layout.height }]}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        {board.map((row, y) =>
          row.map((cell, x) => {
            const origin = cellOrigin(layout, x, y);

            return (
              <RoundedRect
                key={`${x}-${y}`}
                x={origin.x}
                y={origin.y}
                width={layout.cellSize}
                height={layout.cellSize}
                r={BOARD.CELL_RADIUS}
                color={cell === null ? theme.emptyCell : colorFor(theme, cell)}
              />
            );
          }),
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
});
