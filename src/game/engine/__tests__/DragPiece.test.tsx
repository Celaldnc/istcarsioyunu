import { render, screen } from '@testing-library/react-native';

import { DRAG_PIECE_TEST_ID, DragPiece } from '../DragPiece';

import { DRAG } from '@/constants/config';
import { computeBoardLayout } from '@/game/core/layout';
import { shapeById } from '@/game/core/pieces';
import { dragPixelOrigin } from '@/game/core/placement';
import type { Piece } from '@/game/core/types';
import { CARSI } from '@/game/data/themes';

const layout = computeBoardLayout(390);

const pieceOf = (id: string, colorId = 2): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId };
};

const pointer = { x: 200, y: 300 };

describe('DragPiece', () => {
  it('parcanin her hucresini cizer', async () => {
    await render(
      <DragPiece piece={pieceOf('plus')} pointer={pointer} layout={layout} theme={CARSI} />,
    );

    expect(screen.getAllByTestId('skia-rounded-rect')).toHaveLength(5);
  });

  it('parcayi kendi renginde cizer', async () => {
    await render(
      <DragPiece piece={pieceOf('square', 3)} pointer={pointer} layout={layout} theme={CARSI} />,
    );

    for (const rect of screen.getAllByTestId('skia-rounded-rect')) {
      expect(rect.props.color).toBe(CARSI.palette[3]);
    }
  });

  it('konumu core ile AYNI matematige dayanir (hayaletten kaymaz)', async () => {
    const piece = pieceOf('dot');
    await render(<DragPiece piece={piece} pointer={pointer} layout={layout} theme={CARSI} />);

    const expected = dragPixelOrigin(layout, pointer, piece);
    const [rect] = screen.getAllByTestId('skia-rounded-rect');

    expect(rect?.props.x).toBeCloseTo(expected.x);
    expect(rect?.props.y).toBeCloseTo(expected.y);
  });

  it('parcayi parmagin USTUNDE tutar', async () => {
    const piece = pieceOf('dot');
    await render(<DragPiece piece={piece} pointer={pointer} layout={layout} theme={CARSI} />);

    const [rect] = screen.getAllByTestId('skia-rounded-rect');
    // DRAG.LIFT sifirdan buyukse parca parmagin yukarisinda cizilir.
    expect(rect?.props.y).toBeLessThan(pointer.y);
    expect(DRAG.LIFT).toBeGreaterThan(0);
  });

  it('dokunuslari gecirir (altindaki alani engellemez)', async () => {
    await render(
      <DragPiece piece={pieceOf('dot')} pointer={pointer} layout={layout} theme={CARSI} />,
    );

    const style = screen.getByTestId(DRAG_PIECE_TEST_ID).props.style as { pointerEvents?: string };
    expect(style.pointerEvents).toBe('none');
  });
});
