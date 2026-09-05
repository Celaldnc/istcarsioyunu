import { fireEvent, render, screen } from '@testing-library/react-native';

import { HAGGLE_NEEDLE_TEST_ID, HagglePanel, isHit } from '../HagglePanel';

import { HAGGLE } from '@/constants/config';
import { shapeById } from '@/game/core/pieces';
import type { Piece } from '@/game/core/types';

const pieceOf = (id: string): Piece => {
  const shape = shapeById(id);
  if (shape === undefined) {
    throw new Error(`Test kurulumu hatali: ${id} sekli yok.`);
  }
  return { shape, colorId: 1 };
};

const tray = [pieceOf('dot'), undefined, pieceOf('square')];

describe('isHit', () => {
  it('ortadaki bolgeyi tutturur, kenarlari kacirir', () => {
    expect(isHit(0.5)).toBe(true);
    expect(isHit(0.5 + HAGGLE.TARGET_WIDTH / 2)).toBe(true);
    expect(isHit(0.5 + HAGGLE.TARGET_WIDTH)).toBe(false);
    expect(isHit(0)).toBe(false);
    expect(isHit(1)).toBe(false);
  });
});

describe('HagglePanel', () => {
  it('yalnizca dolu yuvalari secenek olarak sunar', async () => {
    await render(
      <HagglePanel tray={tray} hagglesLeft={2} onResult={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByLabelText('1. parçayı pazarlığa koy')).toBeOnTheScreen();
    expect(screen.queryByLabelText('2. parçayı pazarlığa koy')).toBeNull();
    expect(screen.getByLabelText('3. parçayı pazarlığa koy')).toBeOnTheScreen();
    expect(screen.getByText(/2 hak/)).toBeOnTheScreen();
  });

  it('yuva secilince ibre belirir ve DUR sonucu iletir', async () => {
    const onResult = jest.fn();
    await render(
      <HagglePanel tray={tray} hagglesLeft={2} onResult={onResult} onClose={jest.fn()} />,
    );

    fireEvent.press(screen.getByLabelText('3. parçayı pazarlığa koy'));
    // React 19: state guncellemesi asenkron flush olur; ibre beklenir.
    expect(await screen.findByTestId(HAGGLE_NEEDLE_TEST_ID)).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Dur'));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0]?.[0]).toBe(2);
    expect(typeof onResult.mock.calls[0]?.[1]).toBe('boolean');
  });

  it('vazgec kapatir', async () => {
    const onClose = jest.fn();
    await render(
      <HagglePanel tray={tray} hagglesLeft={1} onResult={jest.fn()} onClose={onClose} />,
    );

    fireEvent.press(screen.getByLabelText('Vazgeç'));

    expect(onClose).toHaveBeenCalled();
  });
});
