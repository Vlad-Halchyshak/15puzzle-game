import { styleButton } from "./styleButton";

export function initUI() {
  const uiContainer = document.createElement("div");
  uiContainer.style.position = "absolute";
  uiContainer.style.top = "40px";
  uiContainer.style.left = "50%";
  uiContainer.style.transform = "translateX(-50%)";
  uiContainer.style.display = "flex";
  uiContainer.style.flexDirection = "column";
  uiContainer.style.alignItems = "center";
  uiContainer.style.gap = "16px";
  uiContainer.style.zIndex = "1000";
  document.body.appendChild(uiContainer);

  const timerDisplay = document.createElement("div");
  timerDisplay.style.fontSize = "32px";
  timerDisplay.style.color = "white";
  timerDisplay.style.minHeight = "40px";
  uiContainer.appendChild(timerDisplay);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.gap = "20px";
  uiContainer.appendChild(buttonContainer);

  const startButton = document.createElement("button");
  startButton.textContent = "Start Game";
  startButton.style.fontSize = "24px";
  styleButton(startButton);
  buttonContainer.appendChild(startButton);

  return {
    uiContainer,
    timerDisplay,
    buttonContainer,
    startButton,
  };
}
