import { ElementEntity } from "../types";

export function isAllowedCell(
  x: number,
  y: number,
  elements: ElementEntity[],
  fieldMatrix: number[][],
  entity: ElementEntity
): boolean {
  const val = fieldMatrix?.[y]?.[x];
  if (val == null) return false;

  const currentPosMap = new Map<string, ElementEntity>();
  for (const e of elements) {
    if (e !== entity) {
      currentPosMap.set(`${e.x},${e.y}`, e);
    }
  }

  const key = `${x},${y}`;
  const occupiedEntity = currentPosMap.get(key);
  const isOccupied = !!occupiedEntity;

  // For block 3
  if (entity.type === 3) {
    const isStartCell = x === entity.initialX && y === entity.initialY;

    const isFreedCellOf912 =
      val >= 9 && val <= 12 && (!occupiedEntity || occupiedEntity.type !== val);

    const isFreedOther3 =
      val === 3 && (!occupiedEntity || occupiedEntity.type !== 3);

    return (
      (val === 1 || isStartCell || isFreedCellOf912 || isFreedOther3) &&
      !isOccupied
    );
  }
  //For block 9, 10, 11, 12

  if (entity.type >= 9 && entity.type <= 12) {
    const isOwnSocket = val === 100 + entity.type;
    const isEmpty = val === 1;
    const isBlock3 = val === 3;
    const isOwnInitialCell = x === entity.initialX && y === entity.initialY;

    const isFreedAnother912 =
      val >= 9 &&
      val <= 12 &&
      (val !== entity.type || isOwnInitialCell) &&
      (!occupiedEntity || occupiedEntity.type !== val);

    return (
      (isEmpty ||
        isOwnSocket ||
        isBlock3 ||
        isFreedAnother912 ||
        isOwnInitialCell) &&
      !isOccupied
    );
  }

  return false;
}

/* export function isValidPath(
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

    const allowed =
      val === 1 || val === 100 + entity.type || val === entity.type;

    const blocked = elements.some(
      (e) => e !== entity && e.x === x && e.y === y
    );

    if (!allowed || blocked) return false;

    x += stepX;
    y += stepY;
  }

  const finalVal = fieldMatrix[newY][newX];
  const finalAllowed =
    finalVal === 1 ||
    finalVal === 100 + entity.type ||
    finalVal === entity.type;

  const finalBlocked = elements.some(
    (e) => e !== entity && e.x === newX && e.y === newY
  );

  return finalAllowed && !finalBlocked;
}
 */
