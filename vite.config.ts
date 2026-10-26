import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { templateI18n } from "./build/template-i18n";
export default defineConfig({
  plugins: [templateI18n(), vue()],
  base: process.env.MOBYWATEL_BASE || "/mobywatel/",
});
