import { renderHook } from '@testing-library/react-native';

import { useThemeColor } from '../Themed';

import Colors from '@/constants/Colors';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const coreHook = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default;

describe('useThemeColor', () => {
  it('acik temada token degerini dondurur', async () => {
    coreHook.mockReturnValue('light');

    const { result } = await renderHook(() => useThemeColor({}, 'text'));

    expect(result.current).toBe(Colors.light.text);
  });

  it('koyu temada token degerini dondurur', async () => {
    coreHook.mockReturnValue('dark');

    const { result } = await renderHook(() => useThemeColor({}, 'text'));

    expect(result.current).toBe(Colors.dark.text);
  });

  it('acik temada prop ile verilen rengi token yerine kullanir', async () => {
    coreHook.mockReturnValue('light');

    const { result } = await renderHook(() => useThemeColor({ light: '#123456' }, 'text'));

    expect(result.current).toBe('#123456');
  });

  it('koyu temada prop ile verilen rengi token yerine kullanir', async () => {
    coreHook.mockReturnValue('dark');

    const { result } = await renderHook(() => useThemeColor({ dark: '#654321' }, 'text'));

    expect(result.current).toBe('#654321');
  });

  it('aktif temaya ait prop yoksa token degerine duser', async () => {
    coreHook.mockReturnValue('dark');

    const { result } = await renderHook(() => useThemeColor({ light: '#123456' }, 'text'));

    expect(result.current).toBe(Colors.dark.text);
  });
});
