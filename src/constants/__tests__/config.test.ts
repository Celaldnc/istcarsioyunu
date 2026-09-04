import { BOARD, LAYOUT, PIECES, SCORING, TIME_ATTACK, TRAY } from '@/constants/config';

/**
 * Bu testler dolgu degildir: config.ts'teki bir degeri yanlislikla bozan birine,
 * oyunu kirdigi anda geri bildirim verirler.
 */
describe('oyun sabitleri', () => {
  describe('tahta geometrisi', () => {
    it('portre oranindadir (satir sayisi sutundan fazla)', () => {
      expect(BOARD.ROWS).toBeGreaterThan(BOARD.COLS);
    });

    it('en genis parcayi her iki eksende alabilir', () => {
      expect(BOARD.COLS).toBeGreaterThanOrEqual(PIECES.MAX_SPAN);
      expect(BOARD.ROWS).toBeGreaterThanOrEqual(PIECES.MAX_SPAN);
    });

    it('tum olculeri pozitif tamsayidir', () => {
      // Kesirli deger sub-pixel hit-test hatalarina yol acar.
      for (const value of Object.values(BOARD)) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }
    });

    it('hucreler arasi bosluk hucreden kucuktur', () => {
      expect(BOARD.CELL_GAP).toBeLessThan(BOARD.MAX_CELL_SIZE);
    });

    it('desteklenen en dar ekranda oynanabilir hucre boyutu birakir', () => {
      // Sprint 2'de gercek hucre boyutu bu formulle turetilecek.
      const usableWidth = LAYOUT.MIN_SUPPORTED_WIDTH - BOARD.SCREEN_MARGIN * 2;
      const totalGap = BOARD.CELL_GAP * (BOARD.COLS - 1);
      const derivedCellSize = (usableWidth - totalGap) / BOARD.COLS;

      expect(derivedCellSize).toBeGreaterThanOrEqual(LAYOUT.MIN_PLAYABLE_CELL_SIZE);
      // Tavan asilmamali; asiliyorsa MAX_CELL_SIZE anlamsiz demektir.
      expect(derivedCellSize).toBeLessThanOrEqual(BOARD.MAX_CELL_SIZE);
    });
  });

  describe('parca tepsisi', () => {
    it('pozitif tamsayi sayida parca sunar', () => {
      expect(Number.isInteger(TRAY.PIECE_COUNT)).toBe(true);
      expect(TRAY.PIECE_COUNT).toBeGreaterThan(0);
    });
  });

  describe('puanlama', () => {
    it('satir puani pozitiftir', () => {
      expect(SCORING.POINTS_PER_LINE).toBeGreaterThan(0);
    });

    it('perfect clear bonusu tek satir puanindan yuksektir', () => {
      expect(SCORING.PERFECT_CLEAR_BONUS).toBeGreaterThan(SCORING.POINTS_PER_LINE);
    });

    it('tum puan degerleri tamsayidir', () => {
      for (const value of Object.values(SCORING)) {
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  describe('Time Attack', () => {
    it('bir oturum uzunlugunda makul bir tamsayi suredir (30-180 sn)', () => {
      expect(Number.isInteger(TIME_ATTACK.DURATION_SECONDS)).toBe(true);
      expect(TIME_ATTACK.DURATION_SECONDS).toBeGreaterThanOrEqual(30);
      expect(TIME_ATTACK.DURATION_SECONDS).toBeLessThanOrEqual(180);
    });
  });
});
