import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { Text, View } from '@/components/Themed';
import { BOARD } from '@/constants/config';
import { canPlace, createBoard, placePiece } from '@/game/core/board';
import { computeBoardLayout, computeTrayLayout } from '@/game/core/layout';
import { generatePieceSet } from '@/game/core/pieces';
import { createRng } from '@/game/core/rng';
import type { Board, Piece, Point } from '@/game/core/types';
import { DEFAULT_THEME } from '@/game/data/themes';
import { GameCanvas } from '@/game/engine/GameCanvas';
import { PieceTray } from '@/game/engine/PieceTray';

/**
 * TODO(sprint-3): Bu ekranin durumu Zustand store'una tasinacak ve parcalar
 * surukle-birak ile yerlestirilecek. Su anki sabit seed'li onizleme, render
 * katmanini (Skia + layout + tema) gercek veriyle dogrulamak icin var.
 */
const PREVIEW_SEED = 20260905;

/** Tahtanin altindan baslayarak parcanin sigdigi ilk konumu bulur. */
function firstFit(board: Board, piece: Piece): Point | null {
  for (let y = BOARD.ROWS - 1; y >= 0; y -= 1) {
    for (let x = 0; x < BOARD.COLS; x += 1) {
      if (canPlace(board, piece, { x, y })) {
        return { x, y };
      }
    }
  }
  return null;
}

function buildPreview(): { board: Board; tray: Piece[] } {
  const rng = createRng(PREVIEW_SEED);
  const [...placeable] = generatePieceSet(rng, 5);
  const tray = generatePieceSet(rng);

  const board = placeable.reduce<Board>((current, piece) => {
    const origin = firstFit(current, piece);
    return origin === null ? current : placePiece(current, piece, origin);
  }, createBoard());

  return { board, tray };
}

export default function PlayScreen() {
  const { width } = useWindowDimensions();

  const boardLayout = useMemo(() => computeBoardLayout(width), [width]);
  const trayLayout = useMemo(() => computeTrayLayout(width), [width]);
  const preview = useMemo(() => buildPreview(), []);

  return (
    <View style={styles.container}>
      <GameCanvas board={preview.board} layout={boardLayout} theme={DEFAULT_THEME} />

      <PieceTray pieces={preview.tray} layout={trayLayout} theme={DEFAULT_THEME} />

      <Text style={styles.hint}>{"Sürükle-bırak Sprint 3'te gelecek"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  hint: { fontSize: 13, opacity: 0.6, textAlign: 'center' },
});
