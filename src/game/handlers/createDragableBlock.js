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
  let targetX = sprite.x;
  let targetY = sprite.y;
  let dragOffset = { x: 0, y: 0 };

  sprite.on("pointerdown", (event) => {
    if (getIsInteractionBlocked()) return;
    if (entity.locked) return;
    if (isDragging) return;

    const pos = event.data.global;

    isDragging = false;
    direction = null;
    isSnapping = false;
    justSnapped = false;
    pendingDirection = null;

    const snappedX =
      offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
    const snappedY =
      offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;

    sprite.x = snappedX;
    sprite.y = snappedY;

    dragOffset = { x: pos.x - sprite.x, y: pos.y - sprite.y };

    lastPointer = { x: pos.x, y: pos.y };
    dragOrigin = { x: snappedX, y: snappedY };
    targetX = snappedX;
    targetY = snappedY;

    app.stage.on("pointermove", onPointerMove);

    const handlePointerUp = () => {
      onPointerUp();
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointerup", handlePointerUp);

    app.ticker.add(onTick);
  });

  function onPointerMove(event) {
    if (getIsInteractionBlocked()) return;
    const pos = event.data.global;
    const dx = pos.x - lastPointer.x;
    const dy = pos.y - lastPointer.y;

    const movementThreshold = 0.5;

    if (!isDragging) {
      const startDrag =
        Math.abs(pos.x - lastPointer.x) > movementThreshold ||
        Math.abs(pos.y - lastPointer.y) > movementThreshold;

      if (startDrag) {
        isDragging = true;

        const snappedX =
          offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
        const snappedY =
          offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;
        dragOrigin = { x: snappedX, y: snappedY };
        lastPointer = { x: pos.x, y: pos.y };

        targetX = pos.x - dragOffset.x;
        targetY = pos.y - dragOffset.y;

        sprite.x = targetX;
        sprite.y = targetY;
      }
    }
    if (!isDragging || isSnapping) return;
    if (justSnapped) {
      justSnapped = false;
      return;
    }

    if (!direction && (Math.abs(dx) > 0 || Math.abs(dy) > 0)) {
      direction = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }

    const cursorPosX = pos.x - dragOffset.x;
    const cursorPosY = pos.y - dragOffset.y;

    const centerX =
      offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
    const centerY =
      offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;
    const offsetFromCenterX = Math.abs(sprite.x - centerX);
    const offsetFromCenterY = Math.abs(sprite.y - centerY);
    const relaxedOffset = cellSize * 0.25;

    const allowAxisSwitch =
      direction &&
      ((direction === "horizontal" &&
        Math.abs(dy) > Math.abs(dx) * 1.1 &&
        offsetFromCenterX < relaxedOffset) ||
        (direction === "vertical" &&
          Math.abs(dx) > Math.abs(dy) * 1.1 &&
          offsetFromCenterY < relaxedOffset));

    if (allowAxisSwitch) {
      targetX = centerX;
      targetY = centerY;
      direction = direction === "horizontal" ? "vertical" : "horizontal";
      dragOrigin = { x: centerX, y: centerY };
      lastPointer = { x: pos.x, y: pos.y };

      onPointerMove(event);
      return;
    }

    const gridX = Math.round((dragOrigin.x - offsetX) / cellSize);
    const gridY = Math.round((dragOrigin.y - offsetY) / cellSize);

    if (direction === "horizontal") {
      const cursorDelta = cursorPosX - dragOrigin.x;

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
      const rawX = dragOrigin.x + cursorDelta;

      targetX = Math.max(minX, Math.min(maxX, rawX));
      targetY = dragOrigin.y;
      entity.x = Math.round((targetX - offsetX) / cellSize);
    } else if (direction === "vertical") {
      const cursorDelta = cursorPosY - dragOrigin.y;

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
      const rawY = dragOrigin.y + cursorDelta;

      targetY = Math.max(minY, Math.min(maxY, rawY));
      targetX = dragOrigin.x;
      entity.y = Math.round((targetY - offsetY) / cellSize);
    }

    if (
      direction &&
      Math.abs(targetX - centerX) < cellSize * 0.2 &&
      Math.abs(targetY - centerY) < cellSize * 0.2
    ) {
      dragOrigin = { x: centerX, y: centerY };
      lastPointer = { x: pos.x, y: pos.y };
    }
  }
  function onTick() {
    if (getIsInteractionBlocked()) {
      const snappedX =
        offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
      const snappedY =
        offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;

      sprite.x = snappedX;
      sprite.y = snappedY;

      targetX = snappedX;
      targetY = snappedY;

      entity.x = Math.round((sprite.x - offsetX) / cellSize);
      entity.y = Math.round((sprite.y - offsetY) / cellSize);

      app.ticker.remove(onTick);
      app.stage.off("pointermove", onPointerMove);
      return;
    }
    if (!direction) return;
    const lerpFactor = 0.29;
    sprite.x = lerp(sprite.x, targetX, lerpFactor);
    sprite.y = lerp(sprite.y, targetY, lerpFactor);
    const centerReached =
      Math.abs(sprite.x - targetX) < 0.5 && Math.abs(sprite.y - targetY) < 0.5;

    if (centerReached && !isDragging) {
      sprite.x = targetX;
      sprite.y = targetY;
    }
    const centerX =
      offsetX + Math.round((sprite.x - offsetX) / cellSize) * cellSize;
    const centerY =
      offsetY + Math.round((sprite.y - offsetY) / cellSize) * cellSize;

    const gridX = Math.round((dragOrigin.x - offsetX) / cellSize);
    const gridY = Math.round((dragOrigin.y - offsetY) / cellSize);

    const cursorGlobal = app.renderer.events.pointer.global;
    const cursorX = cursorGlobal.x - dragOffset.x;
    const cursorY = cursorGlobal.y - dragOffset.y;

    const distanceFromX = Math.abs(cursorX - sprite.x);
    const distanceFromY = Math.abs(cursorY - sprite.y);

    const offsetFromCenterX = Math.abs(sprite.x - centerX);
    const offsetFromCenterY = Math.abs(sprite.y - centerY);
    const relaxedOffset = cellSize * 0.25;

    const canSwitchToHorizontal =
      direction === "vertical" &&
      Math.abs(targetY - sprite.y) < 0.5 &&
      distanceFromX > cellSize &&
      offsetFromCenterY < relaxedOffset;

    const canSwitchToVertical =
      direction === "horizontal" &&
      Math.abs(targetX - sprite.x) < 0.5 &&
      distanceFromY > cellSize &&
      offsetFromCenterX < relaxedOffset;

    if (canSwitchToHorizontal) {
      direction = "horizontal";
      dragOrigin = { x: centerX, y: centerY };
    }

    if (canSwitchToVertical) {
      direction = "vertical";
      dragOrigin = { x: centerX, y: centerY };
    }
    if (direction === "horizontal") {
      const cursorX = app.renderer.events.pointer.global.x - dragOffset.x;
      const cursorDelta = cursorX - dragOrigin.x;

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
      const rawX = dragOrigin.x + cursorDelta;

      targetX = Math.max(minX, Math.min(maxX, rawX));
      targetY = dragOrigin.y;
      entity.x = Math.round((targetX - offsetX) / cellSize);
    }

    if (direction === "vertical") {
      const cursorY = app.renderer.events.pointer.global.y - dragOffset.y;
      const cursorDelta = cursorY - dragOrigin.y;

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
      const rawY = dragOrigin.y + cursorDelta;

      targetY = Math.max(minY, Math.min(maxY, rawY));
      targetX = dragOrigin.x;
      entity.y = Math.round((targetY - offsetY) / cellSize);
    }

    if (isDragging && !entity.locked && entity.type >= 9 && entity.type <= 12) {
      const spriteCenterX = sprite.x + cellSize / 2;
      const spriteCenterY = sprite.y + cellSize / 2;
      const cellX = Math.floor((spriteCenterX - offsetX) / cellSize);
      const cellY = Math.floor((spriteCenterY - offsetY) / cellSize);
      const expectedSlot = 100 + entity.type;

      if (fieldMatrix?.[cellY]?.[cellX] === expectedSlot) {
        const cellCenterX = offsetX + cellX * cellSize + cellSize / 2;
        const cellCenterY = offsetY + cellY * cellSize + cellSize / 2;

        const inCenter =
          Math.abs(spriteCenterX - cellCenterX) < cellSize / 2 &&
          Math.abs(spriteCenterY - cellCenterY) < cellSize / 2;

        if (inCenter) {
          sprite.x = offsetX + cellX * cellSize;
          sprite.y = offsetY + cellY * cellSize;

          entity.x = cellX;
          entity.y = cellY;
          entity.locked = true;
          isDragging = false;

          app.stage.off("pointermove", onPointerMove);
          app.ticker.remove(onTick);
          sprite.eventMode = "none";
          sprite.cursor = "default";
        }
      }
    }
  }
  function onPointerUp() {
    if (getIsInteractionBlocked()) return;
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
