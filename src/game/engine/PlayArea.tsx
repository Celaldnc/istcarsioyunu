import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { GameCanvas } from './GameCanvas';
import { ClearBurst } from './ClearBurst';
import { DragPiece } from './DragPiece';
import { GhostOverlay } from './GhostOverlay';
import { PieceTray } from './PieceTray';

import { LAYOUT } from '@/constants/config';
import { computeBoardLayout, computeTrayLayout, traySlotAt } from '@/game/core/layout';
import { dragOrigin, previewPlacement } from '@/game/core/placement';
import type { Board, FullLines, Piece, Point } from '@/game/core/types';
import type { Theme } from '@/game/data/themes';

/** Suruklenen parcanin o anki durumu. Koordinatlar oyun alanina goredir. */
interface DragState {
  readonly index: number;
  readonly x: number;
  readonly y: number;
}

interface PlayAreaProps {
  readonly board: Board;
  readonly tray: readonly (Piece | undefined)[];
  /** Kullanilabilir genislik; layout bundan turetilir. */
  readonly width: number;
  readonly theme: Theme;
  /**
   * Oyun alanina ayrilan dikey alan. Verilmezse yalnizca genislik sinirlar.
   *
   * 10 satirli tahtada baglayici kisit genelde yukseklik: verilmezse tahta
   * ekrandan tasar ve kirpilan uclardan biri tepsi, yani tek etkilesimli oge
   * olur.
   */
  readonly maxHeight?: number;
  /**
   * Son hamlenin temizleme efekti. `token` her hamlede degisir; `lines`
   * bos ise efekt cizilmez.
   */
  readonly burst?: { readonly lines: FullLines; readonly token: string };
  /** Gecerli bir birakma oldugunda cagrilir. */
  readonly onDrop: (trayIndex: number, origin: Point) => void;
}

export const PLAY_PAN_TEST_ID = 'play-pan';

/**
 * Tahta + tepsi + surukleme etkilesimi.
 *
 * Tek bir Pan hareketi tum alani kapsiyor; hangi yuvadan baslandigi
 * dokunusun y/x koordinatindan cikariliyor. Boylece yuva basina ayri
 * handler kurmak ve olcum (measure) yapmak gerekmiyor - tum koordinatlar
 * zaten bu View'a goredir.
 *
 * Hareket callback'leri .runOnJS(true) ile JS thread'inde calisiyor.
 * Gerekce: konum -> hucre donusumu ve gecerlilik kontrolu core'daki saf
 * fonksiyonlarda; bunlari worklet'e tasimak icin isaretlemek gerekirdi ve
 * o yol Sprint 3'te olcum yapmadan girilecek bir karmasiklik degil.
 * Olcum altyapisi kurulunca (PerformanceMonitor) tekrar degerlendirilecek.
 */
export function PlayArea({ board, tray, width, theme, maxHeight, burst, onDrop }: PlayAreaProps) {
  const trayLayout = useMemo(() => computeTrayLayout(width), [width]);

  // Tahtaya kalan yukseklik: toplam alandan tepsi ve aradaki bosluk dusulur.
  const boardBudget =
    maxHeight === undefined
      ? Number.POSITIVE_INFINITY
      : maxHeight - trayLayout.height - LAYOUT.BOARD_TRAY_GAP;

  const boardLayout = useMemo(() => computeBoardLayout(width, boardBudget), [width, boardBudget]);
  const trayTop = boardLayout.height + LAYOUT.BOARD_TRAY_GAP;

  const [drag, setDrag] = useState<DragState | null>(null);
  // Hareket callback'leri kapanis (closure) icinde eskimis durumu gormesin.
  const dragRef = useRef<DragState | null>(null);

  const updateDrag = useCallback((next: DragState | null) => {
    dragRef.current = next;
    setDrag(next);
  }, []);

  const draggedPiece = drag === null ? null : (tray[drag.index] ?? null);

  const preview = useMemo(() => {
    if (drag === null) {
      return null;
    }
    const piece = tray[drag.index];
    if (piece === undefined) {
      return null;
    }
    const origin = dragOrigin(boardLayout, { x: drag.x, y: drag.y }, piece);
    return previewPlacement(board, piece, origin);
  }, [drag, tray, boardLayout, board]);

  // Handler govdeleri useCallback icinde: ref erisimi render fazinda degil,
  // hareket tetiklendiginde olur (react-hooks/refs kuralinin istedigi de bu).
  const handleBegin = useCallback(
    (event: { x: number; y: number }) => {
      // Surukleme yalnizca tepsiden baslar; tahtaya dokunmak bir sey yapmaz.
      if (event.y < trayTop) {
        return;
      }
      const index = traySlotAt(trayLayout, width, event.x);
      if (index === null || tray[index] === undefined) {
        return;
      }
      updateDrag({ index, x: event.x, y: event.y });
    },
    [trayTop, trayLayout, width, tray, updateDrag],
  );

  const handleUpdate = useCallback(
    (event: { x: number; y: number }) => {
      const current = dragRef.current;
      if (current === null) {
        return;
      }
      updateDrag({ index: current.index, x: event.x, y: event.y });
    },
    [updateDrag],
  );

  const handleFinalize = useCallback(() => {
    const current = dragRef.current;
    updateDrag(null);

    if (current === null) {
      return;
    }
    const piece = tray[current.index];
    if (piece === undefined) {
      return;
    }
    const origin = dragOrigin(boardLayout, { x: current.x, y: current.y }, piece);
    if (origin !== null) {
      onDrop(current.index, origin);
    }
  }, [tray, boardLayout, onDrop, updateDrag]);

  /*
   * react-hooks/refs asagida devre disi.
   *
   * Kural, ref okuyabilecek bir callback'in render sirasinda bir fonksiyona
   * gecirilmesini uyari sayiyor. Burada dragRef render fazinda OKUNMUYOR;
   * yalnizca native hareket olayi geldiginde calisan callback'lerin icinde
   * okunuyor.
   *
   * Alternatif, hareket nesnesini her render'da yeniden kurmak olurdu; bu da
   * surukleme sirasinda saniyede ~60 kez GestureDetector yeniden
   * yapilandirmasi demek. Ref hem daha ucuz hem de dogru.
   */
  /* eslint-disable react-hooks/refs */
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .withTestId(PLAY_PAN_TEST_ID)
        .onBegin(handleBegin)
        .onUpdate(handleUpdate)
        .onFinalize(handleFinalize),
    [handleBegin, handleUpdate, handleFinalize],
  );
  /* eslint-enable react-hooks/refs */

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.container, { width }]}>
        <GameCanvas board={board} layout={boardLayout} theme={theme} />

        {burst !== undefined ? (
          <ClearBurst lines={burst.lines} token={burst.token} layout={boardLayout} theme={theme} />
        ) : null}

        {preview !== null && preview.cells.length > 0 ? (
          <GhostOverlay
            cells={preview.cells}
            valid={preview.valid}
            layout={boardLayout}
            theme={theme}
          />
        ) : null}

        <View style={{ height: LAYOUT.BOARD_TRAY_GAP }} />

        <PieceTray pieces={tray} layout={trayLayout} theme={theme} dimmedIndex={drag?.index} />

        {/* Suruklenen parca parmagi takip eder. Hayaletle ayni matematigi
            kullandigi icin ikisi birbirinden kaymaz. */}
        {draggedPiece !== null && drag !== null ? (
          <DragPiece
            piece={draggedPiece}
            pointer={{ x: drag.x, y: drag.y }}
            layout={boardLayout}
            theme={theme}
          />
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
});
