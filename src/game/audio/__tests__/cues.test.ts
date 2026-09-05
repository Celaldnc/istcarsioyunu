import { cueForMove } from '../cues';

import { LEVEL } from '@/constants/config';
import { playPiece, startGame } from '@/game/core/game';
import type { GameState } from '@/game/core/game';

const SEED = 20260905;

/** Verilen temizleme sonucuna sahip sahte bir sonraki durum uretir. */
const withClear = (base: GameState, rows: number[], cols: number[]): GameState => ({
  ...base,
  lastClear: { rows, cols },
});

describe('cueForMove', () => {
  const before = startGame(SEED);

  it('hamle reddedildiyse uyari sesi', () => {
    expect(cueForMove(before, before)).toBe('invalid');
  });

  it('temizleme yoksa yerlestirme sesi', () => {
    const after = playPiece(before, 0, { x: 0, y: 0 });

    expect(cueForMove(before, after)).toBe('place');
  });

  it('tek cizgi temizlendiyse temizleme sesi', () => {
    expect(cueForMove(before, withClear({ ...before }, [0], []))).toBe('clear');
  });

  it('iki cizgi temizlendiyse combo sesi', () => {
    expect(cueForMove(before, withClear({ ...before }, [0, 1], []))).toBe('combo');
  });

  it('satir ve sutun birlikte sayilir', () => {
    expect(cueForMove(before, withClear({ ...before }, [0], [3]))).toBe('combo');
  });

  it('oyun bittiyse temizlemeden bagimsiz oyun sonu sesi', () => {
    const over: GameState = { ...before, status: 'gameOver', lastClear: { rows: [0], cols: [] } };

    expect(cueForMove(before, over)).toBe('gameOver');
  });

  it('tek renkli cizgi (Cini) combo sesinin onune gecer', () => {
    const after: GameState = {
      ...withClear({ ...before }, [0, 1], []),
      lastCini: { rows: [0], cols: [] },
    };

    expect(cueForMove(before, after)).toBe('cini');
  });

  it('seviye atlandiysa seviye sesi (temizleme sesinin onune gecer)', () => {
    const after = withClear({ ...before, score: LEVEL.POINTS_PER_LEVEL }, [0], []);

    expect(cueForMove(before, after)).toBe('levelUp');
  });

  it('rekor asildiginda rekor sesi her seyin onune gecer', () => {
    const after: GameState = {
      ...withClear({ ...before, score: 150 }, [0, 1], []),
      lastCini: { rows: [0], cols: [] },
    };

    expect(cueForMove({ ...before, score: 90 }, after, { highScore: 100 })).toBe('record');
  });

  it('rekor zaten asilmissa tekrar rekor sesi calmaz', () => {
    const after = withClear({ ...before, score: 200 }, [0], []);

    expect(cueForMove({ ...before, score: 150 }, after, { highScore: 100 })).toBe('clear');
  });

  it('ilk oyunda (rekor 0) rekor sesi calmaz', () => {
    const after = withClear({ ...before, score: 10 }, [0], []);

    expect(cueForMove(before, after, { highScore: 0 })).toBe('clear');
  });
});
