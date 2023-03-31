const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Board dimensions
const SIZE = 8;

// Directions for checking valid moves and flipping pieces
const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1], [1, 0], [1, 1]
];

// Create an empty board
function createBoard() {
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      board[i][j] = '.';
    }
  }
  // Initialize the starting pieces
  board[3][3] = 'W';
  board[3][4] = 'B';
  board[4][3] = 'B';
  board[4][4] = 'W';
  return board;
}

// Print the current board state
// function printBoard(board) {
//   console.log('  0 1 2 3 4 5 6 7');
//   for (let i = 0; i < SIZE; i++) {
//     let row = `${i}`;
//     for (let j = 0; j < SIZE; j++) {
//       row += ` ${board[i][j]}`;
//     }
//     console.log(row);
 
//   }
// }

function printBoard(board) {
  console.log('  0 1 2 3 4 5 6 7');
  for (let i = 0; i < 8; i++) {
    let row = `${i} `;
    for (let j = 0; j < 8; j++) {
      const cell = board[i][j];
      if (cell === 'B') {
        row += '○ '; // black disc goes here
      } else if (cell === 'W') {
        row += '● '; // white disc goes here
      } else {
        row += '. ';
      }
    }
    console.log(row);
  }
}


// Calculate the current score for both players
function score(board) {
  let W = 0;
  let B = 0;
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (board[i][j] === 'W') {
        W++;
      } else if (board[i][j] === 'B') {
        B++;
      }
    }
  }
  return { W, B };
}

// Check if the game is over
function isGameOver(board) {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (board[i][j] === '.') {
        return false;
      }
    }
  }
  return true;
}

// Check if a move is valid
function isValidMove(x, y, player, board) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE || board[x][y] !== '.') {
    return false;
  }

  const opponent = player === 'B' ? 'W' : 'B';
  for (const dir of directions) {
    const flips = getFlips([x, y], player, opponent, board, dir);
    if (flips.length > 0) {
      return true;
    }
  }

  return false;
}

// Get the coordinates of the pieces to flip after a move
function getFlips(coord, player, opponent, board, dir) {
  const [dx, dy] = dir;
  let x = coord[0] + dx;
  let y = coord[1] + dy;
  const flips = [];

  while (x >= 0 && x < SIZE && y >= 0 && y < SIZE && board[x][y] === opponent) {
    flips.push([x, y]);
    x += dx;
    y += dy;
  }
  

  if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && board[x][y] === player) {
    return flips;
  }

  return [];
}

// Make a move and flip the appropriate pieces
function makeMove(x, y, player, board) {
  const opponent = player === 'B' ? 'W' : 'B';
  board[x][y] = player;

  for (const dir of directions) {
    const flips = getFlips([x, y], player, opponent, board, dir);
    for (const flip of flips) {
      board[flip[0]][flip[1]] = player;
    }
  }
}

// Prompt the human player for a move
function humanMove(player, board) {
  return new Promise((resolve) => {
    rl.question(`Player ${player}, enter your move (x y): `, (input) => {
      const [x, y] = input.split(' ').map(Number);
      if (isValidMove(x, y, player, board)) {
        resolve([x, y]);
      } else {
        console.log('Invalid move. Please try again.');
        resolve(humanMove(player, board));
      }
    });
  });
}

// Get valid moves for a player
function getValidMoves(player, board) {
  const validMoves = [];
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
     
      if (isValidMove(i, j, player, board)) {
        validMoves.push([i, j]);
      }
    }
  }
  return validMoves;
}

// CPU move for easy difficulty
function cpuMove(player, board) {
  const validMoves = getValidMoves(player, board);
  if (validMoves.length > 0) {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
  return null;
}

// CPU move for advanced difficulty
function advancedCpuMove(player, board, depth) {
  const result = minimax(board, depth, player, -Infinity, Infinity);
  return result.move;
}

// Evaluation function to score a board state
function evaluateBoard(board, player) {
  const { W, B } = score(board);
  const scoreDiff = player === 'W' ? W - B : B - W;
  return scoreDiff;
}

// Minimax algorithm with Alpha-Beta pruning
function minimax(board, depth, player, alpha, beta) {
  if (depth === 0 || isGameOver(board)) {
    return { score: evaluateBoard(board, player) };
  }

  const maximizingPlayer = player === 'W'; // Assume White is the maximizing player
  const validMoves = getValidMoves(player, board);

  if (maximizingPlayer) {
    let maxScore = -Infinity;
    let bestMove = null;

    for (const move of validMoves) {
      const newBoard = JSON.parse(JSON.stringify(board));
      makeMove(move[0], move[1], player, newBoard);
      const result = minimax(newBoard, depth - 1, 'B', alpha, beta);
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
      const result = minimax(newBoard, depth - 1, 'W', alpha, beta);
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

function askDifficulty() {
  return new Promise((resolve) => {
    rl.question('Choose the game mode (1v1, easy, or advanced): ', (input) => {
      if (input === '1v1' || input === 'easy' || input === 'advanced') {
        resolve(input);
      } else {
        console.log('Invalid mode. Please choose either 1v1, easy, or advanced.');
        resolve(askDifficulty());
      }
    });
  });
}

// Main game loop
async function startGame(mode) {
  mode = await askDifficulty();
  const board = createBoard();
  let currentPlayer = 'B';

  while (!isGameOver(board)) {
    printBoard(board);
    const { W, B } = score(board);
    console.log(`Score: W ${W} - ${B} B`);

    let move;
    if (currentPlayer === 'B') {
      move = await humanMove(currentPlayer, board);
    } else {
      if (mode === '1v1') {
        move = await humanMove(currentPlayer, board);
      } else {
        // Change depth to adjust difficulty (higher depth = more difficult)
        const depth = mode === 'advanced' ? 4 : 2;
        move = advancedCpuMove(currentPlayer, board, depth);
      }
    }

    if (move) {
      makeMove(move[0], move[1],
        currentPlayer, board);
      }
  
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
    }
  
    // Print final board and score
    printBoard(board);
    const { W, B } = score(board);
    console.log(`Final score: W ${W} - ${B} B`);
    if (W > B) {
      console.log('White wins!');
    } else if (W < B) {
      console.log('Black wins!');
    } else {
      console.log('It\'s a draw!');
    }
  
    rl.close();
  }
  
  // Start the game with the desired mode
  // Choose '1v1', 'easy', or 'advanced'
  startGame('advanced');
  