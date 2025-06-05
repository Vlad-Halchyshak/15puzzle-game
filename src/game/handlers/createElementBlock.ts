import { Application, Sprite } from "pixi.js";
import { ElementEntity } from "../../types";
import { isAllowedCell, isValidPath } from "../../helpers/boardHelper";

export function createElementBlock(
  app: Application,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  x: number,
  y: number,
  elementSprite: Sprite,
  fieldMatrix: number[][],
  elements: ElementEntity[],
  getIsInteractionBlocked: () => boolean
): ElementEntity {
  elementSprite.width = elementSprite.height = cellSize;
  elementSprite.x = offsetX + x * cellSize;
  elementSprite.y = offsetY + y * cellSize;
  elementSprite.zIndex = 1;
  elementSprite.eventMode = "dynamic";
  elementSprite.cursor = "pointer";
  app.stage.addChild(elementSprite);

  const entity: ElementEntity = {
    sprite: elementSprite,
    x,
    y,
    type: fieldMatrix[y][x],
  };

  if (y !== 0 && y !== fieldMatrix.length - 1) {
    let dragging = false;
    let offset = { x: 0, y: 0 };
    let dragAxis: "x" | "y" | null = null;
    let dragStart = { x: 0, y: 0 };

    elementSprite.on("pointerdown", (e) => {
      if (getIsInteractionBlocked()) return;
      if (entity.locked) return;
      dragging = true;
      offset = {
        x: e.global.x - elementSprite.x,
        y: e.global.y - elementSprite.y,
      };
      dragAxis = null;
      dragStart = { x: e.global.x, y: e.global.y };
    });

    elementSprite.on("pointermove", (e) => {
      if (!dragging) return;

      if (!dragAxis) {
        const dx = e.global.x - dragStart.x;
        const dy = e.global.y - dragStart.y;
        const lockThreshold = 10;
        if (Math.abs(dx) > lockThreshold) dragAxis = "x";
        else if (Math.abs(dy) > lockThreshold) dragAxis = "y";
        else return;
      }

      const originalX = offsetX + entity.x * cellSize;
      const originalY = offsetY + entity.y * cellSize;

      const newPosX = e.global.x - offset.x;
      const newPosY = e.global.y - offset.y;

      const maxX = offsetX + (fieldMatrix[0].length - 1) * cellSize;
      const maxY = offsetY + (fieldMatrix.length - 1) * cellSize;

      if (dragAxis === "x") {
        const clampedX = Math.max(offsetX, Math.min(newPosX, maxX));
        const targetX = Math.round((clampedX - offsetX) / cellSize);
        const targetY = entity.y;

        const isInsideBounds = targetX >= 0 && targetX < fieldMatrix[0].length;
        const cellVal = isInsideBounds ? fieldMatrix[targetY][targetX] : 0;

        const isOccupied = elements.some(
          (e) => e !== entity && e.x === targetX && e.y === targetY
        );

        if (cellVal !== 0 && cellVal !== 2 && cellVal !== 3 && !isOccupied) {
          elementSprite.x = clampedX;
          elementSprite.y = originalY;
        }
      } else if (dragAxis === "y") {
        const clampedY = Math.max(offsetY, Math.min(newPosY, maxY));
        const targetX = entity.x;
        const targetY = Math.round((clampedY - offsetY) / cellSize);

        const isInsideBounds = targetY >= 0 && targetY < fieldMatrix.length;
        const cellVal = isInsideBounds ? fieldMatrix[targetY][targetX] : 0;

        const isOccupied = elements.some(
          (e) => e !== entity && e.x === targetX && e.y === targetY
        );

        if (cellVal !== 0 && cellVal !== 2 && cellVal !== 3 && !isOccupied) {
          elementSprite.y = clampedY;
          elementSprite.x = originalX;
        }
      }
    });

    elementSprite.on("pointerup", () => {
      dragging = false;
      if (entity.locked) return;
      if (!dragAxis) return snapBack();

      let newX = entity.x;
      let newY = entity.y;

      if (dragAxis === "x")
        newX = Math.round((elementSprite.x - offsetX) / cellSize);
      if (dragAxis === "y")
        newY = Math.round((elementSprite.y - offsetY) / cellSize);

      if (!isValidPath(entity, newX, newY, elements, fieldMatrix)) {
        return snapBack();
      }

      const targetCell = fieldMatrix[newY][newX];
      const isOwnSlot = targetCell === 100 + entity.type;

      if (isOwnSlot && !elements.some((e) => e.x === newX && e.y === newY)) {
        elementSprite.x = offsetX + newX * cellSize;
        elementSprite.y = offsetY + newY * cellSize;
        entity.x = newX;
        entity.y = newY;
        entity.locked = true;
        elementSprite.alpha = 0.95;
        dragAxis = null;
        return;
      }

      if (entity.type === 3) {
        if (targetCell >= 109 && targetCell <= 112) return snapBack();
        if (targetCell === 2 || targetCell === 0) return snapBack();
        const isOnTopOfElement = elements.some(
          (e) =>
            e !== entity &&
            e.x === newX &&
            e.y === newY &&
            e.type >= 9 &&
            e.type <= 12
        );
        if (isOnTopOfElement) return snapBack();
      }

      if (
        isAllowedCell(newX, newY, elements, fieldMatrix, entity) &&
        !elements.some((e) => e !== entity && e.x === newX && e.y === newY)
      ) {
        elementSprite.x = offsetX + newX * cellSize;
        elementSprite.y = offsetY + newY * cellSize;
        entity.x = newX;
        entity.y = newY;
      } else {
        snapBack();
      }

      dragAxis = null;

      function snapBack() {
        elementSprite.x = offsetX + entity.x * cellSize;
        elementSprite.y = offsetY + entity.y * cellSize;
      }
    });

    elementSprite.on("pointerupoutside", () => {
      dragging = false;
      dragAxis = null;
      elementSprite.x = offsetX + entity.x * cellSize;
      elementSprite.y = offsetY + entity.y * cellSize;
    });
  }

  return entity;
}
