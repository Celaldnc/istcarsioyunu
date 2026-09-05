import React from 'react';
import { View, type ViewProps } from 'react-native';

/**
 * @shopify/react-native-skia icin hafif manuel mock.
 *
 * Neden paketin kendi jestSetup.js dosyasi kullanilmiyor: o mock global
 * CanvasKit (WASM) bekliyor ve kendi test ortamini (jestEnv.js) gerektiriyor;
 * bu da jest-expo'nun react-native test ortamini ezerdi.
 *
 * Bu mock cizim yapmaz, yalnizca AGACI dogrular: hangi sekil kac kez, hangi
 * konum ve renkle isteniyor. Piksel dogrulugu emulatorde gozle, burada degil.
 *
 * node_modules paketleri icin kok dizindeki __mocks__ klasoru Jest tarafindan
 * OTOMATIK kullanilir; testlerde ayrica jest.mock() cagirmak gerekmez.
 */

type SkiaStubProps = Record<string, unknown> & { readonly children?: React.ReactNode };

function createStub(testID: string) {
  return function SkiaStub({ children, ...rest }: SkiaStubProps) {
    return React.createElement(View, { testID, ...(rest as ViewProps) }, children);
  };
}

export const Canvas = createStub('skia-canvas');
export const Group = createStub('skia-group');
export const Rect = createStub('skia-rect');
export const RoundedRect = createStub('skia-rounded-rect');
export const Fill = createStub('skia-fill');
export const Circle = createStub('skia-circle');
export const Oval = createStub('skia-oval');
export const Line = createStub('skia-line');
export const Path = createStub('skia-path');

/** Geometri yardimcilari: gercek Skia'da SkRect/SkRRect, burada duz nesne. */
export const rect = (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
});
export const rrect = (r: ReturnType<typeof rect>, rx: number, ry: number) => ({ rect: r, rx, ry });
export const vec = (x: number, y: number) => ({ x, y });
