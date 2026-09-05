# İstanbul Çarşı Blok

> Türk esnaf mahallesinden ilham alan, İstanbul temalı bir blok bulmaca oyunu.
> Expo + React Native Skia + Reanimated ile tek kod tabanından Android ve iOS.
> **v1.0 hedefi Google Play**; iOS kod tabanında destekleniyor ama v1.1'e ertelendi.

_A block-puzzle mobile game themed around Istanbul's bazaars, built solo with Expo,
React Native Skia and Reanimated._

---

## Durum

| Sprint | Kapsam                                                       | Durum       |
| ------ | ------------------------------------------------------------ | ----------- |
| 0      | Kurulum: Expo, TypeScript strict, lint/format/hook, Jest, CI | ✅ Tamam    |
| 1      | Oyun mantığı (`src/game/core`), TDD, %90 coverage            | ✅ Tamam    |
| 2      | Skia render katmanı (8×10 grid, parça tepsisi)               | ✅ Tamam    |
| 3      | Gesture + sürükle-bırak + oyun döngüsü                       | ✅ Tamam    |
| 4      | Ses, kalıcı depolama (MMKV), yüksek skor, ayarlar            | ✅ Tamam    |
| 4.5    | "His paketi": Çini bonusu, Çay molası, esnaf, efektler       | ✅ Tamam    |
| 5      | Günün Çarşısı, İstanbul Yolculuğu + kartpostallar, temalar   | ⏳ Sıradaki |
| 6      | EAS build + Google Play yayını (kapalı test → production)    | —           |
| 7      | iOS portu + App Store (v1.1, yalnızca v1.0 tutarsa)          | —           |

## Gereksinimler

- **Node.js 24+** ve npm 11+
- **JDK 21** — Android Studio'nun getirdiği JBR yeterli
  (`C:\Program Files\Android\Android Studio\jbr`)
- **Android Studio** + Android SDK (platform 36, build-tools 36.x, NDK)
- iOS derlemesi için **macOS + Xcode** gerekir. Windows'ta iOS yerel derleme
  mümkün değildir. v1.0 kapsamında iOS derlenmiyor; iOS konfigürasyonu
  (bundle identifier, görünen ad, `platforms`) bilerek korunuyor ki v1.1'de
  port maliyeti düşük kalsın.

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

## Tarayıcıda çalıştırma (en hızlı geliştirme döngüsü)

```bash
npm run web        # http://localhost:8081
```

Emülatör gerekmez, anında yenilenir. Skia web'de CanvasKit (WASM) ile çalışır;
`public/canvaskit.wasm` `npx setup-skia-web public` ile bir kez kopyalanır.
MMKV web'de `localStorage`'a düşer, yani kalıcılık da çalışır.

Web bir **yayın hedefi değildir** — v1.0 yalnızca Google Play. Amacı geliştirme
sırasında emülatör beklememektir.

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

## Açık Kalan İş: ses içeriği

`assets/sounds/` içindeki dosyalar
[scripts/generate-placeholder-sounds.mjs](scripts/generate-placeholder-sounds.mjs)
ile üretilen **sentetik tonlardır**. Spesifikasyonun istediği Türkçe sesli
efektler (simitçi "Günaydııın!", çaydanlık, vapur düdüğü, "Afiyet olsun!")
kayıt gerektirir ve kod tarafından üretilemez.

Ses sistemi hazır ve testli; gerçek kayıtlar geldiğinde `assets/sounds/`
içindeki dosyaları aynı adlarla değiştirmek yeterli — kodda değişiklik
gerekmez. Beklenen dosyalar: `place`, `clear`, `combo`, `invalid`,
`gameOver`, `cini` (çay bardağı çınlaması), `levelUp` (vapur düdüğü),
`record` (fanfar), `teaBreak` (`.wav` veya `.mp3`).

## Oyunu Farklı Kılan Mekanikler (araştırma tabanlı)

Rakip analizinin özeti: Block Blast'ın tutunması kuraldan değil **his**ten
(rekor çubuğu, başlangıçta "ayarlanmış şans", abartılı geri bildirim), Woodoku'nun
farkı **ses**ten geliyor; 1 numaralı şikâyet **reklam**. Buna göre eklenenler:

| Mekanik                  | Ne yapar                                                                                                                                                                                         | Nerede                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| **Çini bonusu**          | Tek renkli bir çizgi temizlemek +50. Renk türde ilk kez bir strateji boyutu                                                                                                                      | `core/board.ts monochromeLines` |
| **Yapışkan renk**        | Tepsi içi parça %45 olasılıkla öncekinin rengini alır; Çini kurulabilir olsun. rng tüketimi sabit                                                                                                | `core/pieces.ts pickColor`      |
| **Kolay başlangıç**      | İlk tepsi yalnızca küçük şekiller ("engineered luck")                                                                                                                                            | `core/pieces.ts STARTER_*`      |
| **Çay molası**           | Oyun başına 1 ücretsiz devam: en dolu 2 satır + 2 sütun boşalır. Rakipler bunu reklama satıyor                                                                                                   | `core/game.ts takeTeaBreak`     |
| **Çarşı esnafı**         | Yalnızca "an"larda konuşan karakter (rekor, Çini, combo, sıkışma…). Sıradan hamlede susar                                                                                                        | `data/esnaf.ts`                 |
| **Rekor çubuğu**         | "Rekora N kaldı" → "Yeni rekor!"                                                                                                                                                                 | `components/RecordBar.tsx`      |
| **Efektler**             | Çizgi parlaması + tema renginde parçacıklar (Skia + Reanimated, UI thread), uçan "+40 Çini!"                                                                                                     | `engine/ClearBurst.tsx`         |
| **Çarşı eşyası bloklar** | Her renk kimliği bir eşya: simit (halka+susam), çay bardağı, nazar boncuğu, lokum, fıstık, dövme bakır. Skia vektörü, resim yok; tema 6 renk + eşya listesi tanımlar, tonlar `shade()` ile türer | `engine/CellSprite.tsx`         |
| **Titreşim**             | Olaya göre hafif/orta/ağır; web'de kapalı; ayarlardan kapatılabilir                                                                                                                              | `game/haptics/`                 |

**Yol haritası (öncelik sırasıyla):** Günün Çarşısı (tarih seed'i hazır) →
İstanbul Yolculuğu (semt seviyeleri + kartpostal koleksiyonu, temaların
kilidini açar) → özel hücreler (nazar, çay bardağı), Pazarlık (perk seçimi),
Boğaz akıntısı modu. v1.0 **reklamsız** çıkar.

## Yayın Stratejisi

**v1.0: yalnızca Google Play.** Gerekçe: Apple $99/yıl'a karşı Play $25 tek
seferlik; Windows'ta iOS derlemesi mümkün değil; Expo/RN ile iOS portu yeniden
yazım değil konfigürasyon işi. Uygulama tutarsa iOS v1.1'de açılır.

**Play production'a çıkış şartı (kişisel geliştirici hesapları):** 13 Kasım
2023'ten sonra açılmış kişisel hesaplar, production erişimi için **12 farklı
testçiyle 14 gün kesintisiz kapalı test** yapmak zorundadır. Emülatör ve
mükerrer hesaplar sayılmaz. Bu, Sprint 6'nın takvimine doğrudan girer:
testçi toplama işine sprint başlamadan başlanmalıdır.
(Kuruluş hesaplarında bu şart aranmaz.)

## Mimari Kararlar

| Karar                                | Gerekçe                                                                                                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expo SDK 57** (spec "54+" diyordu) | 54 üç sürüm eski; `expo-av` SDK 55'te tamamen kaldırıldı                                                                                                                                                                      |
| **`expo-audio`**, `expo-av` değil    | `expo-av` SDK 55'te kaldırıldı, geri dönüşü yok                                                                                                                                                                               |
| **New Architecture zorunlu**         | Reanimated 4 ve MMKV v4 (Nitro) eski mimariyi desteklemiyor                                                                                                                                                                   |
| **Web geliştirme için açık**         | Sprint 0'da "MMKV'nin web desteği yok" gerekçesiyle kapatılmıştı; bu **yanlıştı** — MMKV v4'ün `localStorage` tabanlı web uygulaması, Skia'nın da CanvasKit desteği var. Web bir yayın hedefi değil, hızlı geliştirme döngüsü |
| **`noUncheckedIndexedAccess: true`** | `board[y][x]` erişimi `Cell \| undefined` döner; sınır taşması bug'ları derleme zamanında yakalanır                                                                                                                           |
| **Development build**, Expo Go değil | Skia + MMKV + Nitro Expo Go'da çalışmaz                                                                                                                                                                                       |
| **pre-commit hızlı, pre-push tam**   | 40 sn'lik pre-commit commit'ten kaçınmaya yol açar; garanti aynı, dağıtımı farklı                                                                                                                                             |
| **Kayıt göçü, atma değil**           | `SAVE_VERSION` artınca eski kayıt `MIGRATIONS` zinciriyle güncel şemaya çıkarılır (v1→v2 seri, v2→v3 Çay molası). Oyuncu güncelleme yüzünden oyununu kaybetmez                                                                |
| **Reanimated 4 Jest kurulumu**       | `resolver: 'react-native-worklets/jest/resolver'` + `setUpTests()`; aksi halde `loadUnpackers` hatası. Zamanlayıcıdan gelen state güncellemeleri React 19'da yalnızca **async `act`** ile flush olur                          |

## Bilinen Tuzaklar

- **`expo.name` ASCII dışı karakter içeremez.** Prebuild, Kotlin dosyalarının
  içine `android.package` yerine addan türetilmiş bir paket yazıyor ve derleme
  `Unresolved reference 'BuildConfig'` ile düşüyor. Türkçe görünen ad
  [withLocalizedAppName.js](plugins/withLocalizedAppName.js) ile geri yazılır.
- **`GestureHandlerRootView` olmadan sürükleme sessizce çalışmaz.** Kök
  layout'ta duruyor; kaldırılırsa hata sadece konsola düşer.
- **`react-native-gesture-handler` sürümünü `npx expo install` ile ekleyin.**
  Transitive olarak gelen 3.2.1 SDK 57 ile uyumsuzdu; doğrusu 2.32.0.
- **RNGH jest-utils:** `State.ACTIVE` `onStart`'ı tetikler; `onUpdate` için
  `state` alanı **olmayan** ek bir olay gerekir. Ayrıca `fireGestureHandler`
  eksik yaşam döngüsü olaylarını kendisi tamamlar, yani geçici sürükleme
  durumu bu yolla yakalanamaz.
- **Emülatörde ilk soğuk açılış ANR verebilir.** Skia'nın eklediği yükle
  başlangıç zaman aşımına uğrayabiliyor; ikinci açılış sorunsuz.
- **MMKV v4'te metod adı `remove()`,** v3'teki `delete()` kaldırılmış.
- **MMKV ve expo-audio Jest'te import anında patlar** (native modül yok).
  MMKV'nin kendi `isTest()` mock'u yetmez; sorun çalışma anında değil
  yüklenme anında. İkisi için de kök `__mocks__` altında manuel mock var.
- **Yerel derlemede tek ABI kullanın:** `npm run android:emu` yalnızca x86_64
  derler; dört mimari 9 dakika sürerken bu 1.5 dakika.

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
