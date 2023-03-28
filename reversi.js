const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Initialize the game board
function initBoard() {
  const board = [];
  for (let i = 0; i < 8; i++) {
    board[i] = new Array(8).fill(".");
  }
  board[3][3] = "W";
  board[3][4] = "B";
  board[4][3] = "B";
  board[4][4] = "W";
  return board;
}

// Display the game board
function displayBoard(board) {
  console.log("  0 1 2 3 4 5 6 7");
  for (let i = 0; i < 8; i++) {
    let row = `${i}`;
    for (let j = 0; j < 8; j++) {
      row += ` ${board[i][j]}`;
    }
    console.log(row);
  }
}

// Get all valid moves for the current player
function getValidMoves(player, board) {
  const opponent = player === "B" ? "W" : "B";
  const validMoves = [];

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board[i][j] === ".") {
        const move = [i, j];
        for (const dir of directions) {
          const flips = getFlips(move, player, opponent, board, dir);
          if (flips.length > 0) {
            validMoves.push(move);
            break;
          }
        }
      }
    }
  }

  return validMoves;
}

// Check if the game is over
function isGameOver(board) {
  return (
    getValidMoves("B", board).length === 0 &&
    getValidMoves("W", board).length === 0
  );
}

// Calculate the score for both players
function score(board) {
  let W = 0;
  let B = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell === "W") W++;
      if (cell === "B") B++;
    }
  }

  return { W, B };
}

const directions = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

// Get the pieces to flip for a move in the given direction
function getFlips(move, player, opponent, board, direction) {
  const flips = [];
  let [x, y] = move;
  let [dx, dy] = direction;

  x += dx;
  y += dy;

  while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
    flips.push([x, y]);
    x += dx;
    y += dy;
  }

  if (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === player) {
    return flips;
  }

  return [];
}

// Make a move and flip the appropriate pieces
function makeMove(x, y, player, board) {
  const opponent = player === "B" ? "W" : "B";
  board[x][y] = player;

  for (const dir of directions) {
    const flips = getFlips([x, y], player, opponent, board, dir);
    for (const flip of flips) {
      board[flip[0]][flip[1]] = player;
    }
  }
}

// Prompt the human player for a move
// function humanMove(player, board) {
//   return new Promise((resolve) => {
//     rl.question(`Player ${player}, enter your move (x y): `, (input) => {
//       const [x, y] = input.split(" ").map(Number);
//       if (isValidMove(x, y, player, board)) {
//         resolve([x, y]);
//       } else {
//         console.log("Invalid move. Please try again.");
//         resolve(humanMove(player, board));
//       }
//     });
//   });
// }

// Prompt the human player for a move
async function humanMove(player, board) {
  return new Promise((resolve) => {
    rl.question(`Player ${player}, enter your move (x y): `, (input) => {
      const inputParts = input.split(" ");
      if (inputParts.length !== 2) {
        console.log(
          'Invalid input. Please enter your move in the format "x y".'
        );
        resolve(humanMove(player, board));
      } else {
        const [x, y] = inputParts.map((part) => {
          const num = parseInt(part, 10);
          return isNaN(num) ? -1 : num;
        });

        if (isValidMove(x, y, player, board)) {
          resolve([x, y]);
        } else {
          console.log("Invalid move. Please try again.");
          resolve(humanMove(player, board));
        }
      }
    });
  });
}

// Check if a move is valid
function isValidMove(x, y, player, board) {
  if (x < 0 || x >= 8 || y < 0 || y >= 8 || board[x][y] !== ".") {
    return false;
  }

  const opponent = player === "B" ? "W" : "B";
  for (const dir of directions) {
    const flips = getFlips([x, y], player, opponent, board, dir);
    if (flips.length > 0) {
      return true;
    }
  }

  return false;
}

// Evaluation function to score a board state
function evaluateBoard(board, player) {
  const { W, B } = score(board);
  const scoreDiff = player === "W" ? W - B : B - W;
  return scoreDiff;
}

// Minimax algorithm with Alpha-Beta pruning
function minimax(board, depth, player, alpha, beta) {
  if (depth === 0 || isGameOver(board)) {
    return { score: evaluateBoard(board, player) };
  }

  const maximizingPlayer = player === "W"; // Assume White is the maximizing player
  const validMoves = getValidMoves(player, board);

  if (maximizingPlayer) {
    let maxScore = -Infinity;
    let bestMove = null;

    for (const move of validMoves) {
      const newBoard = JSON.parse(JSON.stringify(board));
      makeMove(move[0], move[1], player, newBoard);
      const result = minimax(newBoard, depth - 1, "B", alpha, beta);
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break; // Alpha-Beta pruning
    }

    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    let bestMove = null;
    for (const move of validMoves) {
      const newBoard = JSON.parse(JSON.stringify(board));
      makeMove(move[0], move[1], player, newBoard);
      const result = minimax(newBoard, depth - 1, "W", alpha, beta);
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break; // Alpha-Beta pruning
    }

    return { score: minScore, move: bestMove };
  }
}

// Advanced CPU move using the Minimax algorithm with Alpha-Beta pruning
function advancedCpuMove(player, board) {
  const depth = 4; // Search depth; increase for a stronger but slower CPU player
  const result = minimax(board, depth, player, -Infinity, Infinity);
  return result.move;
}

async function main() {
  const board = initBoard();
  let currentPlayer = "B"; // Start with Black

  while (!isGameOver(board)) {
    displayBoard(board);
    const validMoves = getValidMoves(currentPlayer, board);
    if (validMoves.length === 0) {
      console.log(`No valid moves for player ${currentPlayer}. Pass.`);
    } else {
      let move;
      if (currentPlayer === "B") {
        move = await humanMove(currentPlayer, board);
      } else {
        // Replace the cpuMove() function call with advancedCpuMove()
        move = advancedCpuMove(currentPlayer, board);
        if (move === null) {
          console.log(`No valid moves for player ${currentPlayer}. Pass.`);
          currentPlayer = currentPlayer === "B" ? "W" : "B";
          continue;
        }
      }
      makeMove(move[0], move[1], currentPlayer, board);
    }
    currentPlayer = currentPlayer === "B" ? "W" : "B";
  }

  displayBoard(board);
  const { W, B } = score(board);

  if (W === B) {
    console.log("Stalemate! Game is a draw.");
  } else {
    console.log(`Game over! White: ${W}, Black: ${B}`);
  }
}

main();
