import type { GameRules } from '@/game/core/rules';

/**
 * Takvim etkinlikleri — SUNUCUSUZ canli servis.
 *
 * Ramazan, bayramlar, 29 Ekim ve yilbasi tarihten turetilir. Hicri takvim
 * yildan yila kaydigi icin Ramazan/bayram araliklari TABLO olarak tutulur
 * (Diyanet takvimine gore, 2026-2028). Tablo bitince etkinlik yoktur; oyun
 * bozulmaz, sadece susar. Yeni yil eklemek = tabloya satir eklemek.
 */

export type CalendarEventId =
  'ramazan' | 'ramazanBayrami' | 'kurbanBayrami' | 'cumhuriyet' | 'yilbasi';

export interface CalendarEvent {
  readonly id: CalendarEventId;
  readonly title: string;
  readonly text: string;
  readonly emoji: string;
  /** Etkinlik suresince kurallara eklenen ustune yazmalar. */
  readonly overrides: Partial<GameRules>;
}

interface DateRange {
  readonly id: CalendarEventId;
  /** YYYY-MM-DD, dahil. */
  readonly from: string;
  readonly to: string;
}

/** Diyanet takvimi (Ramazan ilk gun - arife; bayramlar tam gun). */
const RANGES: readonly DateRange[] = [
  { id: 'ramazan', from: '2026-02-18', to: '2026-03-19' },
  { id: 'ramazanBayrami', from: '2026-03-20', to: '2026-03-22' },
  { id: 'kurbanBayrami', from: '2026-05-27', to: '2026-05-30' },
  { id: 'ramazan', from: '2027-02-08', to: '2027-03-08' },
  { id: 'ramazanBayrami', from: '2027-03-09', to: '2027-03-11' },
  { id: 'kurbanBayrami', from: '2027-05-16', to: '2027-05-19' },
  { id: 'ramazan', from: '2028-01-28', to: '2028-02-25' },
  { id: 'ramazanBayrami', from: '2028-02-26', to: '2028-02-28' },
  { id: 'kurbanBayrami', from: '2028-05-05', to: '2028-05-08' },
];

const EVENTS: Readonly<Record<CalendarEventId, Omit<CalendarEvent, 'id'>>> = {
  ramazan: {
    title: 'Ramazan',
    text: 'İftardan sonra ilk oyunda bir ek çay molası: İftar topu!',
    emoji: '🌙',
    overrides: {},
  },
  ramazanBayrami: {
    title: 'Ramazan Bayramı',
    text: 'Bayram şekeri: Çini bonusu iki kat.',
    emoji: '🍬',
    overrides: { ciniMultiplier: 2 },
  },
  kurbanBayrami: {
    title: 'Kurban Bayramı',
    text: 'Bayramınız kutlu olsun! Ek bir çay molası.',
    emoji: '🎉',
    overrides: { teaBreaks: 2 },
  },
  cumhuriyet: {
    title: '29 Ekim',
    text: 'Cumhuriyet Bayramı: pazarlık hakkı iki kat.',
    emoji: '🇹🇷',
    overrides: { haggles: 6 },
  },
  yilbasi: {
    title: 'Yılbaşı',
    text: 'Yeni yıl, yeni tezgâh: ilk 3 tepsi kolay.',
    emoji: '🎆',
    overrides: { starterTrays: 3 },
  },
};

const pad = (n: number): string => String(n).padStart(2, '0');

/** Yerel tarih -> YYYY-MM-DD. */
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function eventIdFor(date: Date): CalendarEventId | null {
  const day = isoDate(date);
  const md = day.slice(5);
  if (md === '10-29') {
    return 'cumhuriyet';
  }
  if (md === '01-01') {
    return 'yilbasi';
  }
  const range = RANGES.find((r) => day >= r.from && day <= r.to);
  return range?.id ?? null;
}

/** Bugunun etkinligi; yoksa null. Bayramlar Ramazan'in onune gecer. */
export function activeEvent(date: Date): CalendarEvent | null {
  const id = eventIdFor(date);
  return id === null ? null : { id, ...EVENTS[id] };
}

// --- Istanbul gun batimi (NOAA yaklasimi) -----------------------------------

const ISTANBUL = { lat: 41.01, lon: 28.98, utcOffsetHours: 3 } as const;
const RAD = Math.PI / 180;

/** Yilin gunu (1-366). */
function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - start) / 86_400_000) + 1;
}

/**
 * Istanbul icin gun batimi saati (yerel, ondalik saat). Dakika duzeyinde
 * dogruluk yeterli: "iftardan sonra mi?" sorusu icin kullaniliyor.
 */
export function sunsetHourIstanbul(date: Date): number {
  const n = dayOfYear(date);
  const gamma = ((2 * Math.PI) / 365) * (n - 1 + (12 - 12) / 24);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const lat = ISTANBUL.lat * RAD;
  const zenith = 90.833 * RAD;
  const cosHa =
    Math.cos(zenith) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl);
  const ha = Math.acos(Math.max(-1, Math.min(1, cosHa))) / RAD;
  // NOAA: gun DOGUMU = 720 - 4*(lon + ha) - eqTime; gun BATIMI icin saat
  // acisi isareti degisir: 720 - 4*(lon - ha) - eqTime (lon dogu pozitif).
  const sunsetUtcMinutes = 720 - 4 * (ISTANBUL.lon - ha) - eqTime;
  const local = sunsetUtcMinutes / 60 + ISTANBUL.utcOffsetHours;
  return ((local % 24) + 24) % 24;
}

/** Ramazan'da ve iftar gectiyse true: "Iftar topu" ek cay molasi hakki. */
export function isAfterIftar(date: Date): boolean {
  if (activeEvent(date)?.id !== 'ramazan') {
    return false;
  }
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= sunsetHourIstanbul(date);
}

/** Bugunun kural ustune yazmalari (etkinlik + iftar). */
export function calendarOverrides(date: Date): Partial<GameRules> {
  const event = activeEvent(date);
  const base = event?.overrides ?? {};
  return isAfterIftar(date) ? { ...base, teaBreaks: 2 } : base;
}
