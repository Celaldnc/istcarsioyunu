import { render, screen } from '@testing-library/react-native';

import GameScreen from '../GameScreen';

import { LEVEL } from '@/constants/config';
import { useGameStore } from '@/game/store/gameStore';

const SEED = 20260905;

beforeEach(() => {
  useGameStore.getState().newGame(SEED);
});

describe('GameScreen', () => {
  it('skor, seviye ve oyun tahtasini birlikte gosterir', async () => {
    await render(<GameScreen />);

    expect(screen.getByLabelText('Skor: 0')).toBeOnTheScreen();
    expect(screen.getByLabelText('Seviye: 1')).toBeOnTheScreen();
    expect(screen.getByLabelText(/Oyun tahtası/)).toBeOnTheScreen();
  });

  it('skor yukselince seviye rozeti gunceller', async () => {
    useGameStore.setState({ score: LEVEL.POINTS_PER_LEVEL * 2 });

    await render(<GameScreen />);

    expect(screen.getByLabelText('Seviye: 3')).toBeOnTheScreen();
  });

  it('rekor yokken "En iyi" rozeti gosterilmez', async () => {
    useGameStore.setState({ highScore: 0 });

    await render(<GameScreen />);

    expect(screen.queryByLabelText(/En iyi/)).toBeNull();
  });

  it('rekor varsa "En iyi" rozeti gosterilir', async () => {
    useGameStore.setState({ highScore: 1200 });

    await render(<GameScreen />);

    // Binlik ayraci ortama gore degisebilir; rozetin varligi test ediliyor.
    expect(screen.getByLabelText(/^En iyi: 1[.,]?200$/)).toBeOnTheScreen();
  });

  it('seri kurulmadan combo gostergesi cikmaz', async () => {
    useGameStore.setState({ comboStreak: 1 });

    await render(<GameScreen />);

    expect(screen.queryByText(/Combo/)).toBeNull();
  });

  it('seri kurulunca combo gostergesi cikar', async () => {
    useGameStore.setState({ comboStreak: 3 });

    await render(<GameScreen />);

    expect(screen.getByText(/Combo ×/)).toBeOnTheScreen();
  });

  it('oyun bitince yeniden baslama yolu sunar', async () => {
    useGameStore.setState({ status: 'gameOver' });

    await render(<GameScreen />);

    expect(screen.getByLabelText('Oyun bitti')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tekrar oyna')).toBeOnTheScreen();
  });

  it('oyun surerken oyun sonu paneli gosterilmez', async () => {
    await render(<GameScreen />);

    expect(screen.queryByLabelText('Oyun bitti')).toBeNull();
  });
});
