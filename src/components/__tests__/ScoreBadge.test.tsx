import { render, screen } from '@testing-library/react-native';

import { ScoreBadge } from '../ScoreBadge';

describe('ScoreBadge', () => {
  it('skoru gosterir', async () => {
    await render(<ScoreBadge score={120} />);

    expect(screen.getByText('120')).toBeOnTheScreen();
  });

  it('buyuk sayilari Turkce bicimde ayirir', async () => {
    await render(<ScoreBadge score={12345} />);

    // tr-TR binlik ayraci nokta
    expect(screen.getByText('12.345')).toBeOnTheScreen();
  });

  it('ekran okuyucuya etiketle birlikte okunur', async () => {
    await render(<ScoreBadge score={7} />);

    expect(screen.getByLabelText('Skor: 7')).toBeOnTheScreen();
  });

  it('etiket ozellestirilebilir', async () => {
    await render(<ScoreBadge score={9} label="En iyi" />);

    expect(screen.getByLabelText('En iyi: 9')).toBeOnTheScreen();
  });
});
