import { BOARD, SCORING, TIME_ATTACK, TRAY } from '@/constants/config';

/**
 * Bu testler "1+1=2" turu dolgu degildir: config.ts'teki bir degeri yanlislikla
 * degistiren birine, oyunu kirdigi anda geri bildirim verirler.
 */
describe('oyun sabitleri', () => {
  it('tahta portre oranindadir (satir sayisi sutundan fazla)', () => {
    expect(BOARD.ROWS).toBeGreaterThan(BOARD.COLS);
  });

  it('tahta en buyuk parcayi (2x2) alabilecek kadar buyuktur', () => {
    expect(BOARD.COLS).toBeGreaterThanOrEqual(2);
    expect(BOARD.ROWS).toBeGreaterThanOrEqual(2);
  });

  it('hucre olculeri pozitif ve bosluk hucreden kucuktur', () => {
    expect(BOARD.CELL_SIZE).toBeGreaterThan(0);
    expect(BOARD.CELL_GAP).toBeGreaterThanOrEqual(0);
    expect(BOARD.CELL_GAP).toBeLessThan(BOARD.CELL_SIZE);
  });

  it('tray en az bir parca sunar', () => {
    expect(TRAY.PIECE_COUNT).toBeGreaterThan(0);
  });

  it('perfect clear bonusu tek satir puanindan yuksektir', () => {
    expect(SCORING.PERFECT_CLEAR_BONUS).toBeGreaterThan(SCORING.POINTS_PER_LINE);
  });

  it('Time Attack suresi bir oturum uzunlugunda makuldur (30-180 sn)', () => {
    expect(TIME_ATTACK.DURATION_SECONDS).toBeGreaterThanOrEqual(30);
    expect(TIME_ATTACK.DURATION_SECONDS).toBeLessThanOrEqual(180);
  });
});
