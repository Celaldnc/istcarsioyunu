import { render, screen } from '@testing-library/react-native';

import { PieceTray } from '../PieceTray';

import { TRAY } from '@/constants/config';
import { computeTrayLayout } from '@/game/core/layout';
import { shapeById } from '@/game/core/pieces';
import type { Piece } from '@/game/core/types';
import { CARSI } from '@/game/data/themes';

const layout = computeTrayLayout(390);

const pieceOf = (id: string, colorId = 2): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId };
};

describe('PieceTray', () => {
  it('parca kullanildiginda bile yuva sayisi sabit kalir', async () => {
    await render(<PieceTray pieces={[pieceOf('dot')]} layout={layout} theme={CARSI} />);

    // 1 dolu + (PIECE_COUNT - 1) bos yuva
    expect(screen.getAllByLabelText(/yuva boş/)).toHaveLength(TRAY.PIECE_COUNT - 1);
  });

  it('her parcanin hucre sayisi kadar dikdortgen cizer', async () => {
    await render(<PieceTray pieces={[pieceOf('plus')]} layout={layout} theme={CARSI} />);

    expect(screen.getAllByTestId('skia-rounded-rect')).toHaveLength(5);
  });

  it('parcayi kendi renk kimligiyle cizer', async () => {
    await render(<PieceTray pieces={[pieceOf('square', 4)]} layout={layout} theme={CARSI} />);

    for (const rect of screen.getAllByTestId('skia-rounded-rect')) {
      expect(rect.props.color).toBe(CARSI.palette[4]);
    }
  });

  it('ekran okuyucuya parcanin Turkce adini bildirir', async () => {
    await render(<PieceTray pieces={[pieceOf('t')]} layout={layout} theme={CARSI} />);

    expect(screen.getByLabelText('1. parça: T parçası')).toBeOnTheScreen();
  });

  it('bos tepside hicbir parca cizilmez', async () => {
    await render(<PieceTray pieces={[]} layout={layout} theme={CARSI} />);

    expect(screen.queryAllByTestId('skia-rounded-rect')).toHaveLength(0);
    expect(screen.getAllByLabelText(/yuva boş/)).toHaveLength(TRAY.PIECE_COUNT);
  });

  it('parcayi yuvanin ortasina hizalar', async () => {
    await render(<PieceTray pieces={[pieceOf('dot')]} layout={layout} theme={CARSI} />);

    const [rect] = screen.getAllByTestId('skia-rounded-rect');
    const expectedX = (layout.slotWidth - layout.cellSize) / 2;

    expect(rect?.props.x).toBeCloseTo(expectedX);
  });
});
