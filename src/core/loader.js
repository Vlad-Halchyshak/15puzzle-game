import { Assets } from "pixi.js";

export async function loadTextures() {
  Assets.addBundle("main", {
    background: "/assets/soloLeveling.jpeg",
    main: "/assets/main.png",
    fire: "/assets/cell1.png",
    water: "/assets/cell2.png",
    earth: "/assets/cell3.png",
    air: "/assets/cell4.png",
    cell: "/assets/cell.png",
    block: "/assets/block.png",
  });

  const bundle = await Assets.loadBundle("main");
  return bundle;
}
