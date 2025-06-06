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
    2048: "black",
    4096: "#ff0088",
    8192: "#8800ff",
  };
  return colors[number] || "#888888";
};

// --- Initial State for the Reducer ---
const initialState = {
  grid: Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(null)),
  leftPiece: null,
  rightPiece: null,
  score: 0,
  highestNumber: 2,
  isPlaying: false,
  gameOver: false,
  gameWon: false,
  speedLevel: 1,
  isPaused: false,
  pieceCount: 0,
};

// --- The New, No-Gravity Game Engine ---
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
      return { ...state, speedLevel: Math.min(10, Math.max(1, action.level)) };

    case "MOVE_PIECE": {
      if (!state.isPlaying) return state;
      const { side, direction } = action.payload;
      const piece = side === "left" ? state.leftPiece : state.rightPiece;
      const setPieceKey = side === "left" ? "leftPiece" : "rightPiece";
      if (!piece) return state;

      let newX = piece.x,
        newY = piece.y;
      if (direction === "up") newY--;
      if (direction === "down") newY++;
      if (direction === "right" && side === "left") newX++;
      if (direction === "left" && side === "right") newX--;

      if (
        newY < 0 ||
        newY >= GRID_HEIGHT ||
        (side === "left" && newX >= CENTER_X) ||
        (side === "right" && newX <= CENTER_X)
      ) {
        return state;
      }

      const targetCell = state.grid[newY]?.[newX];
      if (targetCell) {
        if (targetCell.number === piece.numbers[0][0]) {
          let grid = state.grid.map((r) => [...r]);
          const n = targetCell.number * 2;
          grid[newY][newX] = { number: n, color: getNumberColor(n) };
          grid[piece.y][piece.x] = null;

          const newState = {
            ...state,
            grid,
            [setPieceKey]: null,
            score: state.score + n,
            highestNumber: Math.max(state.highestNumber, n),
          };
          return gameReducer(newState, { type: "SETTLE_GRID" });
        }
        return state; // Blocked
      }

      return { ...state, [setPieceKey]: { ...piece, x: newX, y: newY } };
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
        if (newX >= CENTER_X || nextState.grid[leftPiece.y]?.[newX]) {
          return gameReducer(nextState, {
            type: "PLACE_PIECE",
            payload: leftPiece,
          });
        } else {
          nextState.leftPiece = { ...leftPiece, x: newX };
        }
      }

      if (!nextState.rightPiece) {
        nextState.rightPiece = generatePiece("right", state.pieceCount);
        nextState.pieceCount++;
      } else {
        const { rightPiece } = nextState;
        const newX = rightPiece.x - 1;
        if (newX <= CENTER_X || nextState.grid[rightPiece.y]?.[newX]) {
          return gameReducer(nextState, {
            type: "PLACE_PIECE",
            payload: rightPiece,
          });
        } else {
          nextState.rightPiece = { ...rightPiece, x: newX };
        }
      }
      return nextState;
    }

    case "PLACE_PIECE": {
      const piece = action.payload;
      let grid = state.grid.map((r) => [...r]);
      const intendedX = piece.side === "left" ? piece.x + 1 : piece.x - 1;
      const intendedY = piece.y;
      const targetCell = grid[intendedY]?.[intendedX];
      let finalX = piece.x;
      let pieceConsumed = false;
      let score = state.score;
      let highestNumber = state.highestNumber;

      if (intendedX === CENTER_X) {
        if (!targetCell) {
          finalX = intendedX;
        } else if (
          intendedY === CENTER_Y &&
          targetCell.number === piece.numbers[0][0]
        ) {
          const n = targetCell.number * 2;
          grid[intendedY][intendedX] = { number: n, color: getNumberColor(n) };
          pieceConsumed = true;
          score += n;
          highestNumber = Math.max(highestNumber, n);
        }
      }

      if (!pieceConsumed) {
        grid[piece.y][finalX] = {
          number: piece.numbers[0][0],
          color: piece.color,
        };
      }

      const newState = {
        ...state,
        grid,
        score,
        highestNumber,
        leftPiece: piece.side === "left" ? null : state.leftPiece,
        rightPiece: piece.side === "right" ? null : state.rightPiece,
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
        // Horizontal Merges
        for (let y = 0; y < GRID_HEIGHT; y++) {
          for (let x = 0; x < CENTER_X; x++) {
            if (
              grid[y][x] &&
              grid[y][x + 1] &&
              grid[y][x].number === grid[y][x + 1].number
            ) {
              const n = grid[y][x].number * 2;
              grid[y][x + 1] = { number: n, color: getNumberColor(n) };
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
              grid[y][x].number === grid[y][x - 1].number
            ) {
              const n = grid[y][x].number * 2;
              grid[y][x - 1] = { number: n, color: getNumberColor(n) };
              grid[y][x] = null;
              score += n;
              if (n > highestNumber) highestNumber = n;
              changedInPass = true;
            }
          }
        }
        // Central Pull
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
            if (adj && adj.number === centerBlock.number) {
              const n = centerBlock.number * 2;
              grid[CENTER_Y][CENTER_X] = {
                number: n,
                color: getNumberColor(n),
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

      // NO GRAVITY. EVER.

      let blockCount = 0,
        has2048 = false,
        isGameOver = false;
      for (let y = 0; y < GRID_HEIGHT; y++) {
        if (grid[y][0] || grid[y][GRID_WIDTH - 1]) isGameOver = true;
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (grid[y][x]) {
            blockCount++;
            if (grid[y][x].number === 2048) has2048 = true;
          }
        }
      }

      return {
        ...state,
        grid,
        score,
        highestNumber,
        gameWon: has2048 && blockCount === 1,
        gameOver: isGameOver && !(has2048 && blockCount === 1),
        isPlaying: !(has2048 && blockCount === 1) && !isGameOver,
      };
    }
    default:
      return state;
  }
}

const generatePiece = (side, pieceCount) => {
  const maxLevel = Math.min(11, 1 + Math.floor(pieceCount / 10));
  const level = Math.ceil(Math.random() * maxLevel);
  const baseNumber = Math.pow(2, level);
  return {
    shape: [[[1]]],
    numbers: [[baseNumber]],
    x: side === "left" ? 0 : GRID_WIDTH - 1,
    y: Math.floor(Math.random() * GRID_HEIGHT),
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
  } = state;

  useEffect(() => {
    if (!isPlaying) return;
    const speedTimer = setInterval(
      () => dispatch({ type: "SET_SPEED", level: state.speedLevel + 1 }),
      60000
    );
    return () => clearInterval(speedTimer);
  }, [isPlaying, state.speedLevel]);

  const gamePace = 1600 - speedLevel * 100;

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
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying]);

  const renderCell = (x, y) => {
    const cell = grid[y][x];
    const isCenterColumn = x === CENTER_X;
    const isCenterBlock = x === CENTER_X && y === CENTER_Y;
    let content = "",
      bgColor = "transparent",
      textColor = "#ffffff",
      isRainbow = false;
    let isPieceCell = false,
      pieceNumber = null,
      pieceColor = null;
    if (leftPiece && leftPiece.x === x && leftPiece.y === y) {
      isPieceCell = true;
      pieceNumber = leftPiece.numbers[0][0];
      pieceColor = leftPiece.color;
    }
    if (rightPiece && rightPiece.x === x && rightPiece.y === y) {
      isPieceCell = true;
      pieceNumber = rightPiece.numbers[0][0];
      pieceColor = rightPiece.color;
    }
    if (cell) {
      content = cell.number.toString();
      bgColor = cell.color;
      isRainbow = cell.color === "rainbow";
      textColor =
        cell.number === 2 || cell.number === 4 || cell.number === 16
          ? "#000000"
          : "#ffffff";
    } else if (isPieceCell) {
      content = pieceNumber.toString();
      bgColor = pieceColor;
      isRainbow = pieceColor === "rainbow";
      textColor =
        pieceNumber === 2 || pieceNumber === 4 || pieceNumber === 16
          ? "#000000"
          : "#ffffff";
    }
    const hasContent = cell || isPieceCell;
    return (
      <div
        key={`${x}-${y}`}
        className={`relative flex items-center justify-center transition-all duration-200 ${
          isCenterColumn
            ? "border-l-2 border-r-2 border-gray-700 border-dashed"
            : ""
        }`}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor:
            isCenterBlock && !hasContent
              ? "#1a202c"
              : isRainbow
              ? "transparent"
              : bgColor,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderLeft: isCenterColumn
            ? "none"
            : "1px solid rgba(255,255,255,0.05)",
          borderRight: isCenterColumn
            ? "none"
            : "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {isCenterBlock && !hasContent && (
          <>
            <div className="absolute w-[2px] h-[calc(100%-12px)] bg-gray-700 transform rotate-45" />
            <div className="absolute w-[2px] h-[calc(100%-12px)] bg-gray-700 transform -rotate-45" />
          </>
        )}
        {isCenterBlock && hasContent && (
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
              background: isRainbow
                ? "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)"
                : bgColor,
              color: textColor,
              fontSize:
                content.length > 3
                  ? "16px"
                  : content.length > 2
                  ? "20px"
                  : "24px",
              fontFamily: "JetBrains Mono, monospace",
              zIndex: 2,
            }}
          >
            {content}
          </div>
        )}
        {!hasContent && !isCenterBlock && (
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl mb-4 font-light tracking-tight">
            NumberFlow_
          </h1>
          <p className="text-gray-400 text-xl font-light">
            Merge matching numbers to reach 2048
          </p>
        </div>
        {/* Game Won/Over Messages */}
        {gameWon && (
          <div className="text-center mb-8 p-8 border-2 border-gray-500 rounded-lg bg-gray-950">
            <div
              className="text-4xl mb-3 font-bold"
              style={{
                background:
                  "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              YOU WON!
            </div>
            <div className="text-gray-300 text-lg font-light">
              You created a single 2048 block!
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
        {/* Game Stats */}
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
                background:
                  highestNumber === 2048
                    ? "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)"
                    : "none",
                WebkitBackgroundClip: highestNumber === 2048 ? "text" : "none",
                WebkitTextFillColor:
                  highestNumber === 2048 ? "transparent" : "white",
              }}
            >
              {highestNumber}
            </div>
            <div className="text-sm text-gray-500 uppercase tracking-widest font-medium">
              Highest
            </div>
          </div>
        </div>
        {/* Game Grid */}
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
        {/* Compact Controls */}
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
              background: gameWon
                ? "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)"
                : "",
              color: gameWon ? "white" : "",
              textShadow: gameWon ? "0 2px 4px rgba(0,0,0,0.5)" : "",
            }}
          >
            {gameWon || gameOver
              ? "NEW GAME"
              : isPlaying
              ? "PAUSE"
              : state.isPaused
              ? "RESUME"
              : "START"}
          </button>
          <div className="flex gap-12 items-center">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">LEFT</div>
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[128px]">
                <div className="col-start-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "left", direction: "up" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying || gameOver || gameWon}
                  >
                    W
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
                    disabled={!isPlaying || gameOver || gameWon}
                  >
                    D
                  </button>
                </div>
                <div className="col-start-2 row-start-3">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "left", direction: "down" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying || gameOver || gameWon}
                  >
                    S
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">SPEED</div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() =>
                    dispatch({ type: "SET_SPEED", level: speedLevel - 1 })
                  }
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-lg border border-gray-700 text-white transition-all duration-200"
                >
                  -
                </button>
                <div className="w-10 text-xl text-gray-400 font-mono">
                  {speedLevel}
                </div>
                <button
                  onClick={() =>
                    dispatch({ type: "SET_SPEED", level: speedLevel + 1 })
                  }
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-lg border border-gray-700 text-white transition-all duration-200"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">RIGHT</div>
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[128px]">
                <div className="col-start-2">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "right", direction: "up" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-lg flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying || gameOver || gameWon}
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
                    disabled={!isPlaying || gameOver || gameWon}
                  >
                    ←
                  </button>
                </div>
                <div className="col-start-2 row-start-3">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "MOVE_PIECE",
                        payload: { side: "right", direction: "down" },
                      })
                    }
                    className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-lg flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                    disabled={!isPlaying || gameOver || gameWon}
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Move blocks with W/S/D (left) and ↑/←/↓ (right) • Match same
              numbers • Create a single 2048 to win
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumberFlow;
