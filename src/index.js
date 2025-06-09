import { createApp } from "./core/app";
import { loadTextures } from "./core/loader";
import { setupGameHandlers } from "./game/setupGameHandlers";
import { initUI } from "./ui/initUI";

let currentLevel = 0;
let elements = [];
let timerId = null;
let intervalId = null;

let timeRemaining = 59;
let isInteractionBlocked = false;

async function main() {
  const app = await createApp();
  const textures = await loadTextures();

  const { timerDisplay, buttonContainer } = initUI();

  const gameAPI = {
    getCurrentLevel: () => currentLevel,
    setCurrentLevel: (v) => (currentLevel = v),
    getElements: () => elements,
    setElements: (e) => (elements = e),
    getIsBlocked: () => isInteractionBlocked,
    setIsBlocked: (v) => (isInteractionBlocked = v),
    getTimerId: () => timerId,
    setTimerId: (id) => (timerId = id),
    getIntervalId: () => intervalId,
    setIntervalId: (id) => (intervalId = id),
    getTimeRemaining: () => timeRemaining,
    setTimeRemaining: (v) => (timeRemaining = v),
  };

  setupGameHandlers({
    app,
    textures,
    buttonContainer,
    timerDisplay,
    gameAPI,
  });
}

main();
