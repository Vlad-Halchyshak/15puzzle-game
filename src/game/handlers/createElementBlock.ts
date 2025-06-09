import { Application, Sprite } from "pixi.js";
import { ElementEntity } from "../../types";
import { isAllowedCell } from "../../helpers/boardHelper";

export function createElementBlock(
  app: Application,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  x: number,
  y: number,
  sprite: Sprite,
  fieldMatrix: number[][],
  elements: ElementEntity[],
  getIsInteractionBlocked: () => boolean
): ElementEntity {
  sprite.width = sprite.height = cellSize;
  sprite.x = offsetX + x * cellSize;
  sprite.y = offsetY + y * cellSize;
  sprite.zIndex = 2;
  sprite.eventMode = "static";
  sprite.interactive = true;
  sprite.cursor = "pointer";

  const entity: ElementEntity = {
    sprite,
    x,
    y,
    type: fieldMatrix[y][x],
    initialX: x,
    initialY: y,
  };

  let isDragging = false;
  let direction: "horizontal" | "vertical" | null = null;
  let dragOrigin = { x: 0, y: 0 };
  let lastPointer = { x: 0, y: 0 };
  let isSnapping = false;
  let snapTarget = { x: 0, y: 0 };
  let pendingDirection: "horizontal" | "vertical" | null = null;
  let pendingPointer = { x: 0, y: 0 };
  const snapSpeed = 8;

  sprite.on("pointerdown", (event) => {
    if (getIsInteractionBlocked()) return;
    if (entity.locked) return;

    const pos = event.data.global;
    isDragging = true;
    direction = null;
    dragOrigin = { x: sprite.x, y: sprite.y };
    lastPointer = { x: pos.x, y: pos.y };
    isSnapping = false;
    pendingDirection = null;

    app.stage.on("pointermove", onPointerMove);
    app.stage.once("pointerup", onPointerUp);
    app.ticker.add(onTick);
  });
  function onPointerMove(event: any) {
    if (!isDragging) return;
    if (isSnapping) return;

    const pos = event.data.global;
    let dx = pos.x - lastPointer.x;
    let dy = pos.y - lastPointer.y;

    if (!direction && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
      direction = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }

    if (
      direction &&
      ((direction === "horizontal" &&
        Math.abs(dy) > Math.abs(dx) &&
        Math.abs(dy) > 2) ||
        (direction === "vertical" &&
          Math.abs(dx) > Math.abs(dy) &&
          Math.abs(dx) > 2))
    ) {
      pendingDirection = direction === "horizontal" ? "vertical" : "horizontal";
      pendingPointer = { x: pos.x, y: pos.y };

      const centerX =
        offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
      const centerY =
        offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;
      snapTarget = { x: centerX, y: centerY };
      isSnapping = true;
      return;
    }

    const gridX = Math.round((dragOrigin.x - offsetX) / cellSize);
    const gridY = Math.round((dragOrigin.y - offsetY) / cellSize);

    if (direction === "horizontal") {
      let pixelOffset = pos.x - lastPointer.x;
      let rawX = dragOrigin.x + pixelOffset;

      let minCellX = gridX;
      let maxCellX = gridX;
      for (let tx = gridX - 1; tx >= 0; tx--) {
        if (!isAllowedCell(tx, gridY, elements, fieldMatrix, entity)) break;
        minCellX = tx;
      }
      for (let tx = gridX + 1; tx < fieldMatrix[0].length; tx++) {
        if (!isAllowedCell(tx, gridY, elements, fieldMatrix, entity)) break;
        maxCellX = tx;
      }
      let minX = offsetX + minCellX * cellSize;
      let maxX = offsetX + maxCellX * cellSize;

      let nextX = Math.max(minX, Math.min(maxX, rawX));
      sprite.x = nextX;
      sprite.y = dragOrigin.y;
      entity.x = Math.round((sprite.x - offsetX) / cellSize);
    } else if (direction === "vertical") {
      let pixelOffset = pos.y - lastPointer.y;
      let rawY = dragOrigin.y + pixelOffset;

      let minCellY = gridY;
      let maxCellY = gridY;
      for (let ty = gridY - 1; ty >= 0; ty--) {
        if (!isAllowedCell(gridX, ty, elements, fieldMatrix, entity)) break;
        minCellY = ty;
      }
      for (let ty = gridY + 1; ty < fieldMatrix.length; ty++) {
        if (!isAllowedCell(gridX, ty, elements, fieldMatrix, entity)) break;
        maxCellY = ty;
      }
      let minY = offsetY + minCellY * cellSize;
      let maxY = offsetY + maxCellY * cellSize;

      let nextY = Math.max(minY, Math.min(maxY, rawY));
      sprite.y = nextY;
      sprite.x = dragOrigin.x;
      entity.y = Math.round((sprite.y - offsetY) / cellSize);
    }

    const centerX =
      offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
    const centerY =
      offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;
    if (
      Math.abs(sprite.x - centerX) < cellSize * 0.1 &&
      Math.abs(sprite.y - centerY) < cellSize * 0.1
    ) {
      dragOrigin = { x: sprite.x, y: sprite.y };
      lastPointer = { x: pos.x, y: pos.y };
    }
  }

  function onTick() {
    if (!isSnapping) return;

    sprite.x = snapTarget.x;
    sprite.y = snapTarget.y;

    isSnapping = false;
    direction = pendingDirection;
    dragOrigin = { x: sprite.x, y: sprite.y };
    lastPointer = { x: pendingPointer.x, y: pendingPointer.y };
  }

  function onPointerUp() {
    isDragging = false;
    app.stage.off("pointermove", onPointerMove);
    app.ticker.remove(onTick);

    entity.x = Math.round((sprite.x - offsetX) / cellSize);
    entity.y = Math.round((sprite.y - offsetY) / cellSize);
    sprite.x = offsetX + entity.x * cellSize;
    sprite.y = offsetY + entity.y * cellSize;

    const valAfterDrop = fieldMatrix?.[entity.y]?.[entity.x];
    if (entity.type >= 9 && entity.type <= 12) {
      if (valAfterDrop === 100 + entity.type) {
        entity.locked = true;
      }
    }
  }
  app.stage.addChild(sprite);
  return entity;
}
