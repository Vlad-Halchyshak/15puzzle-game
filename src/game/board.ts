import { Application, Sprite, Texture } from "pixi.js";
import { ElementEntity, LoadedTextures } from "../types";
import { createMainMovingBlock } from "./handlers/createMainMovingBlock";
import { createElementBlock } from "./handlers/createElementBlock";

export function createBoard(
  app: Application,
  textures: LoadedTextures,
  fieldMatrix: number[][],
  getIsInteractionBlocked: () => boolean
): ElementEntity[] {
  const { background, fire, water, earth, air, cell, block, main } = textures;

  const bg = new Sprite(background);
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChild(bg);

  const cellSize = 64;
  const offsetX = 600;
  const offsetY = 200;

  const elements: ElementEntity[] = [];
  app.stage.sortableChildren = true;

  for (let y = 0; y < fieldMatrix.length; y++) {
    for (let x = 0; x < fieldMatrix[y].length; x++) {
      const value = fieldMatrix[y][x];
      if (value === 0) continue;

      const cellSprite = new Sprite(cell);
      cellSprite.zIndex = 0;
      cellSprite.width = cellSprite.height = cellSize;
      cellSprite.x = offsetX + x * cellSize;
      cellSprite.y = offsetY + y * cellSize;

      app.stage.addChild(cellSprite);

      const textureMap: Record<number, Sprite> = {
        3: new Sprite(main),
        2: new Sprite(block),
        9: new Sprite(fire),
        10: new Sprite(earth),
        11: new Sprite(water),
        12: new Sprite(air),
        109: new Sprite(fire),
        110: new Sprite(earth),
        111: new Sprite(water),
        112: new Sprite(air),
      };

      if (value >= 109 && value <= 112) {
        const finishSprite = new Sprite(textureMap[value]);
        finishSprite.alpha = 0.3;
        finishSprite.width = finishSprite.height = cellSize;
        finishSprite.x = offsetX + x * cellSize;
        finishSprite.y = offsetY + y * cellSize;
        finishSprite.zIndex = 1;
        app.stage.addChild(finishSprite);
        continue;
      }

      if (value === 2) {
        const blockSprite = new Sprite(textureMap[2]);
        blockSprite.alpha = 1;
        blockSprite.width = blockSprite.height = cellSize;
        blockSprite.x = offsetX + x * cellSize;
        blockSprite.y = offsetY + y * cellSize;
        blockSprite.zIndex = 1;
        app.stage.addChild(blockSprite);
        continue;
      }
      if (value === 3) {
        const entity = createMainMovingBlock(
          app,
          cellSize,
          offsetX,
          offsetY,
          x,
          y,
          textureMap[3],
          fieldMatrix,
          elements,
          getIsInteractionBlocked
        );

        elements.push(entity);
        continue;
      }

      if (value >= 9 && value <= 12) {
        const entity = createElementBlock(
          app,
          cellSize,
          offsetX,
          offsetY,
          x,
          y,
          textureMap[value],
          fieldMatrix,
          elements,
          getIsInteractionBlocked
        );
        elements.push(entity);
        continue;
      }
    }
  }
  return elements;
}
