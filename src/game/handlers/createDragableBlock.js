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
    locked: false,
  };

  let isDragging = false;
  let direction = null;
  let lastPointer = { x: 0, y: 0 };

  const targetPos = {
    x: sprite.x,
    y: sprite.y,
  };

  sprite.on("pointerdown", (event) => {
    if (getIsInteractionBlocked()) return;
    if (entity.locked || isDragging) return;

    const pos = event.data.global;
    isDragging = true;
    direction = null;
    lastPointer = { x: pos.x, y: pos.y };

    app.stage.on("pointermove", onPointerMove);

    const handlePointerUp = () => {
      onPointerUp();
      window.removeEventListener("pointerup", handlePointerUp);
    };
    window.addEventListener("pointerup", handlePointerUp);

    app.ticker.add(onTick);
  });

  function onPointerMove(event) {
    if (!isDragging || entity.locked) return;

    const pos = event.data.global;
    const dx = pos.x - lastPointer.x;
    const dy = pos.y - lastPointer.y;

    if (!direction && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
      direction = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
    }

    const gridX = Math.round((sprite.x - offsetX) / cellSize);
    const gridY = Math.round((sprite.y - offsetY) / cellSize);
    const centerX = offsetX + gridX * cellSize;
    const centerY = offsetY + gridY * cellSize;

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

      onPointerMove(event);
      return;
    }
    if (direction === "horizontal") {
      const targetX = Math.floor((pos.x - offsetX) / cellSize);
      let finalX = gridX;
      const step = targetX > gridX ? 1 : -1;
      for (let x = gridX + step; x !== targetX + step; x += step) {
        if (!isAllowedCell(x, gridY, elements, fieldMatrix, entity)) break;
        finalX = x;
      }
      targetPos.x = offsetX + finalX * cellSize;
      targetPos.y = centerY;
      entity.x = finalX;
    } else if (direction === "vertical") {
      const targetY = Math.floor((pos.y - offsetY) / cellSize);
      let finalY = gridY;
      const step = targetY > gridY ? 1 : -1;
      for (let y = gridY + step; y !== targetY + step; y += step) {
        if (!isAllowedCell(gridX, y, elements, fieldMatrix, entity)) break;
        finalY = y;
      }
      targetPos.y = offsetY + finalY * cellSize;
      targetPos.x = centerX;
      entity.y = finalY;
    }

    lastPointer = { x: pos.x, y: pos.y };
  }

  function onTick() {
    const smoothFactor = 0.25;
    sprite.x = lerp(sprite.x, targetPos.x, smoothFactor);
    sprite.y = lerp(sprite.y, targetPos.y, smoothFactor);

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
