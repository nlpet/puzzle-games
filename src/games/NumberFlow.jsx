import React, { useReducer, useEffect } from "react";

// --- Constants and Helpers ---
const fontLinks = [
  {
    href: "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500&display=swap",
    id: "roboto-mono-font",
  },
  {
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap",
    id: "inter-font",
  },
  {
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap",
    id: "jetbrains-font",
  },
];
fontLinks.forEach(({ href, id }) => {
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.href = href;
    link.rel = "stylesheet";
    link.id = id;
    document.head.appendChild(link);
  }
});

const GRID_WIDTH = 19;
const GRID_HEIGHT = 9;
const CELL_SIZE = 48;
const CENTER_X = Math.floor(GRID_WIDTH / 2);
const CENTER_Y = Math.floor(GRID_HEIGHT / 2);

const SHAPES = {
  // Level 1: Single block
  SINGLE: { shape: [[1]] },

  // Level 2: Dominoes (safe - single row/column)
  DOMINO_H: { shape: [[1, 1]] },
  DOMINO_V: {
    shape: [[1], [1]],
  },

  // Level 3: L-shapes (safe - offset rows can't self-merge)
  L_SMALL: {
    shape: [
      [1, 0],
      [1, 1],
    ],
  },
  L_SMALL_FLIP: {
    shape: [
      [0, 1],
      [1, 1],
    ],
  },

  // Level 4: Z-shapes (safe - offset rows)
  Z_MINI: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  S_MINI: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },

  // Level 5: Longer single lines (safe - single row/column)
  LINE_3: { shape: [[1, 1, 1]] },
  LINE_3_V: {
    shape: [[1], [1], [1]],
  },

  // Level 6: T-shape rotations (safe - center prevents self-merge)
  T_UP: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
};

const getNumberColor = (number) => {
  const colors = {
    2: "#ffffff",
    4: "#c0c0c0",
    8: "#808080",
    16: "#EEDBE0",
    32: "#ff8844",
    64: "#E04426",
    128: "#228b22",
    256: "#8b4513",
    512: "#8844ff",
    1024: "#4b0082",
    2048: "#FFD700",
    4096: "#ff0088",
    8192: "#8800ff",
  };
  return colors[number] || "#888888";
};

const initialState = {
  grid: Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(null)),
  leftPiece: null,
  rightPiece: null,
  score: 0,
  highestNumber: 0,
  isPlaying: false,
  gameOver: false,
  gameWon: false,
  speedLevel: 1,
  isPaused: false,
  pieceCount: 0,
};

const rotateShape = (shape) =>
  shape[0].map((_, colIndex) => shape.map((row) => row[colIndex])).reverse();

const isValidMove = (piece, grid) => {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const gridX = piece.x + c;
        const gridY = piece.y + r;
        if (
          gridY < 0 ||
          gridY >= GRID_HEIGHT ||
          gridX < 0 ||
          gridX >= GRID_WIDTH
        )
          return false;
        if (grid[gridY]?.[gridX]) return false;
      }
    }
  }
  return true;
};

// --- The Stable, No-Gravity Game Engine ---
function gameReducer(state, action) {
  switch (action.type) {
    case "RESET":
      return { ...initialState, isPlaying: true };

    case "TOGGLE_PAUSE":
      if (state.gameOver || state.gameWon)
        return gameReducer(state, { type: "RESET" });
      return {
        ...state,
        isPlaying: !state.isPlaying,
        isPaused: state.isPlaying,
      };

    case "SET_SPEED":
      // Only allow automatic level progression, not manual changes
      if (action.automatic) {
        return {
          ...state,
          speedLevel: Math.min(10, Math.max(1, action.level)),
        };
      }
      return state;

    case "ROTATE_PIECE": {
      if (!state.isPlaying) return state;
      const { side } = action.payload;
      const piece = side === "left" ? state.leftPiece : state.rightPiece;
      const setPieceKey = side === "left" ? "leftPiece" : "rightPiece";

      if (!piece) return state;

      const rotatedShape = rotateShape(piece.shape);
      const newPiece = { ...piece, shape: rotatedShape };

      // Check if rotation would go out of bounds or past the center
      for (let r = 0; r < newPiece.shape.length; r++) {
        for (let c = 0; c < newPiece.shape[r].length; c++) {
          if (newPiece.shape[r][c]) {
            const gridX = newPiece.x + c;
            const gridY = newPiece.y + r;

            // Check boundaries
            if (
              gridY < 0 ||
              gridY >= GRID_HEIGHT ||
              gridX < 0 ||
              gridX >= GRID_WIDTH
            ) {
              return state;
            }

            // Check center boundary
            if (
              (side === "left" && gridX > CENTER_X) ||
              (side === "right" && gridX < CENTER_X)
            ) {
              return state;
            }

            // Check collision with existing blocks
            if (state.grid[gridY]?.[gridX]) {
              return state;
            }
          }
        }
      }

      return { ...state, [setPieceKey]: newPiece };
    }

    case "MOVE_PIECE": {
      if (!state.isPlaying) return state;
      const { side, direction } = action.payload;
      const piece = side === "left" ? state.leftPiece : state.rightPiece;
      const setPieceKey = side === "left" ? "leftPiece" : "rightPiece";
      if (!piece) return state;

      // FIX: Prevent backward movement
      if (
        (side === "left" && direction === "left") ||
        (side === "right" && direction === "right")
      ) {
        return state;
      }

      let deltaX = 0,
        deltaY = 0;
      if (direction === "up") deltaY = -1;
      if (direction === "down") deltaY = 1;
      if (direction === "right") deltaX = 1;
      if (direction === "left") deltaX = -1;

      const newPiece = { ...piece, x: piece.x + deltaX, y: piece.y + deltaY };

      const collisionPoints = [];
      let canMerge = true;
      let isBlocked = false;

      for (let r = 0; r < newPiece.shape.length; r++) {
        for (let c = 0; c < newPiece.shape[r].length; c++) {
          if (newPiece.shape[r][c]) {
            const gridX = newPiece.x + c;
            const gridY = newPiece.y + r;

            if (
              (side === "left" && gridX > CENTER_X) ||
              (side === "right" && gridX < CENTER_X)
            ) {
              isBlocked = true;
              break;
            }

            const targetCell = state.grid[gridY]?.[gridX];
            if (targetCell) {
              collisionPoints.push({ x: gridX, y: gridY });
              if (targetCell.number !== piece.number) canMerge = false;
            }
          }
        }
        if (isBlocked) break;
      }

      if (isBlocked) return state;

      if (collisionPoints.length > 0) {
        if (
          canMerge &&
          collisionPoints.length ===
            newPiece.shape.flat().filter(Boolean).length
        ) {
          return gameReducer(state, {
            type: "MERGE_PIECES",
            payload: { movingPiece: newPiece },
          });
        }
        return state; // Blocked by non-matching piece
      }

      if (isValidMove(newPiece, state.grid)) {
        return { ...state, [setPieceKey]: newPiece };
      }
      return state;
    }

    case "TICK": {
      if (!state.isPlaying) return state;
      let nextState = { ...state };

      if (!nextState.leftPiece) {
        nextState.leftPiece = generatePiece("left", state.pieceCount);
        nextState.pieceCount++;
      } else {
        const { leftPiece } = nextState;
        const newX = leftPiece.x + 1;
        let collision = false;

        for (let r = 0; r < leftPiece.shape.length; r++) {
          for (let c = 0; c < leftPiece.shape[r].length; c++) {
            if (leftPiece.shape[r][c]) {
              const gridX = leftPiece.x + c + 1;
              const gridY = leftPiece.y + r;

              if (gridX > CENTER_X || state.grid[gridY]?.[gridX]) {
                collision = true;
                break;
              }
            }
          }
          if (collision) break;
        }

        if (collision) {
          return gameReducer(nextState, {
            type: "PLACE_PIECE",
            payload: leftPiece,
          });
        }
        nextState.leftPiece = { ...leftPiece, x: newX };
      }

      if (!nextState.rightPiece) {
        nextState.rightPiece = generatePiece("right", state.pieceCount);
        nextState.pieceCount++;
      } else {
        const { rightPiece } = nextState;
        const newX = rightPiece.x - 1;
        let collision = false;

        for (let r = 0; r < rightPiece.shape.length; r++) {
          for (let c = 0; c < rightPiece.shape[r].length; c++) {
            if (rightPiece.shape[r][c]) {
              const gridX = rightPiece.x + c - 1;
              const gridY = rightPiece.y + r;

              if (gridX < CENTER_X || state.grid[gridY]?.[gridX]) {
                collision = true;
                break;
              }
            }
          }
          if (collision) break;
        }

        if (collision) {
          return gameReducer(nextState, {
            type: "PLACE_PIECE",
            payload: rightPiece,
          });
        }
        nextState.rightPiece = { ...rightPiece, x: newX };
      }
      return nextState;
    }

    case "PLACE_PIECE": {
      const piece = action.payload;
      let grid = state.grid.map((r) => [...r]);

      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            grid[piece.y + r][piece.x + c] = {
              number: piece.number,
              color: piece.color,
              pieceId: piece.id,
            };
          }
        }
      }

      const newState = {
        ...state,
        grid,
        leftPiece: piece.side === "left" ? null : state.leftPiece,
        rightPiece: piece.side === "right" ? null : state.rightPiece,
      };
      return gameReducer(newState, { type: "SETTLE_GRID" });
    }

    case "MERGE_PIECES": {
      const { movingPiece } = action.payload;
      let grid = state.grid.map((r) => [...r]);
      let score = state.score;
      let highestNumber = state.highestNumber;
      const newNumber = movingPiece.number * 2;

      for (let r = 0; r < movingPiece.shape.length; r++) {
        for (let c = 0; c < movingPiece.shape[r].length; c++) {
          if (movingPiece.shape[r][c]) {
            const gridX = movingPiece.x + c;
            const gridY = movingPiece.y + r;
            grid[gridY][gridX] = {
              number: newNumber,
              color: getNumberColor(newNumber),
              pieceId: movingPiece.id,
            };
            score += newNumber;
            highestNumber = Math.max(highestNumber, newNumber);
          }
        }
      }

      const newState = {
        ...state,
        grid,
        score,
        highestNumber,
        leftPiece: movingPiece.side === "left" ? null : state.leftPiece,
        rightPiece: movingPiece.side === "right" ? null : state.rightPiece,
      };
      return gameReducer(newState, { type: "SETTLE_GRID" });
    }

    case "SETTLE_GRID": {
      let grid = state.grid.map((r) => [...r]);
      let score = state.score;
      let highestNumber = state.highestNumber;
      let changedInPass;
      do {
        changedInPass = false;
        // Horizontal & Central Merges
        for (let y = 0; y < GRID_HEIGHT; y++) {
          for (let x = 0; x < CENTER_X; x++) {
            if (
              grid[y][x] &&
              grid[y][x + 1] &&
              grid[y][x].number === grid[y][x + 1].number &&
              grid[y][x].pieceId !== grid[y][x + 1].pieceId
            ) {
              const n = grid[y][x].number * 2;
              grid[y][x + 1] = {
                number: n,
                color: getNumberColor(n),
                pieceId: Date.now() + Math.random(), // New ID for merged cell
              };
              grid[y][x] = null;
              score += n;
              if (n > highestNumber) highestNumber = n;
              changedInPass = true;
            }
          }
          for (let x = GRID_WIDTH - 1; x > CENTER_X; x--) {
            if (
              grid[y][x] &&
              grid[y][x - 1] &&
              grid[y][x].number === grid[y][x - 1].number &&
              grid[y][x].pieceId !== grid[y][x - 1].pieceId
            ) {
              const n = grid[y][x].number * 2;
              grid[y][x - 1] = {
                number: n,
                color: getNumberColor(n),
                pieceId: Date.now() + Math.random(), // New ID for merged cell
              };
              grid[y][x] = null;
              score += n;
              if (n > highestNumber) highestNumber = n;
              changedInPass = true;
            }
          }
        }
        const centerBlock = grid[CENTER_Y][CENTER_X];
        if (centerBlock) {
          const positions = [
            { x: CENTER_X - 1, y: CENTER_Y },
            { x: CENTER_X + 1, y: CENTER_Y },
            { x: CENTER_X, y: CENTER_Y - 1 },
            { x: CENTER_X, y: CENTER_Y + 1 },
          ];
          for (const pos of positions) {
            const adj = grid[pos.y]?.[pos.x];
            if (
              adj &&
              adj.number === centerBlock.number &&
              adj.pieceId !== centerBlock.pieceId
            ) {
              const n = centerBlock.number * 2;
              grid[CENTER_Y][CENTER_X] = {
                number: n,
                color: getNumberColor(n),
                pieceId: Date.now() + Math.random(), // New ID for merged cell
              };
              grid[pos.y][pos.x] = null;
              score += n;
              if (n > highestNumber) highestNumber = n;
              changedInPass = true;
              break;
            }
          }
        }
      } while (changedInPass);

      const gameIsWon = grid[CENTER_Y]?.[CENTER_X]?.number === 2048;
      let isGameOver = false;
      for (let y = 0; y < GRID_HEIGHT; y++) {
        if (grid[y][0] || grid[y][GRID_WIDTH - 1]) isGameOver = true;
      }
      return {
        ...state,
        grid,
        score,
        highestNumber,
        gameWon: gameIsWon,
        gameOver: isGameOver && !gameIsWon,
        isPlaying: !gameIsWon && !isGameOver,
      };
    }
    default:
      return state;
  }
}

const generatePiece = (side, pieceCount) => {
  // Add slight variation between sides
  const sideModifier = side === "left" ? 0 : 5;
  const adjustedCount = pieceCount + sideModifier;

  // Progressive shape difficulty with some randomness
  let shapePool = ["SINGLE"]; // Always have single blocks

  // Add shapes based on piece count with some probability
  if (adjustedCount >= 8 && Math.random() < 0.8) {
    shapePool.push("DOMINO_H", "DOMINO_V");
  }
  if (adjustedCount >= 20 && Math.random() < 0.7) {
    shapePool.push("L_SMALL", "L_SMALL_FLIP");
  }
  if (adjustedCount >= 35 && Math.random() < 0.6) {
    shapePool.push("Z_MINI", "S_MINI");
  }
  if (adjustedCount >= 50 && Math.random() < 0.5) {
    shapePool.push("LINE_3", "LINE_3_V");
  }
  if (adjustedCount >= 70 && Math.random() < 0.4) {
    shapePool.push("T_UP");
  }

  // Add side-specific bias
  if (side === "left" && pieceCount > 15) {
    shapePool.push("DOMINO_H"); // Left side gets more horizontal pieces
  } else if (side === "right" && pieceCount > 15) {
    shapePool.push("DOMINO_V"); // Right side gets more vertical pieces
  }

  // Add more weight to simpler shapes early on
  if (pieceCount < 30) {
    shapePool.push("SINGLE");
  }

  const shapeKey = shapePool[Math.floor(Math.random() * shapePool.length)];

  // Progressive number difficulty with side variation
  const maxLevel = Math.min(11, 1 + Math.floor(adjustedCount / 30));
  const level = Math.ceil(Math.pow(Math.random(), 2) * maxLevel);
  const baseNumber = Math.pow(2, level);

  const shape = SHAPES[shapeKey].shape;
  const y = Math.floor(Math.random() * (GRID_HEIGHT - shape.length));

  return {
    shape: shape,
    number: baseNumber,
    x: side === "left" ? 0 : GRID_WIDTH - shape[0].length,
    y: y,
    side: side,
    id: Date.now() + Math.random(),
    color: getNumberColor(baseNumber),
  };
};

function NumberFlow() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const {
    grid,
    leftPiece,
    rightPiece,
    score,
    highestNumber,
    isPlaying,
    gameOver,
    gameWon,
    speedLevel,
    isPaused,
  } = state;
  const gamePace = 1200 - (speedLevel - 1) * 75;

  useEffect(() => {
    if (!isPlaying) return;
    const speedTimer = setInterval(
      () =>
        dispatch({
          type: "SET_SPEED",
          level: state.speedLevel + 1,
          automatic: true,
        }),
      60000
    );
    return () => clearInterval(speedTimer);
  }, [isPlaying, state.speedLevel]);

  useEffect(() => {
    if (!isPlaying) return;
    const gameLoop = setInterval(() => dispatch({ type: "TICK" }), gamePace);
    return () => clearInterval(gameLoop);
  }, [isPlaying, gamePace]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isPlaying) return;
      switch (e.key.toLowerCase()) {
        case "w":
          dispatch({
            type: "MOVE_PIECE",
            payload: { side: "left", direction: "up" },
          });
          break;
        case "s":
          dispatch({
            type: "MOVE_PIECE",
            payload: { side: "left", direction: "down" },
          });
          break;
        case "d":
          dispatch({
            type: "MOVE_PIECE",
            payload: { side: "left", direction: "right" },
          });
          break;
        case "a":
          dispatch({
            type: "MOVE_PIECE",
            payload: { side: "left", direction: "left" },
          });
          break;
        case "e":
          dispatch({ type: "ROTATE_PIECE", payload: { side: "left" } });
          break;
        case "arrowup":
          e.preventDefault();
          dispatch({
            type: "MOVE_PIECE",
            payload: { side: "right", direction: "up" },
          });
          break;
        case "arrowdown":
          e.preventDefault();
          dispatch({
            type: "MOVE_PIECE",
            payload: { side: "right", direction: "down" },
          });
          break;
        case "arrowleft":
          e.preventDefault();
          dispatch({
            type: "MOVE_PIECE",
            payload: { side: "right", direction: "left" },
          });
          break;
        case "arrowright":
          e.preventDefault();
          dispatch({
            type: "MOVE_PIECE",
            payload: { side: "right", direction: "right" },
          });
          break;
        case " ":
          e.preventDefault();
          dispatch({ type: "ROTATE_PIECE", payload: { side: "right" } });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying]);

  const renderCell = (x, y) => {
    let cell = grid[y][x];
    let pieceColor = null;
    let pieceNumber = null;
    const checkPiece = (piece) => {
      if (!piece) return;
      const pX = x - piece.x;
      const pY = y - piece.y;
      if (
        pY >= 0 &&
        pY < piece.shape.length &&
        pX >= 0 &&
        pX < piece.shape[pY].length &&
        piece.shape[pY][pX]
      ) {
        pieceColor = piece.color;
        pieceNumber = piece.number;
      }
    };
    checkPiece(leftPiece);
    checkPiece(rightPiece);
    const hasContent = cell || pieceNumber;
    let content = cell?.number ?? pieceNumber ?? "";
    let bgColor = cell?.color ?? pieceColor ?? "transparent";
    let textColor =
      content === 2 || content === 4 || content === 16 || content === 2048
        ? "#000000"
        : "#ffffff";
    const shadowStyle = hasContent
      ? { boxShadow: "3px 5px 5px rgba(20, 20, 20, 0.3)" }
      : {};
    return (
      <div
        key={`${x}-${y}`}
        className={`relative flex items-center justify-center transition-all duration-200 ${
          x === CENTER_X
            ? "border-l-2 border-r-2 border-gray-700 border-dashed"
            : ""
        }`}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderLeft:
            x === CENTER_X ? "none" : "1px solid rgba(255,255,255,0.05)",
          borderRight:
            x === CENTER_X ? "none" : "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {x === CENTER_X && y === CENTER_Y && !hasContent && (
          <>
            <div className="absolute w-[2px] h-[calc(100%-12px)] bg-gray-700 transform rotate-45" />
            <div className="absolute w-[2px] h-[calc(100%-12px)] bg-gray-700 transform -rotate-45" />
          </>
        )}
        {x === CENTER_X && y === CENTER_Y && cell && (
          <div
            className="absolute inset-0 flex items-center justify-center text-4xl"
            style={{ color: "rgba(255, 255, 255, 0.1)", zIndex: 1 }}
          >
            ×
          </div>
        )}
        {hasContent && (
          <div
            className="absolute inset-0 flex items-center justify-center font-bold"
            style={{
              background: bgColor,
              color: textColor,
              fontSize:
                content.toString().length > 3
                  ? "16px"
                  : content.toString().length > 2
                  ? "20px"
                  : "24px",
              fontFamily: "JetBrains Mono, monospace",
              zIndex: 2,
              ...shadowStyle,
            }}
          >
            {content}
          </div>
        )}
        {!hasContent && !(x === CENTER_X && y === CENTER_Y) && (
          <div className="w-2 h-2 bg-gray-600 rounded-full" />
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-black text-white p-4 flex flex-col items-center overflow-hidden"
      style={{ fontFamily: "Roboto Mono, Inter, sans-serif" }}
    >
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-6xl mb-4 font-light tracking-tight">
            NumberFlow_
          </h1>
          <p className="text-gray-400 text-lg font-light">
            Merge matching numbers to create a 2048 block in the center cell.
          </p>
        </div>
        {gameWon && (
          <div className="text-center mb-8 p-8 border-2 border-yellow-400 rounded-lg bg-gray-950">
            <div
              className="text-4xl mb-3 font-bold"
              style={{ color: getNumberColor(2048) }}
            >
              YOU WON!
            </div>
            <div className="text-gray-300 text-lg font-light">
              You created a 2048 block in the center!
            </div>
            <div className="text-2xl mt-4 font-light">
              Final Score: <span className="text-white font-bold">{score}</span>
            </div>
          </div>
        )}
        {gameOver && !gameWon && (
          <div className="text-center mb-8 p-8 border border-gray-800 rounded-lg bg-gray-950">
            <div className="text-white text-3xl mb-3 font-light">Game Over</div>
            <div className="text-gray-400 text-lg font-light">
              Blocks reached the edges
            </div>
            <div className="text-2xl mt-4 font-light">
              Final Score:{" "}
              <span className="text-white font-normal">{score}</span>
            </div>
          </div>
        )}
        <div className="flex justify-center mb-8 space-x-20">
          <div className="text-center">
            <div
              className="text-5xl text-white mb-2 font-light"
              style={{ fontFamily: "Roboto Mono, JetBrains Mono, monospace" }}
            >
              {score}
            </div>
            <div className="text-sm text-gray-500 uppercase tracking-widest font-medium">
              Score
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-5xl text-white mb-2 font-light"
              style={{
                fontFamily: "Roboto Mono, JetBrains Mono, monospace",
                color: getNumberColor(highestNumber),
              }}
            >
              {highestNumber}
            </div>
            <div className="text-sm text-gray-500 uppercase tracking-widest font-medium">
              Highest
            </div>
          </div>
        </div>
        <div className="flex justify-center mb-8">
          <div
            className="bg-gray-950 border-2 border-gray-800 rounded-lg"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_WIDTH}, ${CELL_SIZE}px)`,
              gap: "0px",
              padding: "4px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            {Array.from({ length: GRID_HEIGHT }).map((_, y) =>
              Array.from({ length: GRID_WIDTH }).map((_, x) => renderCell(x, y))
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => dispatch({ type: "TOGGLE_PAUSE" })}
            className={`px-16 py-5 rounded-lg text-2xl transition-all duration-200 font-light ${
              gameOver
                ? "bg-white text-black hover:bg-gray-200"
                : isPlaying
                ? "bg-gray-900 text-red-400 border-2 border-red-400 hover:bg-red-400 hover:text-white"
                : "bg-white text-black hover:bg-gray-200"
            }`}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              background: gameWon ? getNumberColor(2048) : "",
              color: gameWon ? "black" : "",
              textShadow: gameWon ? "0 1px 2px rgba(0,0,0,0.2)" : "",
            }}
          >
            {gameWon || gameOver
              ? "NEW GAME"
              : isPlaying
              ? "PAUSE"
              : isPaused
              ? "RESUME"
              : "START"}
          </button>

          <div className="flex gap-12 items-center mt-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">LEFT</div>
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[128px]">
                <div className="col-start-2 row-start-1">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "left", direction: "up" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    W
                  </button>
                </div>
                <div className="col-start-1 row-start-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "left", direction: "left" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    A
                  </button>
                </div>
                <div className="col-start-2 row-start-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "left", direction: "down" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    S
                  </button>
                </div>
                <div className="col-start-3 row-start-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "left", direction: "right" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    D
                  </button>
                </div>
                <div className="col-start-1 col-span-3 row-start-3 mt-1">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "ROTATE_PIECE",
                        payload: { side: "left" },
                      })
                    }
                    className="w-full h-8 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    E
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">LEVEL</div>
              <div className="w-20 h-12 bg-gray-900 rounded border border-gray-700 flex items-center justify-center">
                <div className="text-2xl text-white font-mono">
                  {speedLevel}
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">RIGHT</div>
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[128px]">
                <div className="col-start-2 row-start-1">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "right", direction: "up" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-lg flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    ↑
                  </button>
                </div>
                <div className="col-start-1 row-start-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "right", direction: "left" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-lg flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    ←
                  </button>
                </div>
                <div className="col-start-2 row-start-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "right", direction: "down" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-lg flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    ↓
                  </button>
                </div>
                <div className="col-start-3 row-start-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "right", direction: "right" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-lg flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    →
                  </button>
                </div>
                <div className="col-start-1 col-span-3 row-start-3 mt-1">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "ROTATE_PIECE",
                        payload: { side: "right" },
                      })
                    }
                    className="w-full h-8 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying}
                  >
                    SPACE
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm">
              Controls: (Left) WASD to move, E to rotate • (Right) Arrows to
              move, Space to rotate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumberFlow;
