import { isGameOver } from './board';
import type { GameState, GameStatus } from './game';
import { shapeById } from './pieces';
import type { Board, Cell, Piece } from './types';

import { BOARD, TEA_BREAK, THEME, TRAY } from '@/constants/config';

/**
 * Oyun durumunun kalici depolamaya yazilabilir bicimi.
 *
 * Tasarim notlari:
 * - Parcalar SEKIL KIMLIGI olarak saklanir, sekil nesnesi olarak degil.
 *   Sekil tanimi (hucre koordinatlari) kodda yasar; kaydin icine kopyalamak
 *   hem yer israfi olur hem de sekil tanimi degistiginde eski kayitlar yanlis
 *   geometriyle geri gelirdi.
 * - rng FONKSIYONU saklanmaz. seed + o ana kadar cekilen parca sayisi yeterli;
 *   uretec geri yuklerken ayni noktaya sarilir.
 * - Her cozumleme adimi dogrulanir. Bozuk bir kayit null dondurur; cagiran
 *   taraf yeni oyun baslatir. Kaydin oyunu cokertmemesi, kaydi kurtarmaktan
 *   onemli.
 *
 * SURUMLEME
 * Eski surumler ATILMAZ, GOC ETTIRILIR. Oyuncunun devam eden oyununu bir
 * guncelleme yuzunden kaybetmesi kabul edilemez. Her surum icin tip DONDURULUR
 * (SavedGameV1'e bir daha dokunulmaz) ve MIGRATIONS zinciri eksik alanlari
 * varsayilanla doldurur. Dogrulama yalnizca GUNCEL sema icin yazilir; goc
 * zinciri her kaydi once guncel semaya cikarir.
 *
 * SAVE_VERSION su durumlarda artirilmalidir:
 *  - Yeni alan eklendiginde
 *  - Bir alanin anlami degistiginde
 *  - SEKIL GEOMETRISI degistiginde (ayni id, farkli hucreler): eski kayitlar
 *    yeni geometriyle yanlis yorumlanir.
 */

/** Guncel kayit bicimi surumu. */
export const SAVE_VERSION = 3;

interface SavedSlot {
  readonly shapeId: string;
  readonly colorId: number;
}

/** v1 — DONDURULDU. Yeni alan eklemeyin; yeni surum acin. */
interface SavedGameV1 {
  readonly version: 1;
  readonly board: readonly (readonly Cell[])[];
  readonly tray: readonly (SavedSlot | null)[];
  readonly score: number;
  readonly seed: number;
  readonly piecesDrawn: number;
  readonly status: GameStatus;
}

/** v2 — DONDURULDU. Ardisik temizleme serisi eklendi. */
interface SavedGameV2 extends Omit<SavedGameV1, 'version'> {
  readonly version: 2;
  readonly comboStreak: number;
}

/** v3 — "Cay molasi" hakki eklendi. */
interface SavedGameV3 extends Omit<SavedGameV2, 'version'> {
  readonly version: 3;
  readonly teaBreaksLeft: number;
}

type SavedGame = SavedGameV3;

/**
 * Surumden bir sonrakine gecis. Eksik alanlar VARSAYILANLA doldurulur;
 * eski kaydin dogru yorumlanabilmesi icin baska bir varsayim yapilmaz.
 */
const MIGRATIONS: Readonly<
  Record<number, (raw: Record<string, unknown>) => Record<string, unknown>>
> = {
  // v1'de seri kavrami yoktu; sifirdan baslamak dogru varsayilan.
  1: (raw) => ({ ...raw, version: 2, comboStreak: 0 }),
  // v2'de cay molasi yoktu; eski oyuna tam hak vermek oyuncunun lehine.
  2: (raw) => ({ ...raw, version: 3, teaBreaksLeft: TEA_BREAK.PER_GAME }),
};

export function serializeGame(state: GameState): string {
  const payload: SavedGame = {
    version: SAVE_VERSION,
    board: state.board,
    tray: state.tray.map((piece) =>
      piece === undefined ? null : { shapeId: piece.shape.id, colorId: piece.colorId },
    ),
    score: state.score,
    seed: state.seed,
    piecesDrawn: state.piecesDrawn,
    status: state.status,
    comboStreak: state.comboStreak,
    teaBreaksLeft: state.teaBreaksLeft,
  };

  return JSON.stringify(payload);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isStatus = (value: unknown): value is GameStatus =>
  value === 'playing' || value === 'gameOver';

/**
 * Renk kimligi paletin icinde mi?
 *
 * Yalnizca "sayi mi" diye bakmak yetmez: palet disi bir kimlik colorFor'da
 * bos hucre rengine duser ve hucre MANTIKEN dolu ama GORSEL olarak bos
 * gorunur. Oyuncu oraya parca birakmaya calisir, sessizce reddedilir ve
 * sebebini asla goremez.
 */
const isColorId = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) < THEME.PALETTE_SIZE;

/**
 * Cekilen parca sayisi gecerli mi?
 *
 * Bozuk bir deger (or. 1e9) ureteci o kadar ileri sarmaya calisirdi.
 * Sayi her zaman tepsi boyutunun kati olur: baslangicta bir tepsi, sonra
 * her yenilemede bir tepsi daha.
 */
const isPiecesDrawn = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) % TRAY.PIECE_COUNT === 0;

/** Negatif olmayan tamsayi (seri, kalan hak...). */
const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;
const isStreak = isCount;

function parseBoard(value: unknown): Board | null {
  if (!Array.isArray(value) || value.length !== BOARD.ROWS) {
    return null;
  }

  const rows: Cell[][] = [];

  for (const row of value) {
    if (!Array.isArray(row) || row.length !== BOARD.COLS) {
      return null;
    }
    const cells: Cell[] = [];
    for (const cell of row) {
      if (cell !== null && !isColorId(cell)) {
        return null;
      }
      cells.push(cell);
    }
    rows.push(cells);
  }

  return rows;
}

function parseTray(value: unknown): (Piece | undefined)[] | null {
  if (!Array.isArray(value) || value.length !== TRAY.PIECE_COUNT) {
    return null;
  }

  const tray: (Piece | undefined)[] = [];

  for (const slot of value) {
    if (slot === null) {
      tray.push(undefined);
      continue;
    }
    if (typeof slot !== 'object' || slot === null) {
      return null;
    }

    const { shapeId, colorId } = slot as Partial<SavedSlot>;
    if (typeof shapeId !== 'string' || !isColorId(colorId)) {
      return null;
    }

    // Sekil katalogdan cozulur; kayit sonrasi silinmis bir sekil kaydi gecersiz kilar.
    const shape = shapeById(shapeId);
    if (shape === undefined) {
      return null;
    }

    tray.push({ shape, colorId });
  }

  return tray;
}

/** Kaydi guncel semaya cikarir; zincir kirilirsa null. */
function migrate(raw: Record<string, unknown>): Record<string, unknown> | null {
  let current = raw;

  while (typeof current.version === 'number' && current.version < SAVE_VERSION) {
    const step = MIGRATIONS[current.version];
    if (step === undefined) {
      // Zincirde eksik halka: kaydi zorlamaktansa atmak guvenli.
      return null;
    }
    current = step(current);
  }

  return current;
}

export function deserializeGame(json: string): GameState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }

  const version = (raw as Record<string, unknown>).version;
  if (!Number.isInteger(version) || (version as number) < 1) {
    return null;
  }
  // Ileri surumden dusme korumasi: bilmedigimiz alanlari yorumlayamayiz.
  if ((version as number) > SAVE_VERSION) {
    return null;
  }

  const migrated = migrate(raw as Record<string, unknown>);
  if (migrated === null) {
    return null;
  }

  const saved = migrated as unknown as Partial<SavedGame>;

  const board = parseBoard(saved.board);
  const tray = parseTray(saved.tray);

  if (
    board === null ||
    tray === null ||
    !isFiniteNumber(saved.score) ||
    !isFiniteNumber(saved.seed) ||
    !isPiecesDrawn(saved.piecesDrawn) ||
    !isStatus(saved.status) ||
    !isStreak(saved.comboStreak) ||
    !isCount(saved.teaBreaksLeft)
  ) {
    return null;
  }

  // Durum kaydedildigi gibi degil, tahtadan YENIDEN TURETILIR.
  // Sekil tanimlari surumler arasinda degisirse (ayni id, farkli hucreler)
  // kayitli "playing" durumu hicbir parcanin sigmadigi bir tahtaya
  // uygulanabilir; oyuncu oyun sonu ekranini goremeden ekranda kilitlenirdi.
  const remaining = tray.filter((piece): piece is Piece => piece !== undefined);
  const status: GameStatus = isGameOver(board, remaining) ? 'gameOver' : saved.status;

  return {
    board,
    tray,
    score: saved.score,
    seed: saved.seed,
    piecesDrawn: saved.piecesDrawn,
    status,
    comboStreak: saved.comboStreak,
    teaBreaksLeft: saved.teaBreaksLeft,
    // Animasyon ipuclari gecicidir; geri yuklerken sifirlanir.
    lastClear: { rows: [], cols: [] },
    lastGain: 0,
    lastCini: { rows: [], cols: [] },
  };
}
