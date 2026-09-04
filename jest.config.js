/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // DIKKAT: burada moduleNameMapper TANIMLAMA. Jest, preset'in ayni anahtarini
  // birlestirmez, ezer. jest-expo preset'i hem tsconfig'deki "@/*" alias'ini hem
  // de "^react-native($|/.*)" tekillestirmesini saglar; ezersen react-native iki
  // ayri modul ornegi olarak yuklenir ve RTL'in screen nesnesi hic baglanmaz.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    // Router ekranlari E2E kapsamina girer, birim testi hedefi degildir.
    '!src/app/**',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
    // NOT: './src/game/core/' icin %90 esigi Sprint 1'in ilk commit'inde
    // eklenecek. Henuz var olmayan bir dizine esik koymak Jest'i
    // "coverage data not found" hatasiyla dusurur.
  },
};
