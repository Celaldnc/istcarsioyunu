import { render, screen } from '@testing-library/react-native';

import { GHOST_TEST_ID, GhostOverlay } from '../GhostOverlay';

import { computeBoardLayout } from '@/game/core/layout';
import { CARSI } from '@/game/data/themes';

const layout = computeBoardLayout(390);
const cells = [
  { x: 1, y: 2 },
  { x: 2, y: 2 },
];

describe('GhostOverlay', () => {
  it('her hucre icin bir dikdortgen cizer', async () => {
    await render(<GhostOverlay cells={cells} valid layout={layout} theme={CARSI} />);

    expect(screen.getAllByTestId('skia-rounded-rect')).toHaveLength(cells.length);
  });

  it('gecerli yerlestirmeyi temanin onay rengiyle gosterir', async () => {
    await render(<GhostOverlay cells={cells} valid layout={layout} theme={CARSI} />);

    for (const rect of screen.getAllByTestId('skia-rounded-rect')) {
      expect(rect.props.color).toBe(CARSI.ghostValid);
    }
  });

  it('gecersiz yerlestirmeyi uyari rengiyle gosterir', async () => {
    await render(<GhostOverlay cells={cells} valid={false} layout={layout} theme={CARSI} />);

    for (const rect of screen.getAllByTestId('skia-rounded-rect')) {
      expect(rect.props.color).toBe(CARSI.ghostInvalid);
    }
  });

  it('yari saydam cizilir (altindaki tahta gorunsun)', async () => {
    await render(<GhostOverlay cells={cells} valid layout={layout} theme={CARSI} />);

    for (const rect of screen.getAllByTestId('skia-rounded-rect')) {
      expect(rect.props.opacity).toBeGreaterThan(0);
      expect(rect.props.opacity).toBeLessThan(1);
    }
  });

  it('dokunuslari gecirir (altindaki alani engellemez)', async () => {
    await render(<GhostOverlay cells={cells} valid layout={layout} theme={CARSI} />);

    expect(screen.getByTestId(GHOST_TEST_ID).props.pointerEvents).toBe('none');
  });

  it('bos hucre listesinde cizim yapmaz', async () => {
    await render(<GhostOverlay cells={[]} valid layout={layout} theme={CARSI} />);

    expect(screen.queryAllByTestId('skia-rounded-rect')).toHaveLength(0);
  });
});
