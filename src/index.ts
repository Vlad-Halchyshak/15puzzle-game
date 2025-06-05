import { createApp } from "./core/app";
import { loadTextures } from "./core/loader";
import { setupGameHandlers } from "./game/setupGameHandlers";
import { ElementEntity } from "./types";
import { initUI } from "./ui/initUI";

let currentLevel = 0;
let elements: ElementEntity[] = [];
let timerId: ReturnType<typeof setTimeout> | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let timeRemaining = 40;
let isInteractionBlocked = false;

async function main() {
  const app = await createApp();
  const textures = await loadTextures();

  const { timerDisplay, buttonContainer } = initUI();

  const gameAPI = {
    getCurrentLevel: () => currentLevel,
    setCurrentLevel: (v: number) => (currentLevel = v),
    getElements: () => elements,
    setElements: (e: ElementEntity[]) => (elements = e),
    getIsBlocked: () => isInteractionBlocked,
    setIsBlocked: (v: boolean) => (isInteractionBlocked = v),
    getTimerId: () => timerId,
    setTimerId: (id: ReturnType<typeof setTimeout> | null) => (timerId = id),
    getIntervalId: () => intervalId,
    setIntervalId: (id: ReturnType<typeof setInterval> | null) =>
      (intervalId = id),
    getTimeRemaining: () => timeRemaining,
    setTimeRemaining: (v: number) => (timeRemaining = v),
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
