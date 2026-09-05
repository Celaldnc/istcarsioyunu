import {
  activeEvent,
  calendarOverrides,
  isAfterIftar,
  isoDate,
  sunsetHourIstanbul,
} from '../calendar';

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);

describe('takvim etkinlikleri', () => {
  it('isoDate yerel tarihi YYYY-MM-DD yazar', () => {
    expect(isoDate(at(2026, 3, 5))).toBe('2026-03-05');
  });

  it('Ramazan ve bayramlari tablodan bulur', () => {
    expect(activeEvent(at(2026, 3, 1))?.id).toBe('ramazan');
    expect(activeEvent(at(2026, 3, 21))?.id).toBe('ramazanBayrami');
    expect(activeEvent(at(2027, 5, 17))?.id).toBe('kurbanBayrami');
  });

  it('sabit gunler: 29 Ekim ve yilbasi', () => {
    expect(activeEvent(at(2026, 10, 29))?.id).toBe('cumhuriyet');
    expect(activeEvent(at(2030, 1, 1))?.id).toBe('yilbasi');
  });

  it('siradan gunde etkinlik yoktur', () => {
    expect(activeEvent(at(2026, 7, 14))).toBeNull();
  });

  it('bayram kurallari ustune yazar', () => {
    expect(calendarOverrides(at(2026, 3, 21)).ciniMultiplier).toBe(2);
    expect(calendarOverrides(at(2026, 7, 14))).toEqual({});
  });
});

describe('Istanbul gun batimi', () => {
  it('yazin gec, kisin erken batar', () => {
    const summer = sunsetHourIstanbul(at(2026, 6, 21));
    const winter = sunsetHourIstanbul(at(2026, 12, 21));

    expect(summer).toBeGreaterThan(20);
    expect(summer).toBeLessThan(21);
    expect(winter).toBeGreaterThan(17);
    expect(winter).toBeLessThan(18);
  });

  it('Ramazan`da iftardan once false, sonra true', () => {
    expect(isAfterIftar(at(2026, 3, 1, 12))).toBe(false);
    expect(isAfterIftar(at(2026, 3, 1, 21))).toBe(true);
  });

  it('Ramazan disinda iftar yoktur', () => {
    expect(isAfterIftar(at(2026, 7, 14, 23))).toBe(false);
  });

  it('iftar sonrasi ek cay molasi', () => {
    expect(calendarOverrides(at(2026, 3, 1, 22)).teaBreaks).toBe(2);
  });
});
