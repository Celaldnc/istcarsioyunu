// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const testingLibrary = require('eslint-plugin-testing-library');

module.exports = defineConfig([
  {
    ignores: ['dist/*', 'coverage/*', 'android/*', 'ios/*', '.expo/*', 'node_modules/*'],
  },
  expoConfig,
  // Prettier ile cakisan bicimlendirme kurallarini kapatir. En sonda olmali.
  prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // console.log production'a sizmasin; uyari/hata bilincli tercihtir.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Mimari kural, makineyle zorlanir: src/game/core saf TypeScript kalmalidir.
    // Boylece oyun mantigi RN calistirmadan, milisaniyelerde test edilebilir.
    files: ['src/game/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Alt yollar da kapatildi: 'react-native/Libraries/...' gibi kacaklar
              // aksi halde '*' slash'i gecmedigi icin yakalanmiyordu.
              group: [
                'react',
                'react/*',
                'react-*',
                'react-*/**',
                'react-native/*',
                'expo',
                'expo-*',
                'expo-*/**',
                '@expo/*',
                '@shopify/*',
                'zustand',
                'zustand/*',
              ],
              message:
                'src/game/core saf TypeScript olmalidir (RN/Expo importu yasak). Render veya state ihtiyacini engine/ ya da store/ katmanina tasi.',
            },
          ],
        },
      ],
    },
  },
  {
    // Gelistirme scriptleri Node ortaminda calisir, React Native'de degil.
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  {
    // @testing-library/react-native v14'te render/fireEvent/renderHook ASENKRON.
    // await unutulursa "`render` function has not been called" gibi kafa karistirici
    // hatalar cikar. Bu kurallar o sinifin tamamini CI'da yakalar.
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    ...testingLibrary.configs['flat/react'],
  },
]);
