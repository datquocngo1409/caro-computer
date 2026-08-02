import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Cell, Difficulty, getBestMove} from './gomoku-ai';

const X = 'X';
const O = 'O';
const COMPUTER = 'COMPUTER';
const INITIAL_RADIUS = 10;
const PADDING = 3;
const DRAG_THRESHOLD = 4;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'caro-computer';
  stones = new Map<string, Cell>();
  moveOrder = new Map<string, number>();
  moveCount = 0;
  typeGame = COMPUTER;
  player = X;
  lastPlayerPoint = [-1, -1];
  lastComputerPoint = [-1, -1];
  winPlayer = '';
  isPlayerWon = false;
  readonly isNormalMode = false;
  readonly difficulty: Difficulty = Difficulty.HARD;
  isComputerThinking = false;
  resultMessage = '';
  gameStarted = false;

  minRow = -INITIAL_RADIUS;
  maxRow = INITIAL_RADIUS;
  minCol = -INITIAL_RADIUS;
  maxCol = INITIAL_RADIUS;
  visibleRows: number[] = [];
  visibleCols: number[] = [];

  pendingRow: number | null = null;
  pendingCol: number | null = null;

  winningCells = new Set<string>();

  @ViewChild('boardViewport') boardViewportRef!: ElementRef<HTMLDivElement>;
  isDragging = false;
  private dragMoved = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private scrollStartLeft = 0;
  private scrollStartTop = 0;

  init() {
    this.lastPlayerPoint = [-1, -1];
    this.lastComputerPoint = [-1, -1];
    this.winPlayer = '';
    this.isPlayerWon = false;
    this.isComputerThinking = false;
    this.resultMessage = '';
    this.stones.clear();
    this.moveOrder.clear();
    this.moveCount = 0;
    this.pendingRow = null;
    this.pendingCol = null;
    this.winningCells.clear();
    this.minRow = -INITIAL_RADIUS;
    this.maxRow = INITIAL_RADIUS;
    this.minCol = -INITIAL_RADIUS;
    this.maxCol = INITIAL_RADIUS;
    this.rebuildVisibleRange();
    this.scrollCellIntoView(0, 0);
  }

  ngOnInit(): void {
  }

  start() {
    this.gameStarted = true;
    this.init();
  }

  rebuildVisibleRange() {
    this.visibleRows = range(this.minRow, this.maxRow);
    this.visibleCols = range(this.minCol, this.maxCol);
  }

  expandBoundsIfNeeded(row: number, col: number) {
    let changed = false;
    if (row - this.minRow < PADDING) {
      this.minRow = row - PADDING;
      changed = true;
    }
    if (this.maxRow - row < PADDING) {
      this.maxRow = row + PADDING;
      changed = true;
    }
    if (col - this.minCol < PADDING) {
      this.minCol = col - PADDING;
      changed = true;
    }
    if (this.maxCol - col < PADDING) {
      this.maxCol = col + PADDING;
      changed = true;
    }
    if (changed) {
      this.rebuildVisibleRange();
    }
  }

  onBoardPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;

    const el = this.boardViewportRef.nativeElement;
    this.isDragging = true;
    this.dragMoved = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.scrollStartLeft = el.scrollLeft;
    this.scrollStartTop = el.scrollTop;
    el.setPointerCapture(event.pointerId);
  }

  onBoardPointerMove(event: PointerEvent) {
    if (!this.isDragging) return;

    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    if (!this.dragMoved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      this.dragMoved = true;
    }
    if (this.dragMoved) {
      const el = this.boardViewportRef.nativeElement;
      el.scrollLeft = this.scrollStartLeft - dx;
      el.scrollTop = this.scrollStartTop - dy;
    }
  }

  onBoardPointerUp(event: PointerEvent) {
    this.isDragging = false;
    if (this.dragMoved) {
      this.dragMoved = false;
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.table-element');
    const row = target?.getAttribute('data-row');
    const col = target?.getAttribute('data-col');
    if (row !== null && row !== undefined && col !== null && col !== undefined) {
      this.handleClick(Number(row), Number(col));
    }
  }

  onBoardPointerCancel(event: PointerEvent) {
    this.isDragging = false;
    this.dragMoved = false;
  }

  scrollCellIntoView(row: number, col: number) {
    setTimeout(() => {
      document.getElementById(buildCellId(row, col))?.scrollIntoView({block: 'center', inline: 'center', behavior: 'smooth'});
    });
  }

  getCell(row: number, col: number): Cell {
    return this.stones.get(row + ',' + col) ?? '';
  }

  isPendingCell(row: number, col: number): boolean {
    return this.pendingRow === row && this.pendingCol === col;
  }

  setCell(row: number, col: number, value: Cell) {
    const key = row + ',' + col;
    if (value === '') {
      this.stones.delete(key);
    } else {
      this.stones.set(key, value);
      this.moveCount++;
      this.moveOrder.set(key, this.moveCount);
    }
  }

  getMoveOrder(row: number, col: number): number | null {
    return this.moveOrder.get(row + ',' + col) ?? null;
  }

  cellId(row: number, col: number): string {
    return buildCellId(row, col);
  }

  getOpponent(player: string) {
    return player === X ? O : X;
  }

  getHorizontal(x: number, y: number, player: string, isCheck?: boolean): number {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (this.getCell(x, y + i) === player) {
        count++;
      } else if (this.getCell(x, y + i) === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    for (let i = 1; i < 5; i++) {
      if (this.getCell(x, y - i) === player) {
        count++;
      } else if (this.getCell(x, y - i) === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    return count;
  }

  getVertical(x: number, y: number, player: string, isCheck?: boolean): number {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (this.getCell(x + i, y) === player) {
        count++;
      } else if (this.getCell(x + i, y) === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    for (let i = 1; i < 5; i++) {
      if (this.getCell(x - i, y) === player) {
        count++;
      } else if (this.getCell(x - i, y) === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    return count;
  }

  getRightDiagonal(x: number, y: number, player: string, isCheck?: boolean): number {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (this.getCell(x - i, y + i) === player) {
        count++;
      } else if (this.getCell(x - i, y + i) === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    for (let i = 1; i < 5; i++) {
      if (this.getCell(x + i, y - i) === player) {
        count++;
      } else if (this.getCell(x + i, y - i) === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    return count;
  }

  getLeftDiagonal(x: number, y: number, player: string, isCheck?: boolean): number {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (this.getCell(x - i, y - i) === player) {
        count++;
      } else if (this.getCell(x - i, y - i) === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    for (let i = 1; i < 5; i++) {
      if (this.getCell(x + i, y + i) === player) {
        count++;
      } else if (this.getCell(x + i, y + i) === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    return count;
  }

  checkWin(points: any, isComputer: boolean) {
    const x = Number(points[0]);
    const y = Number(points[1]);
    if((this.getHorizontal(x, y, X, true) >= 5
      || this.getVertical(x, y, X, true) >= 5
      || this.getRightDiagonal(x, y, X, true) >= 5
      || this.getLeftDiagonal(x, y, X, true) >= 5) && !isComputer) {
      this.isPlayerWon = true;
      this.winPlayer = X;
      this.setWinningCells(x, y, X);
      return true;
    }
    if((this.getHorizontal(x, y, O, true) >= 5
      || this.getVertical(x, y, O, true) >= 5
      || this.getRightDiagonal(x, y, O, true) >= 5
      || this.getLeftDiagonal(x, y, O, true) >= 5) && isComputer) {
      this.isPlayerWon = false;
      this.winPlayer = O;
      this.setWinningCells(x, y, O);
      return true;
    }
    return false;
  }

  setWinningCells(x: number, y: number, player: string) {
    const directions: Array<[number, number]> = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dx, dy] of directions) {
      const cells: Array<[number, number]> = [[x, y]];

      let cx = x + dx, cy = y + dy;
      while (this.getCell(cx, cy) === player) {
        cells.push([cx, cy]);
        cx += dx;
        cy += dy;
      }
      cx = x - dx;
      cy = y - dy;
      while (this.getCell(cx, cy) === player) {
        cells.push([cx, cy]);
        cx -= dx;
        cy -= dy;
      }

      if (cells.length >= 5) {
        this.winningCells = new Set(cells.map(([r, c]) => r + ',' + c));
        return;
      }
    }
  }

  isWinningCell(row: number, col: number): boolean {
    return this.winningCells.has(row + ',' + col);
  }

  handleClick(row: number, col: number) {
    if (this.winPlayer !== '' || this.isComputerThinking || this.typeGame !== COMPUTER) return;
    if (this.getCell(row, col) !== "") return;

    if (this.pendingRow !== row || this.pendingCol !== col) {
      this.pendingRow = row;
      this.pendingCol = col;
      return;
    }
    this.pendingRow = null;
    this.pendingCol = null;

    this.setCell(row, col, X);
    this.lastPlayerPoint = [row, col];
    this.expandBoundsIfNeeded(row, col);
    this.scrollCellIntoView(row, col);

    if (this.checkWin([row, col], false)) {
      this.resultMessage = "You are winner";
      return;
    }

    this.isComputerThinking = true;
    setTimeout(() => this.playComputerTurn(), 50);
  }

  playComputerTurn() {
    const computerTurn = getBestMove(this.stones, O, X, this.difficulty);
    this.lastComputerPoint = [computerTurn[0], computerTurn[1]];
    this.setCell(computerTurn[0], computerTurn[1], O);
    this.isComputerThinking = false;
    this.expandBoundsIfNeeded(computerTurn[0], computerTurn[1]);

    if (this.checkWin(computerTurn, true)) {
      this.resultMessage = "Computer is winner";
    }
  }

  isHiddenCell(cell: string, i: number, j: number) {
    if (this.winPlayer !== '') return false;
    return (cell === 'X' || cell === 'O') &&
    !((i === this.lastPlayerPoint[0] && j === this.lastPlayerPoint[1]) ||
      (i === this.lastComputerPoint[0] && j === this.lastComputerPoint[1]))
  }

  isLastMove(i: number, j: number, point: number[]): boolean {
    return i === point[0] && j === point[1];
  }
}

function range(from: number, to: number): number[] {
  const result: number[] = [];
  for (let i = from; i <= to; i++) {
    result.push(i);
  }
  return result;
}

function buildCellId(row: number, col: number): string {
  return 'cell-' + row + '-' + col;
}
