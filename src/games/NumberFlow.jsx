import React, { useState, useEffect, useRef, useCallback } from "react";

// Add Google Fonts import
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

// Block shapes (simplified to single blocks)
const BLOCK_SHAPES = [
  [[1]], // Single block only
];

function NumberFlow() {
  const [grid, setGrid] = useState(() =>
    Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(null))
  );
  const [leftPiece, setLeftPiece] = useState(null);
  const [rightPiece, setRightPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [highestNumber, setHighestNumber] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [lastCombinationTime, setLastCombinationTime] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1500);
  const [pieceCount, setPieceCount] = useState(0);
  const pieceCountRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);

  const gameLoopRef = useRef(null);

  // Get colors based on number value
  const getNumberColor = (number) => {
    const colors = {
      2: "#ffffff", // White
      4: "#c0c0c0", // Light gray (slightly darker)
      8: "#808080", // Gray
      16: "#EEDBE0", // Pink
      32: "#ff8844", // Orange
      64: "#E04426", // Red
      128: "#228b22", // Forest green
      256: "#8b4513", // Brown
      512: "#8844ff", // Purple
      1024: "#4b0082", // Indigo
      2048: "rainbow", // Special rainbow indicator
      4096: "#ff0088", // Hot pink
      8192: "#8800ff", // Deep purple
    };
    return colors[number] || "#888888";
  };

  // Check for game won condition
  const checkGameWon = () => {
    let blockCount = 0;
    let has2048 = false;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (grid[y][x]) {
          blockCount++;
          if (grid[y][x].number === 2048) {
            has2048 = true;
          }
        }
      }
    }

    if (has2048 && blockCount === 1) {
      setGameWon(true);
      setIsPlaying(false);
      // Clear the interval immediately
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return true;
    }
    return false;
  };

  // Check for number combinations and merge them
  const checkCombinations = () => {
    const now = Date.now();
    if (now - lastCombinationTime < 200) return;

    setGrid((prevGrid) => {
      let newGrid = prevGrid.map((row) => [...row]);
      let scoreIncrease = 0;
      let foundCombination = false;

      // Check all positions for vertical merges
      for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = GRID_HEIGHT - 1; y > 0; y--) {
          const current = newGrid[y][x];
          const above = newGrid[y - 1][x];

          if (
            current &&
            above &&
            current.number === above.number &&
            typeof current.number === "number" &&
            typeof above.number === "number"
          ) {
            const newNumber = current.number * 2;
            const newColor = getNumberColor(newNumber);

            // Merge down
            newGrid[y][x] = { number: newNumber, color: newColor };
            newGrid[y - 1][x] = null;

            scoreIncrease += newNumber;
            foundCombination = true;

            if (newNumber > highestNumber) {
              setHighestNumber(newNumber);
            }
          }
        }
      }

      // Special handling for center X - acts as a black hole
      const centerY = Math.floor(GRID_HEIGHT / 2);
      const centerBlock = newGrid[centerY][CENTER_X];

      if (centerBlock) {
        // Check adjacent blocks for matches
        const positions = [
          { x: CENTER_X - 1, y: centerY }, // left
          { x: CENTER_X + 1, y: centerY }, // right
          { x: CENTER_X, y: centerY - 1 }, // above
          { x: CENTER_X, y: centerY + 1 }, // below
        ];

        for (const pos of positions) {
          if (
            pos.x >= 0 &&
            pos.x < GRID_WIDTH &&
            pos.y >= 0 &&
            pos.y < GRID_HEIGHT
          ) {
            const adjacent = newGrid[pos.y][pos.x];
            if (adjacent && adjacent.number === centerBlock.number) {
              const newNumber = centerBlock.number * 2;
              const newColor = getNumberColor(newNumber);

              // Pull into center
              newGrid[centerY][CENTER_X] = {
                number: newNumber,
                color: newColor,
              };
              newGrid[pos.y][pos.x] = null;

              scoreIncrease += newNumber;
              foundCombination = true;

              if (newNumber > highestNumber) {
                setHighestNumber(newNumber);
              }
              break; // Only merge one at a time
            }
          }
        }
      }

      // Check horizontal combinations away from center
      for (let y = 0; y < GRID_HEIGHT; y++) {
        // Left side
        for (let x = 0; x < CENTER_X - 1; x++) {
          const current = newGrid[y][x];
          const next = newGrid[y][x + 1];

          if (
            current &&
            next &&
            current.number === next.number &&
            typeof current.number === "number" &&
            typeof next.number === "number"
          ) {
            const newNumber = current.number * 2;
            const newColor = getNumberColor(newNumber);

            // Merge right
            newGrid[y][x + 1] = { number: newNumber, color: newColor };
            newGrid[y][x] = null;

            scoreIncrease += newNumber;
            foundCombination = true;

            if (newNumber > highestNumber) {
              setHighestNumber(newNumber);
            }
          }
        }

        // Right side
        for (let x = GRID_WIDTH - 1; x > CENTER_X + 1; x--) {
          const current = newGrid[y][x];
          const prev = newGrid[y][x - 1];

          if (
            current &&
            prev &&
            current.number === prev.number &&
            typeof current.number === "number" &&
            typeof prev.number === "number"
          ) {
            const newNumber = current.number * 2;
            const newColor = getNumberColor(newNumber);

            // Merge left
            newGrid[y][x - 1] = { number: newNumber, color: newColor };
            newGrid[y][x] = null;

            scoreIncrease += newNumber;
            foundCombination = true;

            if (newNumber > highestNumber) {
              setHighestNumber(newNumber);
            }
          }
        }
      }

      // Apply gravity after merges
      let gravityApplied = true;
      while (gravityApplied) {
        gravityApplied = false;
        for (let x = 0; x < GRID_WIDTH; x++) {
          for (let y = GRID_HEIGHT - 1; y > 0; y--) {
            if (!newGrid[y][x] && newGrid[y - 1][x]) {
              newGrid[y][x] = newGrid[y - 1][x];
              newGrid[y - 1][x] = null;
              gravityApplied = true;
            }
          }
        }
      }

      if (foundCombination) {
        setLastCombinationTime(now);
        // Check for more combinations after gravity
        setTimeout(() => checkCombinations(), 200);
      }

      if (scoreIncrease > 0) {
        setScore((prev) => prev + scoreIncrease);
      }

      return newGrid;
    });
  };

  // Check for game over condition
  const checkGameOver = () => {
    // Check if any edge columns are filled
    for (let y = 0; y < GRID_HEIGHT; y++) {
      if (grid[y][0] || grid[y][GRID_WIDTH - 1]) {
        setGameOver(true);
        setIsPlaying(false);
        // Clear the interval immediately
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        return true;
      }
    }
    return false;
  };

  // Start/stop game
  const toggleGame = () => {
    if (gameOver || gameWon) {
      // Reset everything for a new game
      setGrid(
        Array(GRID_HEIGHT)
          .fill(null)
          .map(() => Array(GRID_WIDTH).fill(null))
      );
      setScore(0);
      setHighestNumber(2);
      setGameOver(false);
      setGameWon(false);
      setLeftPiece(null);
      setRightPiece(null);
      setPieceCount(0);
      pieceCountRef.current = 0;
      setIsPaused(false);
      setIsPlaying(true);
    } else if (isPlaying) {
      // Pause the game
      setIsPaused(true);
      setIsPlaying(false);
    } else if (isPaused) {
      // Resume the game
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      // Starting a new game
      setGrid(
        Array(GRID_HEIGHT)
          .fill(null)
          .map(() => Array(GRID_WIDTH).fill(null))
      );
      setScore(0);
      setHighestNumber(2);
      setGameOver(false);
      setGameWon(false);
      setLeftPiece(null);
      setRightPiece(null);
      setPieceCount(0);
      pieceCountRef.current = 0;
      setIsPaused(false);
      setIsPlaying(true);
    }
  };

  // Handle controls
  const handleControl = (side, action) => {
    if (!isPlaying || gameOver || gameWon) return;

    if (side === "left") {
      setLeftPiece((prev) => {
        if (!prev) return prev;
        let newX = prev.x;
        let newY = prev.y;

        switch (action) {
          case "up":
            newY = prev.y - 1;
            break;
          case "down":
            newY = prev.y + 1;
            break;
          case "right":
            newX = prev.x + 1;
            break;
        }

        // Validate move
        if (newY < 0 || newY >= GRID_HEIGHT) return prev;
        if (newX < 0 || newX > CENTER_X) return prev;

        // Check collision with existing blocks
        const targetCell = grid[newY] && grid[newY][newX];

        // Special handling for center X
        if (newX === CENTER_X && newY === Math.floor(GRID_HEIGHT / 2)) {
          if (!targetCell || targetCell.number === prev.numbers[0][0]) {
            // Can move to center if empty or same number
            if (targetCell) {
              // Merge immediately
              setGrid((oldGrid) => {
                const newGrid = oldGrid.map((row) => [...row]);
                newGrid[newY][newX] = {
                  number: targetCell.number * 2,
                  color: getNumberColor(targetCell.number * 2),
                };
                return newGrid;
              });

              // Update score and highest
              const newNumber = targetCell.number * 2;
              setScore((s) => s + newNumber);
              if (newNumber > highestNumber) {
                setHighestNumber(newNumber);
              }

              // Remove the piece
              return null;
            } else {
              // Place in center
              setGrid((oldGrid) => {
                const newGrid = oldGrid.map((row) => [...row]);
                newGrid[newY][newX] = {
                  number: prev.numbers[0][0],
                  color: prev.color,
                };
                return newGrid;
              });
              return null;
            }
          }
          return prev;
        }

        // Normal collision check
        if (targetCell) return prev;

        return { ...prev, x: newX, y: newY };
      });
    } else {
      setRightPiece((prev) => {
        if (!prev) return prev;
        let newX = prev.x;
        let newY = prev.y;

        switch (action) {
          case "up":
            newY = prev.y - 1;
            break;
          case "down":
            newY = prev.y + 1;
            break;
          case "left":
            newX = prev.x - 1;
            break;
        }

        // Validate move
        if (newY < 0 || newY >= GRID_HEIGHT) return prev;
        if (newX < CENTER_X || newX >= GRID_WIDTH) return prev;

        // Check collision with existing blocks
        const targetCell = grid[newY] && grid[newY][newX];

        // Special handling for center X
        if (newX === CENTER_X && newY === Math.floor(GRID_HEIGHT / 2)) {
          if (!targetCell || targetCell.number === prev.numbers[0][0]) {
            // Can move to center if empty or same number
            if (targetCell) {
              // Merge immediately
              setGrid((oldGrid) => {
                const newGrid = oldGrid.map((row) => [...row]);
                newGrid[newY][newX] = {
                  number: targetCell.number * 2,
                  color: getNumberColor(targetCell.number * 2),
                };
                return newGrid;
              });

              // Update score and highest
              const newNumber = targetCell.number * 2;
              setScore((s) => s + newNumber);
              if (newNumber > highestNumber) {
                setHighestNumber(newNumber);
              }

              // Remove the piece
              return null;
            } else {
              // Place in center
              setGrid((oldGrid) => {
                const newGrid = oldGrid.map((row) => [...row]);
                newGrid[newY][newX] = {
                  number: prev.numbers[0][0],
                  color: prev.color,
                };
                return newGrid;
              });
              return null;
            }
          }
          return prev;
        }

        // Normal collision check
        if (targetCell) return prev;

        return { ...prev, x: newX, y: newY };
      });
    }
  };

  // Game loop effect - simplified
  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = setInterval(() => {
      // Update left piece
      setLeftPiece((prev) => {
        if (!prev) {
          // Generate new piece
          const shape = BLOCK_SHAPES[0];
          const level = Math.max(
            1,
            Math.min(
              11,
              Math.floor(pieceCountRef.current / 5) +
                Math.floor(Math.random() * 3) -
                1
            )
          );
          const baseNumber = Math.pow(2, level);

          pieceCountRef.current += 1;

          return {
            shape,
            numbers: [[baseNumber]],
            x: 0,
            y: Math.floor(Math.random() * GRID_HEIGHT),
            side: "left",
            id: Date.now() + Math.random(),
            color: getNumberColor(baseNumber),
          };
        }

        const newX = prev.x + 1;
        const centerY = Math.floor(GRID_HEIGHT / 2);

        // Check if should place (reached center or collision)
        if (newX >= CENTER_X || (grid[prev.y] && grid[prev.y][newX])) {
          // Special handling for reaching center X
          if (newX === CENTER_X && prev.y === centerY) {
            const centerCell = grid[centerY][CENTER_X];
            if (!centerCell || centerCell.number === prev.numbers[0][0]) {
              // Can place or merge in center
              setGrid((oldGrid) => {
                const newGrid = oldGrid.map((row) => [...row]);
                if (centerCell) {
                  // Merge
                  const newNumber = centerCell.number * 2;
                  newGrid[centerY][CENTER_X] = {
                    number: newNumber,
                    color: getNumberColor(newNumber),
                  };
                  setScore((s) => s + newNumber);
                  if (newNumber > highestNumber) {
                    setHighestNumber(newNumber);
                  }
                } else {
                  // Place
                  newGrid[centerY][CENTER_X] = {
                    number: prev.numbers[0][0],
                    color: prev.color,
                  };
                }
                return newGrid;
              });
            } else {
              // Can't merge, place before center
              setGrid((oldGrid) => {
                const newGrid = oldGrid.map((row) => [...row]);
                if (prev.x >= 0 && prev.x < GRID_WIDTH) {
                  newGrid[prev.y][prev.x] = {
                    number: prev.numbers[0][0],
                    color: prev.color,
                  };
                }
                return newGrid;
              });
            }
          } else {
            // Normal placement
            setGrid((oldGrid) => {
              const newGrid = oldGrid.map((row) => [...row]);
              if (
                prev.y >= 0 &&
                prev.y < GRID_HEIGHT &&
                prev.x >= 0 &&
                prev.x < GRID_WIDTH
              ) {
                newGrid[prev.y][prev.x] = {
                  number: prev.numbers[0][0],
                  color: prev.color,
                };
              }
              return newGrid;
            });
          }

          // Check combinations after placing
          setTimeout(() => {
            checkCombinations();
            checkGameWon();
          }, 50);

          // Generate new piece
          const shape = BLOCK_SHAPES[0];
          const level = Math.max(
            1,
            Math.min(
              11,
              Math.floor(pieceCountRef.current / 5) +
                Math.floor(Math.random() * 3) -
                1
            )
          );
          const baseNumber = Math.pow(2, level);

          pieceCountRef.current += 1;
          setPieceCount((c) => c + 1);

          return {
            shape,
            numbers: [[baseNumber]],
            x: 0,
            y: Math.floor(Math.random() * GRID_HEIGHT),
            side: "left",
            id: Date.now() + Math.random(),
            color: getNumberColor(baseNumber),
          };
        }

        return { ...prev, x: newX };
      });

      // Update right piece
      setRightPiece((prev) => {
        if (!prev) {
          // Generate new piece
          const shape = BLOCK_SHAPES[0];
          const level = Math.max(
            1,
            Math.min(
              11,
              Math.floor(pieceCountRef.current / 5) +
                Math.floor(Math.random() * 3) -
                1
            )
          );
          const baseNumber = Math.pow(2, Math.max(1, level + 1));

          pieceCountRef.current += 1;

          return {
            shape,
            numbers: [[baseNumber]],
            x: GRID_WIDTH - 1,
            y: Math.floor(Math.random() * GRID_HEIGHT),
            side: "right",
            id: Date.now() + Math.random() + 1,
            color: getNumberColor(baseNumber),
          };
        }

        const newX = prev.x - 1;
        const centerY = Math.floor(GRID_HEIGHT / 2);

        // Check if should place (reached center or collision)
        if (newX <= CENTER_X || (grid[prev.y] && grid[prev.y][newX])) {
          // Special handling for reaching center X
          if (newX === CENTER_X && prev.y === centerY) {
            const centerCell = grid[centerY][CENTER_X];
            if (!centerCell || centerCell.number === prev.numbers[0][0]) {
              // Can place or merge in center
              setGrid((oldGrid) => {
                const newGrid = oldGrid.map((row) => [...row]);
                if (centerCell) {
                  // Merge
                  newGrid[centerY][CENTER_X] = {
                    number: centerCell.number * 2,
                    color: getNumberColor(centerCell.number * 2),
                  };
                  const newNumber = centerCell.number * 2;
                  setScore((s) => s + newNumber);
                  if (newNumber > highestNumber) {
                    setHighestNumber(newNumber);
                  }
                } else {
                  // Place
                  newGrid[centerY][CENTER_X] = {
                    number: prev.numbers[0][0],
                    color: prev.color,
                  };
                }
                return newGrid;
              });
            } else {
              // Can't merge, place before center
              setGrid((oldGrid) => {
                const newGrid = oldGrid.map((row) => [...row]);
                if (prev.x >= 0 && prev.x < GRID_WIDTH) {
                  newGrid[prev.y][prev.x] = {
                    number: prev.numbers[0][0],
                    color: prev.color,
                  };
                }
                return newGrid;
              });
            }
          } else {
            // Normal placement
            setGrid((oldGrid) => {
              const newGrid = oldGrid.map((row) => [...row]);
              if (
                prev.y >= 0 &&
                prev.y < GRID_HEIGHT &&
                prev.x >= 0 &&
                prev.x < GRID_WIDTH
              ) {
                newGrid[prev.y][prev.x] = {
                  number: prev.numbers[0][0],
                  color: prev.color,
                };
              }
              return newGrid;
            });
          }

          // Check combinations after placing
          setTimeout(() => {
            checkCombinations();
            checkGameWon();
          }, 50);

          // Generate new piece
          const shape = BLOCK_SHAPES[0];
          const level = Math.max(
            1,
            Math.min(
              11,
              Math.floor(pieceCountRef.current / 5) +
                Math.floor(Math.random() * 3) -
                1
            )
          );
          const baseNumber = Math.pow(2, Math.max(1, level + 1));

          pieceCountRef.current += 1;
          setPieceCount((c) => c + 1);

          return {
            shape,
            numbers: [[baseNumber]],
            x: GRID_WIDTH - 1,
            y: Math.floor(Math.random() * GRID_HEIGHT),
            side: "right",
            id: Date.now() + Math.random() + 1,
            color: getNumberColor(baseNumber),
          };
        }

        return { ...prev, x: newX };
      });
    }, gameSpeed);

    return () => clearInterval(intervalId);
  }, [isPlaying, gameSpeed]);

  // Check game over after grid changes
  useEffect(() => {
    if (isPlaying) {
      checkGameOver();
    }
  }, [grid, isPlaying]);

  // Continuously check for combinations in center column
  useEffect(() => {
    if (isPlaying && !gameOver && !gameWon) {
      const interval = setInterval(() => {
        checkCombinations();
        setTimeout(checkGameWon, 100);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isPlaying, gameOver, gameWon]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isPlaying || gameOver || gameWon) return;

      switch (e.key.toLowerCase()) {
        case "w":
          handleControl("left", "up");
          break;
        case "s":
          handleControl("left", "down");
          break;
        case "d":
          handleControl("left", "right");
          break;
        case "arrowup":
          e.preventDefault();
          handleControl("right", "up");
          break;
        case "arrowdown":
          e.preventDefault();
          handleControl("right", "down");
          break;
        case "arrowleft":
          e.preventDefault();
          handleControl("right", "left");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, gameOver, gameWon]);

  // Render cell
  const renderCell = (x, y) => {
    const cell = grid[y][x];
    const isCenter = x === CENTER_X;
    const isCenterBlock = x === CENTER_X && y === Math.floor(GRID_HEIGHT / 2);

    let content = "";
    let bgColor = "transparent";
    let textColor = "#ffffff";
    let isRainbow = false;

    // Check if current pieces occupy this cell
    let isPieceCell = false;
    let pieceNumber = null;
    let pieceColor = null;

    // Check left piece
    if (leftPiece) {
      for (let py = 0; py < leftPiece.shape.length; py++) {
        for (let px = 0; px < leftPiece.shape[py].length; px++) {
          if (
            leftPiece.shape[py][px] &&
            leftPiece.x + px === x &&
            leftPiece.y + py === y
          ) {
            isPieceCell = true;
            pieceNumber = leftPiece.numbers[py][px];
            pieceColor = leftPiece.color;
          }
        }
      }
    }

    // Check right piece
    if (rightPiece) {
      for (let py = 0; py < rightPiece.shape.length; py++) {
        for (let px = 0; px < rightPiece.shape[py].length; px++) {
          if (
            rightPiece.shape[py][px] &&
            rightPiece.x + px === x &&
            rightPiece.y + py === y
          ) {
            isPieceCell = true;
            pieceNumber = rightPiece.numbers[py][px];
            pieceColor = rightPiece.color;
          }
        }
      }
    }

    // Cell content and styling
    if (cell) {
      content = cell.number.toString();
      bgColor = cell.color;
      isRainbow = cell.color === "rainbow";
      // Use black text for light backgrounds
      textColor =
        cell.number === 2 || cell.number === 4 || cell.number === 16
          ? "#000000"
          : "#ffffff";
    } else if (isPieceCell) {
      content = pieceNumber.toString();
      bgColor = pieceColor;
      isRainbow = pieceColor === "rainbow";
      // Use black text for light backgrounds
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
          isCenter ? "border-l-2 border-r-2 border-gray-700 border-dashed" : ""
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
          borderLeft: isCenter ? "none" : "1px solid rgba(255,255,255,0.05)",
          borderRight: isCenter ? "none" : "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Center cross */}
        {isCenterBlock && !hasContent && (
          <>
            <div
              className="absolute"
              style={{
                width: "2px",
                height: "calc(100% - 12px)",
                backgroundColor: "#4a5568",
                transform: "rotate(45deg)",
              }}
            />
            <div
              className="absolute"
              style={{
                width: "2px",
                height: "calc(100% - 12px)",
                backgroundColor: "#4a5568",
                transform: "rotate(-45deg)",
              }}
            />
          </>
        )}

        {/* Center marker for blocks */}
        {isCenterBlock && hasContent && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              fontSize: "36px",
              color: "rgba(255, 255, 255, 0.1)",
              zIndex: 1,
            }}
          >
            ×
          </div>
        )}

        {/* Content */}
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

        {/* Grid dot for empty cells */}
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

        {/* Game Won Message */}
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

        {/* Game Over Message */}
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
            {grid.map((row, y) => row.map((cell, x) => renderCell(x, y)))}
          </div>
        </div>

        {/* Compact Controls */}
        <div className="flex flex-col items-center gap-6">
          {/* Main Control Button */}
          <button
            onClick={toggleGame}
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
              : isPaused
              ? "RESUME"
              : "START"}
          </button>

          {/* Compact Controls Grid */}
          <div className="flex gap-12 items-center">
            {/* Left Control */}
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">LEFT</div>
              <div className="grid grid-cols-3 gap-1">
                <div></div>
                <button
                  onClick={() => handleControl("left", "up")}
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                  disabled={!isPlaying || gameOver || gameWon}
                >
                  W
                </button>
                <div></div>
                <div></div>
                <div></div>
                <button
                  onClick={() => handleControl("left", "right")}
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                  disabled={!isPlaying || gameOver || gameWon}
                >
                  D
                </button>
                <div></div>
                <button
                  onClick={() => handleControl("left", "down")}
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                  disabled={!isPlaying || gameOver || gameWon}
                >
                  S
                </button>
                <div></div>
              </div>
            </div>

            {/* Speed Control */}
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">SPEED</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setGameSpeed(Math.min(2000, gameSpeed + 200))}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded text-sm border border-gray-700 text-white transition-all duration-200"
                >
                  -
                </button>
                <div className="px-4 py-2 text-gray-400 font-mono">
                  {(2500 - gameSpeed) / 1000}s
                </div>
                <button
                  onClick={() => setGameSpeed(Math.max(600, gameSpeed - 200))}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded text-sm border border-gray-700 text-white transition-all duration-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* Right Control */}
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">RIGHT</div>
              <div className="grid grid-cols-3 gap-1">
                <div></div>
                <button
                  onClick={() => handleControl("right", "up")}
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                  disabled={!isPlaying || gameOver || gameWon}
                >
                  ↑
                </button>
                <div></div>
                <button
                  onClick={() => handleControl("right", "left")}
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                  disabled={!isPlaying || gameOver || gameWon}
                >
                  ←
                </button>
                <div></div>
                <div></div>
                <div></div>
                <button
                  onClick={() => handleControl("right", "down")}
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded text-xs flex items-center justify-center border border-gray-700 text-white transition-all duration-200"
                  disabled={!isPlaying || gameOver || gameWon}
                >
                  ↓
                </button>
                <div></div>
              </div>
            </div>
          </div>

          {/* Instructions */}
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
