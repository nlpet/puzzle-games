import React, { useReducer, useEffect, useCallback, useRef } from "react";

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
  { level: 1, words: ["CAR", "BAT"] },
  { level: 2, words: ["MINK", "MOUSE", "VAULT"] },
  { level: 3, words: ["JUMPER", "SPOON", "LIGHTER"] },
];

const initialState = {
  gameState: "start_screen",
  level: 1,
  score: 0,
  levelTargets: [],
  studyIndex: 0,
  crackTarget: null,
  playerPattern: [],
  feedbackMessage: "",
  feedbackColor: "",
};

// --- The Stable, Engaging Game Engine (Reducer) ---
function synapseReducer(state, action) {
  switch (action.type) {
    // FIX: START_GAME now loads level 1 data immediately
    case "START_GAME": {
      const levelData = LEVELS[0];
      const targets = levelData.words.map((word) => ({
        word,
        ...MNEMONICS_DB[word],
        isUnlocked: false,
      }));
      return {
        ...initialState,
        level: 1,
        gameState: "studying",
        levelTargets: targets,
      };
    }

    case "ADVANCE_STUDY":
      if (state.studyIndex >= state.levelTargets.length - 1) {
        const firstTarget = state.levelTargets.find((t) => !t.isUnlocked);
        return {
          ...state,
          gameState: "cracking",
          crackTarget: firstTarget?.word || null,
        };
      }
      return { ...state, studyIndex: state.studyIndex + 1 };

    case "UPDATE_PLAYER_PATTERN":
      return { ...state, playerPattern: action.payload };

    case "SUBMIT_PATTERN": {
      const target = state.levelTargets.find(
        (t) => t.word === state.crackTarget
      );
      if (!target) return state;

      const isCorrect =
        JSON.stringify(target.pattern) === JSON.stringify(state.playerPattern);

      if (isCorrect) {
        const newTargets = state.levelTargets.map((t) =>
          t.word === state.crackTarget ? { ...t, isUnlocked: true } : t
        );
        const nextTarget = newTargets.find((t) => !t.isUnlocked);
        const allUnlocked = newTargets.every((t) => t.isUnlocked);

        return {
          ...state,
          levelTargets: newTargets,
          score: state.score + target.number.length * 10 * state.level,
          crackTarget: nextTarget?.word || null,
          playerPattern: [],
          gameState: allUnlocked ? "level_complete" : "cracking",
        };
      } else {
        return { ...state, playerPattern: [] }; // Clear pattern on failure
      }
    }

    // FIX: NEXT_LEVEL now loads the next level's data
    case "NEXT_LEVEL": {
      const nextLevelNum = state.level + 1;
      const levelData = LEVELS.find((l) => l.level === nextLevelNum);

      if (!levelData) {
        return {
          ...state,
          gameState: "game_won",
          feedbackMessage: "You've mastered all vaults!",
        };
      }

      const targets = levelData.words.map((word) => ({
        word,
        ...MNEMONICS_DB[word],
        isUnlocked: false,
      }));

      return {
        ...state,
        level: nextLevelNum,
        gameState: "studying",
        levelTargets: targets,
        studyIndex: 0,
        playerPattern: [],
        feedbackMessage: "",
      };
    }

    default:
      return state;
  }
}

// --- UI Components ---
const Grid = ({
  pattern,
  onPatternChange,
  onPatternComplete,
  isDrawingDisabled,
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
      {dots.map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-gray-700 transition-colors"
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            top: getDotCoords(i).y - DOT_SIZE / 2,
            left: getDotCoords(i).x - DOT_SIZE / 2,
            backgroundColor: pattern.includes(i) ? "#A78BFA" : "#4B5563",
          }}
          onMouseDown={handleInteractionStart(i)}
          onTouchStart={handleInteractionStart(i)}
        />
      ))}
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
  } = state;

  useEffect(() => {
    if (gameState === "studying" && levelTargets.length > 0) {
      const studyDuration =
        1000 + levelTargets[studyIndex].pattern.length * 200;
      const timer = setTimeout(() => {
        dispatch({ type: "ADVANCE_STUDY" });
      }, studyDuration);
      return () => clearTimeout(timer);
    }
    if (gameState === "level_complete") {
      const timer = setTimeout(() => {
        dispatch({ type: "NEXT_LEVEL" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, studyIndex, levelTargets]);

  const renderGameState = () => {
    if (gameState === "start_screen" || gameState === "game_won") {
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
            Memorize the patterns for each word to crack the vault.
          </p>
          {gameState === "game_won" && (
            <p className="text-2xl text-green-400 mb-8">
              {state.feedbackMessage}
            </p>
          )}
          <button
            onClick={() => dispatch({ type: "START_GAME" })}
            className="px-16 py-5 rounded-lg text-2xl bg-white text-black hover:bg-gray-200 transition-all duration-200 font-light"
            style={{ fontFamily: "Roboto Mono, monospace" }}
          >
            {gameState === "game_won" ? "PLAY AGAIN" : "BEGIN"}
          </button>
        </div>
      );
    }

    const isStudying = gameState === "studying";
    const currentStudyTarget = levelTargets[studyIndex];

    // FIX: Add a render guard to prevent crashing before data is loaded
    if (isStudying && !currentStudyTarget) return null;

    return (
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md flex justify-between items-center mb-8 text-2xl font-mono">
          <div>
            Level: <span className="font-bold text-white">{level}</span>
          </div>
          <div>
            Score: <span className="font-bold text-white">{score}</span>
          </div>
        </div>
        <div className="flex gap-4 mb-8">
          {levelTargets.map((target) => (
            <div
              key={target.word}
              className={`px-4 py-2 rounded border-2 transition-all duration-300 ${
                target.isUnlocked
                  ? "border-green-500 bg-green-500/10 text-green-400"
                  : crackTarget === target.word
                  ? "border-violet-400 bg-violet-500/20 text-white"
                  : "border-gray-700 text-gray-500"
              }`}
            >
              <span
                className="font-bold"
                style={{ fontFamily: "Roboto Mono, monospace" }}
              >
                {target.word}
              </span>
            </div>
          ))}
        </div>
        <div className="mb-12 text-center h-24 flex flex-col justify-center">
          {isStudying && currentStudyTarget && (
            <p
              className="text-5xl text-gray-400 font-light"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Memorize{" "}
              <span className="text-white font-bold">
                {currentStudyTarget.word}
              </span>
            </p>
          )}
          {gameState === "cracking" && crackTarget && (
            <p
              className="text-5xl text-gray-400 font-light"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Draw:{" "}
              <span className="text-violet-400 font-bold">{crackTarget}</span>
            </p>
          )}
          {gameState === "level_complete" && (
            <p
              className="text-5xl font-bold text-green-400"
              style={{ fontFamily: "Roboto Mono, monospace" }}
            >
              Vault Cracked!
            </p>
          )}
        </div>
        <Grid
          pattern={isStudying ? currentStudyTarget.pattern : playerPattern}
          onPatternChange={(p) =>
            dispatch({ type: "UPDATE_PLAYER_PATTERN", payload: p })
          }
          onPatternComplete={(p) =>
            dispatch({ type: "SUBMIT_PATTERN", payload: p })
          }
          isDrawingDisabled={isStudying}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-gray-400 p-4 flex flex-col items-center justify-center font-sans">
      {renderGameState()}
    </div>
  );
}

export default Synapse;
