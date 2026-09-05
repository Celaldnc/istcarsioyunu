import type { EsnafEvent } from './esnaf';
import type { Theme } from './themes';

/**
 * "Bir Gun Istanbul": tahta paleti telefonun saatine gore degisir.
 *
 * Sabah simit sicakligi, ogle carsi, aksam Bogaz'da turuncu isik, gece
 * lacivert + fener. Uygulama her acilista farkli gorunur; sessiz bir geri
 * donus kancasi. Saf fonksiyonlar: saat parametre olarak gelir.
 */

export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

export function dayPhase(hour: number): DayPhase {
  if (hour >= 6 && hour < 11) {
    return 'morning';
  }
  if (hour >= 11 && hour < 18) {
    return 'day';
  }
  if (hour >= 18 && hour < 22) {
    return 'evening';
  }
  return 'night';
}

export function dayPhaseAt(date: Date): DayPhase {
  return dayPhase(date.getHours());
}

/** Faza gore tahta zemin/bos hucre renkleri (temanin ustune yazilir). */
const PHASE_COLORS: Readonly<Record<DayPhase, Pick<Theme, 'boardBackground' | 'emptyCell'>>> = {
  morning: { boardBackground: '#FBF1DF', emptyCell: '#F0E2C8' },
  day: { boardBackground: '#F5EBDC', emptyCell: '#E8DAC4' },
  evening: { boardBackground: '#F2DCC4', emptyCell: '#E4C6A8' },
  night: { boardBackground: '#2B2F45', emptyCell: '#3B405C' },
};

export function themeForPhase(base: Theme, phase: DayPhase): Theme {
  return { ...base, ...PHASE_COLORS[phase] };
}

/** Faza gore esnafin karsilama olayi; gunduz siradan "start". */
export function greetingForPhase(phase: DayPhase): EsnafEvent {
  switch (phase) {
    case 'morning':
      return 'morning';
    case 'evening':
      return 'evening';
    case 'night':
      return 'night';
    case 'day':
      return 'start';
  }
}
