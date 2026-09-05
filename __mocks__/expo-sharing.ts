/** expo-sharing icin manuel mock (native paylasim sayfasi yok). */
export function isAvailableAsync(): Promise<boolean> {
  return Promise.resolve(true);
}

export function shareAsync(_url: string, _options?: unknown): Promise<void> {
  return Promise.resolve();
}
