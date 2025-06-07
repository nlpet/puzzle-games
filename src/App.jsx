import React from "react";
// 1. Change BrowserRouter to HashRouter
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import GameFrame from "./components/GameFrame";
import NumberFlow from "./games/NumberFlow";
import Synapse from "./games/Synapse";
import MacrodataRefinement from "./games/MacrodataRefinement";

function App() {
  return (
    // 2. Remove the basename prop
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/game/number-flow"
          element={
            <GameFrame>
              <NumberFlow />
            </GameFrame>
          }
        />
        {/* 2. Add the route for Synapse */}
        <Route
          path="/game/synapse"
          element={
            <GameFrame>
              <Synapse />
            </GameFrame>
          }
        />
        <Route
          path="/game/macrodata-refinement"
          element={
            <GameFrame>
              <MacrodataRefinement />
            </GameFrame>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
