import { fireEvent, render, screen } from '@testing-library/react-native';

import { LIVE_HUD_TEST_ID, LiveHud, objectiveProgress } from '../LiveHud';

import { NO_PROGRESS } from '@/game/core/game';

describe('objectiveProgress', () => {
  it('hedef turune gore ilerlemeyi yazar ve hedefi asmaz', () => {
    expect(objectiveProgress({ kind: 'score', target: 300 }, 120, NO_PROGRESS)).toBe('120/300');
    expect(objectiveProgress({ kind: 'lines', target: 5 }, 0, { ...NO_PROGRESS, lines: 9 })).toBe(
      '5/5',
    );
    expect(objectiveProgress({ kind: 'cini', target: 3 }, 0, { ...NO_PROGRESS, cini: 1 })).toBe(
      '1/3',
    );
    expect(
      objectiveProgress({ kind: 'synergy', target: 3 }, 0, { ...NO_PROGRESS, synergy: 2 }),
    ).toBe('2/3');
    expect(objectiveProgress({ kind: 'bridge', target: 4 }, 0, { ...NO_PROGRESS, bridge: 4 })).toBe(
      '4/4',
    );
  });
});

describe('LiveHud', () => {
  it('gosterecek sey yoksa cizilmez', async () => {
    await render(
      <LiveHud
        levelId={null}
        score={0}
        progress={NO_PROGRESS}
        gull={null}
        hagglesLeft={0}
        onHaggle={jest.fn()}
      />,
    );

    expect(screen.queryByTestId(LIVE_HUD_TEST_ID)).toBeNull();
  });

  it('yolculuk hedefini ve ilerlemeyi gosterir', async () => {
    await render(
      <LiveHud
        levelId="galata"
        score={0}
        progress={{ ...NO_PROGRESS, lines: 4 }}
        gull={null}
        hagglesLeft={0}
        onHaggle={jest.fn()}
      />,
    );

    expect(screen.getByText(/4\/12/)).toBeOnTheScreen();
  });

  it('marti geri sayimini duyurur', async () => {
    await render(
      <LiveHud
        levelId={null}
        score={0}
        progress={NO_PROGRESS}
        gull={{ col: 2, turnsLeft: 2 }}
        hagglesLeft={0}
        onHaggle={jest.fn()}
      />,
    );

    expect(screen.getByLabelText(/Martı 3. sütunda/)).toBeOnTheScreen();
  });

  it('pazarlik dugmesi hak varsa gorunur ve tiklanir', async () => {
    const onHaggle = jest.fn();
    await render(
      <LiveHud
        levelId={null}
        score={0}
        progress={NO_PROGRESS}
        gull={null}
        hagglesLeft={3}
        onHaggle={onHaggle}
      />,
    );

    fireEvent.press(screen.getByLabelText('Pazarlık, 3 hak'));

    expect(onHaggle).toHaveBeenCalled();
  });
});

describe('kapilar, senlik ve kedi', () => {
  it('yanan kapi sayisini gosterir', async () => {
    await render(
      <LiveHud
        levelId={null}
        score={0}
        progress={NO_PROGRESS}
        gull={null}
        hagglesLeft={0}
        onHaggle={jest.fn()}
        gates={5}
      />,
    );

    expect(screen.getByText('🏮 2/4')).toBeOnTheScreen();
  });

  it('senlik suruyorsa kapi yerine senlik gosterir', async () => {
    await render(
      <LiveHud
        levelId={null}
        score={0}
        progress={NO_PROGRESS}
        gull={null}
        hagglesLeft={0}
        onHaggle={jest.fn()}
        gates={0}
        festivalTurns={2}
      />,
    );

    expect(screen.getByText(/Şenlik ×2 \(2\)/)).toBeOnTheScreen();
    expect(screen.queryByText(/🏮/)).toBeNull();
  });

  it('dinlenmeyen kedi icin oksa dugmesi', async () => {
    const onPet = jest.fn();
    await render(
      <LiveHud
        levelId={null}
        score={0}
        progress={NO_PROGRESS}
        gull={null}
        hagglesLeft={0}
        onHaggle={jest.fn()}
        cat={{ x: 0, y: 0, restTurns: 0 }}
        onPet={onPet}
      />,
    );

    fireEvent.press(screen.getByLabelText("Tekir'i okşa"));
    expect(onPet).toHaveBeenCalled();
  });

  it('dinlenen kedi icin dugme yoktur', async () => {
    await render(
      <LiveHud
        levelId={null}
        score={0}
        progress={NO_PROGRESS}
        gull={null}
        hagglesLeft={0}
        onHaggle={jest.fn()}
        cat={{ x: 0, y: 0, restTurns: 2 }}
        onPet={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText("Tekir'i okşa")).toBeNull();
  });
});
