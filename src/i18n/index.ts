import { computed, ref, watch } from "vue";
import en from "./en.json";
export type Language = "pl" | "en";
const KEY = "mobywatel-concept:language";
function saved(): Language {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "pl";
  } catch {
    return "pl";
  }
}
export const language = ref<Language>(saved());
export const dateLocale = computed(() =>
  language.value === "en" ? "en-GB" : "pl-PL",
);
export function setLanguage(value: Language) {
  language.value = value;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* the selected language still works for this tab */
  }
}
const catalog: Record<string, string> = en;
const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const phrases = new RegExp(
  "(?<![\\p{L}\\p{N}])(?:" +
    Object.keys(catalog)
      .filter((k) => catalog[k] !== k)
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join("|") +
    ")(?![\\p{L}\\p{N}])",
  "gu",
);
const RAW = Symbol("verbatim");
export function verbatim(value: unknown) {
  return { [RAW]: true, value: String(value ?? "") };
}
export function t(value: unknown): string {
  if (typeof value === "object" && value !== null && RAW in value)
    return (value as ReturnType<typeof verbatim>).value;
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (language.value === "pl") return text;
  const key = normalize(text);
  if (catalog[key] !== undefined)
    return (
      (text.match(/^\s*/)?.[0] || "") +
      catalog[key]! +
      (text.match(/\s*$/)?.[0] || "")
    );
  return text
    .replace(/^Krok (\d+) z (\d+)$/, "Step $1 of $2")
    .replace(phrases, (key) => catalog[key] || key);
}
export function initLanguage() {
  watch(
    language,
    (value) => {
      document.documentElement.lang = value;
      document.title =
        value === "en" ? "mObywatel / concept" : "mObywatel / koncepcja";
    },
    { immediate: true },
  );
}
