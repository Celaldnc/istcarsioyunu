import { Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useSkiaWebReady } from '@/hooks/useSkiaWebReady';

/**
 * Oyun ekrani TEMBEL yuklenir.
 *
 * Skia'nin ana modulu import aninda global CanvasKit'i yakaliyor. Web'de
 * CanvasKit WASM ile sonradan geldigi icin, Skia kullanan modul uygulama
 * giris grafiginde statik bulunursa undefined bir CanvasKit ile kurulur.
 * lazy(), importu render anina erteler; render de ancak CanvasKit hazir
 * olduktan sonra yapilir.
 */
const GameScreen = lazy(() => import('@/game/screens/GameScreen'));

function Loading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator />
      <Text style={styles.label}>Oyun hazırlanıyor…</Text>
    </View>
  );
}

export default function PlayScreen() {
  const skiaReady = useSkiaWebReady();

  if (!skiaReady) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <GameScreen />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  label: { fontSize: 14, opacity: 0.7 },
});
