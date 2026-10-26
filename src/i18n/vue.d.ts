import type { t } from "./index";
declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $t: typeof t;
  }
}
export {};
