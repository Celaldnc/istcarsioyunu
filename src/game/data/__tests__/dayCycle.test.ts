import { dayPhase, dayPhaseAt, greetingForPhase, themeForPhase } from '../dayCycle';
import { CARSI } from '../themes';

describe('gun dongusu', () => {
  it('saati faza cevirir', () => {
    expect(dayPhase(7)).toBe('morning');
    expect(dayPhase(13)).toBe('day');
    expect(dayPhase(19)).toBe('evening');
    expect(dayPhase(23)).toBe('night');
    expect(dayPhase(3)).toBe('night');
  });

  it('tarihten fazi turetir', () => {
    expect(dayPhaseAt(new Date(2026, 0, 1, 8))).toBe('morning');
  });

  it('faz temanin yalnizca zemin renklerini degistirir', () => {
    const night = themeForPhase(CARSI, 'night');

    expect(night.boardBackground).not.toBe(CARSI.boardBackground);
    expect(night.palette).toBe(CARSI.palette);
    expect(night.sprites).toBe(CARSI.sprites);
  });

  it('gunduz zemin temanin kendisidir', () => {
    expect(themeForPhase(CARSI, 'day').boardBackground).toBe(CARSI.boardBackground);
  });

  it('faza gore karsilama repligi', () => {
    expect(greetingForPhase('morning')).toBe('morning');
    expect(greetingForPhase('day')).toBe('start');
    expect(greetingForPhase('evening')).toBe('evening');
    expect(greetingForPhase('night')).toBe('night');
  });
});
