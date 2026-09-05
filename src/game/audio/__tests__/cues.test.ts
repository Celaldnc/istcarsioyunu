import { cueForMove, soundForEvents } from '../cues';
import { noteForStreak } from '../sources';

import { LEVEL, MAKAM } from '@/constants/config';
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

  it('tek cizgi temizlendiyse makam notasi (seri 1 -> ilk nota)', () => {
    const after = { ...withClear({ ...before }, [0], []), comboStreak: 1 };

    expect(cueForMove(before, after)).toBe('note1');
  });

  it('makam kapaliysa duz temizleme sesi', () => {
    const after = {
      ...withClear({ ...before }, [0], []),
      comboStreak: 1,
      rules: { ...before.rules, makam: false },
    };

    expect(cueForMove(before, after)).toBe('clear');
  });

  it('seri uzadikca nota ilerler ve tavanda kalir', () => {
    expect(noteForStreak(3)).toBe('note3');
    expect(noteForStreak(MAKAM.NOTES + 5)).toBe(`note${MAKAM.NOTES}`);
    expect(noteForStreak(0)).toBe('note1');
  });

  it('canli olaylar temizleme sesinin onune gecer', () => {
    const after = { ...withClear({ ...before }, [0], []), events: ['gullFed' as const] };

    expect(cueForMove(before, after)).toBe('gull');
    expect(soundForEvents(['catMoved'])).toBe('cat');
    expect(soundForEvents(['nazarSpread'])).toBe('nazar');
    expect(soundForEvents(['synergy'])).toBe('synergy');
    expect(soundForEvents(['haggleLost'])).toBe('haggleLose');
    expect(soundForEvents([])).toBeNull();
  });

  it('makam tamamlaninca fanfar', () => {
    const after = { ...withClear({ ...before }, [0], []), events: ['makamComplete' as const] };

    expect(cueForMove(before, after)).toBe('record');
  });

  it('seviye kazanilinca fanfar', () => {
    expect(cueForMove(before, { ...before, status: 'won' })).toBe('record');
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

    expect(cueForMove({ ...before, score: 150 }, after, { highScore: 100 })).toBe('note1');
  });

  it('ilk oyunda (rekor 0) rekor sesi calmaz', () => {
    const after = withClear({ ...before, score: 10 }, [0], []);

    expect(cueForMove(before, after, { highScore: 0 })).toBe('note1');
  });
});
