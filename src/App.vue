<script setup lang="ts">
import {
  computed,
  watch,
  ref,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDemo } from "./stores/demo";
import { actionNames, canRead } from "./domain/engine";
import { roles } from "./domain/flows";
import Icon from "./components/Icon.vue";
import Assistant from "./components/Assistant.vue";
import Modal from "./components/Modal.vue";
import PresentationOverview from "./components/PresentationOverview.vue";
import DemoToolbar from "./components/DemoToolbar.vue";
const s = useDemo(),
  route = useRoute(),
  router = useRouter(),
  confirmReset = ref(false);
function requestRestore() {
  confirmReset.value = true;
}
onMounted(() => window.addEventListener("demo:restore", requestRestore));
onBeforeUnmount(() =>
  window.removeEventListener("demo:restore", requestRestore),
);
watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    const shell = document.getElementById("app-shell");
    if (shell) shell.scrollTop = 0;
  },
);
const nav = [
  { to: "/", label: "Start", icon: "home" },
  { to: "/documents", label: "Dokumenty", icon: "documents" },
  { to: "/cases", label: "Sprawy", icon: "cases" },
  { to: "/more", label: "Więcej", icon: "more" },
];
function selected(path: string) {
  if (path === "/")
    return ["/", "/children", "/pets"].some((p) =>
      p === "/" ? route.path === "/" : route.path.startsWith(p),
    );
  if (path === "/more")
    return ["/more", "/demo", "/services", "/trusted"].some((p) =>
      route.path.startsWith(p),
    );
  return route.path.startsWith(path);
}
watch(
  () => s.version,
  () => router.replace("/"),
);
const confirmationCase = computed(() =>
  s.confirmation ? s.getCase(s.confirmation.caseId) : undefined,
);
const canShow = computed(
  () => confirmationCase.value && canRead(s.world, confirmationCase.value),
);
</script>
<template>
  <div class="presentation-layout">
    <DemoToolbar @restore="requestRestore" />
    <section class="phone-column" aria-label="Interaktywny podgląd aplikacji">
      <div class="phone-caption">
        <span class="phone-caption-dot"></span>PODGLĄD APLIKACJI
        <span>Wersja demonstracyjna</span>
      </div>
      <div class="phone-device">
        <div class="phone-status" aria-hidden="true">
          <span>10:00</span><span class="phone-camera"></span>
          <div class="phone-indicators">
            <span class="phone-signal">▂▄▆</span
            ><span class="phone-battery"></span>
          </div>
        </div>
        <div class="phone-viewport">
          <div id="phone-overlays"></div>
          <div id="app-shell">
            <a class="skip-link" href="#main-content">Przejdź do treści</a>
            <div class="prototype-banner">
              <span class="prototype-dot"></span>Prototyp. Dane i działania są
              fikcyjne
              <span class="banner-desktop">· Niezależna koncepcja</span>
            </div>
            <header class="app-header">
              <div class="header-inner">
                <RouterLink
                  to="/"
                  class="brand"
                  aria-label="mObywatel / koncepcja — Start"
                  ><span class="brand-symbol" aria-hidden="true"
                    ><span></span><span></span><span></span></span
                  ><span class="brand-text"
                    >mObywatel <small>/ koncepcja</small></span
                  ><span class="demo-chip">DEMO</span></RouterLink
                >
                <nav class="desktop-nav" aria-label="Nawigacja główna">
                  <RouterLink
                    v-for="n in nav"
                    :key="n.to"
                    :to="n.to"
                    :aria-current="selected(n.to) ? 'page' : undefined"
                    :class="{ active: selected(n.to) }"
                    >{{ n.label }}</RouterLink
                  >
                </nav>
                <div class="header-actions">
                  <RouterLink
                    to="/inbox"
                    class="icon-button notification-button"
                    :aria-label="`Skrzynka, ${s.unread} nieprzeczytanych wiadomości`"
                    ><Icon name="bell" /><span
                      v-if="s.unread"
                      class="notification-dot"
                    ></span></RouterLink
                  ><button
                    class="icon-button assistant-toggle"
                    aria-label="Otwórz asystenta"
                    @click="
                      s.openAssistant(
                        route.path.startsWith('/cases/')
                          ? route.path.split('/')[2]
                          : '',
                      )
                    "
                  >
                    <Icon name="assistant" /><span class="tiny-spark">✦</span>
                  </button>
                </div>
              </div>
            </header>
            <div v-if="s.world.role !== 'marta'" class="role-banner">
              <span
                >Profil demonstracyjny:
                <strong>{{ roles[s.world.role] }}</strong></span
              ><RouterLink to="/demo"
                >Zmień profil <Icon name="settings" :size="15"
              /></RouterLink>
            </div>
            <main id="main-content" class="main-content">
              <div v-if="!s.persistent" class="info-banner amber" role="status">
                Postęp jest dostępny tylko w tej otwartej karcie
              </div>
              <div
                v-if="s.error && !s.assistant"
                class="info-banner error"
                role="alert"
              >
                <Icon name="alert" /><span>{{ s.error }}</span
                ><button
                  class="icon-button"
                  aria-label="Zamknij komunikat"
                  @click="s.error = ''"
                >
                  <Icon name="close" :size="18" />
                </button>
              </div>
              <RouterView v-if="!s.corrupt" />
              <section v-else class="empty-state">
                <Icon name="alert" :size="40" />
                <h1>Nie można odtworzyć postępu</h1>
                <p>
                  Rozpocznij nowe demo. Nie odtwarzamy częściowych uprawnień.
                </p>
                <button class="button" @click="confirmReset = true">
                  Rozpocznij nowe demo
                </button>
              </section>
            </main>
            <footer class="app-footer">
              <span>mObywatel / koncepcja</span
              ><span
                >Przykładowe dane. Żadne działanie nie trafia do urzędu.</span
              ><RouterLink to="/demo"
                >Sterowanie demo <Icon name="settings" :size="14"
              /></RouterLink>
            </footer>
            <nav class="bottom-nav" aria-label="Nawigacja główna">
              <RouterLink
                v-for="n in nav"
                :key="n.to"
                :to="n.to"
                :aria-current="selected(n.to) ? 'page' : undefined"
                :class="{ active: selected(n.to) }"
                ><span><Icon :name="n.icon" /></span>{{ n.label }}</RouterLink
              >
            </nav>
          </div>
          <div v-if="s.toast" class="toast" role="status">
            <Icon name="check" :size="18" />{{ s.toast }}
          </div>
          <Assistant v-if="s.assistant && !s.blocked" />
          <Modal
            v-if="s.confirmation && canShow && !s.blocked"
            title="Zatwierdzenie demonstracyjne"
            :locked="s.executing"
            @close="s.confirmation = null"
            ><div class="confirmation-art" :class="{ running: s.executing }">
              <Icon :name="s.executing ? 'clock' : 'shield'" :size="56" />
            </div>
            <h3>
              {{ actionNames[s.confirmation.action] || "Potwierdź działanie" }}
            </h3>
            <p>To animacja. Nie używamy aparatu ani danych biometrycznych.</p>
            <p class="demo-note">
              Zatwierdzenie symulowane · {{ roles[s.confirmation.role] }}
            </p>
            <div v-if="s.error" class="info-banner error" role="alert">
              {{ s.error }}
            </div>
            <div class="actions">
              <button class="button" :disabled="s.executing" @click="s.execute">
                {{
                  s.executing ? "Wykonywanie — symulacja" : "Zatwierdź — demo"
                }}</button
              ><button
                v-if="!s.executing"
                class="button secondary"
                @click="s.confirmation = null"
              >
                Anuluj
              </button>
            </div></Modal
          >
          <Modal
            v-if="s.blocked"
            title="Demo jest otwarte w innej karcie"
            locked
            ><p>
              Wróć do niej albo przejmij sesję. Przejęcie unieważni wcześniejsze
              karty zatwierdzenia.
            </p>
            <button
              class="button"
              @click="
                s.claim(true);
                router.replace('/');
              "
            >
              Przejmij sesję
            </button></Modal
          >
          <Modal
            v-if="confirmReset"
            title="Reset demonstracji"
            @close="confirmReset = false"
            ><p>
              Reset usunie postęp wszystkich fikcyjnych osób. Rozpocząć od nowa?
            </p>
            <div class="actions">
              <button
                class="button danger"
                @click="
                  s.reset();
                  confirmReset = false;
                "
              >
                Resetuj demo</button
              ><button class="button secondary" @click="confirmReset = false">
                Wróć
              </button>
            </div></Modal
          >
        </div>
        <div class="phone-chin" aria-hidden="true"><span></span></div>
      </div>
      <p class="phone-hint">
        Klikaj i przewijaj wewnątrz telefonu, aby poznać prototyp.
      </p>
    </section>
    <PresentationOverview />
  </div>
</template>
