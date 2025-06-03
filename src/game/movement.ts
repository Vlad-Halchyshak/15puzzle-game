import { ElementEntity } from "./board";

export function moveElement(
  element: ElementEntity,
  dx: number,
  dy: number,
  matrix: number[][],
  offsetX: number,
  offsetY: number,
  cellSize: number
) {
  const newX = element.x + dx;
  const newY = element.y + dy;

  if (newY < 0 || newY >= matrix.length || newX < 0 || newX >= matrix[0].length)
    return;

  if (matrix[newY][newX] !== 1) return;

  element.x = newX;
  element.y = newY;
  element.sprite.x = offsetX + newX * cellSize;
  element.sprite.y = offsetY + newY * cellSize;
}

/* const fieldMatrix = [
  [0, 9, 0, 0, 0, 0, 0, 11, 0],
  [1, 1, 1, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 1, 1, 1],
  [0, 10, 0, 0, 0, 0, 0, 12, 0],
]; */
