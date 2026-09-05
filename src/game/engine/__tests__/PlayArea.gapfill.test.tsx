import { act, render, screen } from '@testing-library/react-native';
import { DeviceEventEmitter } from 'react-native';
import { State } from 'react-native-gesture-handler';
import { getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { GHOST_TEST_ID } from '../GhostOverlay';
import { PLAY_PAN_TEST_ID, PlayArea } from '../PlayArea';

import { BOARD, LAYOUT, TRAY } from '@/constants/config';
import { createBoard, placePiece } from '@/game/core/board';
import { cellOrigin, computeBoardLayout, computeTrayLayout } from '@/game/core/layout';
import { shapeById } from '@/game/core/pieces';
import type { Piece } from '@/game/core/types';
import { CARSI } from '@/game/data/themes';

const WIDTH = 390;
const boardLayout = computeBoardLayout(WIDTH);
const trayLayout = computeTrayLayout(WIDTH);
const trayTop = boardLayout.height + LAYOUT.BOARD_TRAY_GAP;

const pieceOf = (id: string): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`sekil yok: ${id}`);
  }
  return { shape, colorId: 1 };
};

function trayTouch(index: number) {
  const rowWidth = trayLayout.slotWidth * TRAY.PIECE_COUNT + TRAY.SLOT_GAP * (TRAY.PIECE_COUNT - 1);
  const left = (WIDTH - rowWidth) / 2;
  return {
    x: left + index * (trayLayout.slotWidth + TRAY.SLOT_GAP) + trayLayout.slotWidth / 2,
    y: trayTop + trayLayout.height / 2,
  };
}

function boardTouch(piece: Piece, cellX: number, cellY: number) {
  const origin = cellOrigin(boardLayout, cellX, cellY);
  const step = boardLayout.cellSize + BOARD.CELL_GAP;
  return {
    x: origin.x + (piece.shape.width * step - BOARD.CELL_GAP) / 2,
    y: origin.y + 1.5 * boardLayout.cellSize + boardLayout.cellSize / 2,
  };
}

/**
 * fireGestureHandler her zaman bir END olayi ekler; bu yuzden "surukleme
 * DEVAM EDERKEN" ekrani gozlemek icin olaylar dogrudan yayinlanir.
 */
async function emitDrag(from: { x: number; y: number }, to: { x: number; y: number }) {
  const handlerTag = getByGestureTestId(PLAY_PAN_TEST_ID).handlerTag;
  const base = { handlerTag, numberOfPointers: 1, translationX: 0, translationY: 0 };

  await act(async () => {
    DeviceEventEmitter.emit('onGestureHandlerStateChange', {
      ...base,
      ...from,
      absoluteX: from.x,
      absoluteY: from.y,
      state: State.BEGAN,
      oldState: State.UNDETERMINED,
    });
    DeviceEventEmitter.emit('onGestureHandlerStateChange', {
      ...base,
      ...to,
      absoluteX: to.x,
      absoluteY: to.y,
      state: State.ACTIVE,
      oldState: State.BEGAN,
    });
    DeviceEventEmitter.emit('onGestureHandlerEvent', {
      ...base,
      ...to,
      absoluteX: to.x,
      absoluteY: to.y,
      state: State.ACTIVE,
    });
  });
}

describe('P1 surukleme sirasinda hayalet onizleme', () => {
  it('gecerli konumda hayalet parcanin hucre sayisi kadar cizilir', async () => {
    const piece = pieceOf('square');
    await render(
      <PlayArea
        board={createBoard()}
        tray={[piece]}
        width={WIDTH}
        theme={CARSI}
        onDrop={jest.fn()}
      />,
    );

    await emitDrag(trayTouch(0), boardTouch(piece, 3, 4));

    expect(screen.getByTestId(GHOST_TEST_ID)).toBeOnTheScreen();
    const rects = screen.getAllByTestId('skia-rounded-rect');
    const ghostRects = rects.filter((r) => r.props.color === CARSI.ghostValid);
    expect(ghostRects).toHaveLength(piece.shape.cells.length);
  });

  it('dolu hucrenin uzerinde hayalet UYARI rengiyle cizilir', async () => {
    const piece = pieceOf('dot');
    const occupied = placePiece(createBoard(), piece, { x: 3, y: 4 });
    await render(
      <PlayArea board={occupied} tray={[piece]} width={WIDTH} theme={CARSI} onDrop={jest.fn()} />,
    );

    await emitDrag(trayTouch(0), boardTouch(piece, 3, 4));

    const rects = screen.getAllByTestId('skia-rounded-rect');
    expect(rects.filter((r) => r.props.color === CARSI.ghostInvalid)).toHaveLength(1);
  });

  it('tahta disina cikildiginda hayalet gizlenir', async () => {
    const piece = pieceOf('dot');
    await render(
      <PlayArea
        board={createBoard()}
        tray={[piece]}
        width={WIDTH}
        theme={CARSI}
        onDrop={jest.fn()}
      />,
    );

    await emitDrag(trayTouch(0), { x: -400, y: -400 });

    expect(screen.queryByTestId(GHOST_TEST_ID)).toBeNull();
  });
});

async function emitEnd(to: { x: number; y: number }) {
  const handlerTag = getByGestureTestId(PLAY_PAN_TEST_ID).handlerTag;
  await act(async () => {
    DeviceEventEmitter.emit('onGestureHandlerStateChange', {
      handlerTag,
      numberOfPointers: 1,
      translationX: 0,
      translationY: 0,
      ...to,
      absoluteX: to.x,
      absoluteY: to.y,
      state: State.END,
      oldState: State.ACTIVE,
    });
  });
}

describe('P2 surukleme sirasinda tepsi yenilenirse', () => {
  it('yuva bosalirsa hayalet gizlenir ve birakma yok sayilir', async () => {
    const piece = pieceOf('dot');
    const onDrop = jest.fn();
    const view = await render(
      <PlayArea board={createBoard()} tray={[piece]} width={WIDTH} theme={CARSI} onDrop={onDrop} />,
    );

    await emitDrag(trayTouch(0), boardTouch(piece, 3, 4));
    expect(screen.getByTestId(GHOST_TEST_ID)).toBeOnTheScreen();

    // Surukleme surerken tepsi degisti (or. yeni oyun / geri yukleme).
    // rerender RTL v14'te asenkron; act sarmalayicisina gerek yok.
    await view.rerender(
      <PlayArea
        board={createBoard()}
        tray={[undefined]}
        width={WIDTH}
        theme={CARSI}
        onDrop={onDrop}
      />,
    );

    expect(screen.queryByTestId(GHOST_TEST_ID)).toBeNull();

    await emitEnd(boardTouch(piece, 3, 4));

    expect(onDrop).not.toHaveBeenCalled();
  });
});

describe('P3 onDrop cagri sayisi', () => {
  it('tek surukleme tek onDrop uretir', async () => {
    const piece = pieceOf('dot');
    const onDrop = jest.fn();
    await render(
      <PlayArea board={createBoard()} tray={[piece]} width={WIDTH} theme={CARSI} onDrop={onDrop} />,
    );

    await emitDrag(trayTouch(0), boardTouch(piece, 3, 4));
    await emitEnd(boardTouch(piece, 3, 4));

    expect(onDrop).toHaveBeenCalledTimes(1);
  });
});
