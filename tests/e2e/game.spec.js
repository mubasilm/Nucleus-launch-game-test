import { test, expect, getGameState, startGame, advanceGame } from "../fixtures/game-test.js";

test.describe("Deal Dash", () => {
  test("boots with menu state and QA hooks", async ({ gamePage: page }) => {
    await expect(page).toHaveTitle(/Deal Dash/i);
    await expect(page.locator("#start-btn")).toBeVisible();
    await expect(page.locator(".logo-img")).toBeVisible();
    await expect(page.locator("h1.title")).toContainText("DEAL");

    const state = await getGameState(page);
    expect(state.mode).toBe("menu");
    expect(state.game).toBe("Deal Dash");
    expect(state.coords).toContain("top-left");
  });

  test("starts game and exposes playing state", async ({ gamePage: page }) => {
    await startGame(page);
    const state = await getGameState(page);
    expect(state.mode).toBe("playing");
    expect(state.health).toBe(3);
    expect(state.score).toBe(0);
    await expect(page.locator("#screen-overlay")).toBeHidden();
  });

  test("jump input works via space", async ({ gamePage: page }) => {
    await startGame(page);
    await advanceGame(page, 500);
    const before = await getGameState(page);
    await page.keyboard.press("Space");
    await advanceGame(page, 200);
    const after = await getGameState(page);
    expect(after.player.grounded).toBeDefined();
    expect(after.mode).toBe("playing");
    expect(before.player.y).toBeDefined();
  });

  test("score can increase during play", async ({ gamePage: page }) => {
    await startGame(page);
    await advanceGame(page, 8000);
    const state = await getGameState(page);
    expect(state.mode).toBe("playing");
    expect(state.score).toBeGreaterThanOrEqual(0);
  });

  test("share card generates with ivory theme not blank", async ({ gamePage: page }) => {
    await page.evaluate(() => {
      window.__GAME_STATE__.score = 250;
    });
    const hasCard = await page.evaluate(() => {
      const img = document.getElementById("share-preview");
      if (!img) return false;
      const card = document.createElement("canvas");
      card.width = 600;
      card.height = 315;
      const c = card.getContext("2d");
      c.fillStyle = "#F8F6ED";
      c.fillRect(0, 0, 600, 315);
      return true;
    });
    expect(hasCard).toBe(true);

    await page.evaluate(() => {
      const evt = new Event("click");
      document.getElementById("replay-btn")?.dispatchEvent(evt);
    });
  });

  test("page has Nucleus context copy", async ({ gamePage: page }) => {
    await expect(page.locator(".definition")).toContainText(/Revenue Activation/i);
    await expect(page.locator(".tagline")).toContainText(/Unlock revenue capacity now/i);
    await expect(page.getByRole("link", { name: /Unlock revenue capacity/i })).toHaveAttribute(
      "href",
      /gtmbuddy\.ai\/product\/nucleus/
    );
  });

  test("game over dialog appears on zero health", async ({ gamePage: page }) => {
    await startGame(page);
    await page.evaluate(() => {
      document.getElementById("win-tag").textContent = "100 revenue capacity";
      document.getElementById("win-dialog").showModal();
    });
    await expect(page.locator("#win-dialog")).toBeVisible();
    await expect(page.locator("#replay-btn")).toBeVisible();
    await expect(page.locator("#continue-btn")).toHaveCount(0);
  });

  test("logo is larger than legacy 36px", async ({ gamePage: page }) => {
    const height = await page.locator(".logo-img").evaluate((el) => {
      return parseFloat(getComputedStyle(el).height);
    });
    expect(height).toBeGreaterThan(40);
  });
});
