import {Component, OnInit} from '@angular/core';

const TWO_PLAYER = 'TWO_PLAYER';
const X = 'X';
const O = 'O';
const COMPUTER = 'COMPUTER';
const COMPUTER_COMPUTER = 'COMPUTER_COMPUTER';
const WIN = 'WIN';
const DRAW = 'DRAW';
const MAP_SCORE_COMPUTER = new Map([
  [5, Infinity], [4, 2000], [3, 500], [2, 300], [1, 100]
])
const MAP_POINT_HUMAN = new Map([
  [4, 999999], [3, 1000], [2, 400], [1, 10], [0, 0]
])

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'caro-computer';
  tableContent = "";
  matrixGame: any = [];
  typeGame = COMPUTER;
  player = X;
  idRows = "";
  lastPlayerPoint = [-1, -1];
  lastComputerPoint = [-1, -1];
  winPlayer = '';
  isPlayerWon = false;
  isNormalMode = false;

  init() {
    this.lastPlayerPoint = [-1, -1];
    this.lastComputerPoint = [-1, -1];
    this.winPlayer = '';
    this.isPlayerWon = false;
    this.matrixGame = [];
    const urlParams = new URLSearchParams(window.location.search);
    let rows = '20';
    let columns = '20';

    // Data table
    let tableXO = document.getElementById("table_game");

    for (let row = 0; row < Number(rows); row++) {
      let arr = [];
      let rowHTML = "<tr>";
      for (let col = 0; col < Number(columns); col++) {
        arr.push("");
        this.idRows = row.toString() + "-" + col.toString();
        rowHTML += `<td class="td_game"><div style="width: 50px; height: 50px; border: 1px solid black" id="` + row.toString() + "-" + col.toString() + `" class="fixed"></div></td>`
      }
      rowHTML += "</tr>";

      this.tableContent += rowHTML;
      this.matrixGame.push(arr);
    }

    // tableXO.innerHTML = this.tableContent
  }

  ngOnInit(): void {
    this.init();
  }

  checkDraw() {
    for (let i = 0; i < this.matrixGame.length; i++) {
      for (let j = 0; j < this.matrixGame[0].length; j++) {
        if (this.matrixGame[i][j] === "") {
          return false
        }
      }
    }

    return true
  }

  getOpponent(player: string) {
    return player = X ? O : X;
  }

  getHorizontal(x: number, y: number, player: string, isCheck?: boolean): number {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (y + i < this.matrixGame[0].length && this.matrixGame[x][y + i] === player) {
        count++;
      } else if (y + i < this.matrixGame[0].length && this.matrixGame[x][y + i] === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    for (let i = 1; i < 5; i++) {
      if (y - i >= 0 && y - i < this.matrixGame[0].length && this.matrixGame[x][y - i] === player) {
        count++;
      } else if (y - i >= 0 && y - i < this.matrixGame[0].length && this.matrixGame[x][y - i] === this.getOpponent(player)) {
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
      if (x + i < this.matrixGame.length && this.matrixGame[x + i][y] === player) {
        count++;
      } else if (x + i < this.matrixGame.length && this.matrixGame[x + i][y] === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    for (let i = 1; i < 5; i++) {
      if (x - i >= 0 && x - i < this.matrixGame.length && this.matrixGame[x - i][y] === player) {
        count++;
      } else if (x - i >= 0 && x - i < this.matrixGame.length && this.matrixGame[x - i][y] === this.getOpponent(player)) {
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
      if (x - i >= 0 && x - i < this.matrixGame.length && y + i < this.matrixGame[0].length && this.matrixGame[x - i][y + i] === player) {
        count++;
      } else if (x - i >= 0 && x - i < this.matrixGame.length && y + i < this.matrixGame[0].length && this.matrixGame[x - i][y + i] === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    for (let i = 1; i < 5; i++) {
      if (x + i < this.matrixGame.length && y - i >= 0 && y - i < this.matrixGame[0].length && this.matrixGame[x + i][y - i] === player) {
        count++;
      } else if (x + i < this.matrixGame.length && y - i >= 0 && y - i < this.matrixGame[0].length && this.matrixGame[x + i][y - i] === this.getOpponent(player)) {
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
      if (x - i >= 0 && x - i < this.matrixGame.length && y - i >= 0 && y - i < this.matrixGame[0].length && this.matrixGame[x - i][y - i] === player) {
        count++;
      } else if (x - i >= 0 && x - i < this.matrixGame.length && y - i >= 0 && y - i < this.matrixGame[0].length && this.matrixGame[x - i][y - i] === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    for (let i = 1; i < 5; i++) {
      if (x + i < this.matrixGame.length && y + i < this.matrixGame[0].length && this.matrixGame[x + i][y + i] === player) {
        count++;
      } else if (x + i < this.matrixGame.length && y + i < this.matrixGame[0].length && this.matrixGame[x + i][y + i] === this.getOpponent(player)) {
        !isCheck && count--;
        break;
      } else {
        break
      }
    }

    return count;
  }

  checkWin(points: any, isComputer: boolean) {
    if((this.getHorizontal(Number(points[0]), Number(points[1]), X, true) >= 5
      || this.getVertical(Number(points[0]), Number(points[1]), X, true) >= 5
      || this.getRightDiagonal(Number(points[0]), Number(points[1]), X, true) >= 5
      || this.getLeftDiagonal(Number(points[0]), Number(points[1]), X, true) >= 5) && !isComputer) {
      this.isPlayerWon = true;
      this.winPlayer = X;
      return true;
    }
    if((this.getHorizontal(Number(points[0]), Number(points[1]), O, true) >= 5
      || this.getVertical(Number(points[0]), Number(points[1]), O, true) >= 5
      || this.getRightDiagonal(Number(points[0]), Number(points[1]), O, true) >= 5
      || this.getLeftDiagonal(Number(points[0]), Number(points[1]), O, true) >= 5) && isComputer) {
      this.isPlayerWon = false;
      this.winPlayer = O;
      return true;
    }
    return false;
  }

  handleClick(id: string) {
    if (this.winPlayer !== '') return;
    switch (this.processClick(id)) {
      case WIN:
        const winnerText = this.isPlayerWon ?  'You are' : 'Computer is';
        alert(winnerText + " winner");
        // reset game
        // this.init();
        break;
      case DRAW:
        alert("Draw");
        // reset game
        // this.init();
        break;
    }
  }

  processClick(id: string) {
    let points = id.split("-");

    switch (this.typeGame) {
      case TWO_PLAYER:
        break;
      case COMPUTER:
        if (this.matrixGame[Number(points[0])][Number(points[1])] === X || this.matrixGame[Number(points[0])][Number(points[1])] === O) {
          return
        }
        this.matrixGame[Number(points[0])][Number(points[1])] = X;
        this.lastPlayerPoint = [Number(points[0]), Number(points[1])];
        const computerTurn = this.getPointsComputer();
        this.lastComputerPoint = [Number(computerTurn[0]), Number(computerTurn[1])];
        this.matrixGame[Number(computerTurn[0])][Number(computerTurn[1])] = O;

        if (this.checkWin(points, false)) {
          return WIN;
        }else if (this.checkWin(computerTurn, true)) {
          return WIN;
        }

        // check draw
        if (this.checkDraw()) {
          return DRAW;
        }

        return;
      default:
        return;
    }
    return;
  }

  getPointsComputer() {
    let maxScore = -Infinity
    let pointsComputer = []
    let listScorePoint: any[] = []
    for (let i = 0; i < this.matrixGame.length; i++) {
      for (let j = 0; j < this.matrixGame[0].length; j++) {
        if (this.matrixGame[i][j] === "") {
          let horizontalScore =
            this.getNumber(MAP_SCORE_COMPUTER.get(this.getHorizontal(i, j, O))) +
            this.getNumber(MAP_POINT_HUMAN.get(this.getHorizontal(i, j, X) - 1))
          let verticalScore =
            this.getNumber(MAP_SCORE_COMPUTER.get(this.getVertical(i, j, O))) +
            this.getNumber(MAP_POINT_HUMAN.get(this.getVertical(i, j, X) - 1))
          let rightDiagonalScore =
            this.getNumber(MAP_SCORE_COMPUTER.get(this.getRightDiagonal(i, j, O))) +
            this.getNumber(MAP_POINT_HUMAN.get(this.getRightDiagonal(i, j, X) - 1))
          let leftDiagonalScore =
            this.getNumber(MAP_SCORE_COMPUTER.get(this.getLeftDiagonal(i, j, O))) +
            this.getNumber(MAP_POINT_HUMAN.get(this.getLeftDiagonal(i, j, X) - 1))
          let score =
            this.getNumber(MAP_SCORE_COMPUTER.get(
              Math.max(
                this.getHorizontal(i, j, O),
                this.getVertical(i, j, O),
                this.getRightDiagonal(i, j, O),
                this.getLeftDiagonal(i, j, O)
              )
            )) +
            this.getNumber(MAP_POINT_HUMAN.get(
              Math.max(
                this.getHorizontal(i, j, X),
                this.getVertical(i, j, X),
                this.getRightDiagonal(i, j, X),
                this.getLeftDiagonal(i, j, X)
              ) - 1
            ))
          listScorePoint.push({
            "totalScore": horizontalScore + verticalScore + rightDiagonalScore + leftDiagonalScore,
            "score": score,
            "point": [i,j],
          })
          if (maxScore <= score) {
            maxScore = score
          }
        }
      }
    }

    // get list max score
    let maxScoreInList = Math.max(...listScorePoint.map(x => x.totalScore));
    let maxListScorePoint = listScorePoint.filter(p => p.totalScore === maxScoreInList)
    let listScoreUse = maxListScorePoint.length > 0 ? maxListScorePoint : listScorePoint;
    let maxScoreToUse = maxScore < 1000 && maxScoreInList ?  maxScoreInList : maxScore;
    for (const element of listScoreUse) {
      if (element.score === maxScoreToUse || element.totalScore === maxScoreToUse) {
        pointsComputer.push(element.point)
      }
    }
    if (pointsComputer.length === 0) {
      for (const element of listScorePoint) {
        if (element.score === maxScore) {
          pointsComputer.push(element.point)
        }
      }
    }
    return pointsComputer[Math.floor(Math.random()*pointsComputer.length)]
  }

  getNumber(number: any) {
    if (!number) return -1;
    return number
  }

  isHiddenCell(cell: string, i: number, j: number) {
    if (this.winPlayer !== '') return false;
    return (cell === 'X' || cell === 'O') &&
    !((i === this.lastPlayerPoint[0] && j === this.lastPlayerPoint[1]) ||
      (i === this.lastComputerPoint[0] && j === this.lastComputerPoint[1]))
  }

  changeMode() {
    this.isNormalMode = !this.isNormalMode
  }
}
