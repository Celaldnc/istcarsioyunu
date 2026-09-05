import { render, screen } from '@testing-library/react-native';

import { GameCanvas } from '../GameCanvas';

import { BOARD } from '@/constants/config';
import { createBoard } from '@/game/core/board';
import { computeBoardLayout } from '@/game/core/layout';
import type { Board } from '@/game/core/types';
import { CARSI } from '@/game/data/themes';

const layout = computeBoardLayout(390);

const boardFrom = (rows: string[]): Board =>
  rows.map((row) => [...row].map((ch) => (ch === '.' ? null : Number(ch))));

describe('GameCanvas', () => {
  it('her hucre icin bir dikdortgen cizer', async () => {
    await render(<GameCanvas board={createBoard()} layout={layout} theme={CARSI} />);

    expect(screen.getAllByTestId('skia-rounded-rect')).toHaveLength(BOARD.COLS * BOARD.ROWS);
  });

  it('bos hucreleri temanin bos hucre rengiyle cizer', async () => {
    await render(<GameCanvas board={boardFrom(['..'])} layout={layout} theme={CARSI} />);

    for (const rect of screen.getAllByTestId('skia-rounded-rect')) {
      expect(rect.props.color).toBe(CARSI.emptyCell);
    }
  });

  it('dolu hucreleri parcanin renk kimligine karsilik gelen renkle cizer', async () => {
    await render(<GameCanvas board={boardFrom(['0.', '.3'])} layout={layout} theme={CARSI} />);

    const colors = screen.getAllByTestId('skia-rounded-rect').map((r) => r.props.color);

    expect(colors).toEqual([CARSI.palette[0], CARSI.emptyCell, CARSI.emptyCell, CARSI.palette[3]]);
  });

  it('hucreleri layout tarafindan hesaplanan konumlara yerlestirir', async () => {
    await render(<GameCanvas board={boardFrom(['..'])} layout={layout} theme={CARSI} />);

    const [first, second] = screen.getAllByTestId('skia-rounded-rect');

    expect(first?.props.width).toBe(layout.cellSize);
    expect(second?.props.x - first?.props.x).toBe(layout.cellSize + BOARD.CELL_GAP);
  });

  it('ekran okuyucuya tahta olculerini bildirir', async () => {
    await render(<GameCanvas board={createBoard()} layout={layout} theme={CARSI} />);

    expect(
      screen.getByLabelText(`Oyun tahtası, ${BOARD.COLS} sütun ${BOARD.ROWS} satır`),
    ).toBeOnTheScreen();
  });

  it('bos tahtada cizim yapmadan cokmez', async () => {
    await render(<GameCanvas board={[]} layout={layout} theme={CARSI} />);

    expect(screen.queryAllByTestId('skia-rounded-rect')).toHaveLength(0);
  });
});
