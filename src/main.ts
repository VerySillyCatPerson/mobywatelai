import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Pages from "./components/Pages.vue";
import "./styles.css";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: "/:pathMatch(.*)*", component: Pages }],
  scrollBehavior: () => ({ top: 0 }),
});
createApp(App).use(createPinia()).use(router).mount("#app");
