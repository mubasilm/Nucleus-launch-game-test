import { test, expect } from "../fixtures/game-test.js";

test.describe("Deal Dash visual", () => {
  test("menu overlay screenshot", async ({ gamePage: page }) => {
    await expect(page.locator("#screen-overlay")).toBeVisible();
    await expect(page).toHaveScreenshot("menu-overlay.png", {
      maxDiffPixels: 500,
      mask: [page.locator(".sky")],
    });
  });

  test("share section layout when visible", async ({ gamePage: page }) => {
    await page.evaluate(() => {
      document.getElementById("share-section").hidden = false;
    });
    await expect(page.locator("#share-section")).toBeVisible();
    await expect(page.locator(".share-preview-wrap")).toBeVisible();
  });
});
