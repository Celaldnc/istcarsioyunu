/**
 * Tema renk token'lari. Kod icinde ham renk literali kullanmak yasak
 * (config.ts'teki magic number kuralinin renk karsiligi).
 *
 * Kontrast oranlari WCAG AA'ya gore secildi:
 *   metin >= 4.5:1, metin disi UI >= 3:1
 */

// #fff uzerinde 5.77:1 (eski #2f95dc yalnizca 3.25:1 idi; sekme ETIKETINI de
// bu renk boyadigi icin kucuk metin esigini gecmiyordu)
const tintColorLight = '#1b6b9d';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000', //            #fff uzerinde 21.00:1
    background: '#fff',
    tint: tintColorLight, //    5.77:1
    tabIconDefault: '#6e6e6e', // 5.10:1
    tabIconSelected: tintColorLight,
    separator: '#e0e0e0', //    dekoratif ayrac
    link: '#1b6b9d', //         5.77:1
  },
  dark: {
    // Arka plan #000 yerine #121212: React Navigation DarkTheme'in kart/header
    // rengiyle ayni, ayrica OLED'de halation/goz yorgunlugu yapmiyor.
    text: '#e5e5e7', //         #121212 uzerinde 15.8:1
    background: '#121212',
    tint: tintColorDark,
    tabIconDefault: '#9b9b9b', // 6.74:1
    tabIconSelected: tintColorDark,
    separator: 'rgba(255,255,255,0.14)',
    link: '#55b8f6', //         8.54:1
  },
};
