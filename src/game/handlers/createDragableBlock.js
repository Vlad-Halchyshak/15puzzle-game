import { isAllowedCell } from "../../helpers/boardHelper";

export function createDraggableBlock({
  app,
  sprite,
  x,
  y,
  cellSize,
  offsetX,
  offsetY,
  fieldMatrix,
  elements,
  getIsInteractionBlocked,
  type,
}) {
  sprite.width = sprite.height = cellSize;
  sprite.x = offsetX + x * cellSize;
  sprite.y = offsetY + y * cellSize;
  sprite.zIndex = 2;
  sprite.eventMode = "dynamic";
  sprite.interactive = true;
  sprite.cursor = "pointer";

  const entity = {
    sprite,
    x,
    y,
    type,
    initialX: x,
    initialY: y,
  };

  let isDragging = false;
  let direction = null;
  let dragOrigin = { x: 0, y: 0 };
  let lastPointer = { x: 0, y: 0 };
  let isSnapping = false;
  let pendingDirection = null;
  let justSnapped = false;

  sprite.on("pointerdown", (event) => {
    if (getIsInteractionBlocked()) return;
    if (entity.locked) return;
    if (isDragging) return;

    const pos = event.data.global;
    isDragging = true;
    direction = null;
    dragOrigin = { x: sprite.x, y: sprite.y };
    lastPointer = { x: pos.x, y: pos.y };
    isSnapping = false;

    pendingDirection = null;

    app.stage.on("pointermove", onPointerMove);

    const handlePointerUp = () => {
      onPointerUp();
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointerup", handlePointerUp);

    app.ticker.add(onTick);
  });

  function onPointerMove(event) {
    if (!isDragging || isSnapping) return;

    if (justSnapped) {
      justSnapped = false;
      return;
    }

    const pos = event.data.global;
    const dx = pos.x - lastPointer.x;
    const dy = pos.y - lastPointer.y;

    if (!direction && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
      direction = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }

    const centerX =
      offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
    const centerY =
      offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;
    const offsetFromCenterX = Math.abs(sprite.x - centerX);
    const offsetFromCenterY = Math.abs(sprite.y - centerY);

    const relaxedOffset = cellSize * 0.2;

    const allowAxisSwitch =
      direction &&
      ((direction === "horizontal" &&
        Math.abs(dy) > Math.abs(dx) * 1.1 &&
        offsetFromCenterX < relaxedOffset) ||
        (direction === "vertical" &&
          Math.abs(dx) > Math.abs(dy) * 1.1 &&
          offsetFromCenterY < relaxedOffset));

    if (allowAxisSwitch) {
      sprite.x = centerX;
      sprite.y = centerY;

      direction = direction === "horizontal" ? "vertical" : "horizontal";
      dragOrigin = { x: sprite.x, y: sprite.y };
      lastPointer = { x: pos.x, y: pos.y };
      return;
    }

    const gridX = Math.round((dragOrigin.x - offsetX) / cellSize);
    const gridY = Math.round((dragOrigin.y - offsetY) / cellSize);

    if (direction === "horizontal") {
      const pixelOffset = pos.x - lastPointer.x;
      const rawX = dragOrigin.x + pixelOffset;

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
      const minX = offsetX + minCellX * cellSize;
      const maxX = offsetX + maxCellX * cellSize;

      sprite.x = Math.max(minX, Math.min(maxX, rawX));
      sprite.y = dragOrigin.y;
      entity.x = Math.round((sprite.x - offsetX) / cellSize);
    } else if (direction === "vertical") {
      const pixelOffset = pos.y - lastPointer.y;
      const rawY = dragOrigin.y + pixelOffset;

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
      const minY = offsetY + minCellY * cellSize;
      const maxY = offsetY + maxCellY * cellSize;

      sprite.y = Math.max(minY, Math.min(maxY, rawY));
      sprite.x = dragOrigin.x;
      entity.y = Math.round((sprite.y - offsetY) / cellSize);
    }

    if (
      Math.abs(sprite.x - centerX) < cellSize * 0.1 &&
      Math.abs(sprite.y - centerY) < cellSize * 0.1
    ) {
      dragOrigin = { x: sprite.x, y: sprite.y };
      lastPointer = { x: pos.x, y: pos.y };
    }
  }

  function onTick() {
    const centerX =
      offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
    const centerY =
      offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;

    const distX = Math.abs(sprite.x - centerX);
    const distY = Math.abs(sprite.y - centerY);

    const snapThreshold = cellSize * 0.1;
    const snapSpeedFactor = 0.8;

    if (distX < snapThreshold && distY < snapThreshold) {
      sprite.x = lerp(sprite.x, centerX, snapSpeedFactor);
      sprite.y = lerp(sprite.y, centerY, snapSpeedFactor);
    }
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

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  app.stage.addChild(sprite);
  return entity;
}
