import { Canvas } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { CellSprite } from './CellSprite';

import { BOARD } from '@/constants/config';
import type { BoardLayout } from '@/game/core/layout';
import { dragPixelOrigin } from '@/game/core/placement';
import type { Piece, Point } from '@/game/core/types';
import type { Theme } from '@/game/data/themes';

export const DRAG_PIECE_TEST_ID = 'drag-piece';

interface DragPieceProps {
  readonly piece: Piece;
  /** Parmagin oyun alanina gore konumu. */
  readonly pointer: Point;
  readonly layout: BoardLayout;
  readonly theme: Theme;
}

/**
 * Suruklenen parcayi parmagin konumunda cizer.
 *
 * NEDEN GEREKLI: Yalnizca tahtadaki hayalet cizilirken, oyuncu parmagini
 * tepsiden kaldirdigi andan tahtaya girene kadar ELINDE NE TUTTUGUNU
 * GOREMIYORDU. Kenarlarda parca yarim tastiginda hayalet tamamen kayboluyor
 * ve hicbir geri bildirim kalmiyordu.
 *
 * Konum hesabi core'daki dragPixelOrigin ile PAYLASILIR; ayri hesaplamak
 * parcanin hayaletten kaymasina yol acardi.
 */
export function DragPiece({ piece, pointer, layout, theme }: DragPieceProps) {
  const origin = dragPixelOrigin(layout, pointer, piece);
  const step = layout.cellSize + BOARD.CELL_GAP;

  return (
    <View style={styles.overlay} testID={DRAG_PIECE_TEST_ID}>
      <Canvas style={StyleSheet.absoluteFill}>
        {piece.shape.cells.map((cell) => (
          <CellSprite
            key={`${cell.x}-${cell.y}`}
            x={origin.x + cell.x * step}
            y={origin.y + cell.y * step}
            size={layout.cellSize}
            colorId={piece.colorId}
            theme={theme}
            opacity={0.9}
          />
        ))}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  // pointerEvents style icinde: props olarak vermek RN 0.86'da deprecated.
  // Tum oyun alanini kaplar: parca tepsiden tahtaya giderken kesilmemeli.
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
