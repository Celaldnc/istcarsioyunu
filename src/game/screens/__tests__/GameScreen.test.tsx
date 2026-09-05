import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import GameScreen from '../GameScreen';

import { BOARD, FX, LEVEL } from '@/constants/config';
import type { Board } from '@/game/core/types';
import { useGameStore } from '@/game/store/gameStore';

/** Capraz bosluklu, hicbir 'plus' sigmayan tahta. */
const deadBoard = (): Board =>
  Array.from({ length: BOARD.ROWS }, (_, y) =>
    Array.from({ length: BOARD.COLS }, (_, x) => (x === y % BOARD.COLS ? null : 1)),
  );

const SEED = 20260905;

beforeEach(() => {
  useGameStore.getState().newGame(SEED);
});

afterEach(() => {
  jest.useRealTimers();
});

// Ucan puan yazisi ekran okuyucudan bilerek gizli; RTL gizlileri atlar.
const HIDDEN = { includeHiddenElements: true };

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

describe('his paketi', () => {
  it('rekor varsa rekor cubugu gosterilir', async () => {
    useGameStore.setState({ highScore: 1000, score: 250 });

    await render(<GameScreen />);

    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    expect(screen.getByText('Rekora 750')).toBeOnTheScreen();
  });

  it('rekor yokken rekor cubugu yoktur', async () => {
    useGameStore.setState({ highScore: 0 });

    await render(<GameScreen />);

    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('yeni oyunda esnaf karsilama repligi gorunur', async () => {
    await render(<GameScreen />);

    expect(screen.getByLabelText(/^Esnaf: /)).toBeOnTheScreen();
  });

  it('puan kazandiran hamlede ucan puan yazisi cikar', async () => {
    jest.useFakeTimers();
    useGameStore.setState({ lastGain: 40, lastClear: { rows: [0], cols: [] } });

    await render(<GameScreen />);

    expect(screen.getByText('+40', HIDDEN)).toBeOnTheScreen();
  });

  it('Cini temizlemesinde ucan puan etiketlenir', async () => {
    jest.useFakeTimers();
    useGameStore.setState({
      lastGain: 60,
      lastClear: { rows: [0], cols: [] },
      lastCini: { rows: [0], cols: [] },
    });

    await render(<GameScreen />);

    expect(screen.getByText('+60 Çini!', HIDDEN)).toBeOnTheScreen();
  });

  it('temizleme patlamasi bitince tuval kaldirilir', async () => {
    jest.useFakeTimers();
    useGameStore.setState({ lastGain: 10, lastClear: { rows: [2], cols: [] } });

    await render(<GameScreen />);
    expect(screen.getByTestId('clear-burst')).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(FX.CLEAR_BURST_MS + 100);
    });

    expect(screen.queryByTestId('clear-burst')).toBeNull();
  });
});

describe('cay molasi dugmesi', () => {
  it('hak varsa oyun sonunda sunulur ve oyunu devam ettirir', async () => {
    useGameStore.setState({ board: deadBoard(), status: 'gameOver', teaBreaksLeft: 1 });

    await render(<GameScreen />);
    fireEvent.press(screen.getByLabelText('Çay molası'));

    expect(useGameStore.getState().status).toBe('playing');
    // Store guncellemesinin ekrana yansimasi asenkron; panelin kalkmasi beklenir.
    await waitFor(() => expect(screen.queryByLabelText('Oyun bitti')).toBeNull());
  });

  it('hak kalmadiysa sunulmaz', async () => {
    useGameStore.setState({ board: deadBoard(), status: 'gameOver', teaBreaksLeft: 0 });

    await render(<GameScreen />);

    expect(screen.queryByLabelText('Çay molası')).toBeNull();
    expect(screen.getByLabelText('Tekrar oyna')).toBeOnTheScreen();
  });

  it('oyun surerken gosterilmez', async () => {
    await render(<GameScreen />);

    expect(screen.queryByLabelText('Çay molası')).toBeNull();
  });
});
