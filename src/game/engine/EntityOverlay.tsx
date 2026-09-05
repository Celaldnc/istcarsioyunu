import {
  Canvas,
  Circle,
  Group,
  Line,
  Oval,
  Path,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BOARD } from '@/constants/config';
import type { Cat, Curse, Gull } from '@/game/core/game';
import { GATE, isGateLit } from '@/game/core/gates';
import { cellOrigin, type BoardLayout } from '@/game/core/layout';
import type { Theme } from '@/game/data/themes';

export const ENTITY_OVERLAY_TEST_ID = 'entity-overlay';

interface EntityOverlayProps {
  readonly cat: Cat | null;
  readonly gull: Gull | null;
  readonly curses: readonly Curse[];
  /** Yanan kapilar; null ise fenerler cizilmez. */
  readonly gates?: number | null;
  /** Senlik: tahta sicak bir isikla yikanir. */
  readonly festival?: boolean;
  readonly layout: BoardLayout;
  readonly theme: Theme;
}

const LANTERN = { lit: '#FFB63A', unlit: '#8A8A8A', glow: '#FFD580', festival: '#FFC857' } as const;

const CAT_COLORS = { fur: '#6B6B6B', ear: '#F2B8A2', eye: '#2B2B2B', nose: '#D97B7B' } as const;
const GULL_COLORS = { body: '#F7F7F7', wing: '#9AA3AD', beak: '#F2A33A', eye: '#222222' } as const;
const CURSE_COLORS = { veil: '#1B1B2F', iris: '#5FB3E6', pupil: '#0B0B14' } as const;

/**
 * Tahtanin USTUNDE yasayan seyler: Tekir, marti, nazar laneti.
 *
 * Ayri bir tuval: tahta tuvali memo'lu ve yalnizca hucreler degisince
 * diff'lenmeli; kedi/marti hareketi ya da lanetin nabzi onu yeniden
 * cizdirmemeli. Dokunuslari yutmaz (pointerEvents none): oksama PlayArea'daki
 * tap hareketiyle, koordinattan cozulur.
 */
function EntityOverlayImpl({
  cat,
  gull,
  curses,
  gates = null,
  festival = false,
  layout,
  theme,
}: EntityOverlayProps) {
  // Lanetin nabzi: tum lanetler ayni ritimde soluk alir (tek shared value).
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);
  const veilOpacity = useDerivedValue(() => 0.45 + pulse.value * 0.25);

  if (cat === null && gull === null && curses.length === 0 && gates === null && !festival) {
    return null;
  }

  const s = layout.cellSize;

  return (
    <View style={[styles.overlay, { height: layout.height }]} testID={ENTITY_OVERLAY_TEST_ID}>
      <Canvas style={StyleSheet.absoluteFill}>
        {festival ? (
          <RoundedRect
            x={layout.originX}
            y={0}
            width={layout.width}
            height={layout.height}
            r={BOARD.CELL_RADIUS}
            color={LANTERN.festival}
            opacity={0.18}
          />
        ) : null}

        {gates !== null ? <Lanterns gates={gates} layout={layout} /> : null}

        {curses.map((curse) => {
          const o = cellOrigin(layout, curse.x, curse.y);
          const cx = o.x + s / 2;
          const cy = o.y + s / 2;
          return (
            <Group key={`curse-${curse.x}-${curse.y}`} opacity={veilOpacity}>
              <RoundedRect
                x={o.x}
                y={o.y}
                width={s}
                height={s}
                r={BOARD.CELL_RADIUS}
                color={CURSE_COLORS.veil}
              />
              <Oval
                x={cx - s * 0.3}
                y={cy - s * 0.17}
                width={s * 0.6}
                height={s * 0.34}
                color="#FFFFFF"
              />
              <Circle cx={cx} cy={cy} r={s * 0.15} color={CURSE_COLORS.iris} />
              <Circle cx={cx} cy={cy} r={s * 0.07} color={CURSE_COLORS.pupil} />
            </Group>
          );
        })}

        {cat !== null ? <CatGlyph cat={cat} layout={layout} /> : null}
        {gull !== null ? <GullGlyph gull={gull} layout={layout} theme={theme} /> : null}
      </Canvas>
    </View>
  );
}

/**
 * Dort kapinin fenerleri: ust/alt kenar ortasi ve sol/sag kenar ortasi.
 * Yanan fener sicak turuncu + hale; sonuk fener gri.
 */
function Lanterns({ gates, layout }: { readonly gates: number; readonly layout: BoardLayout }) {
  const r = Math.max(4, layout.cellSize * 0.16);
  const cx = layout.originX + layout.width / 2;
  const cy = layout.height / 2;
  const spots: readonly (readonly [number, number, number])[] = [
    [GATE.TOP, cx, r * 1.2],
    [GATE.BOTTOM, cx, layout.height - r * 1.2],
    [GATE.LEFT, layout.originX + r * 1.2, cy],
    [GATE.RIGHT, layout.originX + layout.width - r * 1.2, cy],
  ];
  return (
    <Group>
      {spots.map(([gate, x, y]) => {
        const lit = isGateLit(gates, gate);
        return (
          <Group key={gate}>
            {lit ? <Circle cx={x} cy={y} r={r * 2.2} color={LANTERN.glow} opacity={0.35} /> : null}
            <Circle
              cx={x}
              cy={y}
              r={r}
              color={lit ? LANTERN.lit : LANTERN.unlit}
              opacity={lit ? 1 : 0.55}
            />
            <Circle
              cx={x}
              cy={y - r * 0.35}
              r={r * 0.35}
              color="#FFFFFF"
              opacity={lit ? 0.9 : 0.3}
            />
          </Group>
        );
      })}
    </Group>
  );
}

/** Uyuyan kedi: yuvarlak kafa, iki kulak, kapali gozler; oksanmissa kalp. */
function CatGlyph({ cat, layout }: { readonly cat: Cat; readonly layout: BoardLayout }) {
  const s = layout.cellSize;
  const o = cellOrigin(layout, cat.x, cat.y);
  const cx = o.x + s / 2;
  const cy = o.y + s * 0.56;
  const ear = (dir: -1 | 1) =>
    `M ${cx + dir * s * 0.12} ${cy - s * 0.22} L ${cx + dir * s * 0.34} ${cy - s * 0.46} L ${cx + dir * s * 0.36} ${cy - s * 0.12} Z`;

  return (
    <Group>
      <Path path={ear(-1)} color={CAT_COLORS.fur} />
      <Path path={ear(1)} color={CAT_COLORS.fur} />
      <Circle cx={cx} cy={cy} r={s * 0.34} color={CAT_COLORS.fur} />
      <Path path={ear(-1)} color={CAT_COLORS.ear} opacity={0.5} />
      <Path path={ear(1)} color={CAT_COLORS.ear} opacity={0.5} />
      {/* kapali gozler: iki kucuk kavis yerine kisa cizgi */}
      <Line
        p1={vec(cx - s * 0.2, cy - s * 0.02)}
        p2={vec(cx - s * 0.08, cy - s * 0.02)}
        color={CAT_COLORS.eye}
        strokeWidth={s * 0.05}
      />
      <Line
        p1={vec(cx + s * 0.08, cy - s * 0.02)}
        p2={vec(cx + s * 0.2, cy - s * 0.02)}
        color={CAT_COLORS.eye}
        strokeWidth={s * 0.05}
      />
      <Circle cx={cx} cy={cy + s * 0.08} r={s * 0.04} color={CAT_COLORS.nose} />
      {cat.restTurns > 0 ? (
        // Oksanmis: kalp
        <Path
          path={`M ${cx + s * 0.3} ${cy - s * 0.42} c -${s * 0.08} -${s * 0.1} -${s * 0.22} 0 -${s * 0.12} ${s * 0.12} c ${s * 0.1} -${s * 0.12} -${s * 0.04} -${s * 0.22} -${s * 0.12} -${s * 0.12} Z`}
          color="#D9534F"
        />
      ) : null}
    </Group>
  );
}

/** Marti: sutunun ustunde tuneyen beyaz kus; kalan hamle kadar nokta. */
function GullGlyph({
  gull,
  layout,
  theme,
}: {
  readonly gull: Gull;
  readonly layout: BoardLayout;
  readonly theme: Theme;
}) {
  // Marti hucrenin ust yarisinda, kucuk: altindaki hucre gorunur kalsin.
  const s = layout.cellSize * 0.7;
  const o = cellOrigin(layout, gull.col, 0);
  const cx = o.x + layout.cellSize / 2;
  const cy = o.y + layout.cellSize * 0.34;

  return (
    <Group>
      {/* sutun vurgusu: martinin gozu bu sutunda */}
      <RoundedRect
        x={o.x}
        y={0}
        width={layout.cellSize}
        height={layout.height}
        r={BOARD.CELL_RADIUS}
        color={theme.ghostInvalid}
        opacity={0.12}
      />
      {/* Sutun vurgusunda genislik hucre boyutudur; kus daha kucuk. */}
      <Oval
        x={cx - s * 0.36}
        y={cy - s * 0.2}
        width={s * 0.72}
        height={s * 0.4}
        color={GULL_COLORS.body}
      />
      <Path
        path={`M ${cx - s * 0.3} ${cy - s * 0.05} L ${cx - s * 0.05} ${cy - s * 0.3} L ${cx + s * 0.15} ${cy - s * 0.02} Z`}
        color={GULL_COLORS.wing}
      />
      <Circle cx={cx + s * 0.26} cy={cy - s * 0.12} r={s * 0.14} color={GULL_COLORS.body} />
      <Path
        path={`M ${cx + s * 0.38} ${cy - s * 0.12} L ${cx + s * 0.52} ${cy - s * 0.08} L ${cx + s * 0.38} ${cy - s * 0.04} Z`}
        color={GULL_COLORS.beak}
      />
      <Circle cx={cx + s * 0.29} cy={cy - s * 0.15} r={s * 0.03} color={GULL_COLORS.eye} />
      {Array.from({ length: gull.turnsLeft }, (_, i) => (
        <Circle
          key={i}
          cx={cx - s * 0.2 + i * s * 0.16}
          cy={cy + s * 0.34}
          r={s * 0.05}
          color={GULL_COLORS.beak}
        />
      ))}
    </Group>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, pointerEvents: 'none' },
});

export const EntityOverlay = memo(EntityOverlayImpl);
