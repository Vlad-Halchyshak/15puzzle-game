import { ElementEntity } from "../types";

export function isAllowedCell(
  x: number,
  y: number,
  elements: ElementEntity[],
  fieldMatrix: number[][],
  entity: ElementEntity
) {
  const val = fieldMatrix[y][x];

  if (entity.type === 3) {
    const isStartCell = x === entity.initialX && y === entity.initialY;
    return val === 1 || (val >= 9 && val <= 12) || isStartCell;
  }

  if (entity.type >= 9 && entity.type <= 12) {
    if (
      val === 1 ||
      (val >= 9 && val <= 12) ||
      val === 100 + entity.type ||
      val === 3
    ) {
      return !elements.some((e) => e !== entity && e.x === x && e.y === y);
    }
  }

  return false;
}

export function isValidPath(
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

  if (entity.type === 3) {
    while (x !== newX || y !== newY) {
      const val = fieldMatrix[y][x];
      const isOwnStart =
        x === entity.initialX && y === entity.initialY && val === 3;

      const isWalkable = val === 1 || (val >= 9 && val <= 12) || isOwnStart;

      const isBlocked = elements.some((e) => {
        const isOther = e !== entity && e.x === x && e.y === y;
        const isStihia = e.type >= 9 && e.type <= 12;
        return isOther && (isStihia || e.type === 3);
      });

      if (!isWalkable || isBlocked) return false;
      x += stepX;
      y += stepY;
    }

    const targetVal = fieldMatrix[newY][newX];
    const isTargetStart =
      newX === entity.initialX && newY === entity.initialY && targetVal === 3;

    const isTargetBlocked = elements.some((e) => {
      const isSamePos = e.x === newX && e.y === newY;
      const isStihia = e.type >= 9 && e.type <= 12;
      return isSamePos && (isStihia || e.type === 3);
    });

    return (
      (targetVal === 1 ||
        (targetVal >= 9 && targetVal <= 12) ||
        isTargetStart) &&
      !isTargetBlocked
    );
  }

  while (x !== newX || y !== newY) {
    const val = fieldMatrix[y][x];
    const isWalkable =
      val === 1 ||
      val === 3 ||
      val === entity.type ||
      val === 100 + entity.type ||
      (val >= 9 && val <= 12) ||
      (val >= 109 && val <= 112);

    if (!isWalkable) return false;

    const isBlocked = elements.some(
      (e) => e.x === x && e.y === y && e !== entity
    );
    if (isBlocked) return false;

    x += stepX;
    y += stepY;
  }

  return true;
}
