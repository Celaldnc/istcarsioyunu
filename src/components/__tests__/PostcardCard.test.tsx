import { render, screen } from '@testing-library/react-native';

import { POSTCARD_TEST_ID, PostcardCard, SKYLINE_PATH } from '../PostcardCard';

describe('PostcardCard', () => {
  it('skor, baslik ve unvani gosterir', async () => {
    await render(
      <PostcardCard
        heading="Eminönü"
        emoji="⛴️"
        score={1200}
        title="Kalfa"
        dateText="5 Eylül 2026"
        color="#1E6FA8"
      />,
    );

    expect(screen.getByTestId(POSTCARD_TEST_ID)).toBeOnTheScreen();
    expect(screen.getByText('Eminönü')).toBeOnTheScreen();
    expect(screen.getByText(/Kalfa/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/1200 puan/)).toBeOnTheScreen();
  });

  it('Istanbul siluetini cizer', async () => {
    await render(
      <PostcardCard
        heading="Rekor"
        emoji="🏆"
        score={10}
        title="Çırak"
        dateText="x"
        color="#000"
      />,
    );

    expect(screen.getByTestId('skia-path').props.path).toBe(SKYLINE_PATH);
    expect(SKYLINE_PATH.startsWith('M 0')).toBe(true);
    expect(SKYLINE_PATH.endsWith('Z')).toBe(true);
  });
});
