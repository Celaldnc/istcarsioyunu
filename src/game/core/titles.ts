/**
 * Omur boyu istatistik ve unvanlar (Cirak -> Kalfa -> Usta -> Haci).
 *
 * Saf: depolama store katmaninda. Unvan, toplam temizlenen cizgiden
 * turetilir; oyuncu ne kadar oynarsa o kadar "carsili" olur.
 */

export interface LifetimeStats {
  readonly games: number;
  readonly lines: number;
  readonly cini: number;
  readonly synergy: number;
  readonly gullsFed: number;
  readonly catMoves: number;
  readonly makams: number;
  readonly nazarCleared: number;
  readonly bestStreak: number;
  readonly bestScore: number;
}

export const EMPTY_STATS: LifetimeStats = {
  games: 0,
  lines: 0,
  cini: 0,
  synergy: 0,
  gullsFed: 0,
  catMoves: 0,
  makams: 0,
  nazarCleared: 0,
  bestStreak: 0,
  bestScore: 0,
};

export interface Title {
  readonly id: string;
  readonly name: string;
  /** Bu unvan icin gereken toplam cizgi. */
  readonly minLines: number;
}

export const TITLES: readonly Title[] = [
  { id: 'cirak', name: 'Çırak', minLines: 0 },
  { id: 'kalfa', name: 'Kalfa', minLines: 100 },
  { id: 'usta', name: 'Usta', minLines: 500 },
  { id: 'haci', name: 'Hacı', minLines: 2000 },
];

export function titleFor(stats: Pick<LifetimeStats, 'lines'>): Title {
  let current = TITLES[0] as Title;
  for (const title of TITLES) {
    if (stats.lines >= title.minLines) {
      current = title;
    }
  }
  return current;
}

/** Bir sonraki unvana kalan cizgi; son unvandaysa null. */
export function linesToNextTitle(stats: Pick<LifetimeStats, 'lines'>): number | null {
  const next = TITLES.find((title) => title.minLines > stats.lines);
  return next === undefined ? null : next.minLines - stats.lines;
}

/** Bir oyunun sayaclarini omur boyu istatistige ekler. */
export function addGameToStats(
  stats: LifetimeStats,
  game: {
    readonly score: number;
    readonly lines: number;
    readonly cini: number;
    readonly synergy: number;
    readonly gullsFed: number;
    readonly catMoves: number;
    readonly makams: number;
    readonly nazarCleared: number;
    readonly bestStreak: number;
  },
): LifetimeStats {
  return {
    games: stats.games + 1,
    lines: stats.lines + game.lines,
    cini: stats.cini + game.cini,
    synergy: stats.synergy + game.synergy,
    gullsFed: stats.gullsFed + game.gullsFed,
    catMoves: stats.catMoves + game.catMoves,
    makams: stats.makams + game.makams,
    nazarCleared: stats.nazarCleared + game.nazarCleared,
    bestStreak: Math.max(stats.bestStreak, game.bestStreak),
    bestScore: Math.max(stats.bestScore, game.score),
  };
}
