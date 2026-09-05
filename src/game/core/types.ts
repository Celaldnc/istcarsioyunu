/**
 * Oyun mantiginin veri tipleri.
 *
 * Bu dosya ve tum src/game/core klasoru React Native / Expo / Zustand import
 * ETMEZ. Kural eslint.config.js'teki no-restricted-imports ile makineye
 * zorlatilir. Amac: oyun mantigini render'dan bagimsiz tutmak, boylece
 * milisaniyeler icinde test edilebilir kalmasi.
 */

/** Bir hucreyi dolduran parcanin renk kimligi. Tema paletine indekstir. */
export type ColorId = number;

/** Bos hucre null; dolu hucre, onu dolduran parcanin renk kimligi. */
export type Cell = ColorId | null;

/** Tahta satir dizisidir, her satir da sutun dizisi: board[y][x] */
export type Board = readonly (readonly Cell[])[];

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Parca sekli: dolu hucrelerin (0,0) baz alinmis koordinatlari. */
export interface Shape {
  readonly id: string;
  readonly cells: readonly Point[];
  /** Kapladigi kutunun genisligi (hucre) */
  readonly width: number;
  /** Kapladigi kutunun yuksekligi (hucre) */
  readonly height: number;
}

/** Tepside duran, tahtaya yerlestirilebilir parca. */
export interface Piece {
  readonly shape: Shape;
  readonly colorId: ColorId;
}

/** Tam dolu satir ve sutunlarin indeksleri. */
export interface FullLines {
  readonly rows: readonly number[];
  readonly cols: readonly number[];
}

/**
 * Tahta DISI hucre (sekilli tahtalar: Galata silueti, Bogaz'in suyu...).
 *
 * Renk kimlikleri 0'dan basladigi icin -1 hicbir paletle cakismaz. Bu hucreye
 * parca konamaz, temizlenmez, "dolu" da sayilmaz; yalnizca satir/sutunun
 * tamamlanmasi icin gereken hucre sayisini azaltir.
 */
export const OFF_CELL = -1;

export const isOffCell = (cell: Cell | undefined): boolean => cell === OFF_CELL;

/** Bir parcanin doldurdugu hucre mi? (bos ve tahta disi degil) */
export const isFilledCell = (cell: Cell | undefined): cell is ColorId =>
  typeof cell === 'number' && cell >= 0;
