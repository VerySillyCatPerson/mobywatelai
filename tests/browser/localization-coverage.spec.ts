import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { seed, openCase } from "../../src/domain/engine";
import { flows, flowIds } from "../../src/domain/flows";
test("all workflow screens have English interface copy", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    const raw = sessionStorage.getItem("translation-fixture");
    if (raw) localStorage.setItem("mobywatel-concept:world:v1", raw);
    localStorage.setItem("mobywatel-concept:language", "en");
  });
  await page.goto("./");
  const leftovers: { flow: string; step: string; text: string }[] = [];
  for (const fid of flowIds) {
    for (const step of Object.keys(flows[fid].steps)) {
      const w = seed();
      const c = openCase(w, fid).case;
      c.currentStep = step;
      Object.assign(c.draftData, {
        childId: "zosia",
        documentId: "zosia-passport",
        recipient: "anna",
        duration: "7",
        caseIds: ["letter-case"],
        permissions: { "letter-case": ["viewStatus"] },
        recordAvailability: "unknown",
      });
      await page.evaluate(
        (w) => sessionStorage.setItem("translation-fixture", JSON.stringify(w)),
        w,
      );
      await page.goto(`cases/${c.id}`);
      for (const line of (await page.locator("#app-shell").innerText()).split(
        "\n",
      )) {
        const cleaned = line.replace(/mDowód|Zieliński/g, "");
        if (/[ąćęłńóśźż]/i.test(cleaned))
          leftovers.push({ flow: fid, step, text: line });
      }
    }
  }
  expect(leftovers).toEqual([]);
});
test("English interface is accessible and fits the phone at 320px", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations
      .filter((v) => ["serious", "critical"].includes(v.impact || ""))
      .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Open assistant", exact: true })
    .click();
  const chat = page.getByRole("dialog", { name: "Assistant", exact: true });
  await expect(
    chat.getByRole("button", { name: "Restore demo", exact: true }),
  ).toBeVisible();
  const bounds = await chat.boundingBox(),
    frame = await page.locator(".phone-device").boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    frame!.x + frame!.width,
  );
});
