import { createApp } from "./core/app";
import { loadTextures } from "./core/loader";
import { createBoard } from "./game/board";
import { ElementEntity } from "./game/elements";
import { moveElement } from "./game/movement";

async function main() {
  const app = await createApp();
  const textures = await loadTextures();
  /* 
  const fieldMatrix = [
    [0, 9, 0, 0, 0, 0, 0, 11, 0],
    [1, 1, 1, 0, 0, 0, 1, 1, 1],
    [1, 9, 1, 1, 0, 1, 1, 11, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 10, 1, 1, 0, 1, 1, 12, 1],
    [1, 1, 1, 0, 0, 0, 1, 1, 1],
    [0, 10, 0, 0, 0, 0, 0, 12, 0],
  ]; */
  const fieldMatrix = [
    [0, 109, 0, 0, 0, 0, 0, 111, 0],
    [1, 1, 1, 0, 0, 0, 1, 1, 1],
    [1, 9, 1, 1, 0, 1, 1, 11, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 10, 1, 1, 0, 1, 1, 12, 1],
    [1, 1, 1, 0, 0, 0, 1, 1, 1],
    [0, 110, 0, 0, 0, 0, 0, 112, 0],
  ];
  let elements = []; // Оголошуємо пустий масив

  const onElementMove = (entity, newX, newY) => {
    // Bounds check
    if (
      newX < 0 ||
      newX >= fieldMatrix[0].length ||
      newY < 0 ||
      newY >= fieldMatrix.length
    )
      return false;

    if (fieldMatrix[newY][newX] !== 1) return false;

    for (const other of elements) {
      if (other !== entity && other.x === newX && other.y === newY) {
        return false;
      }
    }

    return true;
  };

  elements = createBoard(app, textures, fieldMatrix, onElementMove);
}

main();
