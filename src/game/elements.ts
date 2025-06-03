import { Application, Sprite } from "pixi.js";
import { ILoadedTextures } from "../core/loader";

export interface ElementEntity {
  sprite: Sprite;
  x: number;
  y: number;
  type: number;
}

export function createElementEntities(
  app: Application,
  matrix: number[][],
  textures: ILoadedTextures,
  cellSize: number,
  offsetX: number,
  offsetY: number
): ElementEntity[] {
  const elements: ElementEntity[] = [];

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const value = matrix[y][x];
      if (value === 0) continue;

      const cell = new Sprite(textures.cell);
      cell.width = cell.height = cellSize;
      cell.x = offsetX + x * cellSize;
      cell.y = offsetY + y * cellSize;
      app.stage.addChild(cell);

      if (value >= 9) {
        const textureMap: Record<number, any> = {
          9: textures.fire,
          10: textures.earth,
          11: textures.water,
          12: textures.air,
        };
        const element = new Sprite(textureMap[value]);
        element.width = element.height = cellSize;
        element.x = offsetX + x * cellSize;
        element.y = offsetY + y * cellSize;
        app.stage.addChild(element);

        elements.push({ sprite: element, x, y, type: value });
      }
    }
  }

  return elements;
}
