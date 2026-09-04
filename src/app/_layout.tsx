import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';

// expo-router bu adla export edilen bileseni hata siniri olarak kullanir.
export { AppErrorBoundary as ErrorBoundary } from '@/components/AppErrorBoundary';

export const unstable_settings = {
  // /modal yeniden yuklendiginde geri butonunun kalmasini saglar.
  initialRouteName: '(tabs)',
};

// Splash'in asset yuklemesi bitmeden kapanmasini engeller.
// preventAutoHideAsync bir promise dondurur; yakalanmazsa unhandled rejection uyarisi verir.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash zaten gizlenmisse onemsiz */
});

export default function RootLayout() {
  // TODO(sprint-2): Skia atlaslari ve TODO(sprint-4): ses dosyalari yuklenene
  // kadar splash burada tutulacak. Su an bekletilecek asset yok.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      /* splash zaten gizlenmisse onemsiz */
    });
  }, []);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* title verilmezse header rota adini ("modal") gosterir. */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Hakkında' }} />
      </Stack>
    </ThemeProvider>
  );
}
