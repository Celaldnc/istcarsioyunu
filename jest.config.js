/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Reanimated 4, react-native-worklets uzerine kurulu. Worklets'in Jest
  // rehberi bu cozumleyiciyi ister: paketin ".native" dosyalari yerine JS
  // mock uygulamasini secer. jest-expo kendi resolver'ini tanimlamiyor,
  // dolayisiyla burada ezilen bir sey yok.
  resolver: 'react-native-worklets/jest/resolver',
  // Testler arasi mock sizintisini engeller.
  clearMocks: true,
  restoreMocks: true,
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/.expo/',
    // Router kokune test dosyasi konmamali; oradaki her dosya rota adayidir.
    '<rootDir>/src/app/',
  ],
  // DIKKAT: burada moduleNameMapper TANIMLAMA. Jest, preset'in ayni anahtarini
  // birlestirmez, ezer. jest-expo hem tsconfig'deki "@/*" alias'ini hem de
  // "^react-native($|/.*)" tekillestirmesini oradan saglar; ezersen react-native
  // iki ayri modul ornegi olarak yuklenir ve RTL'in screen nesnesi hic baglanmaz.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    // Salt-tip dosyalar derlemede bos modul olur; olculecek kod icermezler.
    '!src/**/types.ts',
    // Router ekranlari E2E kapsamina girer. Dar tutuldu: src/app altina yazilan
    // yardimci .ts dosyalari olculmeye devam eder.
    '!src/app/**/*.tsx',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
    // Oyun mantigi render'dan bagimsiz ve saf oldugu icin burada cok daha
    // yuksek bir cita savunulabilir; spec'in DoD'u %90 istiyor.
    './src/game/core/': { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
};
