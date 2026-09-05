import { act, render, screen } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

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
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId: 1 };
};

/** Verilen tepsi yuvasinin merkezindeki dokunus noktasi. */
function trayTouch(index: number) {
  const rowWidth = trayLayout.slotWidth * TRAY.PIECE_COUNT + TRAY.SLOT_GAP * (TRAY.PIECE_COUNT - 1);
  const left = (WIDTH - rowWidth) / 2;

  return {
    x: left + index * (trayLayout.slotWidth + TRAY.SLOT_GAP) + trayLayout.slotWidth / 2,
    y: trayTop + trayLayout.height / 2,
  };
}

/** Parcanin verilen hucreye oturmasi icin gereken parmak konumu. */
function boardTouch(piece: Piece, cellX: number, cellY: number) {
  const origin = cellOrigin(boardLayout, cellX, cellY);
  const step = boardLayout.cellSize + BOARD.CELL_GAP;

  return {
    x: origin.x + (piece.shape.width * step - BOARD.CELL_GAP) / 2,
    y: origin.y + 1.5 * boardLayout.cellSize + boardLayout.cellSize / 2,
  };
}

/**
 * Bir surukleme dizisi uretir.
 *
 * RNGH jest-utils'te State.ACTIVE onStart'i tetikler; onUpdate icin state
 * ALANI OLMAYAN ek bir olay gerekir. Bu ayrimi kacirmak, testin baslangic
 * koordinatlarini bitis koordinati sanmasina yol acar.
 */
const dragEvents = (from: { x: number; y: number }, to: { x: number; y: number }) => [
  { state: State.BEGAN, ...from },
  { state: State.ACTIVE, ...from },
  { ...to },
  { state: State.END, ...to },
];

const mountArea = async (tray: readonly (Piece | undefined)[], onDrop = jest.fn()) => {
  await render(
    <PlayArea board={createBoard()} tray={tray} width={WIDTH} theme={CARSI} onDrop={onDrop} />,
  );
  return onDrop;
};

describe('PlayArea', () => {
  it('tahtayi ve tepsiyi birlikte cizer', async () => {
    await mountArea([pieceOf('dot')]);

    expect(screen.getByLabelText(/Oyun tahtası/)).toBeOnTheScreen();
    expect(screen.getByLabelText('1. parça: tek kare')).toBeOnTheScreen();
  });

  it('surukleme yokken hayalet gostermez', async () => {
    await mountArea([pieceOf('dot')]);

    expect(screen.queryByTestId('drag-ghost')).toBeNull();
  });

  it('tepsiden suruklenip tahtaya birakilinca onDrop cagrilir', async () => {
    const piece = pieceOf('dot');
    const onDrop = await mountArea([piece]);
    const target = boardTouch(piece, 3, 4);

    // act sarmalayicisi sart: hareket callback'leri setState cagiriyor ve
    // React guncellemeleri aksi halde test bittikten sonra flush oluyor.
    await act(async () => {
      fireGestureHandler(getByGestureTestId(PLAY_PAN_TEST_ID), dragEvents(trayTouch(0), target));
    });

    expect(onDrop).toHaveBeenCalledWith(0, { x: 3, y: 4 });
  });

  it('tahtanin disina birakilirsa onDrop cagrilmaz', async () => {
    const piece = pieceOf('dot');
    const onDrop = await mountArea([piece]);

    await act(async () => {
      fireGestureHandler(
        getByGestureTestId(PLAY_PAN_TEST_ID),
        dragEvents(trayTouch(0), { x: -400, y: -400 }),
      );
    });

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('tahtaya dokunarak surukleme baslatilamaz', async () => {
    const piece = pieceOf('dot');
    const onDrop = await mountArea([piece]);
    const target = boardTouch(piece, 3, 4);

    await act(async () => {
      fireGestureHandler(
        getByGestureTestId(PLAY_PAN_TEST_ID),
        dragEvents({ x: boardLayout.originX + 10, y: 10 }, target),
      );
    });

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('bos yuvadan surukleme baslatilamaz', async () => {
    const piece = pieceOf('dot');
    const onDrop = await mountArea([undefined, piece]);
    const target = boardTouch(piece, 3, 4);

    // act sarmalayicisi sart: hareket callback'leri setState cagiriyor ve
    // React guncellemeleri aksi halde test bittikten sonra flush oluyor.
    await act(async () => {
      fireGestureHandler(getByGestureTestId(PLAY_PAN_TEST_ID), dragEvents(trayTouch(0), target));
    });

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("dolu hucrenin ustune birakmada onDrop yine cagrilir; kabul karari store'a aittir", async () => {
    const piece = pieceOf('dot');
    const onDrop = jest.fn();
    const occupied = placePiece(createBoard(), piece, { x: 3, y: 4 });

    await render(
      <PlayArea board={occupied} tray={[piece]} width={WIDTH} theme={CARSI} onDrop={onDrop} />,
    );

    const target = boardTouch(piece, 3, 4);
    // act sarmalayicisi sart: hareket callback'leri setState cagiriyor ve
    // React guncellemeleri aksi halde test bittikten sonra flush oluyor.
    await act(async () => {
      fireGestureHandler(getByGestureTestId(PLAY_PAN_TEST_ID), dragEvents(trayTouch(0), target));
    });

    // dragOrigin gecerli bir hucre verir; kabul/ret karari cagirana aittir,
    // bu yuzden onDrop cagrilir ama store hamleyi reddeder.
    expect(onDrop).toHaveBeenCalledWith(0, { x: 3, y: 4 });
  });
});

describe('PlayArea dikey alan siniri', () => {
  it('maxHeight verilmezse tahta tam boyutta cizilir', async () => {
    await mountArea([pieceOf('dot')]);

    const rects = screen.getAllByTestId('skia-rounded-rect');
    expect(rects[0]?.props.width).toBe(boardLayout.cellSize);
  });

  it('dar dikey alanda hucreler kuculur (tepsi kirpilmasin)', async () => {
    const onDrop = jest.fn();
    await render(
      <PlayArea
        board={createBoard()}
        tray={[pieceOf('dot')]}
        width={WIDTH}
        maxHeight={320}
        theme={CARSI}
        onDrop={onDrop}
      />,
    );

    const rects = screen.getAllByTestId('skia-rounded-rect');
    expect(rects[0]?.props.width).toBeLessThan(boardLayout.cellSize);
  });
});
