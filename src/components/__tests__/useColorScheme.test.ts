import { renderHook } from '@testing-library/react-native';

import { useColorScheme } from '../useColorScheme';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const coreHook = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default;

describe('useColorScheme', () => {
  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    // RN tipi 'unspecified' vaat eder...
    ['unspecified', 'light'],
    // ...ama Appearance native katman hazir degilken tipte gorunmeyen null doner.
    [null, 'light'],
    [undefined, 'light'],
  ])('%p degerini %p olarak normalize eder', async (coreValue, expected) => {
    coreHook.mockReturnValue(coreValue);

    const { result } = await renderHook(() => useColorScheme());

    expect(result.current).toBe(expected);
  });
});
