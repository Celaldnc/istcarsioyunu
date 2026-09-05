import { THEME } from '@/constants/config';

/**
 * Gorsel temalar.
 *
 * Sprint 5'te bes tema olacak (Carsi, Pazar, Sahil, Vapur, Galata). Sprint
 * 2'de yalnizca Carsi tanimli; amac render katmanini renk sabitleri
 * serpistirmeden calistirmak.
 *
 * Palet uzunlugu THEME.PALETTE_SIZE ile ayni olmak zorundadir: parca uretici
 * renk kimliklerini 0..PALETTE_SIZE-1 araligindan seciyor. Test bu
 * invariant'i koruyor.
 */

export interface Theme {
  readonly id: string;
  readonly name: string;
  /** Tahtanin arka plani */
  readonly boardBackground: string;
  /** Bos hucre rengi */
  readonly emptyCell: string;
  /** Dolu hucre renkleri; indeks = parcanin colorId degeri */
  readonly palette: readonly string[];
}

/** Kapalicarsi: sicak turuncu-sari, bakir ve cay tonlari. */
export const CARSI: Theme = {
  id: 'carsi',
  name: 'Çarşı',
  boardBackground: '#F5EBDC',
  emptyCell: '#E8DAC4',
  palette: [
    '#C6803A', // simit
    '#A83C28', // cay
    '#1E6FA8', // nazar boncugu
    '#C4557F', // lokum
    '#5F7F3A', // fistik
    '#7A5C3E', // bakir
  ],
};

export const THEMES: readonly Theme[] = [CARSI];

export const DEFAULT_THEME: Theme = CARSI;

/** colorId icin renk; tanimsiz kimlikte bos hucre rengine duser. */
export function colorFor(theme: Theme, colorId: number): string {
  return theme.palette[colorId] ?? theme.emptyCell;
}

/** Palet uzunlugunun config ile tutarli oldugunu calisma aninda da dogrular. */
export function isPaletteValid(theme: Theme): boolean {
  return theme.palette.length === THEME.PALETTE_SIZE;
}
