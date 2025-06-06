import React, { useEffect } from "react";
import { Link } from "react-router-dom";

// Add Google Fonts import for Inter and JetBrains Mono
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

const games = [
  {
    id: "number-flow",
    name: "NumberFlow",
    description: "2048 meets Unify. Merge matching numbers in a flowing grid.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect
          x="10"
          y="10"
          width="35"
          height="35"
          fill="currentColor"
          opacity="0.2"
          rx="4"
        />
        <rect
          x="55"
          y="10"
          width="35"
          height="35"
          fill="currentColor"
          opacity="0.4"
          rx="4"
        />
        <rect
          x="10"
          y="55"
          width="35"
          height="35"
          fill="currentColor"
          opacity="0.6"
          rx="4"
        />
        <rect
          x="55"
          y="55"
          width="35"
          height="35"
          fill="currentColor"
          opacity="0.8"
          rx="4"
        />
        <text
          x="27.5"
          y="32"
          textAnchor="middle"
          className="fill-current text-xs font-medium"
        >
          2
        </text>
        <text
          x="72.5"
          y="32"
          textAnchor="middle"
          className="fill-current text-xs font-medium"
        >
          4
        </text>
        <text
          x="27.5"
          y="77"
          textAnchor="middle"
          className="fill-current text-xs font-medium"
        >
          8
        </text>
        <text
          x="72.5"
          y="77"
          textAnchor="middle"
          className="fill-current text-xs font-medium"
        >
          16
        </text>
      </svg>
    ),
    available: true,
  },
  {
    id: "memory-lock",
    name: "MemoryLock",
    description: "Mastermind meets digit span",
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Grid of dots */}
        {[20, 50, 80].map((x) =>
          [20, 50, 80].map((y) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r="3"
              fill="currentColor"
              opacity="0.3"
            />
          ))
        )}
        {/* Pattern lines */}
        <path
          d="M 20 20 L 50 20 L 80 50 L 50 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Active dots */}
        <circle cx="20" cy="20" r="4" fill="currentColor" />
        <circle cx="50" cy="20" r="4" fill="currentColor" />
        <circle cx="80" cy="50" r="4" fill="currentColor" />
        <circle cx="50" cy="80" r="4" fill="currentColor" />
      </svg>
    ),
    available: false,
  },
  {
    id: "enhanced-unify",
    name: "Unify+",
    description: "Enhanced block puzzles with dual-side mechanics.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Left blocks */}
        <rect
          x="5"
          y="20"
          width="20"
          height="15"
          fill="currentColor"
          opacity="0.4"
          rx="2"
        />
        <rect
          x="5"
          y="42.5"
          width="20"
          height="15"
          fill="currentColor"
          opacity="0.6"
          rx="2"
        />
        <rect
          x="5"
          y="65"
          width="20"
          height="15"
          fill="currentColor"
          opacity="0.8"
          rx="2"
        />
        {/* Right blocks */}
        <rect
          x="75"
          y="20"
          width="20"
          height="15"
          fill="currentColor"
          opacity="0.4"
          rx="2"
        />
        <rect
          x="75"
          y="42.5"
          width="20"
          height="15"
          fill="currentColor"
          opacity="0.6"
          rx="2"
        />
        <rect
          x="75"
          y="65"
          width="20"
          height="15"
          fill="currentColor"
          opacity="0.8"
          rx="2"
        />
        {/* Center merge area */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="3 3"
        />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          className="fill-current text-lg font-light opacity-50"
        >
          ×
        </text>
      </svg>
    ),
    available: false,
  },
  {
    id: "flow-puzzle",
    name: "Flow",
    description: "Connect matching colors. Fill the entire grid.",
    icon: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path
          d="M 20 20 Q 20 50 50 50 T 80 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.4"
          strokeLinecap="round"
        />
        <path
          d="M 80 20 Q 50 30 20 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.6"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="5" fill="currentColor" opacity="0.8" />
        <circle cx="80" cy="80" r="5" fill="currentColor" opacity="0.8" />
        <circle cx="80" cy="20" r="5" fill="currentColor" opacity="0.6" />
        <circle cx="20" cy="80" r="5" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    available: false,
  },
];

export default function LandingPage() {
  useEffect(() => {
    document.title = "Puzzle Collection";
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16 md:mb-20">
          <div className="inline-block">
            <h1
              className="text-5xl md:text-7xl font-light tracking-tighter mb-4"
              style={{ fontFamily: "Roboto Mono, Inter, sans-serif" }}
            >
              Puzzle Collection
            </h1>
            <p
              className="text-gray-400 text-lg md:text-xl font-light tracking-wide"
              style={{ fontFamily: "Roboto Mono, Inter, sans-serif" }}
            >
              Minimalist puzzle games
            </p>
          </div>
        </header>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
          {games.map((game) =>
            game.available ? (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="group relative bg-gray-950 border border-gray-800 rounded-lg p-8 md:p-10 
                         hover:bg-gray-900 hover:border-gray-700 transition-all duration-300
                         hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5"
              >
                <div className="flex items-start gap-6 md:gap-8">
                  {/* Icon */}
                  <div
                    className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 text-white opacity-70 
                                group-hover:opacity-100 transition-opacity duration-300"
                  >
                    {game.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <h2
                      className="text-2xl md:text-3xl font-light mb-2 group-hover:text-white transition-colors"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {game.name}
                    </h2>
                    <p
                      className="text-gray-500 text-sm md:text-base leading-relaxed mb-4"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {game.description}
                    </p>
                    <div
                      className="flex items-center gap-2 text-green-400 text-lg font-medium"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      <span>PLAY</span>
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/0 to-white/0 
                              group-hover:from-white/5 group-hover:to-transparent transition-all duration-300 
                              pointer-events-none"
                />
              </Link>
            ) : (
              <div
                key={game.id}
                className="relative bg-gray-950/50 border border-gray-900 rounded-lg p-8 md:p-10 
                         opacity-50 cursor-not-allowed"
              >
                <div className="flex items-start gap-6 md:gap-8">
                  {/* Icon */}
                  <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 text-gray-600">
                    {game.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <h2
                      className="text-2xl md:text-3xl font-light mb-2 text-gray-600"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {game.name}
                    </h2>
                    <p
                      className="text-gray-700 text-sm md:text-base leading-relaxed mb-4"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {game.description}
                    </p>
                    <div
                      className="text-gray-700 text-sm font-medium"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      COMING SOON
                    </div>
                  </div>
                </div>

                {/* Lock icon overlay */}
                <div className="absolute top-4 right-4">
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 md:mt-24 text-center">
          <div
            className="inline-flex items-center gap-8 text-gray-600 text-sm"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            <a
              href="https://maxwellito.github.io/breaklock/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              BREAKLOCK
            </a>
            <span className="text-gray-800">•</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              GITHUB
            </a>
          </div>
          <div
            className="mt-4 text-gray-700 text-xs"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Inspired by timeless puzzle games
          </div>
        </footer>
      </div>
    </div>
  );
}
