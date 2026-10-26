<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useDemo } from "../stores/demo";
import { flows, flowIds } from "../domain/flows";
import { canRead, canContent } from "../domain/engine";
import type { FlowId } from "../domain/types";
import FlowPanel from "./FlowPanel.vue";
import Icon from "./Icon.vue";
import ReportPanel from "./ReportPanel.vue";
const s = useDemo(),
  text = ref(""),
  reply = ref(""),
  responding = ref(false),
  choices = ref<FlowId[]>([]),
  topic = ref<FlowId | null>(null),
  panel = ref<HTMLElement>(),
  composer = ref<HTMLInputElement>(),
  flowPanel = ref<InstanceType<typeof FlowPanel>>();
const current = computed(() => s.getCase(s.assistantCase)),
  allowed = computed(() => current.value && canRead(s.world, current.value)),
  privateContent = computed(
    () => current.value && canContent(s.world, current.value),
  ),
  previous = ref<HTMLElement | null>(null),
  epoch = ref(s.world.epoch);
const aliases: Record<FlowId, string[]> = {
  F01: [
    "zglos utrate dokumentu dziecka",
    "zosia zgubila paszport",
    "dziecko zgubilo legitymacje",
    "utrata dokumentu",
  ],
  F02: [
    "przygotuj paszport dziecka",
    "nowy paszport zosi",
    "paszport dla dziecka",
  ],
  F03: ["zarejestruj chip", "rejestracja chipa", "zarejestruj chip luny"],
  F04: [
    "zglos zaginiecie zwierzecia",
    "zaginela luna",
    "zaginal kot",
    "czy znaleziono lune",
    "wiadomosc o lunie",
    "odebralam lune",
    "luna wrocila",
    "zwierze wrocilo do domu",
    "sprawdz znalezienie",
  ],
  F05: ["wyjasnij pismo", "co oznacza to pismo", "pomoz odpowiedziec"],
  F06: [
    "dodaj bliska osobe",
    "anna ma mi pomagac",
    "udostepnij sprawe",
    "cofnij dostep",
    "odbierz annie dostep",
  ],
  F07: ["zglos narodziny", "urodzilo mi sie dziecko", "zgloszenie narodzin"],
  F08: [
    "uporzadkuj sprawy po smierci bliskiej osoby",
    "zmarla bliska osoba",
    "zmarl mi tata",
  ],
  Q01: ["zarzadzaj zawieszka qr", "aktywuj qr luny", "wylacz zawieszke"],
};
const normalize = (v: string) =>
  v
    .toLocaleLowerCase("pl")
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function launch(fid: FlowId) {
  if (current.value && current.value.flowId !== fid) {
    topic.value = fid;
    return;
  }
  go(fid);
}
function go(fid: FlowId) {
  if (s.world.role !== "marta") {
    reply.value =
      "W tym profilu nie masz dostępu do tej czynności. Wybierz udostępnioną sprawę.";
    return;
  }
  const result = s.start(fid);
  if (result) {
    s.assistantCase = result.id;
    reply.value = result.existing
      ? "Kontynuujesz zapisaną sprawę. Dane i wersja są wspólne z formularzem."
      : "";
    choices.value = [];
    topic.value = null;
  }
}
async function send() {
  const raw = text.value.trim();
  if (!raw || responding.value) return;
  text.value = "";
  responding.value = true;
  const turnEpoch = s.world.epoch;
  await new Promise((r) => setTimeout(r, 300));
  responding.value = false;
  if (turnEpoch !== s.world.epoch || !s.assistant) return;
  const q = normalize(raw);
  if (q.includes("konto jana")) {
    reply.value = "Ten plan nie daje dostępu do konta osoby zmarłej";
    return;
  }
  if (/\bnie (chce|zgubilam|zgubilem|zaginela)\b/.test(q)) {
    reply.value =
      "Nie uruchamiam działania. Wybierz dostępną sprawę albo zachowaj przygotowanie.";
    return;
  }
  if (q === "anuluj") {
    reply.value =
      "Możesz wybrać „Zapisz i wyjdź”, „Porzuć szkic” albo kontynuować bieżący krok.";
    return;
  }
  if (["kontynuuj sprawe", "wroc do sprawy"].includes(q)) {
    reply.value = "Wybierz sprawę z listy poniżej.";
    return;
  }
  const matches = flowIds.filter((fid) =>
    aliases[fid].some((a) => q.includes(a)),
  );
  if (matches.length > 1) {
    choices.value = matches;
    reply.value = "Rozpoznaję dwie sprawy. Wybierz, którą chcesz otworzyć.";
    return;
  }
  if (matches.length === 1) {
    launch(matches[0]!);
    return;
  }
  if (current.value && allowed.value) {
    const n = flows[current.value.flowId].steps[current.value.currentStep];
    if (n?.review) {
      reply.value = "Sprawdź kartę i użyj przycisku, aby zatwierdzić";
      return;
    }
    const fields = flowPanel.value?.fields || [];
    const options = fields.flatMap((f) =>
      (f.options || []).map((o) => ({ field: f, opt: o })),
    );
    const match = options.filter(
      (o) => normalize(o.opt.label) === q || normalize(o.opt.value) === q,
    );
    if (match.length === 1) {
      const { field, opt } = match[0]!;
      flowPanel.value?.change(
        field.key,
        field.kind === "checkboxes"
          ? [
              ...new Set([
                ...(current.value.draftData[field.key] || []),
                opt.value,
              ]),
            ]
          : opt.value,
      );
      reply.value = "Wybór zapisany. Możesz przejść dalej.";
      return;
    }
    const free = fields.filter((f) =>
      ["text", "textarea"].includes(f.kind || ""),
    );
    if (free.length === 1) {
      flowPanel.value?.change(free[0]!.key, raw);
      reply.value = "Odpowiedź zapisana w bieżącym polu.";
      return;
    }
    if (q === "dalej") {
      const action = n?.actions.find((a) => a.next && a.kind !== "secondary");
      if (action) {
        flowPanel.value?.act(action);
        reply.value = "";
        return;
      }
    }
    if (["popraw", "wstecz"].includes(q)) {
      reply.value =
        "Użyj „Wróć i popraw” przy bieżącym kroku. Wszystkie zapisane wartości pozostają w formularzu.";
      return;
    }
    reply.value = "Wybierz jedną z widocznych odpowiedzi";
    return;
  }
  reply.value =
    "Tego pytania nie obsługuje demonstracja. Wybierz dostępną sprawę";
}
function key(e: KeyboardEvent) {
  if (e.key === "Escape" && !s.confirmation) {
    s.persist();
    s.assistant = false;
  }
  if (e.key === "Tab" && !s.confirmation) {
    const els = panel.value?.querySelectorAll<HTMLElement>(
      "button:not(:disabled),input:not(:disabled),textarea,select,a[href]",
    );
    if (!els?.length) return;
    const first = els[0]!,
      last = els[els.length - 1]!;
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === panel.value)
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
watch(
  () => [s.world.role, s.version],
  () => {
    reply.value = "";
    choices.value = [];
    topic.value = null;
  },
);
watch(allowed, (value) => {
  if (current.value && !value) {
    reply.value = "Ta pozycja nie jest już dostępna";
    s.assistantCase = "";
  }
});
onMounted(async () => {
  previous.value = document.activeElement as HTMLElement;
  await nextTick();
  panel.value?.focus();
  document.querySelector<HTMLElement>("#app-shell")!.inert = true;
  document.querySelector<HTMLElement>("#app-shell")!.style.overflow = "hidden";
  document.addEventListener("keydown", key);
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", key);
  document.querySelector<HTMLElement>("#app-shell")!.inert = false;
  document.querySelector<HTMLElement>("#app-shell")!.style.overflow = "";
  previous.value?.isConnected && previous.value.focus();
});
</script>
<template>
  <Teleport to="#phone-overlays"
    ><div
      class="assistant-backdrop"
      @click.self="
        s.persist();
        s.assistant = false;
      "
    >
      <section
        ref="panel"
        class="assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Asystent"
        tabindex="-1"
      >
        <header class="assistant-header">
          <span class="assistant-spark small"
            ><Icon name="assistant" /><i>✦</i></span
          >
          <div>
            <h2>Asystent</h2>
            <span>Odpowiedzi symulowane</span>
          </div>
          <button
            class="icon-button"
            aria-label="Zamknij asystenta"
            @click="
              s.persist();
              s.assistant = false;
            "
          >
            <Icon name="close" />
          </button>
        </header>
        <div v-if="current && allowed" class="assistant-context">
          <Icon name="cases" :size="16" />Dotyczy:
          {{
            privateContent
              ? flows[current.flowId].subject
              : "Udostępniona sprawa"
          }}
          · {{ s.title(current) }}
        </div>
        <div class="assistant-body">
          <ReportPanel
            v-if="['finder', 'vet', 'shelter', 'police'].includes(s.world.role)"
          /><template v-else-if="!current"
            ><div class="assistant-intro">
              <span class="assistant-spark"
                ><Icon name="assistant" :size="30" /><i>✦</i></span
              >
              <h3>W czym pomóc?</h3>
              <p>Wybierz sprawę albo wpisz jedną z przykładowych próśb.</p>
            </div>
            <div v-if="s.world.role === 'marta'" class="assistant-suggestions">
              <button v-for="fid in flowIds" :key="fid" @click="launch(fid)">
                <Icon :name="flows[fid].icon" :size="19" /><span>{{
                  flows[fid].name
                }}</span
                ><Icon name="chevron" :size="16" />
              </button>
            </div>
            <div v-if="s.visibleCases.length" class="assistant-suggestions">
              <h3>Zapisane sprawy</h3>
              <button
                v-for="c in s.visibleCases"
                :key="c.id"
                @click="s.assistantCase = c.id"
              >
                <Icon name="cases" :size="19" />{{ s.title(c)
                }}<Icon name="chevron" :size="16" />
              </button></div></template
          ><FlowPanel
            v-else-if="allowed"
            :key="current.id"
            ref="flowPanel"
            :case-id="current.id"
            chat
          />
          <div v-if="topic" class="assistant-question">
            <p>Masz rozpoczętą sprawę. Zapisać ją i przejść do nowej?</p>
            <div class="actions">
              <button
                class="button"
                @click="
                  s.persist();
                  go(topic);
                "
              >
                Zapisz i przejdź</button
              ><button class="button secondary" @click="topic = null">
                Zostań tutaj
              </button>
            </div>
          </div>
          <p v-if="reply" class="assistant-reply" role="status">{{ reply }}</p>
          <div v-if="choices.length" class="assistant-suggestions">
            <button v-for="fid in choices" :key="fid" @click="launch(fid)">
              {{ flows[fid].name }}
            </button>
          </div>
          <p v-if="responding" class="typing" role="status">
            Przygotowuję odpowiedź…
          </p>
          <div v-if="s.error" class="info-banner error" role="alert">
            {{ s.error }}
          </div>
          <button
            v-if="current"
            class="text-button"
            @click="
              s.persist();
              s.assistantCase = '';
              reply = '';
            "
          >
            Wybierz inną sprawę
          </button>
        </div>
        <form class="assistant-composer" @submit.prevent="send">
          <label for="assistant-prompt" class="sr-only"
            >Wiadomość do asystenta</label
          ><input
            id="assistant-prompt"
            ref="composer"
            v-model="text"
            placeholder="Wpisz przykładową prośbę…"
            autocomplete="off"
          /><button
            class="icon-button send-button"
            :disabled="!text.trim() || responding"
            aria-label="Wyślij wiadomość"
          >
            <Icon name="send" :size="20" />
          </button>
        </form>
        <footer class="assistant-note">
          <Icon name="shield" :size="13" />Wyłącznie przygotowane scenariusze ·
          Bez AI
        </footer>
      </section>
    </div></Teleport
  >
</template>
