/**
 * react-native-view-shot icin manuel mock: native yakalama yok; sahte bir
 * dosya yolu doner. Paylasim akisinin mantigi sharePostcard.test.ts'te
 * enjekte edilen sahte fonksiyonlarla test edilir.
 */
export function captureRef(_ref: unknown, _options?: unknown): Promise<string> {
  return Promise.resolve('file:///mock/kartpostal.png');
}
