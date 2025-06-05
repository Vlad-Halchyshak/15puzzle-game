import { Application, Sprite, Texture } from "pixi.js";

export interface LoadedTextures {
  background: Texture;
  main: Texture;
  fire: Texture;
  water: Texture;
  earth: Texture;
  air: Texture;
  cell: Texture;
  block: Texture;
}

export interface ElementEntity {
  sprite: Sprite;
  x: number;
  y: number;
  type: number;
  locked?: boolean;
  initialX?: number;
  initialY?: number;
}

export interface GameAPI {
  getCurrentLevel(): number;
  setCurrentLevel(v: number): void;
  getElements(): ElementEntity[];
  setElements(v: ElementEntity[]): void;
  getIsBlocked(): boolean;
  setIsBlocked(v: boolean): void;
  getTimerId(): ReturnType<typeof setTimeout> | null;
  setTimerId(v: ReturnType<typeof setTimeout> | null): void;
  getIntervalId(): ReturnType<typeof setInterval> | null;
  setIntervalId(v: ReturnType<typeof setInterval> | null): void;
  getTimeRemaining(): number;
  setTimeRemaining(v: number): void;
}

export interface SetupGameHandlersProps {
  app: Application;
  textures: LoadedTextures;
  buttonContainer: HTMLDivElement;
  timerDisplay: HTMLDivElement;
  gameAPI: GameAPI;
}
