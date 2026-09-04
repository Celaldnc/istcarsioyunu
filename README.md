# İstanbul Çarşı Blok

> Türk esnaf mahallesinden ilham alan, İstanbul temalı bir blok bulmaca oyunu.
> Expo + React Native Skia + Reanimated ile tek kod tabanından iOS ve Android.

_A block-puzzle mobile game themed around Istanbul's bazaars, built solo with Expo,
React Native Skia and Reanimated._

---

## Durum

| Sprint | Kapsam                                                       | Durum       |
| ------ | ------------------------------------------------------------ | ----------- |
| 0      | Kurulum: Expo, TypeScript strict, lint/format/hook, Jest, CI | ✅ Tamam    |
| 1      | Oyun mantığı (`src/game/core`), TDD, %90 coverage            | ⏳ Sıradaki |
| 2      | Skia render katmanı (8×10 grid, parça tepsisi)               | —           |
| 3      | Gesture + sürükle-bırak + oyun döngüsü                       | —           |
| 4      | Ses, skor, kalıcı depolama (MMKV)                            | —           |
| 5      | 5 İstanbul teması, oyun modları, onboarding                  | —           |
| 6      | EAS build, App Store + Play Store yayını                     | —           |

## Gereksinimler

- **Node.js 24+** ve npm 11+
- **JDK 21** — Android Studio'nun getirdiği JBR yeterli
  (`C:\Program Files\Android\Android Studio\jbr`)
- **Android Studio** + Android SDK (platform 36, build-tools 36.x, NDK)
- iOS derlemesi için **macOS + Xcode** gerekir. Windows'ta iOS yerel derleme
  mümkün değildir; iOS tarafı EAS Cloud üzerinden alınır.

## Kurulum

```bash
npm install

# Android geliştirme derlemesi (ilk sefer ~10-20 dk)
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
npm run android
```

> **Expo Go çalışmaz.** Proje Skia, MMKV (Nitro Modules) ve Reanimated 4 gibi
> özel native modüller kullanacağı için **development build** zorunludur.

## Komutlar

| Komut               | Ne yapar                          |
| ------------------- | --------------------------------- |
| `npm start`         | Metro bundler                     |
| `npm run android`   | Yerel Android derlemesi + kurulum |
| `npm run lint`      | ESLint, 0 uyarı toleransı         |
| `npm run typecheck` | `tsc --noEmit`                    |
| `npm test`          | Jest                              |
| `npm run test:ci`   | Jest + coverage eşikleri          |
| `npm run doctor`    | `expo-doctor` sağlık kontrolü     |

## Mimari

```
src/
├── app/          Expo Router rotaları (dosya tabanlı yönlendirme)
├── game/
│   ├── core/     Saf TypeScript oyun mantığı — RN/Expo importu YASAK
│   ├── engine/   Skia + Reanimated render katmanı
│   ├── store/    Zustand
│   ├── audio/    Ses yönetimi
│   └── data/     Tema tanımları
├── components/   Paylaşılan UI parçaları
├── hooks/
└── constants/    config.ts — tüm sayısal sabitler
```

**Tek yönlü bağımlılık:** `app → store → core` ve `engine → core`.
`src/game/core` hiçbir şeye bakmaz.

Bu kural yorum satırıyla değil, **makineyle** zorlanır: `eslint.config.js`
içindeki `no-restricted-imports` kuralı `src/game/core/**` altında
React/React Native/Expo/Zustand importunu hata sayar. Böylece oyun mantığı
render'dan bağımsız kalır ve milisaniyeler içinde test edilebilir.

## Mimari Kararlar

| Karar                                | Gerekçe                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Expo SDK 57** (spec "54+" diyordu) | 54 üç sürüm eski; `expo-av` SDK 55'te tamamen kaldırıldı                                            |
| **`expo-audio`**, `expo-av` değil    | `expo-av` SDK 55'te kaldırıldı, geri dönüşü yok                                                     |
| **New Architecture zorunlu**         | Reanimated 4 ve MMKV v4 (Nitro) eski mimariyi desteklemiyor                                         |
| **Web hedefi kaldırıldı**            | Platform hedefi iOS+Android. Ayrıca MMKV/Nitro'nun web desteği yok; Sprint 4'te zaten kırılacaktı   |
| **`noUncheckedIndexedAccess: true`** | `board[y][x]` erişimi `Cell \| undefined` döner; sınır taşması bug'ları derleme zamanında yakalanır |
| **Development build**, Expo Go değil | Skia + MMKV + Nitro Expo Go'da çalışmaz                                                             |
| **pre-commit hızlı, pre-push tam**   | 40 sn'lik pre-commit commit'ten kaçınmaya yol açar; garanti aynı, dağıtımı farklı                   |

## Bilinen Tuzaklar

- **`@testing-library/react-native` v14'te `render()` asenkrondur** (`test-renderer` v1
  geçişi). `await` edilmezse `screen` bağlanmaz ve
  `` `render` function has not been called `` hatası alınır.
- **`jest.config.js` içinde `moduleNameMapper` tanımlama.** Jest, preset'in aynı
  anahtarını birleştirmez, ezer. `jest-expo` hem `@/*` alias'ını hem de
  `^react-native($|/.*)` tekilleştirmesini oradan sağlar; ezersen `react-native`
  iki ayrı modül örneği olarak yüklenir.
- **`tsconfig.json`'da `types: ["jest"]` gerekli.** TypeScript 6 +
  `expo/tsconfig.base` bileşiminde `@types/jest` otomatik toplanmıyor.
- **`npm run doctor --silent` kullanma.** `--silent`, `expo-doctor`'ın içeride
  çağırdığı `npm explain` komutlarına da geçer ve onları düşürür; proje sağlıklı
  olmasına rağmen sahte hata alırsın.

## Lisans

MIT
