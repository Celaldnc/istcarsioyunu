// Jest global kurulumu.
//
// Bilerek minimal tutuldu: @testing-library/react-native v14 kendi jest
// matcher'larini ve her testten sonraki otomatik cleanup'i zaten sagliyor.
//
// Skia mock'u kok __mocks__ klasorunde (Jest otomatik kullanir).
//
// Reanimated: resmi test rehberi setUpTests() ister; animasyonlar sahte
// zamanlayiciyla (jest.advanceTimersByTime) ilerletilir. Bu satir olmadan
// useSharedValue/useAnimatedStyle kullanan bilesenler "loadUnpackers"
// hatasiyla render edilemiyordu.
import { setUpTests } from 'react-native-reanimated';

setUpTests();
