import { test, expect, type Page } from "@playwright/test";
const KEY = "mobywatel-concept:world:v1";
const state = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
async function english(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
}
test("English screens, translated dates, labels and persisted language", async ({
  page,
}) => {
  await english(page);
  for (const [path, heading] of [
    ["documents", "Documents"],
    ["children", "My children"],
    ["pets", "My pets"],
    ["cases", "Your cases"],
    ["inbox", "Inbox"],
    ["more", "More"],
    ["demo", "Demo controls"],
    ["services", "What can we help with?"],
  ]) {
    await page.goto(path!);
    await expect(
      page
        .locator("#app-shell")
        .getByRole("heading", { name: heading!, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Current screen overview" }),
    ).toBeVisible();
  }
  await page.goto("./");
  await expect(page.locator("#app-shell")).toContainText("OCTOBER");
  await expect(page.locator("#app-shell")).not.toContainText("W przygotowaniu");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "English", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Polski", exact: true }).click();
  await expect(page.locator("#app-shell")).toContainText("Dzień dobry, Marto");
});
test("reset is available on every screen and cancellation preserves a draft", async ({
  page,
}) => {
  await english(page);
  await page.goto("cases/letter-case");
  await page
    .getByRole("button", { name: "Prepare a response", exact: true })
    .click();
  await page.getByLabel("Response — use fictional data").fill("My saved draft");
  await page.waitForTimeout(350);
  for (const path of [
    "cases/letter-case",
    "documents",
    "children",
    "pets",
    "cases",
    "inbox",
    "more",
    "demo",
    "services",
  ]) {
    await page.goto(path);
    await page.locator(".restore-demo").click();
    const dialog = page.getByRole("dialog", {
      name: "Reset demo",
      exact: true,
    });
    await expect(dialog).toContainText("remove progress");
    await dialog.getByRole("button", { name: "Back", exact: true }).click();
    expect((await state(page)).cases[0].draftData.responseText).toBe(
      "My saved draft",
    );
  }
  await page.locator(".restore-demo").click();
  await page
    .getByRole("dialog", { name: "Reset demo", exact: true })
    .getByRole("button", { name: "Reset demo", exact: true })
    .click();
  await expect(page.locator("#app-shell")).toContainText("Hello, Marta");
  expect((await state(page)).cases[0].draftData.responseText).toBeUndefined();
  expect((await state(page)).cases).toHaveLength(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#app-shell")).not.toHaveAttribute("inert", "");
});
test("English assistant recognises English requests and saves stable case data", async ({
  page,
}) => {
  await english(page);
  await page
    .getByRole("button", { name: "Open assistant", exact: true })
    .click();
  const chat = page.getByRole("dialog", { name: "Assistant", exact: true });
  await page
    .getByLabel("Message to the assistant")
    .fill("Zosia lost her passport");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    chat.getByRole("heading", { name: "Child's document", exact: true }),
  ).toBeVisible();
  await chat.getByLabel("Zosia Kowalska", { exact: true }).check();
  await chat.getByLabel("Passport", { exact: true }).check();
  await chat.getByRole("button", { name: "Next", exact: true }).click();
  await chat.getByLabel("Lost", { exact: true }).check();
  await chat.getByLabel("Today", { exact: true }).check();
  await chat.getByRole("button", { name: "Next", exact: true }).click();
  await chat
    .getByRole("button", { name: "Review summary", exact: true })
    .click();
  await chat
    .getByRole("button", { name: "Confirm report — demo", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Demo approval", exact: true })
    .getByRole("button", { name: "Approve — demo", exact: true })
    .click();
  await expect(
    chat.getByRole("heading", { name: "Loss report saved", exact: true }),
  ).toBeVisible();
  const w = await state(page);
  const c = w.cases.find((c: any) => c.flowId === "F01");
  expect(c.draftData.documentId).toBe("zosia-passport");
  expect(c.draftData.lossReason).toBe("lost");
  expect(w.documents.find((d: any) => d.id === "zosia-passport").status).toBe(
    "lossReported",
  );
});
test("reset from the assistant clears its draft and restores keyboard access", async ({
  page,
}) => {
  await english(page);
  await page
    .getByRole("button", { name: "Open assistant", exact: true })
    .click();
  let chat = page.getByRole("dialog", { name: "Assistant", exact: true });
  await chat
    .getByRole("button", { name: "Lost child's document", exact: true })
    .click();
  await chat.getByLabel("Zosia Kowalska", { exact: true }).check();
  await chat.getByRole("button", { name: "Restore demo", exact: true }).click();
  const reset = page.getByRole("dialog", { name: "Reset demo", exact: true });
  await reset.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    chat.getByLabel("Zosia Kowalska", { exact: true }),
  ).toBeChecked();
  await chat.getByRole("button", { name: "Restore demo", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Reset demo", exact: true })
    .getByRole("button", { name: "Reset demo", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#app-shell")).not.toHaveAttribute("inert", "");
  expect((await state(page)).cases).toHaveLength(1);
  await page
    .locator("#app-shell")
    .getByRole("link", { name: "Documents", exact: true })
    .click();
  await expect(page).toHaveURL(/\/documents$/);
});
test("restoring during an operation prevents an old callback changing the fresh demo", async ({
  page,
}) => {
  await english(page);
  await page.goto("services");
  await page
    .getByRole("button", { name: "Lost child's document", exact: false })
    .click();
  await page.getByLabel("Zosia Kowalska", { exact: true }).check();
  await page.getByLabel("Passport", { exact: true }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Lost", { exact: true }).check();
  await page.getByLabel("Today", { exact: true }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("button", { name: "Review summary", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm report — demo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Approve — demo", exact: true })
    .click();
  await page.locator(".restore-demo").click();
  await page
    .getByRole("dialog", { name: "Reset demo", exact: true })
    .getByRole("button", { name: "Reset demo", exact: true })
    .click();
  await page.waitForTimeout(1000);
  const w = await state(page);
  expect(w.epoch).toBeGreaterThan(1);
  expect(w.operations).toHaveLength(0);
  expect(w.cases).toHaveLength(1);
  expect(w.documents.find((d: any) => d.id === "zosia-passport").status).toBe(
    "valid",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
