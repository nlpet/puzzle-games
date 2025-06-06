import React from "react";
import { Link } from "react-router-dom";

function GameFrame({ children, title }) {
  return (
    <div className="min-h-screen bg-black">
      {/* Header with back button */}
      <header className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
            style={{ fontFamily: "Roboto Mono, monospace", fontWeight: 300 }}
          >
            <span>←</span> Back to Collection
          </Link>
          {title && (
            <h1
              className="text-white text-lg"
              style={{ fontFamily: "Roboto Mono, monospace", fontWeight: 300 }}
            >
              {title}
            </h1>
          )}
          <div className="w-32"></div> {/* Spacer for centering title */}
        </div>
      </header>

      {/* Game content */}
      <main className="relative">{children}</main>
    </div>
  );
}

export default GameFrame;
