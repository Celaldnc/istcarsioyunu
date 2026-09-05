import { playPiece, startGame } from '../game';
import { SAVE_VERSION, deserializeGame, serializeGame } from '../save';
import type { Piece } from '../types';

import { BOARD, TEA_BREAK, TRAY } from '@/constants/config';

const SEED = 20260905;

const firstFilled = (tray: readonly (Piece | undefined)[]): number =>
  tray.findIndex((piece) => piece !== undefined);

function firstFit(state: ReturnType<typeof startGame>, index: number) {
  for (let y = 0; y < BOARD.ROWS; y += 1) {
    for (let x = 0; x < BOARD.COLS; x += 1) {
      if (playPiece(state, index, { x, y }) !== state) {
        return { x, y };
      }
    }
  }
  throw new Error('Test kurulumu hatali: parca hicbir yere sigmadi.');
}

/** Gecerli bir kaydi bozup JSON metnine ceviren yardimci. */
const corrupt = (mutate: (parsed: Record<string, unknown>) => void): string => {
  const parsed = JSON.parse(serializeGame(startGame(SEED))) as Record<string, unknown>;
  mutate(parsed);
  return JSON.stringify(parsed);
};

describe('serializeGame / deserializeGame', () => {
  it('yeni oyun turu kayipsiz gider gelir', () => {
    const state = startGame(SEED);

    expect(deserializeGame(serializeGame(state))).toEqual(state);
  });

  it('oynanmis oyun turu kayipsiz gider gelir', () => {
    let state = startGame(SEED);
    const index = firstFilled(state.tray);
    state = playPiece(state, index, firstFit(state, index));

    const restored = deserializeGame(serializeGame(state));

    expect(restored?.board).toEqual(state.board);
    expect(restored?.score).toBe(state.score);
    expect(restored?.piecesDrawn).toBe(state.piecesDrawn);
    expect(restored?.tray.map((p) => p?.shape.id)).toEqual(state.tray.map((p) => p?.shape.id));
  });

  it('geri yuklenen durum oynanmaya devam edebilir', () => {
    const restored = deserializeGame(serializeGame(startGame(SEED)));
    if (restored === null) {
      throw new Error('Kayit cozumlenemedi.');
    }

    const index = firstFilled(restored.tray);
    const next = playPiece(restored, index, firstFit(restored, index));

    expect(next).not.toBe(restored);
    expect(next.tray[index]).toBeUndefined();
  });

  it('parcalar sekil kimligi olarak saklanir (geometri kopyalanmaz)', () => {
    const parsed = JSON.parse(serializeGame(startGame(SEED))) as { tray: unknown[] };

    expect(parsed.tray[0]).toEqual({
      shapeId: expect.any(String) as unknown,
      colorId: expect.any(Number) as unknown,
    });
  });

  it('animasyon ipuclari geri yuklerken sifirlanir', () => {
    const restored = deserializeGame(serializeGame(startGame(SEED)));

    expect(restored?.lastClear).toEqual({ rows: [], cols: [] });
    expect(restored?.lastGain).toBe(0);
  });

  describe('bozuk kayitlar oyunu cokertmez, null doner', () => {
    it('gecersiz JSON', () => {
      expect(deserializeGame('{bu json degil')).toBeNull();
    });

    it('JSON ama nesne degil', () => {
      expect(deserializeGame('42')).toBeNull();
      expect(deserializeGame('null')).toBeNull();
      expect(deserializeGame('"metin"')).toBeNull();
    });

    it('bilinmeyen ileri surum reddedilir (dusme korumasi)', () => {
      expect(deserializeGame(corrupt((p) => (p.version = SAVE_VERSION + 1)))).toBeNull();
    });

    it('gecersiz surum degeri reddedilir', () => {
      expect(deserializeGame(corrupt((p) => (p.version = 0)))).toBeNull();
      expect(deserializeGame(corrupt((p) => (p.version = 'iki')))).toBeNull();
      expect(deserializeGame(corrupt((p) => (p.version = 1.5)))).toBeNull();
    });

    it('surum alani yok', () => {
      expect(deserializeGame(corrupt((p) => delete p.version))).toBeNull();
    });

    it('tahta yanlis satir sayisinda', () => {
      expect(deserializeGame(corrupt((p) => (p.board = [[]])))).toBeNull();
    });

    it('tahta yanlis sutun sayisinda', () => {
      expect(
        deserializeGame(
          corrupt((p) => (p.board = Array.from({ length: BOARD.ROWS }, () => [null, null]))),
        ),
      ).toBeNull();
    });

    it('tahta dizi degil', () => {
      expect(deserializeGame(corrupt((p) => (p.board = 'tahta')))).toBeNull();
    });

    it('tahtada gecersiz hucre degeri', () => {
      expect(
        deserializeGame(
          corrupt((p) => {
            const board = p.board as unknown[][];
            board[0]![0] = 'mavi';
          }),
        ),
      ).toBeNull();
    });

    it('tepsi yanlis uzunlukta', () => {
      expect(deserializeGame(corrupt((p) => (p.tray = [])))).toBeNull();
    });

    it('tepside bilinmeyen sekil kimligi', () => {
      expect(
        deserializeGame(
          corrupt((p) => {
            const tray = p.tray as unknown[];
            tray[0] = { shapeId: 'boyle-bir-sekil-yok', colorId: 1 };
          }),
        ),
      ).toBeNull();
    });

    it('tepside eksik alanli yuva', () => {
      expect(
        deserializeGame(
          corrupt((p) => {
            const tray = p.tray as unknown[];
            tray[0] = { shapeId: 'dot' };
          }),
        ),
      ).toBeNull();
    });

    it('tepside nesne olmayan yuva', () => {
      expect(
        deserializeGame(
          corrupt((p) => {
            const tray = p.tray as unknown[];
            tray[0] = 'dot';
          }),
        ),
      ).toBeNull();
    });

    it('skor sayi degil', () => {
      expect(deserializeGame(corrupt((p) => (p.score = 'cok')))).toBeNull();
    });

    it('seed sonsuz', () => {
      expect(deserializeGame(corrupt((p) => (p.seed = null)))).toBeNull();
    });

    it('cekilen parca sayisi eksik', () => {
      expect(deserializeGame(corrupt((p) => delete p.piecesDrawn))).toBeNull();
    });

    it('bilinmeyen durum degeri', () => {
      expect(deserializeGame(corrupt((p) => (p.status = 'duraklatildi')))).toBeNull();
    });
  });

  it('bos yuvalar null olarak saklanir ve undefined olarak geri gelir', () => {
    let state = startGame(SEED);
    const index = firstFilled(state.tray);
    state = playPiece(state, index, firstFit(state, index));

    const parsed = JSON.parse(serializeGame(state)) as { tray: unknown[] };
    expect(parsed.tray[index]).toBeNull();
    expect(parsed.tray).toHaveLength(TRAY.PIECE_COUNT);

    expect(deserializeGame(serializeGame(state))?.tray[index]).toBeUndefined();
  });
});

describe('durum tahtadan yeniden turetilir', () => {
  it('kayitli "playing" ama hicbir parca sigmiyorsa oyun sonu olur', () => {
    // Sekil tanimlari surumler arasi degisirse (ayni id, farkli hucreler)
    // kayitli durum yanilticidir. Oyuncu ekranda kilitlenmemeli.
    const full = Array.from({ length: BOARD.ROWS }, () =>
      Array.from({ length: BOARD.COLS }, () => 1),
    );
    const parsed = JSON.parse(serializeGame(startGame(SEED))) as Record<string, unknown>;
    parsed.board = full;
    parsed.status = 'playing';

    expect(deserializeGame(JSON.stringify(parsed))?.status).toBe('gameOver');
  });

  it('hamle yapilabiliyorsa kayitli "playing" korunur', () => {
    expect(deserializeGame(serializeGame(startGame(SEED)))?.status).toBe('playing');
  });
});

describe('deger araligi dogrulamalari', () => {
  it('palet disi renk kimligi kaydi gecersiz kilar', () => {
    // Aksi halde hucre mantiken dolu ama gorsel olarak bos gorunurdu.
    expect(
      deserializeGame(
        corrupt((p) => {
          const board = p.board as unknown[][];
          board[0]![0] = 999;
        }),
      ),
    ).toBeNull();
  });

  it('negatif renk kimligi gecersizdir', () => {
    expect(
      deserializeGame(
        corrupt((p) => {
          const board = p.board as unknown[][];
          board[0]![0] = -1;
        }),
      ),
    ).toBeNull();
  });

  it('kesirli renk kimligi gecersizdir', () => {
    expect(
      deserializeGame(
        corrupt((p) => {
          const tray = p.tray as unknown[];
          tray[0] = { shapeId: 'dot', colorId: 1.5 };
        }),
      ),
    ).toBeNull();
  });

  it('tepsi boyutunun kati olmayan piecesDrawn gecersizdir', () => {
    expect(deserializeGame(corrupt((p) => (p.piecesDrawn = 4)))).toBeNull();
  });

  it('asiri buyuk piecesDrawn gecersizdir (uretec o kadar ileri sarilmamali)', () => {
    expect(deserializeGame(corrupt((p) => (p.piecesDrawn = 1e9 + 1)))).toBeNull();
  });

  it('negatif piecesDrawn gecersizdir', () => {
    expect(deserializeGame(corrupt((p) => (p.piecesDrawn = -3)))).toBeNull();
  });
});

describe('surum gocu', () => {
  /** Guncel kaydi v1 bicimine dusuren yardimci. */
  const asV1 = (): Record<string, unknown> => {
    const parsed = JSON.parse(serializeGame(startGame(SEED))) as Record<string, unknown>;
    delete parsed.comboStreak;
    parsed.version = 1;
    return parsed;
  };

  it('v1 kaydi ATILMAZ, goc ettirilir', () => {
    // Oyuncunun devam eden oyununu bir guncelleme yuzunden kaybetmesi
    // kabul edilemez.
    const restored = deserializeGame(JSON.stringify(asV1()));

    expect(restored).not.toBeNull();
    expect(restored?.seed).toBe(SEED);
  });

  it('v1 kaydinda olmayan alan varsayilanla doldurulur', () => {
    expect(deserializeGame(JSON.stringify(asV1()))?.comboStreak).toBe(0);
  });

  it('v1 kaydinin tahtasi ve tepsisi korunur', () => {
    const original = startGame(SEED);
    const restored = deserializeGame(JSON.stringify(asV1()));

    expect(restored?.board).toEqual(original.board);
    expect(restored?.tray.map((p) => p?.shape.id)).toEqual(original.tray.map((p) => p?.shape.id));
  });

  it('gocten sonra da dogrulama uygulanir (bozuk v1 yine reddedilir)', () => {
    const broken = asV1();
    broken.board = 'tahta';

    expect(deserializeGame(JSON.stringify(broken))).toBeNull();
  });

  it('negatif seri degeri reddedilir', () => {
    expect(deserializeGame(corrupt((p) => (p.comboStreak = -1)))).toBeNull();
  });

  it('kesirli seri degeri reddedilir', () => {
    expect(deserializeGame(corrupt((p) => (p.comboStreak = 1.5)))).toBeNull();
  });
});

describe('kayit gocu: v2 -> v3 (cay molasi)', () => {
  const asV2 = (): string => {
    const parsed = JSON.parse(serializeGame(startGame(SEED))) as Record<string, unknown>;
    parsed.version = 2;
    delete parsed.teaBreaksLeft;
    return JSON.stringify(parsed);
  };

  it('v2 kaydi tam cay molasi hakkiyla yuklenir', () => {
    const restored = deserializeGame(asV2());

    expect(restored).not.toBeNull();
    expect(restored?.teaBreaksLeft).toBe(TEA_BREAK.PER_GAME);
  });

  it('guncel kayit cay molasi hakkini korur', () => {
    const state = { ...startGame(SEED), teaBreaksLeft: 0 };

    expect(deserializeGame(serializeGame(state))?.teaBreaksLeft).toBe(0);
  });

  it('bozuk cay molasi degeri reddedilir', () => {
    expect(deserializeGame(corrupt((p) => (p.teaBreaksLeft = -1)))).toBeNull();
    expect(deserializeGame(corrupt((p) => (p.teaBreaksLeft = 'bir')))).toBeNull();
    expect(deserializeGame(corrupt((p) => (p.teaBreaksLeft = 1.5)))).toBeNull();
  });

  it('SAVE_VERSION 3 oldu', () => {
    expect(SAVE_VERSION).toBe(3);
  });
});
