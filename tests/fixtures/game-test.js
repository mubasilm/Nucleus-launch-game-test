import { test as base } from "@playwright/test";

export const test = base.extend({
  gamePage: async ({ page }, use) => {
    await page.goto("/");
    await page.waitForFunction(() => typeof window.render_game_to_text === "function");
    await use(page);
  },
});

export { expect } from "@playwright/test";

export async function getGameState(page) {
  const raw = await page.evaluate(() => window.render_game_to_text());
  return JSON.parse(raw);
}

export async function startGame(page) {
  await page.click("#start-btn");
  await page.waitForFunction(() => {
    const s = JSON.parse(window.render_game_to_text());
    return s.mode === "playing";
  });
}

export async function advanceGame(page, ms) {
  await page.evaluate((duration) => window.advanceTime(duration), ms);
}
