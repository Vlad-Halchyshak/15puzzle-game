import { Application, Sprite } from "pixi.js";
import { ElementEntity } from "../../types";
import { isValidPath } from "../../helpers/boardHelper";

export function createMainMovingBlock(
  app: Application,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  x: number,
  y: number,
  mainSprite: Sprite,
  fieldMatrix: number[][],
  elements: ElementEntity[],
  getIsInteractionBlocked: () => boolean
): ElementEntity {
  mainSprite.alpha = 1;
  mainSprite.width = mainSprite.height = cellSize;
  mainSprite.x = offsetX + x * cellSize;
  mainSprite.y = offsetY + y * cellSize;
  mainSprite.zIndex = 1;
  mainSprite.eventMode = "dynamic";
  mainSprite.cursor = "pointer";
  app.stage.addChild(mainSprite);

  const entity: ElementEntity = {
    sprite: mainSprite,
    x,
    y,
    type: 3,
    initialX: x,
    initialY: y,
  };

  let dragging = false;
  let offset = { x: 0, y: 0 };
  let dragAxis: "x" | "y" | null = null;
  let dragStart = { x: 0, y: 0 };

  mainSprite.on("pointerdown", (e) => {
    if (getIsInteractionBlocked()) return;
    dragging = true;
    offset = {
      x: e.global.x - mainSprite.x,
      y: e.global.y - mainSprite.y,
    };
    dragStart = { x: e.global.x, y: e.global.y };
    dragAxis = null;
  });

  mainSprite.on("pointermove", (e) => {
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
      if (!isInsideBounds) return;

      const step = targetX > entity.x ? 1 : -1;
      for (let x = entity.x + step; x !== targetX + step; x += step) {
        const val = fieldMatrix[targetY][x];
        const isBlockedType =
          val === 0 || val === 2 || (val >= 109 && val <= 112);
        const isAnyStihia = elements.some(
          (e) => e.x === x && e.y === targetY && e.type >= 9 && e.type <= 12
        );
        const isOtherBlock3 = elements.some(
          (e) => e !== entity && e.x === x && e.y === targetY && e.type === 3
        );
        if (isBlockedType || isAnyStihia || isOtherBlock3) return;
      }

      mainSprite.x = clampedX;
      mainSprite.y = originalY;
    } else if (dragAxis === "y") {
      const clampedY = Math.max(offsetY, Math.min(newPosY, maxY));
      const targetX = entity.x;
      const targetY = Math.round((clampedY - offsetY) / cellSize);

      const isInsideBounds = targetY >= 0 && targetY < fieldMatrix.length;
      if (!isInsideBounds) return;

      const step = targetY > entity.y ? 1 : -1;
      for (let y = entity.y + step; y !== targetY + step; y += step) {
        const val = fieldMatrix[y][targetX];
        const isBlockedType =
          val === 0 || val === 2 || (val >= 109 && val <= 112);
        const isAnyStihia = elements.some(
          (e) => e.x === targetX && e.y === y && e.type >= 9 && e.type <= 12
        );
        const isOtherBlock3 = elements.some(
          (e) => e !== entity && e.x === targetX && e.y === y && e.type === 3
        );
        if (isBlockedType || isAnyStihia || isOtherBlock3) return;
      }

      mainSprite.y = clampedY;
      mainSprite.x = originalX;
    }
  });

  mainSprite.on("pointerup", () => {
    dragging = false;
    const newX = Math.round((mainSprite.x - offsetX) / cellSize);
    const newY = Math.round((mainSprite.y - offsetY) / cellSize);
    const rows = fieldMatrix.length;
    const cols = fieldMatrix[0].length;
    const isOutOfBounds = newX < 0 || newY < 0 || newX >= cols || newY >= rows;

    if (
      isOutOfBounds ||
      !isValidPath(entity, newX, newY, elements, fieldMatrix)
    ) {
      mainSprite.x = offsetX + entity.x * cellSize;
      mainSprite.y = offsetY + entity.y * cellSize;
      return;
    }

    fieldMatrix[entity.y][entity.x] = 1;
    fieldMatrix[newY][newX] = 3;

    const isSameTypeOverlap = elements.some((e) => {
      return (
        e !== entity &&
        e.x === newX &&
        e.y === newY &&
        entity.type >= 9 &&
        entity.type <= 12 &&
        e.type >= 9 &&
        e.type <= 12
      );
    });

    if (isSameTypeOverlap) {
      mainSprite.x = offsetX + entity.x * cellSize;
      mainSprite.y = offsetY + entity.y * cellSize;
      return;
    }

    mainSprite.x = offsetX + newX * cellSize;
    mainSprite.y = offsetY + newY * cellSize;
    entity.x = newX;
    entity.y = newY;
  });

  mainSprite.on("pointerupoutside", () => {
    dragging = false;
    mainSprite.x = offsetX + entity.x * cellSize;
    mainSprite.y = offsetY + entity.y * cellSize;
  });

  return entity;
}
