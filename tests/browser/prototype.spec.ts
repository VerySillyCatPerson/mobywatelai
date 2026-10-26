import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { seed } from "../../src/domain/engine";
const key = "mobywatel-concept:world:v1";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ key, world }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(world));
    },
    { key, world: seed() },
  );
});
async function home(page: Page) {
  await page.goto("./");
  await expect(
    page
      .locator("#app-shell")
      .getByRole("heading", { name: "Dzień dobry, Marto." }),
  ).toBeVisible();
}
async function flow(page: Page, name: string) {
  await page.goto("services");
  await page.getByRole("button", { name, exact: false }).click();
}
async function next(page: Page) {
  await page.getByRole("button", { name: "Dalej", exact: true }).click();
}
async function commit(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("button", { name: "Zatwierdź — demo", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Zatwierdzenie demonstracyjne" }),
  ).toHaveCount(0);
}
async function world(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
}
async function role(page: Page, value: string) {
  await page.goto("demo");
  await page.getByLabel("Wybierz rolę").selectOption(value);
  await expect(page).toHaveURL(/\/mobywatel\/$/);
}
test("navigation, responsive reflow and independent document privacy", async ({
  page,
}) => {
  await home(page);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "./",
      "documents",
      "children",
      "pets",
      "cases",
      "inbox",
      "more",
      "services",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.goto("documents/marta-id");
  await expect(page.getByText("•••• ••••••••", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pokaż dane", exact: true }).click();
  await expect(
    page.locator("#app-shell").getByText("Marta Kowalska", { exact: true }),
  ).toBeVisible();
  await page.goto("documents/marta-id");
  await expect(page.getByText("•••• ••••••••", { exact: true })).toBeVisible();
});
test("F01 passport loss validates, confirms and persists after reload", async ({
  page,
}) => {
  await flow(page, "Utrata dokumentu dziecka");
  await next(page);
  await expect(page.getByRole("alert")).toContainText("Sprawdź");
  await page.getByLabel("Zosia Kowalska", { exact: true }).check();
  await page.getByLabel("Paszport", { exact: true }).check();
  await next(page);
  await page.getByLabel("Zaginął", { exact: true }).check();
  await page.getByLabel("Dziś", { exact: true }).check();
  await next(page);
  await page
    .getByRole("button", { name: "Sprawdź podsumowanie", exact: true })
    .click();
  await commit(page, "Potwierdź zgłoszenie — demo");
  await expect(
    page
      .locator("#app-shell")
      .getByRole("heading", { name: "Zgłoszenie utraty zapisane" }),
  ).toBeVisible();
  await page.reload();
  expect(
    (await world(page)).documents.find((d: any) => d.id === "zosia-passport")
      .status,
  ).toBe("lossReported");
});
test("F02 consent, appointment and external completion use separate states", async ({
  page,
}) => {
  await flow(page, "Nowy paszport dziecka");
  await page.getByLabel("Zosia Kowalska", { exact: true }).check();
  await page.getByLabel("Utrata dokumentu", { exact: true }).check();
  await next(page);
  await page
    .getByLabel("Użyj zdjęcia demonstracyjnego", { exact: true })
    .check();
  await page.getByLabel("Punkt obsługi · DEMO", { exact: true }).check();
  await next(page);
  await commit(page, "Wyślij prośbę o zgodę — demo");
  const cid = (await world(page)).cases.find((c: any) => c.flowId === "F02").id;
  await role(page, "piotr");
  await page.goto(`cases/${cid}`);
  await commit(page, "Wyraź zgodę — demo");
  await role(page, "marta");
  await page.goto(`cases/${cid}`);
  await page
    .getByRole("button", { name: "Wybierz termin demonstracyjny", exact: true })
    .click();
  await page.getByLabel("28 października, 10:00", { exact: true }).check();
  await commit(page, "Zapisz termin — demo");
  await page.goto("demo");
  await page.getByLabel("Sprawa", { exact: true }).selectOption(cid);
  await expect(
    page.getByRole("button", { name: "Przyjęcie wizyty", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "+7 dni", exact: true }).click();
  await page.getByLabel("Sprawa", { exact: true }).selectOption(cid);
  await page
    .getByRole("button", { name: "Przyjęcie wizyty", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Paszport gotowy do odbioru", exact: true })
    .click();
  expect((await world(page)).documents).toHaveLength(5);
  await page
    .getByRole("button", { name: "Odbiór paszportu", exact: true })
    .click();
  expect((await world(page)).documents).toHaveLength(6);
});
test("F03 registry entry, separate QR and finder report", async ({ page }) => {
  await flow(page, "Mikroczip i kontakt opiekuna");
  await page.getByRole("button", { name: "Wstaw numer przykładowy" }).click();
  await page.getByLabel("Rejestr zwierząt A · DEMO", { exact: true }).check();
  await next(page);
  await page.getByLabel("Kontakt demonstracyjny A", { exact: true }).check();
  await next(page);
  await page.getByRole("button", { name: "Wstaw kod demonstracyjny" }).click();
  await page.getByRole("button", { name: "Sprawdź kod", exact: true }).click();
  await commit(page, "Potwierdź wpis — demo");
  expect(Object.keys((await world(page)).registries)).toEqual(["registry-a"]);
  expect((await world(page)).tags).toHaveLength(0);
  await page
    .getByRole("button", { name: "Zarządzaj zawieszką QR", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aktywuj zawieszkę", exact: true })
    .click();
  await commit(page, "Aktywuj zawieszkę — demo");
  await page
    .getByRole("button", { name: "Pokaż scenariusz znalazcy", exact: true })
    .click();
  await expect(
    page
      .locator("#app-shell")
      .getByRole("heading", { name: "Luna — kontakt z opiekunem" }),
  ).toBeVisible();
  await page
    .getByLabel("Znaleziono kota podobnego do Luny", { exact: true })
    .check();
  await page.getByRole("button", { name: "Sprawdź wiadomość" }).click();
  await commit(page, "Potwierdź zgłoszenie — demo");
  expect((await world(page)).reports).toHaveLength(1);
  expect((await world(page)).petStatus).toBe("home");
});
test("F05 missing invoice is specific; sending is not delivery", async ({
  page,
}) => {
  await page.goto("cases/letter-case");
  await page
    .getByRole("button", { name: "Przygotuj odpowiedź", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Użyj szkicu demonstracyjnego" })
    .click();
  await next(page);
  await page.getByLabel("Faktura A · DEMO", { exact: true }).check();
  await page
    .getByRole("button", { name: "Sprawdź podsumowanie", exact: true })
    .click();
  await expect(
    page.getByText("Brakuje: Faktura B · DEMO", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Faktura B · DEMO", { exact: true }).check();
  await page
    .getByRole("button", { name: "Sprawdź podsumowanie", exact: true })
    .click();
  await commit(page, "Wyślij odpowiedź — demo");
  expect((await world(page)).cases[0].currentStep).toBe("sent");
  expect((await world(page)).cases[0].status).toBe("submitted");
});
test("F06 viewStatus invitation reveals no letter content", async ({
  page,
}) => {
  await flow(page, "Pomoc bliskiej osoby");
  await page.getByLabel("Anna Nowak · DEMO", { exact: true }).check();
  await next(page);
  await page.getByLabel("Pismo do Marty", { exact: true }).check();
  await next(page);
  await page.getByLabel("7 dni", { exact: true }).check();
  await page
    .getByRole("button", { name: "Sprawdź podsumowanie", exact: true })
    .click();
  await commit(page, "Potwierdź zakres — demo");
  const cid = (await world(page)).cases.find((c: any) => c.flowId === "F06").id;
  await role(page, "anna");
  await page.goto("cases/letter-case");
  await expect(
    page
      .locator("#app-shell")
      .getByRole("heading", { name: "Ta pozycja nie jest już dostępna" }),
  ).toBeVisible();
  await page.goto(`cases/${cid}`);
  await commit(page, "Przyjmij zaproszenie — demo");
  await page.goto("cases/letter-case");
  await expect(
    page
      .locator("#app-shell")
      .getByRole("heading", { name: "Udostępniona sprawa", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Wezwanie demonstracyjne do uzupełnienia dokumentów.", {
      exact: false,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Otwórz asystenta", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Asystent" }),
  ).not.toContainText("Wezwanie demonstracyjne");
});
test("F07 confirmation creates one profile and follow-up tasks work", async ({
  page,
}) => {
  await flow(page, "Narodziny dziecka");
  await page
    .getByLabel("Narodziny 25 października · DEMO", { exact: true })
    .check();
  await next(page);
  await page.getByLabel("Lena", { exact: true }).check();
  await page.getByLabel("Skrzynka · DEMO", { exact: true }).check();
  await page
    .getByRole("button", { name: "Sprawdź podsumowanie", exact: true })
    .click();
  await commit(page, "Wyślij zgłoszenie — demo");
  expect((await world(page)).children).toHaveLength(2);
  const cid = (await world(page)).cases.find((c: any) => c.flowId === "F07").id;
  await page.goto("demo");
  await page.getByLabel("Sprawa", { exact: true }).selectOption(cid);
  await page
    .getByRole("button", { name: "Potwierdzenie narodzin", exact: true })
    .click();
  expect((await world(page)).children).toHaveLength(3);
  await page.goto(`cases/${cid}`);
  await page
    .getByRole("button", { name: "Dokument dziecka", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zapisz listę przygotowania", exact: true })
    .click();
  expect(
    (await world(page)).cases.find((c: any) => c.id === cid).draftData.tasks
      .taskDocument,
  ).toBe("prepared");
});
test("F08 unknown record permits preparation without biometric dialog", async ({
  page,
}) => {
  await flow(page, "Sprawy po śmierci bliskiej osoby");
  await page
    .getByRole("button", { name: "Przygotuj wizytę", exact: true })
    .click();
  await page.getByLabel("Nie wiem", { exact: true }).check();
  await page.getByLabel("Własne formalności", { exact: true }).check();
  await next(page);
  await page.getByLabel("Mam zapisaną listę pytań", { exact: true }).check();
  await next(page);
  await page.getByLabel("Ustalę termin samodzielnie", { exact: true }).check();
  await page
    .getByRole("button", { name: "Sprawdź podsumowanie", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zapisz przygotowanie", exact: true })
    .click();
  await expect(
    page
      .locator("#app-shell")
      .getByRole("heading", { name: "Przygotowanie zapisane", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    (await world(page)).cases.find((c: any) => c.flowId === "F08").status,
  ).toBe("completed");
});
test("assistant completes F01 with the same draft and rejects typed approval", async ({
  page,
}) => {
  await home(page);
  await page
    .getByRole("button", { name: "Otwórz asystenta", exact: true })
    .click();
  const chat = page.getByRole("dialog", { name: "Asystent" });
  await chat
    .getByRole("button", { name: "Utrata dokumentu dziecka", exact: true })
    .click();
  await chat.getByLabel("Zosia Kowalska", { exact: true }).check();
  await chat.getByLabel("Paszport", { exact: true }).check();
  await chat.getByRole("button", { name: "Dalej", exact: true }).click();
  await chat.getByLabel("Zaginął", { exact: true }).check();
  await chat.getByLabel("Dziś", { exact: true }).check();
  await chat.getByRole("button", { name: "Dalej", exact: true }).click();
  await chat
    .getByRole("button", { name: "Sprawdź podsumowanie", exact: true })
    .click();
  await page.getByLabel("Wiadomość do asystenta").fill("tak");
  await page
    .getByRole("button", { name: "Wyślij wiadomość", exact: true })
    .click();
  await expect(
    chat.getByText("Sprawdź kartę i użyj przycisku, aby zatwierdzić"),
  ).toBeVisible();
  expect((await world(page)).documents[3].status).toBe("valid");
  await commit(page, "Potwierdź zgłoszenie — demo");
  expect((await world(page)).documents[3].status).toBe("lossReported");
  await page
    .getByRole("button", { name: "Zamknij asystenta", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Otwórz asystenta", exact: true }),
  ).toBeFocused();
});
test("unknown operation survives reload and resolves through demo controls", async ({
  page,
}) => {
  await page.goto("demo");
  await page
    .getByLabel("Wariant", { exact: true })
    .selectOption("unknownOutcome");
  await flow(page, "Utrata dokumentu dziecka");
  await page.getByLabel("Zosia Kowalska", { exact: true }).check();
  await page.getByLabel("Paszport", { exact: true }).check();
  await next(page);
  await page.getByLabel("Zaginął", { exact: true }).check();
  await page.getByLabel("Dziś", { exact: true }).check();
  await next(page);
  await page
    .getByRole("button", { name: "Sprawdź podsumowanie", exact: true })
    .click();
  await commit(page, "Potwierdź zgłoszenie — demo");
  const cid = (await world(page)).cases.find((c: any) => c.flowId === "F01").id;
  await page.reload();
  await expect(
    page
      .locator("#app-shell")
      .getByRole("heading", { name: "Nie mamy potwierdzenia wyniku" }),
  ).toBeVisible();
  await page.goto("demo");
  await page.getByLabel("Wynik do sprawdzenia").selectOption("succeeded");
  await page.goto(`cases/${cid}`);
  await page
    .getByRole("button", { name: "Sprawdź status", exact: true })
    .click();
  expect((await world(page)).documents[3].status).toBe("lossReported");
});
test("a second tab must take over and fences out the old editor", async ({
  page,
  context,
}) => {
  await home(page);
  const second = await context.newPage();
  await second.goto("./");
  await expect(
    second.getByRole("dialog", { name: "Demo jest otwarte w innej karcie" }),
  ).toBeVisible();
  await second.getByRole("button", { name: "Przejmij sesję" }).click();
  await expect(
    page.getByRole("dialog", { name: "Demo jest otwarte w innej karcie" }),
  ).toBeVisible();
  await expect(
    second.getByRole("heading", { name: "Dzień dobry, Marto." }),
  ).toBeVisible();
});
test("runtime stays local and main screens have no serious accessibility violations", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5174/") &&
      !r.url().startsWith("ws://127.0.0.1:5174/")
    )
      external.push(r.url());
  });
  for (const path of [
    "./",
    "documents",
    "children",
    "pets",
    "cases",
    "inbox",
    "more",
    "demo",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact || ""),
      ),
      JSON.stringify(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ),
    ).toEqual([]);
  }
  expect(external).toEqual([]);
});
