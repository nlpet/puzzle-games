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

// Define phases and their encodings
const PHASES = [
  {
    id: 1,
    name: "Mathematical Patterns",
    description: "Numbers have intrinsic emotional properties",
    color: "#00ff88",
    rounds: [
      {
        quota: 8,
        difficulty: 1,
        description: "Find the emotional weight in numbers",
      },
      { quota: 10, difficulty: 2, description: "Patterns become more subtle" },
      { quota: 12, difficulty: 3, description: "Master mathematical emotions" },
      { quota: 15, difficulty: 4, description: "Final mathematical test" },
      // Easy to add more rounds here!
    ],
    patterns: ["SCARY", "HAPPY", "MYSTERIOUS"],
    encoding: "MATHEMATICAL",
  },
  // Future phases - uncomment and implement detection/generation functions
  /*
  ,{
    id: 2,
    name: "Visual Patterns",
    description: "Numbers form shapes in space",
    color: "#44ffff",
    rounds: [
      { quota: 10, difficulty: 1, description: "Numbers draw emotional shapes" },
      { quota: 12, difficulty: 2, description: "More complex spatial patterns" },
      { quota: 15, difficulty: 3, description: "Master visual recognition" }
    ],
    patterns: ["SCARY", "HAPPY", "MYSTERIOUS"],
    encoding: "VISUAL",
    reveal: "SHAPE"
  },
  {
    id: 3,
    name: "Musical Patterns",
    description: "Numbers sing emotional melodies",
    color: "#ff44ff",
    rounds: [
      { quota: 10, difficulty: 1, description: "Numbers as musical notes" },
      { quota: 12, difficulty: 2, description: "Complex harmonic patterns" },
      { quota: 15, difficulty: 3, description: "Master musical emotions" }
    ],
    patterns: ["SCARY", "HAPPY", "MYSTERIOUS"],
    encoding: "MUSICAL",
    reveal: "SOUND"
  },
  {
    id: 4,
    name: "Linguistic Patterns",
    description: "Numbers spell emotional words",
    color: "#ffaa00",
    rounds: [
      { quota: 10, difficulty: 1, description: "Numbers encode letters" },
      { quota: 12, difficulty: 2, description: "Hidden messages emerge" },
      { quota: 15, difficulty: 3, description: "Master word patterns" }
    ],
    patterns: ["SCARY", "HAPPY", "MYSTERIOUS"],
    encoding: "LINGUISTIC",
    reveal: "WORD"
  },
  {
    id: 5,
    name: "Meta Patterns",
    description: "Numbers describe themselves",
    color: "#ff4488",
    rounds: [
      { quota: 12, difficulty: 1, description: "Self-referential sequences" },
      { quota: 15, difficulty: 2, description: "Numbers within numbers" },
      { quota: 18, difficulty: 3, description: "Ultimate pattern mastery" }
    ],
    patterns: ["SCARY", "HAPPY", "MYSTERIOUS"],
    encoding: "META",
    reveal: "ANIMATION"
  }
  */
];

const PATTERNS = {
  // Emotional patterns - these remain constant but encoding changes by phase
  SCARY: {
    color: "#ff4444",
    name: "Scary",
    description: "Numbers that feel wrong",
    hint: "13, 666, descending primes",
  },
  HAPPY: {
    color: "#44ff44",
    name: "Happy",
    description: "Numbers that bring joy",
    hint: "Evens only, ÷10, ascending",
  },
  MYSTERIOUS: {
    color: "#8844ff",
    name: "Mysterious",
    description: "Numbers with hidden meaning",
    hint: "Perfect squares, Fibonacci sequences",
  },
  NEUTRAL: {
    color: "#888888",
    name: "Neutral",
    description: "No pattern detected",
  },
};

// Helper functions
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

// Pattern detection functions for Phase 1 (Mathematical)
const detectMathematicalPattern = (numbers) => {
  const hasEvens = numbers.some((n) => n % 2 === 0);
  const hasOdds = numbers.some((n) => n % 2 === 1);
  const hasPrimes = numbers.some((n) => isPrime(n));
  const ascending = numbers.every((n, i) => i === 0 || n >= numbers[i - 1]);
  const descending = numbers.every((n, i) => i === 0 || n <= numbers[i - 1]);
  const allDivisibleBy10 = numbers.every((n) => n % 10 === 0);
  const allPerfectSquares = numbers.every((n) => isPerfectSquare(n));

  // Scary patterns: 13, 666, descending primes
  if (numbers.includes(13) || numbers.includes(666)) {
    return "SCARY";
  }
  if (descending && hasPrimes && numbers.length >= 3) {
    // Check if at least 2 are prime for descending scary
    const primeCount = numbers.filter((n) => isPrime(n)).length;
    if (primeCount >= 2) return "SCARY";
  }

  // Happy patterns: even numbers, multiples of 10, ascending
  if (
    (hasEvens && !hasOdds) ||
    allDivisibleBy10 ||
    (ascending && numbers.length >= 3)
  ) {
    return "HAPPY";
  }

  // Mysterious patterns: Fibonacci-like, perfect squares
  if (isFibonacciLike(numbers) || (allPerfectSquares && numbers.length >= 3)) {
    return "MYSTERIOUS";
  }

  return "NEUTRAL";
};

/* 
HOW TO ADD NEW PHASES:
1. Add the phase configuration to PHASES array above
2. Create a detect[Type]Pattern function like this:

const detectVisualPattern = (numbers) => {
  // Example: check if numbers form shapes when plotted
  // Return "SCARY", "HAPPY", "MYSTERIOUS", or "NEUTRAL"
};

3. Create a generate[Type]Numbers function in generateNumbers switch
4. Add the case to detectPattern switch below
5. Optionally add reveal logic in SUBMIT_PATTERN (animations, sounds, etc.)
*/

// Main pattern detection function that routes based on phase
const detectPattern = (numbers, phaseId) => {
  const currentPhase = PHASES.find((p) => p.id === phaseId);
  if (!currentPhase) return "NEUTRAL";

  switch (currentPhase.encoding) {
    case "MATHEMATICAL":
      return detectMathematicalPattern(numbers);

    // TO ADD NEW PHASE DETECTION:
    // case "VISUAL":
    //   return detectVisualPattern(numbers);

    default:
      return "NEUTRAL";
  }
};

// Initial state
const initialState = {
  numbers: [],
  score: 0,
  currentPhase: 1,
  currentRound: 0, // 0-indexed within phase
  quota: 8,
  identified: 0,
  timeLeft: 120,
  isPlaying: false,
  gameOver: false,
  gameComplete: false,
  currentPattern: null,
  message: "",
  performance: 100,
  warnings: 0,
};

// Generate numbers for Phase 1 (Mathematical)
const generateMathematicalNumbers = (patternCount, totalCount, difficulty) => {
  const numbers = [];
  const patterns = ["SCARY", "HAPPY", "MYSTERIOUS"];

  // Generate pattern numbers
  for (let i = 0; i < patternCount; i++) {
    const patternType = patterns[i % patterns.length];
    let num;

    // More scary numbers at higher difficulty
    const scaryPool =
      difficulty > 2
        ? [13, 666, 17, 19, 23, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71]
        : [13, 666, 17, 19, 23, 31, 37];

    switch (patternType) {
      case "SCARY":
        num = scaryPool[Math.floor(Math.random() * scaryPool.length)];
        break;

      case "HAPPY":
        // More variety at higher difficulty
        if (difficulty > 2 && Math.random() < 0.3) {
          // Ascending sequences
          num = 10 + i * 10;
        } else if (Math.random() < 0.5) {
          // Multiples of 10
          num = [10, 20, 30, 40, 50, 100, 200, 300][
            Math.floor(Math.random() * 8)
          ];
        } else {
          // Even numbers
          num = [2, 4, 6, 8, 12, 14, 16, 18, 22, 24][
            Math.floor(Math.random() * 10)
          ];
        }
        break;

      case "MYSTERIOUS":
        // Perfect squares and Fibonacci at higher difficulty
        if (difficulty > 2 && Math.random() < 0.3) {
          // Sometimes generate Fibonacci numbers
          const fibNumbers = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
          num = fibNumbers[Math.floor(Math.random() * fibNumbers.length)];
        } else {
          // Mostly perfect squares
          const squares = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
          num = squares[Math.floor(Math.random() * squares.length)];
        }
        break;
    }

    numbers.push(num);
  }

  // Generate noise numbers
  for (let i = patternCount; i < totalCount; i++) {
    // Avoid pattern numbers
    let num;
    do {
      num = Math.floor(Math.random() * 200) + 1;
    } while (
      num === 13 ||
      num === 666 ||
      isPrime(num) || // Avoid scary
      num % 10 === 0 ||
      num % 2 === 0 || // Avoid happy
      isPerfectSquare(num) || // Avoid mysterious
      [1, 2, 3, 5, 8, 13, 21, 34, 55, 89].includes(num) // Avoid Fibonacci
    );
    numbers.push(num);
  }

  return numbers;
};

// Main number generation function
const generateNumbers = (phaseId, roundIndex) => {
  const currentPhase = PHASES.find((p) => p.id === phaseId);
  if (!currentPhase) return [];

  const round = currentPhase.rounds[roundIndex];
  if (!round) return [];

  // Difficulty scaling based on round
  const patternCount = Math.min(6 + round.difficulty * 2, 20);
  const totalCount = Math.min(20 + round.difficulty * 3, 40);

  let numberValues = [];

  switch (currentPhase.encoding) {
    case "MATHEMATICAL":
      numberValues = generateMathematicalNumbers(
        patternCount,
        totalCount,
        round.difficulty
      );
      break;

    // TO ADD NEW PHASES:
    // 1. Create generate[Type]Numbers function that returns array of numbers
    // 2. Add case here to call it
    // Example:
    // case "VISUAL":
    //   numberValues = generateVisualNumbers(patternCount, totalCount, round.difficulty);
    //   break;

    default:
      // Fallback to mathematical for unimplemented phases
      numberValues = generateMathematicalNumbers(
        patternCount,
        totalCount,
        round.difficulty
      );
      break;
  }

  // Shuffle and place numbers on screen
  numberValues.sort(() => Math.random() - 0.5);

  const numbers = [];
  numberValues.forEach((value, i) => {
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
      value,
      x,
      y,
      pattern: null,
      selected: false,
      processed: false,
      opacity: 0.7 + Math.random() * 0.3,
      size: 0.9 + Math.random() * 0.2,
      drift: Math.random() * Math.PI * 2,
    });
  });

  return numbers;
};

// Reducer
function gameReducer(state, action) {
  const firstPhase = PHASES[0];
  const firstRound = firstPhase.rounds[0];
  switch (action.type) {
    case "START_GAME":
      return {
        ...initialState,
        numbers: generateNumbers(1, 0),
        isPlaying: true,
        quota: firstRound.quota,
        message: `PHASE 1: MATHEMATICAL PATTERNS • SELECT 3+ MATCHING EMOTIONS`,
      };

    case "TOGGLE_NUMBER": {
      const { id } = action.payload;
      const newNumbers = state.numbers.map((n) =>
        n.id === id ? { ...n, selected: !n.selected } : n
      );

      return { ...state, numbers: newNumbers };
    }

    case "SUBMIT_PATTERN": {
      const selectedNums = state.numbers
        .filter((n) => n.selected && !n.processed)
        .sort((a, b) => {
          // Sort by spatial proximity for better pattern detection
          if (Math.abs(a.y - b.y) < 50) {
            // Same row-ish
            return a.x - b.x;
          }
          return a.y - b.y;
        });

      if (selectedNums.length < 3) {
        return {
          ...state,
          message: "Select at least 3 numbers",
          warnings: state.warnings + 1,
        };
      }

      const values = selectedNums.map((n) => n.value);
      const currentPhase =
        PHASES.find((p) => p.id === state.currentPhase) || PHASES[0];
      const pattern = detectPattern(values, state.currentPhase);

      if (pattern === "NEUTRAL") {
        return {
          ...state,
          message: "No emotional pattern detected. Try again.",
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

      const points = selectedNums.length * 10 * state.currentPhase; // More points in later phases
      const newIdentified = state.identified + selectedNums.length;
      const quotaMet = newIdentified >= state.quota;

      // Check progression
      let newPhase = state.currentPhase;
      let newRound = state.currentRound;
      let gameComplete = false;
      let message = `Pattern identified: ${PATTERNS[pattern].name} (+${points} points)`;

      if (quotaMet) {
        const currentRounds = currentPhase.rounds;

        if (state.currentRound >= currentRounds.length - 1) {
          // Move to next phase
          if (state.currentPhase < PHASES.length) {
            // For now, completing Phase 1 completes the game
            gameComplete = true;
            message += ` • PHASE 1 COMPLETE! EXCEPTIONAL PERFORMANCE`;
          }
        } else {
          // Next round in same phase
          newRound = state.currentRound + 1;
          const nextRoundData = currentRounds[newRound];
          message += ` • ROUND ${newRound + 1} - ${nextRoundData.description}`;
        }
      }

      // Get new quota for next round
      let newQuota = state.quota;
      if (quotaMet && !gameComplete) {
        const nextPhase = PHASES.find((p) => p.id === newPhase) || currentPhase;
        if (nextPhase && nextPhase.rounds[newRound]) {
          newQuota = nextPhase.rounds[newRound].quota;
        }
      }

      return {
        ...state,
        numbers:
          quotaMet && !gameComplete
            ? generateNumbers(newPhase, newRound)
            : newNumbers,
        score: state.score + points,
        identified: quotaMet ? 0 : newIdentified,
        message,
        currentPattern: pattern,
        performance: Math.min(100, state.performance + 2),
        currentPhase: newPhase,
        currentRound: newRound,
        quota: newQuota,
        timeLeft: quotaMet
          ? Math.min(180, state.timeLeft + 45)
          : state.timeLeft,
        gameComplete,
        gameOver: gameComplete,
        isPlaying: !gameComplete,
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
          message: "",
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
    const currentPhase =
      state.currentPhase >= 1 && state.currentPhase <= PHASES.length
        ? PHASES.find((p) => p.id === state.currentPhase)
        : PHASES[0];

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
              : `0 0 10px ${currentPhase?.color || "#00ff88"}80, 0 0 20px ${
                  currentPhase?.color || "#00ff88"
                }40`,
            filter: !isProcessed ? "contrast(1.2)" : "none",
            backgroundColor: isSelected
              ? "rgba(59, 130, 246, 0.1)"
              : "transparent",
            borderRadius: "4px",
            color: isProcessed
              ? "#333"
              : isSelected
              ? "#3b82f6"
              : currentPhase?.color || "#00ff88",
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
          {state.isPlaying && state.currentPhase <= PHASES.length && (
            <div className="mt-4">
              <div
                className="text-2xl font-normal"
                style={{
                  color:
                    PHASES.find((p) => p.id === state.currentPhase)?.color ||
                    "#00ff88",
                  fontFamily: "VT323, monospace",
                  textShadow: `0 0 15px ${
                    PHASES.find((p) => p.id === state.currentPhase)?.color ||
                    "#00ff88"
                  }80`,
                }}
              >
                PHASE {state.currentPhase}:{" "}
                {PHASES.find(
                  (p) => p.id === state.currentPhase
                )?.name.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {
                  PHASES.find((p) => p.id === state.currentPhase)?.rounds[
                    state.currentRound
                  ]?.description
                }
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3 mb-6 text-center">
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
              className="text-2xl font-light"
              style={{
                color:
                  PHASES.find((p) => p.id === state.currentPhase)?.color ||
                  "#00ff88",
                fontFamily: "VT323, monospace",
                textShadow: `0 0 8px ${
                  PHASES.find((p) => p.id === state.currentPhase)?.color ||
                  "#00ff88"
                }80`,
              }}
            >
              {state.currentRound + 1}/
              {PHASES.find((p) => p.id === state.currentPhase)?.rounds.length ||
                1}
            </div>
            <div className="text-xs text-gray-600 uppercase">Round</div>
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
              {state.currentPhase}/{PHASES.length}
            </div>
            <div className="text-xs text-gray-600 uppercase">Phase</div>
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
                    {state.gameComplete ? (
                      <>
                        <div
                          className="text-green-400 text-4xl mb-2"
                          style={{
                            fontFamily: "VT323, monospace",
                            textShadow: "0 0 20px rgba(0, 255, 0, 0.8)",
                          }}
                        >
                          EXCEPTIONAL PERFORMANCE
                        </div>
                        <div className="text-gray-400 text-xl mb-2">
                          Phase 1 Mathematical Patterns mastered!
                        </div>
                        <div className="text-gray-500 text-xl">
                          Final Score: {state.score}
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
            <div className="mt-8">
              <div className="text-xs text-gray-600 mb-3 text-center uppercase">
                Phase 1: Mathematical Patterns
              </div>
              <div className="flex justify-center gap-6">
                {["SCARY", "HAPPY", "MYSTERIOUS"].map((patternKey) => {
                  const pattern = PATTERNS[patternKey];
                  return (
                    <div
                      key={patternKey}
                      className="text-center group relative"
                    >
                      <div
                        className="w-4 h-4 rounded-full mx-auto mb-2 cursor-help"
                        style={{
                          backgroundColor: pattern.color,
                          boxShadow: `0 0 10px ${pattern.color}80`,
                        }}
                        title={pattern.hint}
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
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs text-gray-400 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                        style={{
                          fontFamily: "Roboto Mono, monospace",
                          fontSize: "11px",
                        }}
                      >
                        {pattern.hint}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p
            className="text-gray-600 text-xs mt-4 text-center"
            style={{
              fontFamily: "Roboto Mono, monospace",
              letterSpacing: "0.1em",
            }}
          >
            Complete 4 rounds to master Phase 1. More phases coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MacrodataRefinement;
