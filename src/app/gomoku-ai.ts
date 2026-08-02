export type Cell = '' | 'X' | 'O';
export type Board = Map<string, Cell>;

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

interface DifficultyConfig {
  maxDepth: number;
  breadth: number;
  timeBudgetMs: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  [Difficulty.EASY]: {maxDepth: 0, breadth: 3, timeBudgetMs: 200},
  [Difficulty.MEDIUM]: {maxDepth: 2, breadth: 12, timeBudgetMs: 400},
  [Difficulty.HARD]: {maxDepth: 4, breadth: 14, timeBudgetMs: 900},
};

const WIN_LENGTH = 5;
const WIN_SCORE = 100_000_000;
const DEFENSE_WEIGHT = 1.05;
const DIRECTIONS: Array<[number, number]> = [[0, 1], [1, 0], [1, 1], [1, -1]];

// Score for a run of stones, keyed by [length][openEnds].
const PATTERN_SCORE: Record<number, Record<number, number>> = {
  4: {2: WIN_SCORE / 2, 1: 50_000, 0: 0},
  3: {2: 5_000, 1: 500, 0: 0},
  2: {2: 200, 1: 50, 0: 0},
  1: {2: 10, 1: 2, 0: 0},
};

function key(x: number, y: number): string {
  return x + ',' + y;
}

function getCell(board: Board, x: number, y: number): Cell {
  return board.get(key(x, y)) ?? '';
}

function setCell(board: Board, x: number, y: number, value: Cell): void {
  if (value === '') {
    board.delete(key(x, y));
  } else {
    board.set(key(x, y), value);
  }
}

/**
 * Scans the line through (x, y) along (dx, dy) and its opposite direction.
 * Returns the contiguous run length of `player` stones through (x, y)
 * (assumed to be `player` or about to be) and how many of the two ends
 * beyond that run are open (empty).
 */
function scanLine(board: Board, x: number, y: number, dx: number, dy: number, player: Cell): {
  length: number;
  openEnds: number
} {
  let length = 1;
  let openEnds = 0;

  let cx = x + dx, cy = y + dy;
  while (getCell(board, cx, cy) === player) {
    length++;
    cx += dx;
    cy += dy;
  }
  if (getCell(board, cx, cy) === '') openEnds++;

  cx = x - dx;
  cy = y - dy;
  while (getCell(board, cx, cy) === player) {
    length++;
    cx -= dx;
    cy -= dy;
  }
  if (getCell(board, cx, cy) === '') openEnds++;

  return {length, openEnds};
}

function longestRunAt(board: Board, x: number, y: number, player: Cell): number {
  let best = 1;
  for (const [dx, dy] of DIRECTIONS) {
    best = Math.max(best, scanLine(board, x, y, dx, dy, player).length);
  }
  return best;
}

function patternScore(length: number, openEnds: number): number {
  if (length >= WIN_LENGTH) return WIN_SCORE;
  const byLength = PATTERN_SCORE[length];
  if (!byLength) return 0;
  return byLength[openEnds] ?? 0;
}

function scoreForPlayer(board: Board, player: Cell): number {
  let total = 0;
  for (const [k, cell] of board) {
    if (cell !== player) continue;
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of DIRECTIONS) {
      // Only score a run once, from its starting cell in this direction.
      if (getCell(board, x - dx, y - dy) === player) continue;
      const {length, openEnds} = scanLine(board, x, y, dx, dy, player);
      total += patternScore(length, openEnds);
    }
  }
  return total;
}

export function evaluateBoard(board: Board, computer: Cell, human: Cell): number {
  return scoreForPlayer(board, computer) - DEFENSE_WEIGHT * scoreForPlayer(board, human);
}

function candidateHeuristic(board: Board, x: number, y: number, computer: Cell, human: Cell): number {
  return patternScore(...toScorePair(longestRunAt(board, x, y, computer)))
    + DEFENSE_WEIGHT * patternScore(...toScorePair(longestRunAt(board, x, y, human)));
}

function toScorePair(length: number): [number, number] {
  // Cheap approximation for candidate ordering: treat as if both ends were open.
  return [length, 2];
}

function generateCandidates(board: Board, computer: Cell, human: Cell, radius: number, breadth: number = Infinity): Array<[number, number]> {
  if (board.size === 0) {
    return [[0, 0]];
  }

  const seen = new Set<string>();
  const candidates: Array<[number, number]> = [];
  for (const k of board.keys()) {
    const [x, y] = k.split(',').map(Number);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (getCell(board, nx, ny) !== '') continue;
        const nk = key(nx, ny);
        if (seen.has(nk)) continue;
        seen.add(nk);
        candidates.push([nx, ny]);
      }
    }
  }

  candidates.sort((a, b) =>
    candidateHeuristic(board, b[0], b[1], computer, human) - candidateHeuristic(board, a[0], a[1], computer, human));

  return candidates.slice(0, breadth);
}

function findImmediateWin(board: Board, player: Cell, opponent: Cell): [number, number] | null {
  const candidates = generateCandidates(board, player, opponent, 2);
  for (const [x, y] of candidates) {
    setCell(board, x, y, player);
    const wins = longestRunAt(board, x, y, player) >= WIN_LENGTH;
    setCell(board, x, y, '');
    if (wins) return [x, y];
  }
  return null;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  computer: Cell,
  human: Cell,
  deadline: number,
  breadth: number,
): number {
  if (depth === 0 || Date.now() > deadline) {
    return evaluateBoard(board, computer, human);
  }

  const player = maximizing ? computer : human;
  const candidates = generateCandidates(board, computer, human, 2, breadth);
  if (candidates.length === 0) {
    return evaluateBoard(board, computer, human);
  }

  let best = maximizing ? -Infinity : Infinity;
  for (const [x, y] of candidates) {
    setCell(board, x, y, player);

    if (longestRunAt(board, x, y, player) >= WIN_LENGTH) {
      setCell(board, x, y, '');
      return maximizing ? WIN_SCORE - depth : -WIN_SCORE + depth;
    }

    const score = minimax(board, depth - 1, alpha, beta, !maximizing, computer, human, deadline, breadth);
    setCell(board, x, y, '');

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha || Date.now() > deadline) break;
  }

  return best;
}

function pickBestBySearch(
  board: Board,
  computer: Cell,
  human: Cell,
  config: DifficultyConfig,
): [number, number] {
  const deadline = Date.now() + config.timeBudgetMs;
  const rootCandidates = generateCandidates(board, computer, human, 2, config.breadth);

  let bestMove = rootCandidates[0];

  for (let depth = 2; depth <= Math.max(config.maxDepth, 2); depth += 2) {
    let depthBestMove = rootCandidates[0];
    let depthBestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    let timedOut = false;

    for (const [x, y] of rootCandidates) {
      setCell(board, x, y, computer);
      const score = minimax(board, depth - 1, alpha, beta, false, computer, human, deadline, config.breadth);
      setCell(board, x, y, '');

      if (score > depthBestScore) {
        depthBestScore = score;
        depthBestMove = [x, y];
      }
      alpha = Math.max(alpha, depthBestScore);

      if (Date.now() > deadline) {
        timedOut = true;
        break;
      }
    }

    if (!timedOut || depth === 2) {
      bestMove = depthBestMove;
    }
    if (timedOut || depth >= config.maxDepth) break;
  }

  return bestMove;
}

function pickBestByHeuristic(board: Board, computer: Cell, human: Cell, topN: number): [number, number] {
  const candidates = generateCandidates(board, computer, human, 2, Math.max(topN, 6));
  const top = candidates.slice(0, topN);
  return top[Math.floor(Math.random() * top.length)] ?? candidates[0];
}

export function getBestMove(board: Board, computer: Cell, human: Cell, difficulty: Difficulty): [number, number] {
  if (board.size === 0) {
    return [0, 0];
  }

  const immediateWin = findImmediateWin(board, computer, human);
  if (immediateWin) return immediateWin;

  const immediateBlock = findImmediateWin(board, human, computer);
  if (immediateBlock) return immediateBlock;

  const config = DIFFICULTY_CONFIG[difficulty];
  if (config.maxDepth <= 0) {
    return pickBestByHeuristic(board, computer, human, config.breadth);
  }

  return pickBestBySearch(board, computer, human, config);
}
