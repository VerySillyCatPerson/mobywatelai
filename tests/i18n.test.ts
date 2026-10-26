import { afterEach, describe, it, expect } from "vitest";
import { t, setLanguage, language, dateLocale, verbatim } from "../src/i18n";
import { templateI18n } from "../build/template-i18n";
afterEach(() => setLanguage("pl"));
describe("presentation language", () => {
  it("keeps Polish as the original copy", () => {
    setLanguage("pl");
    expect(t("Dokumenty")).toBe("Dokumenty");
  });
  it("translates screens, long scenario copy and preserved whitespace", () => {
    setLanguage("en");
    expect(t("Dokumenty")).toBe("Documents");
    expect(t("\n  Prototyp. Dane i działania są\n fikcyjne  ")).toBe(
      "\n  Prototype. All data and actions are fictional  ",
    );
    expect(t("Kod demonstracyjny jest nieprawidłowy. Użyj 123456")).toContain(
      "incorrect",
    );
    expect(dateLocale.value).toBe("en-GB");
  });
  it("translates combined labels without changing names or user input", () => {
    setLanguage("en");
    expect(t("Faktura A · DEMO, Faktura B · DEMO")).toBe(
      "Invoice A · DEMO, Invoice B · DEMO",
    );
    expect(t("Marta Kowalska")).toBe("Marta Kowalska");
    expect(t("My own response: 123")).toBe("My own response: 123");
    expect(t(null)).toBe("");
    expect(t(verbatim("Dokumenty do sprawy"))).toBe("Dokumenty do sprawy");
    expect(t("What do I need?")).toBe("What do I need?");
    expect(t("Krok 2 z 4")).toBe("Step 2 of 4");
  });
  it("does not translate model values, command identifiers or component title props", () => {
    const source =
      '<template><Modal title="Reset demonstracji"><label aria-label="Dokument"><input v-model="draft" value="lost" @change="submit(\'reportLoss\')">Dokumenty {{ status }}</label></Modal></template>';
    const result = (templateI18n().transform as any)(source, "Example.vue");
    expect(result).toContain('title="Reset demonstracji"');
    expect(result).toContain('value="lost"');
    expect(result).toContain('v-model="draft"');
    expect(result).toContain("submit('reportLoss')");
    expect(result).toContain("$t(status)");
    expect(result).toContain('$t("Dokumenty ")');
    expect(result).toContain(":aria-label=");
  });
});
