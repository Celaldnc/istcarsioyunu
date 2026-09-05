/**
 * Kucuk renk yardimcilari (saf).
 *
 * Sprite'lar palet rengini temel alip acik/koyu tonlarini kendileri
 * turetir; boylece yeni bir tema yalnizca 6 ana renk tanimlar, 18 ton degil.
 */

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (match === null) {
    return null;
  }
  const value = Number.parseInt(match[1] ?? '', 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Rengi beyaza (amount > 0) veya siyaha (amount < 0) dogru karistirir.
 * amount [-1, 1] araliginda; 1 tam beyaz, -1 tam siyah.
 * Taninmayan bicim (or. rgba) oldugu gibi doner: cizim asla patlamamali.
 */
export function shade(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (rgb === null || !Number.isFinite(amount)) {
    return hex;
  }
  const t = Math.max(-1, Math.min(1, amount));
  const target = t > 0 ? 255 : 0;
  const mix = Math.abs(t);
  const [r, g, b] = rgb;

  return toHex(r + (target - r) * mix, g + (target - g) * mix, b + (target - b) * mix);
}
