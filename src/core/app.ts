import { Application } from "pixi.js";

export async function createApp(): Promise<Application> {
  const app = new Application();

  await app.init({
    width: 600,
    height: 600,
    backgroundColor: 0xffffff,
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);

  return app;
}
