import { Assets, Texture } from "pixi.js";

export interface ILoadedTextures {
  background: Texture;
  main: Texture;
  fire: Texture;
  water: Texture;
  earth: Texture;
  air: Texture;
  cell: Texture;
  block: Texture;
}

export async function loadTextures(): Promise<ILoadedTextures> {
  Assets.addBundle("main", {
    background: "/assets/woodbackground.jpeg",
    main: "/assets/main.png",
    fire: "/assets/cell1.png",
    water: "/assets/cell2.png",
    earth: "/assets/cell3.png",
    air: "/assets/cell4.png",
    cell: "/assets/cell.png",
    block: "/assets/block.png",
  });

  const bundle = await Assets.loadBundle("main");
  return bundle as ILoadedTextures;
}
