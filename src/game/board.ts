import { Application, Container, Sprite, Texture } from "pixi.js";
import { ILoadedTextures } from "../core/loader";
import { createElementEntities } from "./elements";

export interface ElementEntity {
  sprite: Sprite;
  x: number;
  y: number;
  type: number;
  locked?: boolean;
}
/* function isAllowedCell(
  x: number,
  y: number,
  elements: any[],
  fieldMatrix: number[][]
) {
  if (fieldMatrix[y][x] === 1) return true;
  if ([9, 10, 11, 12].includes(fieldMatrix[y][x])) {
    return !elements.some((e) => e.x === x && e.y === y);
  }
  return false;
} */

function isAllowedCell(
  x: number,
  y: number,
  elements: ElementEntity[],
  fieldMatrix: number[][],
  entity: ElementEntity
) {
  const cellVal = fieldMatrix[y][x];

  // Можна ставати на звичайну клітинку
  if (cellVal === 1) return true;

  // Можна ставати на ЛЮБУ стартову точку (9–12), без перевірок
  if (cellVal >= 9 && cellVal <= 12) return true;

  // Можна ставати на свою фінішну точку
  if (cellVal === 100 + entity.type) {
    const isTopOrBottom = y === 0 || y === fieldMatrix.length - 1;
    if (isTopOrBottom) {
      return !elements.some((e) => e !== entity && e.x === x && e.y === y);
    }
    return true;
  }

  return false;
}
function isValidPath(
  entity: ElementEntity,
  newX: number,
  newY: number,
  elements: ElementEntity[],
  fieldMatrix: number[][]
) {
  const dx = newX - entity.x;
  const dy = newY - entity.y;

  if (dx !== 0 && dy !== 0) return false;

  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  let x = entity.x + stepX;
  let y = entity.y + stepY;

  while (x !== newX || y !== newY) {
    const val = fieldMatrix[y][x];
    const isWalkable =
      val === 1 ||
      val === entity.type || // стартова точка (типу 9–12)
      val === 100 + entity.type; // фінішна точка (типу 109–112)
    /* const isWalkable =
      val === 1 || val === entity.type || val === 100 + entity.type; */

    if (!isWalkable) return false;
    const isBlocking = fieldMatrix[y][x] < 9 || fieldMatrix[y][x] > 12; // дозволяємо ігнорувати 9-12
    if (isBlocking && elements.some((e) => e.x === x && e.y === y))
      return false;

    x += stepX;
    y += stepY;
  }

  return true;
}

export function createBoard(
  app: Application,
  textures: ILoadedTextures,
  fieldMatrix: number[][],
  onElementMove: (element: ElementEntity, newX: number, newY: number) => boolean
): ElementEntity[] {
  const { background, fire, water, earth, air, cell } = textures;

  const bg = new Sprite(background);
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChild(bg);

  const cellSize = 64;
  const offsetX = 600;
  const offsetY = 200;

  const elements: ElementEntity[] = [];
  app.stage.sortableChildren = true;

  for (let y = 0; y < fieldMatrix.length; y++) {
    for (let x = 0; x < fieldMatrix[y].length; x++) {
      const value = fieldMatrix[y][x];
      if (value === 0) continue;

      const cellSprite = new Sprite(cell);
      cellSprite.zIndex = 0;
      cellSprite.width = cellSprite.height = cellSize;
      cellSprite.x = offsetX + x * cellSize;
      cellSprite.y = offsetY + y * cellSize;

      app.stage.addChild(cellSprite);

      const textureMap: Record<number, Texture> = {
        9: fire,
        10: earth,
        11: water,
        12: air,
        109: fire,
        110: earth,
        111: water,
        112: air,
      };

      // 🔹 Фінішні місця (просто рендерим)
      if (value >= 109 && value <= 112) {
        const finishSprite = new Sprite(textureMap[value]);
        finishSprite.alpha = 0.3;
        finishSprite.width = finishSprite.height = cellSize;
        finishSprite.x = offsetX + x * cellSize;
        finishSprite.y = offsetY + y * cellSize;
        finishSprite.zIndex = 1;
        app.stage.addChild(finishSprite);
        continue;
      }

      // 🔹 Стартові фігури
      if (value >= 9 && value <= 12) {
        const elementSprite = new Sprite(textureMap[value]);
        elementSprite.zIndex = 1;
        elementSprite.width = elementSprite.height = cellSize;
        elementSprite.x = offsetX + x * cellSize;
        elementSprite.y = offsetY + y * cellSize;
        elementSprite.eventMode = "dynamic";
        elementSprite.cursor = "pointer";

        const entity: ElementEntity = {
          sprite: elementSprite,
          x,
          y,
          type: value,
        };
        app.stage.addChild(elementSprite);

        // only drag inside board (not top/bottom rows)
        if (y !== 0 && y !== fieldMatrix.length - 1) {
          let dragging = false;
          let offset = { x: 0, y: 0 };
          let dragAxis = null;
          let dragStart = { x: 0, y: 0 };

          elementSprite.on("pointerdown", (e) => {
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

            if (dragAxis === "x") {
              elementSprite.x = e.global.x - offset.x;
              elementSprite.y = originalY;
            } else if (dragAxis === "y") {
              elementSprite.y = e.global.y - offset.y;
              elementSprite.x = originalX;
            }
          });

          elementSprite.on("pointerup", () => {
            dragging = false;

            if (entity.locked) return;
            if (!dragAxis) {
              snapBack();
              return;
            }

            let newX = entity.x;
            let newY = entity.y;

            if (dragAxis === "x") {
              newX = Math.round((elementSprite.x - offsetX) / cellSize);
              newY = entity.y;
            } else if (dragAxis === "y") {
              newY = Math.round((elementSprite.y - offsetY) / cellSize);
              newX = entity.x;
            }

            if (
              (newX === entity.x && newY === entity.y) ||
              (newX !== entity.x && newY !== entity.y)
            ) {
              snapBack();
              return;
            }

            if (!isValidPath(entity, newX, newY, elements, fieldMatrix)) {
              snapBack();
              return;
            }

            const targetCell = fieldMatrix[newY][newX];
            const isTopOrBottom = newY === 0 || newY === fieldMatrix.length - 1;
            const isOwnSlot =
              [109, 110, 111, 112].includes(targetCell) &&
              targetCell === 100 + entity.type;

            if (
              isTopOrBottom &&
              isOwnSlot &&
              !elements.some((e) => e.x === newX && e.y === newY)
            ) {
              elementSprite.x = offsetX + newX * cellSize;
              elementSprite.y = offsetY + newY * cellSize;
              entity.x = newX;
              entity.y = newY;
              entity.locked = true;
              /*  elementSprite.tint = 0xffff66; */
              elementSprite.alpha = 0.95;
              dragAxis = null;
              return;
            }

            if (
              isAllowedCell(newX, newY, elements, fieldMatrix, entity) &&
              !elements.some(
                (e) => e !== entity && e.x === newX && e.y === newY
              )
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

        elements.push(entity);
      }
    }
  }

  return elements;
}
