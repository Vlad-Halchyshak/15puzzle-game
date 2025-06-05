import { checkAllElementsLocked } from "../helpers/checkAllElementsLocked";
import { createBoard } from "./board";
import { styleButton } from "../ui/styleButton";
import { levelMatrices } from "./levelMatrices";
import { SetupGameHandlersProps } from "../types";

export function setupGameHandlers({
  app,
  textures,
  buttonContainer,
  timerDisplay,
  gameAPI,
}: SetupGameHandlersProps) {
  const startLevel = (level: number) => {
    gameAPI.setCurrentLevel(level);
    app.stage.removeChildren();

    const matrix = structuredClone(levelMatrices[level]);
    const elements = createBoard(app, textures, matrix, () =>
      gameAPI.getIsBlocked()
    );
    gameAPI.setElements(elements);

    gameAPI.setIsBlocked(false);
    gameAPI.setTimeRemaining(40);
    updateTimerUI();

    const oldInterval = gameAPI.getIntervalId();
    const oldTimer = gameAPI.getTimerId();
    if (oldInterval) clearInterval(oldInterval);
    if (oldTimer) clearTimeout(oldTimer);

    const intervalId = setInterval(() => {
      const time = gameAPI.getTimeRemaining() - 1;
      gameAPI.setTimeRemaining(time);
      updateTimerUI();

      if (checkAllElementsLocked(gameAPI.getElements(), levelMatrices[level])) {
        clearInterval(intervalId);
        const timerId = gameAPI.getTimerId();
        if (timerId) clearTimeout(timerId);
        gameAPI.setIsBlocked(true);
        showWinMessage();
        showNextLevelButton(level);
      } else if (time <= 0) {
        clearInterval(intervalId);
        const timerId = gameAPI.getTimerId();
        if (timerId) clearTimeout(timerId);
        gameAPI.setIsBlocked(true);
        showLoseMessage();
        showTimeoutButtons(level);
      }
    }, 1000);
    gameAPI.setIntervalId(intervalId);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      gameAPI.setIsBlocked(true);
      showLoseMessage();
      showTimeoutButtons(level);
    }, gameAPI.getTimeRemaining() * 1000);
    gameAPI.setTimerId(timeoutId);
  };

  function updateTimerUI() {
    timerDisplay.textContent = `Level: ${
      gameAPI.getCurrentLevel() + 1
    } | Time left: ${gameAPI.getTimeRemaining()}`;
  }

  function showWinMessage() {
    timerDisplay.textContent = `Level: ${
      gameAPI.getCurrentLevel() + 1
    } | YOU WON`;
    timerDisplay.style.color = "#00ff99";
  }
  function showLoseMessage() {
    timerDisplay.textContent = `Level: ${
      gameAPI.getCurrentLevel() + 1
    } | YOU LOSE`;
    timerDisplay.style.color = "#ff6666";
  }

  function showTimeoutButtons(level: number) {
    buttonContainer.innerHTML = "";

    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Restart Level";
    styleButton(restartBtn);
    restartBtn.onclick = () => {
      buttonContainer.innerHTML = "";
      timerDisplay.style.color = "white";
      startLevel(level);
    };
    buttonContainer.appendChild(restartBtn);

    if (level > 0) {
      const backBtn = document.createElement("button");
      backBtn.textContent = "Previous Level";
      styleButton(backBtn);
      backBtn.onclick = () => {
        buttonContainer.innerHTML = "";
        timerDisplay.style.color = "white";
        startLevel(level - 1);
      };
      buttonContainer.appendChild(backBtn);
    }
  }

  function showNextLevelButton(level: number) {
    buttonContainer.innerHTML = "";

    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Restart Level";
    styleButton(restartBtn);
    restartBtn.onclick = () => {
      buttonContainer.innerHTML = "";
      timerDisplay.style.color = "white";
      startLevel(level);
    };
    buttonContainer.appendChild(restartBtn);

    if (level + 1 < levelMatrices.length) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next Level";
      styleButton(nextBtn);
      nextBtn.onclick = () => {
        buttonContainer.innerHTML = "";
        timerDisplay.style.color = "white";
        startLevel(level + 1);
      };
      buttonContainer.appendChild(nextBtn);
    }
  }

  const startButton = buttonContainer.querySelector("button");
  if (startButton) {
    startButton.addEventListener("click", () => {
      startButton.remove();
      startLevel(0);
    });
  }
}
