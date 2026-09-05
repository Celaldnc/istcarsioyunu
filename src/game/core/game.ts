import {
  applyClears,
  canPlace,
  createBoard,
  createBoardFromMask,
  findFullLines,
  isBoardEmpty,
  isGameOver,
  monochromeLines,
  placePiece,
} from './board';
import { petCat as pet, spawnCat, tickCat, withCatBlocked, type Cat } from './cat';
import { eventRng, haggleRng } from './events';
import { feedsGull, gullDive, landGull, type Gull } from './gull';
import { levelById, type Objective } from './levels';
import { levelForScore } from './level';
import { clearCurses, pruneCurses, tickNazar, type Curse } from './nazar';
import { RNG_CALLS_PER_PIECE, generatePieceSet, generateStarterSet } from './pieces';
import { createRng } from './rng';
import { DEFAULT_ESNAF_ID, rulesFor, type GameMode, type GameRules } from './rules';
import { computeScore } from './score';
import { countSynergies } from './synergy';
import { OFF_CELL } from './types';
import type { Board, FullLines, Piece, Point } from './types';

import { GULL, HAGGLE, MAKAM, NAZAR, SCORING, SYNERGY, TEA_BREAK, TRAY } from '@/constants/config';

/**
 * Oyunun tum durumu ve gecisleri — SAF bir reducer olarak.
 *
 * Zustand store'u bunun ince bir sarmalayicisidir. Boylece oyun akisinin
 * tamami (hamle, temizleme, skor, oyun sonu, tepsi yenileme, kedi, marti,
 * nazar, pazarlik) React veya store calistirmadan test edilebiliyor.
 */

export type GameStatus = 'playing' | 'gameOver' | 'won';

export type { Cat } from './cat';
export type { Gull } from './gull';
export type { Curse } from './nazar';

/** Bir hamlede olan, UI/ses/esnafin tepki verecegi olaylar. */
export type GameEvent =
  | 'catMoved'
  | 'catPetted'
  | 'gullLanded'
  | 'gullDove'
  | 'gullFed'
  | 'nazarSpawned'
  | 'nazarSpread'
  | 'nazarCleared'
  | 'synergy'
  | 'makamComplete'
  | 'bridge'
  | 'haggleWon'
  | 'haggleLost'
  | 'levelWon';

export type BonusKind =
  'cini' | 'perfectClear' | 'synergy' | 'nazar' | 'gullFed' | 'makam' | 'bridge';

export interface Bonus {
  readonly kind: BonusKind;
  readonly points: number;
}

/** Yolculuk hedefine dogru ilerleme. */
export interface Progress {
  readonly lines: number;
  readonly cini: number;
  readonly synergy: number;
  readonly bridge: number;
  readonly gullsFed: number;
  readonly catMoves: number;
  readonly makams: number;
  readonly nazarCleared: number;
  /** Bu oyundaki en uzun ardisik temizleme serisi. */
  readonly bestStreak: number;
}

export interface GameState {
  readonly board: Board;
  /** Sabit uzunlukta; kullanilmis yuvalar undefined. */
  readonly tray: readonly (Piece | undefined)[];
  readonly score: number;
  readonly seed: number;
  /** O ana kadar cekilen toplam parca sayisi (kalici depolamadan geri yukleme icin). */
  readonly piecesDrawn: number;
  readonly status: GameStatus;
  /** Son hamlede temizlenen cizgiler — animasyon ve ses ipucu icin. */
  readonly lastClear: FullLines;
  /** Son hamlenin getirdigi puan — skor animasyonu icin. */
  readonly lastGain: number;
  /**
   * Ardisik temizleme serisi: kac hamledir ust uste cizgi temizleniyor.
   * Temizleme yapmayan bir hamle bunu sifirlar.
   */
  readonly comboStreak: number;
  /** Son hamlede temizlenen TEK RENKLI cizgiler (Cini) — kutlama ipucu. */
  readonly lastCini: FullLines;
  /** Kalan "Cay molasi" (devam) hakki. */
  readonly teaBreaksLeft: number;

  readonly mode: GameMode;
  readonly esnafId: string;
  /** mode + esnaf + seviyeden turetilir; kayda yazilmaz. */
  readonly rules: GameRules;
  readonly levelId: string | null;
  /** Oynanan hamle sayisi (olay rng'sinin sayaci). */
  readonly moves: number;
  readonly cat: Cat | null;
  readonly gull: Gull | null;
  readonly curses: readonly Curse[];
  readonly hagglesLeft: number;
  readonly progress: Progress;
  /** Son gecisin olaylari; gecicidir. */
  readonly events: readonly GameEvent[];
  /** Son hamlenin bonus dokumu; gecicidir. */
  readonly lastBonuses: readonly Bonus[];
}

const NO_LINES: FullLines = { rows: [], cols: [] };
export const NO_PROGRESS: Progress = {
  lines: 0,
  cini: 0,
  synergy: 0,
  bridge: 0,
  gullsFed: 0,
  catMoves: 0,
  makams: 0,
  nazarCleared: 0,
  bestStreak: 0,
};

export interface StartOptions {
  readonly board?: Board;
  readonly mode?: GameMode;
  readonly esnafId?: string;
  readonly levelId?: string | null;
}

/**
 * Seed ve o ana kadar cekilen parca sayisindan yeni tepsi uretir.
 *
 * Ureteci dongu ile ilerletmek yerine O(1) atlama kullaniliyor: uzun bir
 * oyunda tepsi yenileme O(n^2)'ye cikiyordu ve bu is hamlenin bittigi anda,
 * JS thread'inde yapiliyor.
 *
 * Ilk `starterTrays` tepsi bilerek kolay; rng tuketimi ayni oldugundan
 * sonraki tepsiler etkilenmez.
 */
function drawTray(seed: number, piecesDrawn: number, level: number, starterTrays: number): Piece[] {
  const rng = createRng(seed, piecesDrawn * RNG_CALLS_PER_PIECE);
  const trayIndex = piecesDrawn / TRAY.PIECE_COUNT;
  return trayIndex < starterTrays
    ? generateStarterSet(rng, TRAY.PIECE_COUNT)
    : generatePieceSet(rng, TRAY.PIECE_COUNT, level);
}

/** Tepside kalan (kullanilmamis) parcalar. */
function remainingPieces(tray: readonly (Piece | undefined)[]): Piece[] {
  return tray.filter((piece): piece is Piece => piece !== undefined);
}

/** Parca sigma/oyun sonu kontrollerinin bakacagi tahta: kedi hucresi kapali. */
export function effectiveBoard(state: Pick<GameState, 'board' | 'cat'>): Board {
  return withCatBlocked(state.board, state.cat);
}

function resolveStatus(
  board: Board,
  tray: readonly (Piece | undefined)[],
  cat: Cat | null,
): GameStatus {
  return isGameOver(withCatBlocked(board, cat), remainingPieces(tray)) ? 'gameOver' : 'playing';
}

export function startGame(seed: number, boardOrOptions: Board | StartOptions = {}): GameState {
  const options: StartOptions = Array.isArray(boardOrOptions)
    ? { board: boardOrOptions as Board }
    : (boardOrOptions as StartOptions);
  const mode = options.mode ?? 'classic';
  const esnafId = options.esnafId ?? DEFAULT_ESNAF_ID;
  const levelId = options.levelId ?? null;
  const level = levelById(levelId);
  const rules = rulesFor({ mode, esnafId, overrides: level?.overrides });
  const board =
    options.board ?? (level?.mask === undefined ? createBoard() : createBoardFromMask(level.mask));

  const tray = drawTray(seed, 0, 1, rules.starterTrays);
  const cat = rules.cat ? spawnCat(board, eventRng(seed, 0)) : null;

  return {
    board,
    tray,
    score: 0,
    seed,
    piecesDrawn: TRAY.PIECE_COUNT,
    status: resolveStatus(board, tray, cat),
    lastClear: NO_LINES,
    lastGain: 0,
    comboStreak: 0,
    lastCini: NO_LINES,
    teaBreaksLeft: rules.teaBreaks,
    mode,
    esnafId,
    rules,
    levelId,
    moves: 0,
    cat,
    gull: null,
    curses: [],
    hagglesLeft: rules.haggles,
    progress: NO_PROGRESS,
    events: [],
    lastBonuses: [],
  };
}

/** Hedef tamamlandi mi? */
export function objectiveMet(
  objective: Objective,
  state: Pick<GameState, 'score' | 'progress'>,
): boolean {
  switch (objective.kind) {
    case 'score':
      return state.score >= objective.target;
    case 'lines':
      return state.progress.lines >= objective.target;
    case 'cini':
      return state.progress.cini >= objective.target;
    case 'synergy':
      return state.progress.synergy >= objective.target;
    case 'bridge':
      return state.progress.bridge >= objective.target;
  }
}

/** Satirda tahta disi hucre var mi (Bogaz'da "iki yaka" satiri)? */
const rowSpansWater = (board: Board, y: number): boolean =>
  (board[y] ?? []).some((cell) => cell === OFF_CELL);

/**
 * Bir parcayi tahtaya oynar.
 *
 * Gecersiz hamlede durum DEGISMEDEN geri doner (ayni referans); cagiran taraf
 * bunu "kabul edilmedi" olarak yorumlayabilir.
 */
export function playPiece(state: GameState, trayIndex: number, origin: Point): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const piece = state.tray[trayIndex];
  if (piece === undefined || !canPlace(effectiveBoard(state), piece, origin)) {
    return state;
  }

  const { rules } = state;
  const events: GameEvent[] = [];
  const bonuses: Bonus[] = [];

  const placed = placePiece(state.board, piece, origin);
  const lines = findFullLines(placed);
  const lineCount = lines.rows.length + lines.cols.length;
  // Renk bilgisi temizlemeyle kaybolur; Cini/sinerji temizlemeden ONCE bakilir.
  const cini = monochromeLines(placed, lines);
  const ciniCount = cini.rows.length + cini.cols.length;
  const synergy = rules.synergies
    ? countSynergies(placed, lines)
    : { kahvalti: 0, fistikliLokum: 0 };
  const synergyCount = synergy.kahvalti + synergy.fistikliLokum;
  const cleared = applyClears(placed, lines);

  const scored = computeScore({
    clearedLines: lines,
    boardEmptyAfterClears: isBoardEmpty(cleared),
    streak: state.comboStreak,
    ciniLines: ciniCount,
    ciniMultiplier: rules.ciniMultiplier,
  });
  if (scored.ciniBonus > 0) {
    bonuses.push({ kind: 'cini', points: scored.ciniBonus });
  }
  if (scored.perfectClearBonus > 0) {
    bonuses.push({ kind: 'perfectClear', points: scored.perfectClearBonus });
  }
  let gain = scored.total;

  if (synergyCount > 0) {
    const points = synergyCount * SYNERGY.PAIR_BONUS;
    bonuses.push({ kind: 'synergy', points });
    events.push('synergy');
    gain += points;
  }

  // Nazar: temizlenen cizgideki lanet kalkar ve odullendirir.
  const { remaining: cursesAfterClear, cleared: cursesCleared } = clearCurses(state.curses, lines);
  if (cursesCleared > 0) {
    const points = cursesCleared * NAZAR.CLEAR_BONUS;
    bonuses.push({ kind: 'nazar', points });
    events.push('nazarCleared');
    gain += points;
  }

  // Kopru: Bogaz tahtasinda su seridini asan satir.
  const bridges = rules.bridge ? lines.rows.filter((y) => rowSpansWater(placed, y)).length : 0;
  if (bridges > 0) {
    const points = bridges * SCORING.BRIDGE_BONUS;
    bonuses.push({ kind: 'bridge', points });
    events.push('bridge');
    gain += points;
  }

  // Makam: seri melodinin son notasina ulasinca tamamlanir.
  if (rules.makam && lineCount > 0 && scored.nextStreak === MAKAM.NOTES) {
    bonuses.push({ kind: 'makam', points: MAKAM.COMPLETE_BONUS });
    events.push('makamComplete');
    gain += MAKAM.COMPLETE_BONUS;
  }

  // Marti: simit atildi mi?
  let gull = state.gull;
  if (feedsGull(gull, piece, origin)) {
    const points = GULL.FEED_BONUS * rules.simitBonusMultiplier;
    bonuses.push({ kind: 'gullFed', points });
    events.push('gullFed');
    gain += points;
    gull = null;
  }

  const score = state.score + gain;

  let tray: readonly (Piece | undefined)[] = state.tray.map((slot, index) =>
    index === trayIndex ? undefined : slot,
  );
  let piecesDrawn = state.piecesDrawn;

  // Tepsi tamamen bosaldiginda yenilenir; Block Blast akisi budur.
  // Zorluk guncel seviyeden turetilir: oyun ilerledikce zor parcalar sikleşir.
  if (remainingPieces(tray).length === 0) {
    tray = drawTray(state.seed, piecesDrawn, levelForScore(score), rules.starterTrays);
    piecesDrawn += TRAY.PIECE_COUNT;
  }

  // --- canli ogeler: her hamlede bagimsiz olay ureteci -------------------
  const moves = state.moves + 1;
  const rng = eventRng(state.seed, moves);
  let board = cleared;

  let curses: readonly Curse[] = cursesAfterClear;
  if (rules.nazar) {
    const tick = tickNazar(curses, board, rng);
    curses = tick.curses;
    if (tick.spread > 0) {
      events.push('nazarSpread');
    }
    if (tick.spawned) {
      events.push('nazarSpawned');
    }
  }

  if (gull !== null) {
    if (gull.turnsLeft <= 1) {
      const dive = gullDive(board, gull);
      board = dive.board;
      if (dive.stolen !== null) {
        events.push('gullDove');
      }
      gull = null;
    } else {
      gull = { ...gull, turnsLeft: gull.turnsLeft - 1 };
    }
  } else if (rules.gull && moves % rules.gullEvery === 0) {
    gull = landGull(rng);
    events.push('gullLanded');
  }
  curses = pruneCurses(curses, board);

  const catTick = tickCat(state.cat, board, lines, rng);
  if (catTick.moved) {
    events.push('catMoved');
  }

  const progress: Progress = {
    lines: state.progress.lines + lineCount,
    cini: state.progress.cini + ciniCount,
    synergy: state.progress.synergy + synergyCount,
    bridge: state.progress.bridge + bridges,
    gullsFed: state.progress.gullsFed + (events.includes('gullFed') ? 1 : 0),
    catMoves: state.progress.catMoves + (catTick.moved ? 1 : 0),
    makams: state.progress.makams + (events.includes('makamComplete') ? 1 : 0),
    nazarCleared: state.progress.nazarCleared + cursesCleared,
    bestStreak: Math.max(state.progress.bestStreak, scored.nextStreak),
  };

  const next: GameState = {
    ...state,
    board,
    tray,
    score,
    piecesDrawn,
    status: resolveStatus(board, tray, catTick.cat),
    lastClear: lines,
    lastGain: gain,
    comboStreak: scored.nextStreak,
    lastCini: cini,
    moves,
    cat: catTick.cat,
    gull,
    curses,
    progress,
    events,
    lastBonuses: bonuses,
  };

  const level = levelById(state.levelId);
  if (level !== undefined && objectiveMet(level.objective, next)) {
    return { ...next, status: 'won', events: [...events, 'levelWon'] };
  }
  return next;
}

/** Kediyi oksar: CAT.REST_TURNS hamle yerinden kalkmaz. Hamle sayilmaz. */
export function petCat(state: GameState): GameState {
  if (state.status !== 'playing' || state.cat === null || state.cat.restTurns > 0) {
    return state;
  }
  return { ...state, cat: pet(state.cat), events: ['catPetted'], lastBonuses: [] };
}

/**
 * Pazarlik: esnafla parca degistirme. `success` UI'daki zamanlama mini
 * oyunundan gelir. Basari: yuva yeni parcayla degisir (parca akisindan
 * bagimsiz uretec). Basarisizlik: HAGGLE.FAIL_PENALTY puan gider (sifirin
 * altina dusmez). Her iki durumda bir hak harcanir; hamle sayilmaz.
 */
export function haggle(state: GameState, trayIndex: number, success: boolean): GameState {
  if (state.status !== 'playing' || state.hagglesLeft <= 0 || state.tray[trayIndex] === undefined) {
    return state;
  }
  const used = state.rules.haggles - state.hagglesLeft;

  if (!success) {
    return {
      ...state,
      score: Math.max(0, state.score - HAGGLE.FAIL_PENALTY),
      hagglesLeft: state.hagglesLeft - 1,
      events: ['haggleLost'],
      lastBonuses: [],
      lastGain: 0,
    };
  }

  const [piece] = generatePieceSet(haggleRng(state.seed, used), 1, levelForScore(state.score));
  const tray = state.tray.map((slot, index) => (index === trayIndex ? piece : slot));
  return {
    ...state,
    tray,
    hagglesLeft: state.hagglesLeft - 1,
    status: resolveStatus(state.board, tray, state.cat),
    events: ['haggleWon'],
    lastBonuses: [],
    lastGain: 0,
  };
}

/** Dolu hucre sayisina gore en dolu `count` cizginin indeksleri. */
function fullestLines(fillCounts: readonly number[], count: number): number[] {
  return (
    fillCounts
      .map((filled, index) => ({ filled, index }))
      // Esitlikte alt/sag cizgi one gecer: Block Blast'ta yigilma oradan baslar.
      .sort((a, b) => b.filled - a.filled || b.index - a.index)
      .slice(0, count)
      .map((entry) => entry.index)
      .sort((a, b) => a - b)
  );
}

const isFilled = (cell: Board[number][number]): boolean => typeof cell === 'number' && cell >= 0;

/**
 * "Cay molasi": bitmis oyunda en dolu satir ve sutunlari bosaltip devam
 * ettirir.
 *
 * Rakipler bu "devam" hakkini reklam izletip veriyor; burada oyun basina
 * rules.teaBreaks kadar ucretsiz. Puan vermez, seriyi sifirlar; tepsiye
 * dokunmaz (oyuncu ayni parcalarla, acilan yerle devam eder).
 *
 * Hak yoksa veya oyun surerken cagrilirsa durum DEGISMEZ (ayni referans).
 */
export function takeTeaBreak(state: GameState): GameState {
  if (state.status !== 'gameOver' || state.teaBreaksLeft <= 0) {
    return state;
  }

  const rowFill = state.board.map((row) => row.filter(isFilled).length);
  const colFill = Array.from({ length: state.board[0]?.length ?? 0 }, (_, x) =>
    state.board.reduce((total, row) => total + (isFilled(row[x] ?? null) ? 1 : 0), 0),
  );
  const lines: FullLines = {
    rows: fullestLines(rowFill, TEA_BREAK.ROWS),
    cols: fullestLines(colFill, TEA_BREAK.COLS),
  };
  const board = applyClears(state.board, lines);

  return {
    ...state,
    board,
    status: resolveStatus(board, state.tray, state.cat),
    lastClear: lines,
    lastGain: 0,
    comboStreak: 0,
    lastCini: NO_LINES,
    teaBreaksLeft: state.teaBreaksLeft - 1,
    curses: pruneCurses(state.curses, board),
    events: [],
    lastBonuses: [],
  };
}

/** Guncel seviye (skordan turetilir). */
export function currentLevel(state: GameState): number {
  return levelForScore(state.score);
}

/** Ayni seed, mod ve esnafla bastan baslatir (Daily modunda tekrar denemek icin). */
export function restart(state: GameState): GameState {
  return startGame(state.seed, {
    mode: state.mode,
    esnafId: state.esnafId,
    levelId: state.levelId,
  });
}
