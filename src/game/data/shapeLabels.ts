/**
 * Parca sekillerinin ekran okuyucu icin Turkce adlari.
 *
 * Sprint 5'te i18n katmani gelince bu tablo ceviri anahtarlarina donusecek;
 * simdilik tek dil oldugu icin dogrudan metin tutuluyor.
 */
const LABELS: Readonly<Record<string, string>> = {
  dot: 'tek kare',
  'line-h2': 'yatay ikili',
  'line-v2': 'dikey ikili',
  'line-h3': 'yatay üçlü',
  'line-v3': 'dikey üçlü',
  square: 'kare',
  corner: 'köşe',
  l: 'L parçası',
  t: 'T parçası',
  s: 'S parçası',
  z: 'Z parçası',
  plus: 'artı',
};

export function shapeLabel(shapeId: string): string {
  return LABELS[shapeId] ?? 'parça';
}
