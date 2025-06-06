import React from "react";
// 1. Change BrowserRouter to HashRouter
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import GameFrame from "./components/GameFrame";
import NumberFlow from "./games/NumberFlow";

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
        {/* Add more game routes */}
      </Routes>
    </Router>
  );
}

export default App;
