const { withStringsXml, AndroidConfig } = require('expo/config-plugins');

/**
 * Kullaniciya gorunen uygulama adini Android'de Turkce olarak ayarlar.
 *
 * NEDEN GEREKLI (Expo prebuild hatasi, SDK 57.0.20'de dogrulandi):
 * expo.name ASCII disi karakter icerdiginde prebuild, MainActivity.kt ve
 * MainApplication.kt dosyalarinin ICINE android.package yerine addan turetilmis
 * bir paket yaziyor:
 *
 *   dosya yolu : android/app/src/main/java/com/celaldinc/istcarsiblok/MainActivity.kt
 *   icindeki   : package com.istanbularblok        <- "İstanbul Çarşı Blok"dan
 *   namespace  : com.celaldinc.istcarsiblok
 *
 * BuildConfig namespace paketinde uretildigi icin Kotlin onu goremiyor ve
 * derleme "Unresolved reference 'BuildConfig'" ile dusuyor.
 *
 * Cozum: expo.name ASCII tutulur (prebuild dogru paketi turetir), kullanicinin
 * gordugu ad buradan geri yazilir. iOS tarafi app.json'daki
 * ios.infoPlist.CFBundleDisplayName ile ayarlanir.
 *
 * Dogrulama: ASCII adla derleme basarili; temiz bir SDK 57 projesine Turkce ad
 * verildiginde ayni hata olusuyor.
 */
module.exports = function withLocalizedAppName(config, { android } = {}) {
  if (!android) {
    return config;
  }

  return withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name', translatable: 'false' }, _: android }],
      cfg.modResults,
    );
    return cfg;
  });
};
