export function isAllowedCell(x, y, elements, fieldMatrix, entity) {
  const val = fieldMatrix?.[y]?.[x];
  if (val == null) return false;

  const currentPosMap = new Map();
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
  //For blocks 9, 10, 11, 12

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
