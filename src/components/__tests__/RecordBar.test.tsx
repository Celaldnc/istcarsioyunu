import { render, screen } from '@testing-library/react-native';

import { RECORD_BAR_TEST_ID, RecordBar, pointsToRecord } from '../RecordBar';

describe('pointsToRecord', () => {
  it('rekora kalan puani verir', () => {
    expect(pointsToRecord(300, 1000)).toBe(700);
  });

  it('rekor asildiysa sifir (negatif olmaz)', () => {
    expect(pointsToRecord(1200, 1000)).toBe(0);
  });
});

describe('RecordBar', () => {
  it('rekor yokken cizilmez', async () => {
    await render(<RecordBar score={50} highScore={0} />);

    expect(screen.queryByTestId(RECORD_BAR_TEST_ID)).toBeNull();
  });

  it('rekora kalan puani yazar', async () => {
    await render(<RecordBar score={300} highScore={1000} />);

    expect(screen.getByText('Rekora 700')).toBeOnTheScreen();
  });

  it('rekor asilinca kutlar', async () => {
    await render(<RecordBar score={1001} highScore={1000} />);

    expect(screen.getByText('Yeni rekor!')).toBeOnTheScreen();
    expect(screen.getByLabelText('Yeni rekor')).toBeOnTheScreen();
  });

  it('rekora esit skor henuz rekor degildir', async () => {
    await render(<RecordBar score={1000} highScore={1000} />);

    expect(screen.getByText('Rekora 0')).toBeOnTheScreen();
  });

  it('ekran okuyucuya ilerleme degeri verir', async () => {
    await render(<RecordBar score={250} highScore={1000} />);

    const bar = screen.getByRole('progressbar');
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 1000, now: 250 });
  });

  it('ilerleme degeri rekoru asmaz', async () => {
    await render(<RecordBar score={5000} highScore={1000} />);

    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(1000);
  });
});
