import React, { useReducer, useEffect, useState } from "react";

// Font setup
const fontLinks = [
  {
    href: "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500&display=swap",
    id: "roboto-mono-font",
  },
  {
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap",
    id: "jetbrains-font",
  },
  {
    href: "https://fonts.googleapis.com/css2?family=VT323&display=swap",
    id: "vt323-font",
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

// Constants
const TOTAL_NUMBERS = 96;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 500;
const PATTERNS = {
  SCARY: {
    color: "#ff4444",
    name: "Scary",
    description: "Numbers that feel wrong",
  },
  HAPPY: {
    color: "#44ff44",
    name: "Happy",
    description: "Numbers that bring joy",
  },
  NEUTRAL: {
    color: "#888888",
    name: "Neutral",
    description: "Numbers without feeling",
  },
  MYSTERIOUS: {
    color: "#8844ff",
    name: "Mysterious",
    description: "Numbers with hidden meaning",
  },
};

// Pattern detection functions
const detectPattern = (numbers) => {
  const hasEvens = numbers.some((n) => n % 2 === 0);
  const hasOdds = numbers.some((n) => n % 2 === 1);
  const hasPrimes = numbers.some((n) => isPrime(n));
  const ascending = numbers.every((n, i) => i === 0 || n >= numbers[i - 1]);
  const descending = numbers.every((n, i) => i === 0 || n <= numbers[i - 1]);

  // Scary patterns
  if (
    numbers.includes(13) ||
    (descending && hasPrimes) ||
    numbers.includes(666)
  ) {
    return "SCARY";
  }

  // Happy patterns
  if (
    ascending ||
    (hasEvens && !hasOdds) ||
    numbers.every((n) => n % 10 === 0)
  ) {
    return "HAPPY";
  }

  // Mysterious patterns
  if (isFibonacciLike(numbers) || numbers.every((n) => isPerfectSquare(n))) {
    return "MYSTERIOUS";
  }

  return "NEUTRAL";
};

const isPrime = (n) => {
  if (n <= 1) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const isPerfectSquare = (n) => {
  const sqrt = Math.sqrt(n);
  return sqrt === Math.floor(sqrt);
};

const isFibonacciLike = (nums) => {
  if (nums.length < 3) return false;
  for (let i = 2; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + nums[i - 2]) return false;
  }
  return true;
};

// Initial state
const initialState = {
  numbers: [],
  score: 0,
  level: 1,
  quota: 10,
  identified: 0,
  timeLeft: 120,
  isPlaying: false,
  gameOver: false,
  currentPattern: null,
  message: "",
  performance: 100,
  warnings: 0,
};

// Generate random numbers scattered on screen
const generateNumbers = (level) => {
  const numbers = [];
  const patternTypes = Object.keys(PATTERNS);
  const selectedPattern =
    patternTypes[Math.floor(Math.random() * patternTypes.length)];

  // Insert some numbers that match the pattern
  const patternCount = Math.min(3 + level, 15);
  const totalCount = Math.min(20 + level * 3, 60);

  for (let i = 0; i < totalCount; i++) {
    let num;
    const isPatternNumber = i < patternCount;

    if (isPatternNumber) {
      // Generate number that fits the pattern
      switch (selectedPattern) {
        case "SCARY":
          num = [13, 666, 17, 19, 23, 31, 37][Math.floor(Math.random() * 7)];
          break;
        case "HAPPY":
          num = [10, 20, 30, 40, 50, 100, 200][Math.floor(Math.random() * 7)];
          break;
        case "MYSTERIOUS":
          num = [1, 4, 9, 16, 25, 36, 49][Math.floor(Math.random() * 7)];
          break;
        default:
          num = Math.floor(Math.random() * 999) + 1;
      }
    } else {
      num = Math.floor(Math.random() * 999) + 1;
    }

    // Find a position that doesn't overlap
    let x,
      y,
      attempts = 0;
    do {
      x = Math.random() * (SCREEN_WIDTH - 80) + 40;
      y = Math.random() * (SCREEN_HEIGHT - 80) + 40;
      attempts++;
    } while (
      attempts < 50 &&
      numbers.some((n) => Math.abs(n.x - x) < 70 && Math.abs(n.y - y) < 45)
    );

    numbers.push({
      id: i,
      value: num,
      x,
      y,
      pattern: null,
      selected: false,
      processed: false,
      opacity: 0.7 + Math.random() * 0.3,
      size: 0.9 + Math.random() * 0.2,
      drift: Math.random() * Math.PI * 2,
    });
  }

  return numbers;
};

// Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case "START_GAME":
      return {
        ...initialState,
        numbers: generateNumbers(1),
        isPlaying: true,
        message: "SCANNING FOR PATTERNS...",
      };

    case "TOGGLE_NUMBER": {
      const { id } = action.payload;
      const newNumbers = state.numbers.map((n) =>
        n.id === id ? { ...n, selected: !n.selected } : n
      );

      return { ...state, numbers: newNumbers };
    }

    case "SUBMIT_PATTERN": {
      const selectedNums = state.numbers.filter(
        (n) => n.selected && !n.processed
      );

      if (selectedNums.length < 3) {
        return {
          ...state,
          message: "Select at least 3 numbers",
          warnings: state.warnings + 1,
        };
      }

      const values = selectedNums.map((n) => n.value);
      const pattern = detectPattern(values);

      if (pattern === "NEUTRAL") {
        return {
          ...state,
          message: "No clear pattern detected. Try again.",
          warnings: state.warnings + 1,
          performance: Math.max(0, state.performance - 5),
        };
      }

      // Mark numbers as processed
      const newNumbers = state.numbers.map((n) => {
        if (n.selected && !n.processed) {
          return { ...n, processed: true, pattern, selected: false };
        }
        return n;
      });

      const points = selectedNums.length * 10;
      const newIdentified = state.identified + selectedNums.length;
      const quotaMet = newIdentified >= state.quota;
      const newLevel = quotaMet ? state.level + 1 : state.level;

      return {
        ...state,
        numbers: quotaMet ? generateNumbers(newLevel) : newNumbers,
        score: state.score + points,
        identified: quotaMet ? 0 : newIdentified,
        message: quotaMet
          ? `Pattern identified: ${PATTERNS[pattern].name} (+${points} points) • QUOTA MET: +60s`
          : `Pattern identified: ${PATTERNS[pattern].name} (+${points} points)`,
        currentPattern: pattern,
        performance: Math.min(100, state.performance + 2),
        level: newLevel,
        quota: quotaMet ? state.quota + 5 : state.quota,
        timeLeft: quotaMet
          ? Math.min(180, state.timeLeft + 60)
          : state.timeLeft,
      };
    }

    case "TICK": {
      if (!state.isPlaying || state.gameOver) return state;

      const newTimeLeft = state.timeLeft - 1;
      if (newTimeLeft <= 0) {
        return {
          ...state,
          timeLeft: 0,
          gameOver: true,
          isPlaying: false,
          message: "Time's up. Your performance was... inadequate.",
        };
      }

      return { ...state, timeLeft: newTimeLeft };
    }

    case "CLEAR_SELECTION": {
      const newNumbers = state.numbers.map((n) => ({ ...n, selected: false }));
      return { ...state, numbers: newNumbers };
    }

    default:
      return state;
  }
}

function MacrodataRefinement() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [flicker, setFlicker] = useState(false);

  // Timer
  useEffect(() => {
    if (!state.isPlaying) return;
    const timer = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(timer);
  }, [state.isPlaying]);

  // Screen flicker effect
  useEffect(() => {
    const flickerTimer = setInterval(() => {
      setFlicker(true);
      setTimeout(() => setFlicker(false), 100);
    }, 8000 + Math.random() * 4000);
    return () => clearInterval(flickerTimer);
  }, []);

  // Add scanline and fade animations
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes scan {
        0% { transform: translateY(0); }
        100% { transform: translateY(4px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes fadeIn {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes drift {
        0%, 100% { transform: translate(0, 0); }
        33% { transform: translate(3px, -2px); }
        66% { transform: translate(-2px, 3px); }
      }
      .number-appear {
        animation: fadeIn 0.5s ease-out, drift 10s ease-in-out infinite;
      }
      .number-button:hover .number-text {
        transform: scale(1.25);
        filter: brightness(1.3);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderNumber = (num) => {
    const isSelected = num.selected;
    const isProcessed = num.processed;
    const patternColor = num.pattern ? PATTERNS[num.pattern].color : null;

    return (
      <button
        key={num.id}
        onClick={() =>
          dispatch({ type: "TOGGLE_NUMBER", payload: { id: num.id } })
        }
        disabled={!state.isPlaying || num.processed}
        className={`
          absolute transition-all duration-200 number-appear number-button
          ${
            !state.isPlaying || isProcessed
              ? "cursor-not-allowed"
              : "cursor-pointer"
          }
        `}
        style={{
          left: `${num.x}px`,
          top: `${num.y}px`,
          opacity: num.opacity,
          fontFamily: "VT323, monospace",
          animationDelay: `${num.id * 0.05}s, ${num.drift}s`,
          transform: `scale(${num.size})`,
        }}
      >
        <span
          className={`
          number-text text-2xl font-normal transition-all duration-150 block px-3 py-1
          ${
            isProcessed
              ? "text-gray-800"
              : isSelected
              ? "text-blue-400"
              : "text-green-500"
          }
        `}
          style={{
            textShadow: isProcessed
              ? "none"
              : isSelected
              ? "0 0 15px rgba(59, 130, 246, 1), 0 0 30px rgba(59, 130, 246, 0.6)"
              : "0 0 10px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.4)",
            filter: !isProcessed ? "contrast(1.2)" : "none",
            backgroundColor: isSelected
              ? "rgba(59, 130, 246, 0.1)"
              : "transparent",
            borderRadius: "4px",
          }}
        >
          {num.value}
        </span>
        {isProcessed && (
          <div
            className="absolute inset-0 opacity-20 rounded"
            style={{ backgroundColor: patternColor }}
          />
        )}
      </button>
    );
  };

  return (
    <div
      className={`min-h-screen bg-black text-white p-4 flex flex-col items-center transition-opacity duration-100 ${
        flicker ? "opacity-90" : "opacity-100"
      }`}
      style={{
        fontFamily: "Roboto Mono, monospace",
        background:
          "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)",
      }}
    >
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-5xl mb-2 font-normal tracking-tight text-green-400"
            style={{
              textShadow:
                "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)",
              fontFamily: "VT323, monospace",
              letterSpacing: "0.05em",
            }}
          >
            MACRODATA REFINEMENT
          </h1>
          <p
            className="text-gray-500 text-sm uppercase tracking-widest"
            style={{
              fontFamily: "Roboto Mono, monospace",
            }}
          >
            Lumon Industries • Department 7G
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6 text-center">
          <div
            className="bg-black border border-gray-800 rounded p-3"
            style={{
              boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            <div
              className={`text-2xl font-light ${
                state.timeLeft < 30 ? "text-red-400" : "text-green-400"
              }`}
              style={{
                fontFamily: "VT323, monospace",
                textShadow:
                  state.timeLeft < 30
                    ? "0 0 8px rgba(255, 0, 0, 0.6)"
                    : "0 0 8px rgba(0, 255, 0, 0.6)",
                animation: state.timeLeft < 10 ? "pulse 1s infinite" : "none",
              }}
            >
              {formatTime(state.timeLeft)}
            </div>
            <div className="text-xs text-gray-600 uppercase">Time</div>
          </div>
          <div
            className="bg-black border border-gray-800 rounded p-3"
            style={{
              boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            <div
              className="text-2xl font-light text-green-400"
              style={{
                fontFamily: "VT323, monospace",
                textShadow: "0 0 8px rgba(0, 255, 0, 0.6)",
              }}
            >
              {state.score}
            </div>
            <div className="text-xs text-gray-600 uppercase">Score</div>
          </div>
          <div
            className="bg-black border border-gray-800 rounded p-3"
            style={{
              boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            <div
              className="text-2xl font-light text-yellow-400"
              style={{
                fontFamily: "VT323, monospace",
                textShadow: "0 0 8px rgba(255, 235, 59, 0.6)",
              }}
            >
              {state.identified}/{state.quota}
            </div>
            <div className="text-xs text-gray-600 uppercase">Quota</div>
          </div>
          <div
            className="bg-black border border-gray-800 rounded p-3"
            style={{
              boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            <div
              className="text-2xl font-light text-green-400"
              style={{
                fontFamily: "VT323, monospace",
                textShadow: "0 0 8px rgba(0, 255, 0, 0.6)",
              }}
            >
              {state.level}
            </div>
            <div className="text-xs text-gray-600 uppercase">Level</div>
          </div>
          <div
            className="bg-black border border-gray-800 rounded p-3"
            style={{
              boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            <div
              className="text-2xl font-light"
              style={{
                color: state.performance > 50 ? "#44ff44" : "#ff4444",
                fontFamily: "VT323, monospace",
                textShadow: `0 0 8px ${
                  state.performance > 50
                    ? "rgba(68, 255, 68, 0.6)"
                    : "rgba(255, 68, 68, 0.6)"
                }`,
              }}
            >
              {state.performance}%
            </div>
            <div className="text-xs text-gray-600 uppercase">Performance</div>
          </div>
        </div>

        {/* Message */}
        <div className="h-8 mb-4 text-center">
          <p
            className={`text-sm ${
              state.currentPattern ? "text-green-400" : "text-gray-500"
            }`}
            style={{
              fontFamily: "VT323, monospace",
              fontSize: "18px",
              textShadow: state.currentPattern
                ? "0 0 8px rgba(0, 255, 0, 0.6)"
                : "none",
            }}
          >
            {state.message}
            {state.isPlaying &&
              state.numbers &&
              state.numbers.filter((n) => n.selected && !n.processed).length >
                0 &&
              !state.currentPattern && (
                <span className="text-blue-400 ml-4">
                  (
                  {
                    state.numbers.filter((n) => n.selected && !n.processed)
                      .length
                  }{" "}
                  selected)
                </span>
              )}
          </p>
        </div>

        {/* Number Display */}
        {state.isPlaying || state.gameOver ? (
          <div className="flex justify-center mb-8">
            <div
              className="relative bg-black border-2 border-gray-800 rounded-lg overflow-hidden"
              style={{
                width: `${SCREEN_WIDTH}px`,
                height: `${SCREEN_HEIGHT}px`,
                boxShadow:
                  "0 0 40px rgba(0, 255, 0, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.8)",
                opacity: state.gameOver ? 0.5 : 1,
              }}
            >
              {/* CRT scan lines effect */}
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)",
                  animation: "scan 8s linear infinite",
                }}
              />

              {/* CRT glow effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)",
                  boxShadow: "inset 0 0 100px rgba(0, 255, 0, 0.05)",
                }}
              />

              {/* Numbers */}
              {state.numbers && state.numbers.map((num) => renderNumber(num))}

              {state.gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
                  <div className="text-center">
                    <div
                      className="text-red-500 text-4xl mb-2"
                      style={{
                        fontFamily: "VT323, monospace",
                        textShadow: "0 0 20px rgba(255, 0, 0, 0.8)",
                      }}
                    >
                      PERFORMANCE INADEQUATE
                    </div>
                    <div className="text-gray-500 text-xl">
                      Score: {state.score}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-8">
            <div className="text-center py-20">
              <div
                className="text-green-400 text-2xl mb-4"
                style={{
                  fontFamily: "VT323, monospace",
                  textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
                }}
              >
                TERMINAL READY
              </div>
              <div className="text-gray-600 text-sm">
                Press START SHIFT to begin refinement
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <button
              onClick={() =>
                dispatch({
                  type: state.isPlaying ? "SUBMIT_PATTERN" : "START_GAME",
                })
              }
              className={`px-8 py-3 rounded text-lg font-normal transition-all duration-200 ${
                state.isPlaying
                  ? "bg-green-900/20 text-green-400 border border-green-800 hover:bg-green-800/30 hover:border-green-600"
                  : "bg-green-600 text-black hover:bg-green-500"
              }`}
              style={{
                minWidth: "180px",
                fontFamily: "VT323, monospace",
                fontSize: "24px",
                letterSpacing: "0.05em",
                boxShadow: state.isPlaying
                  ? "0 0 20px rgba(0, 255, 0, 0.2), inset 0 0 20px rgba(0, 255, 0, 0.1)"
                  : "0 0 20px rgba(0, 255, 0, 0.4)",
              }}
            >
              {state.isPlaying
                ? "SUBMIT PATTERN"
                : state.gameOver
                ? "TRY AGAIN"
                : "START SHIFT"}
            </button>

            {state.isPlaying && (
              <button
                onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
                className="px-8 py-3 rounded text-lg font-normal bg-black text-gray-400 border border-gray-800 hover:bg-gray-900 hover:border-gray-600 hover:text-gray-300 transition-all duration-200"
                style={{
                  fontFamily: "VT323, monospace",
                  fontSize: "24px",
                  letterSpacing: "0.05em",
                  boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.8)",
                }}
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Pattern Guide */}
          {state.isPlaying && (
            <div className="mt-8 grid grid-cols-4 gap-4">
              {Object.entries(PATTERNS).map(([key, pattern]) => (
                <div key={key} className="text-center">
                  <div
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{
                      backgroundColor: pattern.color,
                      boxShadow: `0 0 10px ${pattern.color}80`,
                    }}
                  />
                  <div
                    className="text-xs text-gray-500"
                    style={{
                      fontFamily: "VT323, monospace",
                      fontSize: "16px",
                    }}
                  >
                    {pattern.name.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p
            className="text-gray-600 text-xs mt-4 text-center"
            style={{
              fontFamily: "Roboto Mono, monospace",
              letterSpacing: "0.1em",
            }}
          >
            Your outie enjoys identifying patterns. Your innie does not.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MacrodataRefinement;
