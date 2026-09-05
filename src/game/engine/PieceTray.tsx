import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { BOARD, TRAY } from '@/constants/config';
import { pieceSize, type TrayLayout } from '@/game/core/layout';
import type { Piece } from '@/game/core/types';
import { shapeLabel } from '@/game/data/shapeLabels';
import { colorFor, type Theme } from '@/game/data/themes';

interface PieceTrayProps {
  /** Tepsideki parcalar. Kullanilmis yuvalar undefined kalir. */
  readonly pieces: readonly (Piece | undefined)[];
  readonly layout: TrayLayout;
  readonly theme: Theme;
}

interface TraySlotProps {
  readonly piece: Piece | undefined;
  readonly index: number;
  readonly layout: TrayLayout;
  readonly theme: Theme;
}

function TraySlot({ piece, index, layout, theme }: TraySlotProps) {
  const slotStyle = { width: layout.slotWidth, height: layout.height };

  if (piece === undefined) {
    return (
      <View
        accessibilityLabel={`${index + 1}. yuva boş`}
        accessible
        style={[styles.slot, slotStyle]}
      />
    );
  }

  const size = pieceSize(layout.cellSize, piece.shape.width, piece.shape.height);
  // Parca yuvanin ortasina hizalanir; aksi halde kucuk parcalar sola yapisirdi.
  const offsetX = (layout.slotWidth - size.width) / 2;
  const offsetY = (layout.height - size.height) / 2;
  const step = layout.cellSize + TRAY.CELL_GAP;

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${index + 1}. parça: ${shapeLabel(piece.shape.id)}`}
      style={[styles.slot, slotStyle]}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        {piece.shape.cells.map((cell) => (
          <RoundedRect
            key={`${cell.x}-${cell.y}`}
            x={offsetX + cell.x * step}
            y={offsetY + cell.y * step}
            width={layout.cellSize}
            height={layout.cellSize}
            r={BOARD.CELL_RADIUS}
            color={colorFor(theme, piece.colorId)}
          />
        ))}
      </Canvas>
    </View>
  );
}

/**
 * Tepside bekleyen parcalarin onizlemesi.
 *
 * Yuva sayisi sabittir (TRAY.PIECE_COUNT): bir parca kullanildiginda yuva
 * bosalir ama yerini korur, boylece tepsi yerlesimi hamle sirasinda zipla-
 * mamis olur.
 */
export function PieceTray({ pieces, layout, theme }: PieceTrayProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: TRAY.PIECE_COUNT }, (_, index) => (
        <TraySlot key={index} index={index} piece={pieces[index]} layout={layout} theme={theme} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: TRAY.SLOT_GAP,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
