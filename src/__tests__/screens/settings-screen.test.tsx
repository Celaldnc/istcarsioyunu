import { render, screen } from '@testing-library/react-native';

import SettingsScreen from '@/app/(tabs)/settings';

/**
 * Entegrasyon dumani: jest-expo preset + TSX derlemesi + "@/" alias'i +
 * Themed bileseni + RTL zincirinin ucu uca calistigini dogrular.
 * Bu test kirmiziya donerse sorun ekranda degil, test altyapisindadir.
 *
 * DIKKAT: @testing-library/react-native v14'te render() ASENKRONDUR
 * (test-renderer v1 gecisiyle geldi). await edilmezse screen baglanmaz ve
 * "`render` function has not been called" hatasi alinir.
 */
describe('Ayarlar ekrani', () => {
  it('basligi ile render olur', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByText('Ayarlar')).toBeOnTheScreen();
  });
});
