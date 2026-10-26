import { test, expect } from "@playwright/test";
test("phone frame, live Polish overview and contained overlays", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("./");
  const frame = page.locator(".phone-device"),
    overview = page.getByRole("complementary", {
      name: "Opis aktualnego ekranu",
    });
  const bounds = await frame.boundingBox();
  expect(bounds!.width).toBeLessThan(430);
  await expect(
    overview.getByRole("heading", { name: "Start", exact: true }),
  ).toBeVisible();
  await page
    .locator("#app-shell")
    .getByRole("link", { name: "Dokumenty", exact: true })
    .click();
  await expect(
    overview.getByRole("heading", { name: "Dokumenty", exact: true }),
  ).toBeVisible();
  await expect(overview).toContainText("Dane na kartach są domyślnie ukryte");
  await page
    .getByRole("button", { name: "Otwórz asystenta", exact: true })
    .click();
  const assistant = page.getByRole("dialog", { name: "Asystent", exact: true });
  const a = await assistant.boundingBox();
  expect(a!.x).toBeGreaterThanOrEqual(bounds!.x);
  expect(a!.x + a!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
  await expect(
    overview.getByRole("heading", { name: "Asystent", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Zamknij asystenta", exact: true })
    .click();
  await expect(
    overview.getByRole("heading", { name: "Dokumenty", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const phone = await frame.boundingBox(),
    side = await overview.boundingBox();
  expect(side!.y).toBeGreaterThan(phone!.y + phone!.height);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
