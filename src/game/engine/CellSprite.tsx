import {
  Circle,
  Group,
  Line,
  Oval,
  Path,
  Rect,
  RoundedRect,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import { memo } from 'react';

import { shade } from './color';

import { BOARD, SPRITE } from '@/constants/config';
import { colorFor, spriteFor, type SpriteKind, type Theme } from '@/game/data/themes';

interface CellSpriteProps {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly colorId: number;
  readonly theme: Theme;
  readonly opacity?: number;
}

/**
 * Dolu bir hucrenin "esya" olarak cizimi.
 *
 * Duz renkli kare yerine her renk kimligi carsidan bir esyadir: simit,
 * cay bardagi, nazar boncugu, lokum, fistik, dovme bakir. Vektorle cizilir
 * (resim dosyasi yok): her hucre boyutunda keskin kalir, tema yalnizca 6 ana
 * renk + esya listesi tanimlar, tonlar shade() ile turetilir.
 *
 * Tahta, tepsi ve suruklenen parca AYNI bileseni kullanir; parca elden
 * tahtaya gecerken gorunumu degismez.
 *
 * Maliyet: dolu hucre basina 3-8 cizim. 80 hucrelik tahtada en kotu ~600
 * dugum; Skia icin ucuz, React tarafinda ise GameCanvas memo'lu oldugundan
 * yalnizca hamle sonrasi diff'lenir.
 */
function CellSpriteImpl({ x, y, size, colorId, theme, opacity = 1 }: CellSpriteProps) {
  const base = colorFor(theme, colorId);
  const kind = spriteFor(theme, colorId);
  const detailed = size >= SPRITE.DETAIL_MIN_SIZE;
  const clip = rrect(rect(x, y, size, size), BOARD.CELL_RADIUS, BOARD.CELL_RADIUS);

  return (
    <>
      <RoundedRect
        x={x}
        y={y}
        width={size}
        height={size}
        r={BOARD.CELL_RADIUS}
        color={base}
        opacity={opacity}
      />
      <Group clip={clip} opacity={opacity}>
        <Glyph kind={kind} x={x} y={y} size={size} base={base} detailed={detailed} />
        {/* Ust parlaklik + alt golge: blok "kabarik" dursun (Block Blast hissi). */}
        <Rect
          x={x}
          y={y}
          width={size}
          height={size * 0.3}
          color="#FFFFFF"
          opacity={SPRITE.GLOSS_OPACITY}
        />
        <Rect
          x={x}
          y={y + size * 0.84}
          width={size}
          height={size * 0.16}
          color="#000000"
          opacity={SPRITE.SHADOW_OPACITY}
        />
      </Group>
    </>
  );
}

interface GlyphProps {
  readonly kind: SpriteKind;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly base: string;
  readonly detailed: boolean;
}

function Glyph({ kind, x, y, size: s, base, detailed }: GlyphProps) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  // Kontrast bilerek yuksek: 26px'lik tepsi hucresinde bile esya SECILMELI.
  const light = shade(base, 0.62);
  const dark = shade(base, -0.4);

  switch (kind) {
    case 'simit': {
      // Halka + susam
      const ring = s * 0.33;
      return (
        <>
          <Circle cx={cx} cy={cy} r={ring} color={light} style="stroke" strokeWidth={s * 0.21} />
          {detailed
            ? [0.4, 1.7, 3.1, 4.5, 5.6].map((angle) => (
                <Circle
                  key={angle}
                  cx={cx + Math.cos(angle) * ring}
                  cy={cy + Math.sin(angle) * ring}
                  r={s * 0.05}
                  color={dark}
                />
              ))
            : null}
        </>
      );
    }
    case 'cay': {
      // Ince belli cay bardagi + tabak
      const glass = [
        [0.26, 0.12],
        [0.74, 0.12],
        [0.66, 0.4],
        [0.74, 0.62],
        [0.66, 0.84],
        [0.34, 0.84],
        [0.26, 0.62],
        [0.34, 0.4],
      ]
        .map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${x + (px ?? 0) * s} ${y + (py ?? 0) * s}`)
        .join(' ');
      return (
        <>
          <Path path={`${glass} Z`} color={light} />
          <Rect x={x + s * 0.37} y={y + s * 0.46} width={s * 0.26} height={s * 0.36} color={dark} />
          {detailed ? (
            <Rect
              x={x + s * 0.18}
              y={y + s * 0.86}
              width={s * 0.64}
              height={s * 0.07}
              color={dark}
            />
          ) : null}
        </>
      );
    }
    case 'nazar':
      // Beyaz - acik mavi - koyu goz bebegi
      return (
        <>
          <Circle cx={cx} cy={cy} r={s * 0.4} color="#F4F1EA" />
          <Circle cx={cx} cy={cy} r={s * 0.27} color="#5FB3E6" />
          <Circle cx={cx} cy={cy} r={s * 0.14} color="#10233F" />
          {detailed ? (
            <Circle cx={cx - s * 0.06} cy={cy - s * 0.07} r={s * 0.05} color="#FFFFFF" />
          ) : null}
        </>
      );
    case 'lokum': {
      // Pudra sekerli kup + kirintilar
      const inset = s * 0.15;
      return (
        <>
          <Rect
            x={x + inset}
            y={y + inset}
            width={s - inset * 2}
            height={s - inset * 2}
            color={light}
          />
          {detailed
            ? [
                [0.3, 0.3],
                [0.68, 0.36],
                [0.42, 0.66],
              ].map(([px, py]) => (
                <Circle
                  key={`${px}-${py}`}
                  cx={x + (px ?? 0) * s}
                  cy={y + (py ?? 0) * s}
                  r={s * 0.055}
                  color={dark}
                />
              ))
            : null}
        </>
      );
    }
    case 'fistik':
      // Fistik ici + kabuk catlagi
      return (
        <>
          <Oval x={x + s * 0.2} y={y + s * 0.08} width={s * 0.6} height={s * 0.84} color={light} />
          {detailed ? (
            <Line
              p1={vec(cx, y + s * 0.14)}
              p2={vec(cx, y + s * 0.56)}
              color={dark}
              strokeWidth={s * 0.07}
            />
          ) : null}
        </>
      );
    case 'bakir': {
      // Dovme bakir: cekic izleri
      const dents = detailed
        ? [
            [0.3, 0.32],
            [0.68, 0.3],
            [0.5, 0.58],
            [0.28, 0.72],
            [0.72, 0.7],
          ]
        : [
            [0.34, 0.36],
            [0.66, 0.6],
          ];
      return (
        <>
          {dents.map(([px, py]) => (
            <Circle
              key={`${px}-${py}`}
              cx={x + (px ?? 0) * s}
              cy={y + (py ?? 0) * s}
              r={s * 0.13}
              color={light}
              opacity={0.75}
            />
          ))}
        </>
      );
    }
  }
}

export const CellSprite = memo(CellSpriteImpl);
