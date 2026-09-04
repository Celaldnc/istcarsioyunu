// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

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
    files: ['src/game/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'react-native',
                'react-native-*',
                'expo',
                'expo-*',
                '@shopify/*',
                'zustand',
              ],
              message:
                'src/game/core saf TypeScript olmalidir (RN/Expo importu yasak). Render veya state ihtiyacini engine/ ya da store/ katmanina tasi.',
            },
          ],
        },
      ],
    },
  },
]);
