import React, { useReducer, useEffect, useCallback, useRef } from "react";

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

// --- Constants and Game Data ---
const GRID_SIZE = 3;
const DOT_SIZE = 24;
const CELL_SIZE = 96;
const GRID_DIMENSION = CELL_SIZE * (GRID_SIZE - 1) + DOT_SIZE;

const MNEMONICS_DB = {
  CAR: { number: "74", pattern: [3, 0, 1] },
  BAT: { number: "91", pattern: [0, 1, 2, 5, 8] },
  MINK: { number: "327", pattern: [7, 3, 0, 1, 5] },
  VAULT: { number: "851", pattern: [0, 4, 8, 7, 6] },
  JUMPER: { number: "694", pattern: [6, 3, 0, 2, 5, 8] },
  LIGHTER: { number: "514", pattern: [3, 0, 1, 4, 7, 8, 5] },
  SPOON: { number: "092", pattern: [6, 7, 8, 5, 2, 1, 0] },
  MOUSE: { number: "30", pattern: [3, 4, 5] },
};

const LEVELS = [
  {
    level: 1,
    words: ["CAR", "BAT"],
    corruption: "none", // Pure memory phase
    maxAttempts: 12,
  },
  {
    level: 2,
    words: ["MINK", "MOUSE"],
    corruption: "light", // 1-2 corrupted patterns
    maxAttempts: 10,
  },
  {
    level: 3,
    words: ["VAULT", "JUMPER"],
    corruption: "medium", // All patterns corrupted
    maxAttempts: 8,
  },
  {
    level: 4,
    words: ["LIGHTER", "SPOON"],
    corruption: "heavy", // Complex corruptions + unknown patterns
    maxAttempts: 6,
  },
];

// Pattern corruption functions
const corruptPattern = (pattern, corruptionLevel) => {
  if (corruptionLevel === "none") return pattern;

  const corrupted = [...pattern];
  const availableDots = Array.from({ length: 9 }, (_, i) => i);

  switch (corruptionLevel) {
    case "light":
      // Change 1 dot to a different position
      if (corrupted.length > 1) {
        const changeIndex = Math.floor(Math.random() * corrupted.length);
        const unusedDots = availableDots.filter(
          (dot) => !corrupted.includes(dot)
        );
        if (unusedDots.length > 0) {
          corrupted[changeIndex] =
            unusedDots[Math.floor(Math.random() * unusedDots.length)];
        }
      }
      break;

    case "medium":
      // Change 2 dots or swap 2 positions
      if (corrupted.length >= 3) {
        // Swap two positions
        const idx1 = Math.floor(Math.random() * corrupted.length);
        let idx2 = Math.floor(Math.random() * corrupted.length);
        while (idx2 === idx1) {
          idx2 = Math.floor(Math.random() * corrupted.length);
        }
        [corrupted[idx1], corrupted[idx2]] = [corrupted[idx2], corrupted[idx1]];
      }
      break;

    case "heavy": {
      // Add extra dots or completely reorganize
      const action = Math.random() > 0.5 ? "add" : "reorganize";
      if (action === "add" && corrupted.length < 7) {
        const unusedDots = availableDots.filter(
          (dot) => !corrupted.includes(dot)
        );
        if (unusedDots.length > 0) {
          const insertPos = Math.floor(Math.random() * (corrupted.length + 1));
          corrupted.splice(
            insertPos,
            0,
            unusedDots[Math.floor(Math.random() * unusedDots.length)]
          );
        }
      } else {
        // Reorganize - keep same dots but different order
        for (let i = corrupted.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [corrupted[i], corrupted[j]] = [corrupted[j], corrupted[i]];
        }
      }
      break;
    }
  }

  return corrupted;
};

const calculateFeedback = (guess, target) => {
  let correctPositions = 0;
  let correctDots = 0;

  // Count correct positions
  for (let i = 0; i < Math.min(guess.length, target.length); i++) {
    if (guess[i] === target[i]) {
      correctPositions++;
    }
  }

  // Count correct dots in wrong positions
  const targetCounts = {};
  const guessCounts = {};

  // Count all dots, excluding correct positions
  for (let i = 0; i < target.length; i++) {
    if (i >= guess.length || guess[i] !== target[i]) {
      targetCounts[target[i]] = (targetCounts[target[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (i >= target.length || guess[i] !== target[i]) {
      guessCounts[guess[i]] = (guessCounts[guess[i]] || 0) + 1;
    }
  }

  // Count matches for wrong positions
  for (const dot in guessCounts) {
    if (targetCounts[dot]) {
      correctDots += Math.min(guessCounts[dot], targetCounts[dot]);
    }
  }

  return { correctPositions, correctDots };
};

const initialState = {
  gameState: "start_screen",
  level: 1,
  score: 0,
  levelTargets: [],
  studyIndex: 0,
  crackTarget: null,
  playerPattern: [],
  attempts: [],
  corruptedPatterns: {},
  isCorrupted: false,
  maxAttempts: 12,
  feedbackMessage: "",
};

// --- Enhanced Game Engine (Reducer) ---
function synapseReducer(state, action) {
  switch (action.type) {
    case "START_GAME": {
      const levelData = LEVELS[0];
      const targets = levelData.words.map((word) => ({
        word,
        ...MNEMONICS_DB[word],
        isUnlocked: false,
        studyComplete: false,
      }));

      return {
        ...initialState,
        level: 1,
        gameState: "studying",
        levelTargets: targets,
        maxAttempts: levelData.maxAttempts,
        corruptedPatterns: {},
      };
    }

    case "ADVANCE_STUDY": {
      const updatedTargets = state.levelTargets.map((t, idx) =>
        idx === state.studyIndex ? { ...t, studyComplete: true } : t
      );

      if (state.studyIndex >= state.levelTargets.length - 1) {
        // All patterns studied, start cracking phase
        const firstTarget = updatedTargets.find((t) => !t.isUnlocked);
        const levelData = LEVELS.find((l) => l.level === state.level);

        // Generate corrupted patterns for this level
        const corrupted = {};
        if (levelData.corruption !== "none") {
          updatedTargets.forEach((target) => {
            corrupted[target.word] = corruptPattern(
              target.pattern,
              levelData.corruption
            );
          });
        }

        return {
          ...state,
          gameState: "cracking",
          crackTarget: firstTarget?.word || null,
          levelTargets: updatedTargets,
          corruptedPatterns: corrupted,
          isCorrupted: levelData.corruption !== "none",
          attempts: [],
        };
      }

      return {
        ...state,
        studyIndex: state.studyIndex + 1,
        levelTargets: updatedTargets,
      };
    }

    case "UPDATE_PLAYER_PATTERN":
      return { ...state, playerPattern: action.payload };

    case "SUBMIT_PATTERN": {
      const target = state.levelTargets.find(
        (t) => t.word === state.crackTarget
      );
      if (!target) return state;

      const actualPattern = state.isCorrupted
        ? state.corruptedPatterns[state.crackTarget] || target.pattern
        : target.pattern;

      const isCorrect =
        JSON.stringify(actualPattern) === JSON.stringify(state.playerPattern);
      const feedback = calculateFeedback(state.playerPattern, actualPattern);

      const newAttempt = {
        pattern: [...state.playerPattern],
        feedback,
        attemptNumber: state.attempts.length + 1,
      };

      const newAttempts = [...state.attempts, newAttempt];

      if (isCorrect) {
        // Pattern cracked!
        const newTargets = state.levelTargets.map((t) =>
          t.word === state.crackTarget ? { ...t, isUnlocked: true } : t
        );
        const nextTarget = newTargets.find((t) => !t.isUnlocked);
        const allUnlocked = newTargets.every((t) => t.isUnlocked);

        const points =
          actualPattern.length * 10 * state.level +
          Math.max(0, (state.maxAttempts - newAttempts.length) * 25);

        return {
          ...state,
          levelTargets: newTargets,
          score: state.score + points,
          crackTarget: nextTarget?.word || null,
          playerPattern: [],
          attempts: nextTarget ? [] : newAttempts, // Reset attempts for next target
          gameState: allUnlocked ? "level_complete" : "cracking",
        };
      } else if (newAttempts.length >= state.maxAttempts) {
        // Out of attempts
        return {
          ...state,
          gameState: "game_over",
          attempts: newAttempts,
        };
      } else {
        // Continue trying
        return {
          ...state,
          playerPattern: [],
          attempts: newAttempts,
        };
      }
    }

    case "NEXT_LEVEL": {
      const nextLevelNum = state.level + 1;
      const levelData = LEVELS.find((l) => l.level === nextLevelNum);

      if (!levelData) {
        return {
          ...state,
          gameState: "game_won",
          feedbackMessage: "All vaults cracked! You're a master hacker!",
        };
      }

      const targets = levelData.words.map((word) => ({
        word,
        ...MNEMONICS_DB[word],
        isUnlocked: false,
        studyComplete: false,
      }));

      return {
        ...state,
        level: nextLevelNum,
        gameState: "studying",
        levelTargets: targets,
        studyIndex: 0,
        playerPattern: [],
        attempts: [],
        corruptedPatterns: {},
        maxAttempts: levelData.maxAttempts,
        feedbackMessage: "",
      };
    }

    case "RESTART_GAME":
      return { ...initialState };

    default:
      return state;
  }
}

// --- Enhanced Grid Component ---
const Grid = ({
  pattern,
  onPatternChange,
  onPatternComplete,
  isDrawingDisabled,
  lastAttemptFeedback = null,
  targetPattern = null,
}) => {
  const [isDrawing, setIsDrawing] = React.useState(false);
  const gridRef = useRef(null);
  const dots = Array.from({ length: GRID_SIZE * GRID_SIZE });

  const getDotCoords = (index) => {
    const col = index % GRID_SIZE;
    const row = Math.floor(index / GRID_SIZE);
    return {
      x: col * CELL_SIZE + DOT_SIZE / 2,
      y: row * CELL_SIZE + DOT_SIZE / 2,
    };
  };

  const getPathData = (p) => {
    if (p.length < 2) return "";
    return p
      .map(
        (dotIndex, i) =>
          `${i === 0 ? "M" : "L"} ${getDotCoords(dotIndex).x} ${
            getDotCoords(dotIndex).y
          }`
      )
      .join(" ");
  };

  const handleInteractionStart = (index) => (e) => {
    if (isDrawingDisabled) return;
    e.preventDefault();
    setIsDrawing(true);
    onPatternChange([index]);
  };

  const handleInteractionMove = (e) => {
    if (!isDrawing || isDrawingDisabled) return;
    e.preventDefault();
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const gridRect = gridRef.current.getBoundingClientRect();
    const x = clientX - gridRect.left;
    const y = clientY - gridRect.top;
    for (let i = 0; i < dots.length; i++) {
      const { x: dotX, y: dotY } = getDotCoords(i);
      const distance = Math.sqrt(Math.pow(x - dotX, 2) + Math.pow(y - dotY, 2));
      if (distance < DOT_SIZE && !pattern.includes(i)) {
        onPatternChange([...pattern, i]);
        break;
      }
    }
  };

  const handleInteractionEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    onPatternComplete(pattern);
  }, [isDrawing, onPatternComplete, pattern]);

  useEffect(() => {
    window.addEventListener("mouseup", handleInteractionEnd);
    window.addEventListener("touchend", handleInteractionEnd);
    return () => {
      window.removeEventListener("mouseup", handleInteractionEnd);
      window.removeEventListener("touchend", handleInteractionEnd);
    };
  }, [handleInteractionEnd]);

  return (
    <div
      ref={gridRef}
      className="relative touch-none"
      style={{ width: GRID_DIMENSION, height: GRID_DIMENSION }}
      onMouseMove={handleInteractionMove}
      onTouchMove={handleInteractionMove}
    >
      <svg className="absolute inset-0 w-full h-full" overflow="visible">
        <path
          d={getPathData(pattern)}
          stroke={isDrawingDisabled ? "#6366F1" : "#A78BFA"}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {dots.map((_, i) => {
        let dotColor = "#4B5563"; // Default gray
        let isInPattern = pattern.includes(i);

        // Show feedback colors if we have feedback from last attempt
        if (lastAttemptFeedback && targetPattern) {
          const lastPattern = lastAttemptFeedback.pattern;
          const lastPatternIndex = lastPattern.indexOf(i);
          const targetIndex = targetPattern.indexOf(i);

          if (lastPatternIndex !== -1) {
            // This dot was in the last attempt
            if (
              lastPatternIndex < targetPattern.length &&
              lastPattern[lastPatternIndex] === targetPattern[lastPatternIndex]
            ) {
              // Correct position
              dotColor = "#22C55E"; // Green
            } else if (targetPattern.includes(i)) {
              // Correct dot, wrong position
              dotColor = "#EAB308"; // Yellow
            } else {
              // Wrong dot
              dotColor = "#EF4444"; // Red
            }
          }
        }

        // Current pattern dots show in purple
        if (isInPattern) {
          dotColor = "#A78BFA";
        }

        return (
          <div
            key={i}
            className="absolute rounded-full transition-colors"
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              top: getDotCoords(i).y - DOT_SIZE / 2,
              left: getDotCoords(i).x - DOT_SIZE / 2,
              backgroundColor: dotColor,
            }}
            onMouseDown={handleInteractionStart(i)}
            onTouchStart={handleInteractionStart(i)}
          />
        );
      })}
    </div>
  );
};

// --- Attempt History Component (BreakLock style) ---
const AttemptHistory = ({ attempts, maxAttempts }) => {
  if (attempts.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mt-8">
      <h3
        className="text-xl mb-4 font-light text-center"
        style={{ fontFamily: "Roboto Mono, monospace" }}
      >
        Forensic Analysis ({attempts.length}/{maxAttempts} attempts)
      </h3>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {attempts
          .slice()
          .reverse()
          .map((attempt, index) => (
            <div
              key={attempts.length - index - 1}
              className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className="text-gray-500 text-sm w-8">
                  #{attempt.attemptNumber}
                </div>
                <div className="text-gray-400 text-sm">
                  Pattern: [{attempt.pattern.join(", ")}]
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-400">
                    {attempt.feedback.correctPositions}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-yellow-500 rounded-full"></div>
                  <span className="text-yellow-400">
                    {attempt.feedback.correctDots}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// --- Main Game Component ---
function Synapse() {
  const [state, dispatch] = useReducer(synapseReducer, initialState);
  const {
    gameState,
    level,
    score,
    levelTargets,
    studyIndex,
    crackTarget,
    playerPattern,
    attempts,
    isCorrupted,
    maxAttempts,
  } = state;

  useEffect(() => {
    if (gameState === "studying" && levelTargets.length > 0) {
      const currentTarget = levelTargets[studyIndex];
      if (currentTarget && !currentTarget.studyComplete) {
        const studyDuration = 1500 + currentTarget.pattern.length * 300;
        const timer = setTimeout(() => {
          dispatch({ type: "ADVANCE_STUDY" });
        }, studyDuration);
        return () => clearTimeout(timer);
      }
    }
    if (gameState === "level_complete") {
      const timer = setTimeout(() => {
        dispatch({ type: "NEXT_LEVEL" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [gameState, studyIndex, levelTargets]);

  const renderGameState = () => {
    if (
      gameState === "start_screen" ||
      gameState === "game_won" ||
      gameState === "game_over"
    ) {
      const isGameOver = gameState === "game_over";
      const isGameWon = gameState === "game_won";

      return (
        <div className="text-center">
          <h1
            className="text-6xl mb-4 font-light tracking-tight"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            Synapse_
          </h1>
          <p
            className="text-gray-400 text-xl font-light mb-8"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            {isGameOver
              ? "Security system locked you out. Vault remains secure."
              : isGameWon
              ? "Master hacker! All corrupted vaults have been cracked."
              : "Memory + deduction. Study patterns, detect corruption, crack vaults."}
          </p>
          {(isGameWon || isGameOver) && (
            <div className="mb-8">
              <p
                className={`text-3xl font-bold mb-4 ${
                  isGameWon ? "text-green-400" : "text-red-400"
                }`}
              >
                Final Score: {score}
              </p>
              {isGameOver && crackTarget && (
                <p className="text-gray-400">
                  Failed to crack:{" "}
                  <span className="text-red-400 font-bold">{crackTarget}</span>
                </p>
              )}
            </div>
          )}
          <button
            onClick={() =>
              dispatch({
                type: isGameWon || isGameOver ? "RESTART_GAME" : "START_GAME",
              })
            }
            className="px-16 py-5 rounded-lg text-2xl bg-white text-black hover:bg-gray-200 transition-all duration-200 font-light"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            {isGameWon || isGameOver ? "HACK AGAIN" : "INFILTRATE"}
          </button>
        </div>
      );
    }

    const isStudying = gameState === "studying";
    const currentStudyTarget = levelTargets[studyIndex];

    if (isStudying && !currentStudyTarget) return null;

    return (
      <div className="w-full flex flex-col items-center">
        {/* Header Stats */}
        <div className="w-full max-w-md flex justify-between items-center mb-8 text-2xl font-mono">
          <div>
            Level: <span className="font-bold text-white">{level}</span>
          </div>
          <div>
            Score: <span className="font-bold text-white">{score}</span>
          </div>
        </div>

        {/* Corruption Warning */}
        {isCorrupted && gameState === "cracking" && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <div
              className="text-red-400 font-bold text-center"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              ⚠️ SECURITY BREACH DETECTED ⚠️
            </div>
            <div className="text-red-300 text-sm text-center mt-1">
              Vault patterns may be corrupted. Use forensic analysis to adapt.
            </div>
            {attempts.length > 0 && (
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-400">Correct position</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-400">Wrong position</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400">Not in pattern</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Target Status */}
        <div className="flex gap-4 mb-8">
          {levelTargets.map((target) => (
            <div
              key={target.word}
              className={`px-4 py-2 rounded border-2 transition-all duration-300 ${
                target.isUnlocked
                  ? "border-green-500 bg-green-500/10 text-green-400"
                  : crackTarget === target.word
                  ? "border-violet-400 bg-violet-500/20 text-white"
                  : target.studyComplete
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-gray-700 text-gray-500"
              }`}
            >
              <span
                className="font-bold"
                style={{ fontFamily: "Roboto Mono, monospace" }}
              >
                {target.word}
              </span>
              <div className="text-xs mt-1">
                {target.isUnlocked
                  ? "CRACKED"
                  : target.studyComplete
                  ? "MEMORIZED"
                  : "LOCKED"}
              </div>
            </div>
          ))}
        </div>

        {/* Main Instruction */}
        <div className="mb-12 text-center h-24 flex flex-col justify-center">
          {isStudying && currentStudyTarget && (
            <>
              <p
                className="text-4xl text-gray-400 font-light"
                style={{ fontFamily: "Roboto Mono, monospace" }}
              >
                Memorize{" "}
                <span className="text-white font-bold">
                  {currentStudyTarget.word}
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Original pattern • Code: {currentStudyTarget.number}
              </p>
            </>
          )}
          {gameState === "cracking" && crackTarget && (
            <>
              <p
                className="text-4xl text-gray-400 font-light"
                style={{ fontFamily: "Roboto Mono, monospace" }}
              >
                {isCorrupted ? "Decode: " : "Draw: "}
                <span className="text-violet-400 font-bold">{crackTarget}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {isCorrupted
                  ? `Pattern corrupted • ${
                      maxAttempts - attempts.length
                    } attempts left`
                  : "Draw the memorized pattern"}
              </p>
            </>
          )}
          {gameState === "level_complete" && (
            <p
              className="text-5xl font-bold text-green-400"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Level {level} Complete!
            </p>
          )}
        </div>

        {/* Grid */}
        <Grid
          pattern={isStudying ? currentStudyTarget.pattern : playerPattern}
          onPatternChange={(p) =>
            dispatch({ type: "UPDATE_PLAYER_PATTERN", payload: p })
          }
          onPatternComplete={(p) =>
            dispatch({ type: "SUBMIT_PATTERN", payload: p })
          }
          isDrawingDisabled={isStudying}
          lastAttemptFeedback={
            attempts.length > 0 ? attempts[attempts.length - 1] : null
          }
          targetPattern={
            isCorrupted && crackTarget
              ? state.corruptedPatterns[crackTarget]
              : null
          }
        />

        {/* Attempt History */}
        {gameState === "cracking" && isCorrupted && (
          <AttemptHistory attempts={attempts} maxAttempts={maxAttempts} />
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-black text-gray-400 p-4 flex flex-col items-center justify-center font-sans"
      style={{ fontFamily: "Roboto Mono, Inter, sans-serif" }}
    >
      {renderGameState()}
    </div>
  );
}

export default Synapse;
