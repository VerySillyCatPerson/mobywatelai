<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDemo } from "../stores/demo";
import { createReport, id, clone } from "../domain/engine";
import type { Data, Operation } from "../domain/types";
import Modal from "./Modal.vue";
import PetAvatar from "./PetAvatar.vue";
import Icon from "./Icon.vue";
const s = useDemo(),
  stage = ref("form"),
  type = ref(""),
  registryId = ref(""),
  chip = ref(""),
  tagId = ref(s.world.tags.find((t) => t.status === "active")?.id || ""),
  confirm = ref(false),
  running = ref(false),
  result = ref(""),
  pendingId = ref("");
const finder = computed(() => s.world.role === "finder"),
  allowed = computed(() =>
    ["finder", "vet", "shelter", "police"].includes(s.world.role),
  ),
  tagActive = computed(() =>
    s.world.tags.some((t) => t.id === tagId.value && t.status === "active"),
  );
const description = computed(() =>
  type.value === "sighting"
    ? "Widziano kota podobnego do Luny w parku demonstracyjnym"
    : type.value === "suspicious"
      ? "Zapłać, aby odebrać zwierzę"
      : "Znaleziono kota podobnego do Luny. Jest bezpieczny w miejscu demonstracyjnym",
);
const op = computed(
  () =>
    s.world.operations.find((o) => o.id === pendingId.value) ||
    s.world.operations
      .filter(
        (o) =>
          o.targetType === "report" &&
          o.actorId === s.world.role &&
          ["unknown", "pending"].includes(o.status),
      )
      .at(-1),
);
watch(
  () => s.world.role,
  () => {
    stage.value = "form";
    confirm.value = false;
    type.value = "";
    result.value = "";
    pendingId.value = "";
    tagId.value = s.world.tags.find((t) => t.status === "active")?.id || "";
  },
);
function review() {
  if (!type.value || (!finder.value && (!registryId.value || !chip.value))) {
    s.fail(Error("Wybierz przykładową wiadomość, rejestr i wynik odczytu"));
    return;
  }
  stage.value = "review";
}
async function send() {
  if (running.value) return;
  const role = s.world.role,
    epoch = s.world.epoch,
    token = s.token,
    oid = crypto.randomUUID();
  const data: Data = {
    tagId: tagId.value,
    type: type.value === "suspicious" ? "found" : type.value,
    description: description.value,
    registryId: registryId.value,
    chipNumber: chip.value,
  };
  running.value = true;
  let outcome = s.world.nextOutcome;
  s.attempt(() =>
    s.transact((w) => {
      w.nextOutcome = "success";
      w.operations.push({
        id: oid,
        targetType: "report",
        targetId: oid,
        caseId: null,
        action: finder.value ? "sendFinderMessage" : "sendInstitutionReport",
        revision: 0,
        actorId: role,
        worldEpoch: epoch,
        editorToken: token,
        status: "pending",
        returnStatus: "draft",
        returnStep: "report",
        resolveAs: "unknown",
        outcome,
        applied: false,
        ...{ reportData: data },
      } as Operation);
    }),
  );
  pendingId.value = oid;
  await new Promise((r) => setTimeout(r, 800));
  if (epoch !== s.world.epoch || s.blocked) {
    running.value = false;
    confirm.value = false;
    return;
  }
  finish(
    oid,
    outcome === "success"
      ? "succeeded"
      : outcome === "knownFailure"
        ? "notExecuted"
        : "unknown",
  );
  running.value = false;
  confirm.value = false;
}
function finish(oid: string, resolution: string) {
  s.attempt(() =>
    s.transact((w) => {
      const operation = w.operations.find((o) => o.id === oid)!;
      if (!operation || operation.applied || operation.worldEpoch !== w.epoch)
        return;
      if (resolution === "unknown") {
        operation.status = "unknown";
        return;
      }
      if (resolution === "notExecuted") {
        operation.status = "notExecuted";
        if (w.role === operation.actorId) {
          stage.value = "review";
          result.value =
            "Nie udało się wykonać działania. Dane zostały zachowane.";
        }
        return;
      }
      const previous = w.role;
      w.role = operation.actorId;
      const data = (operation as any).reportData;
      try {
        const report = createReport(w, data, oid);
        operation.status = "succeeded";
        operation.applied = true;
        if (previous === operation.actorId) {
          result.value =
            report?.notificationDelivery === "noMatch"
              ? "W tym rejestrze nie znaleziono powiązania z opiekunem. Nie wysłano powiadomienia"
              : "Wiadomość zapisana — demo. Nie otrzymujesz danych kontaktowych opiekuna.";
          stage.value = "result";
        }
      } finally {
        w.role = previous;
      }
    }),
  );
}
</script>
<template>
  <section v-if="allowed" class="narrow panel section-pad report-panel">
    <p class="eyebrow">
      {{ finder ? "Widok znalazcy" : "Zgłoszenie placówki" }} · DEMO
    </p>
    <template v-if="finder && !tagActive"
      ><Icon name="qr" :size="44" />
      <h1>Ta zawieszka jest nieaktywna</h1>
      <p>Nie można wysłać wiadomości tym formularzem.</p>
      <RouterLink to="/demo" class="button secondary"
        >Wróć do demonstracji</RouterLink
      ></template
    ><template v-else
      ><PetAvatar v-if="finder" large />
      <h1>
        {{
          finder
            ? "Luna — kontakt z opiekunem"
            : "Zgłoszenie znalezienia — demo"
        }}
      </h1>
      <p
        v-if="finder && s.world.notice?.status === 'active'"
        class="badge needsInput"
      >
        Ogłoszenie zaginięcia jest aktywne
      </p>
      <p class="muted">
        {{
          finder
            ? "Kontakt przez formularz. Dane kontaktowe opiekuna pozostają prywatne."
            : "Odczyt odpowiednim czytnikiem został zasymulowany. Nie otrzymujesz dostępu do listy spraw opiekuna."
        }}
      </p>
      <div
        v-if="op && ['pending', 'unknown'].includes(op.status)"
        class="operation-state"
      >
        <h2>Nie mamy potwierdzenia wyniku</h2>
        <p>Najpierw sprawdź status. Nie wysyłaj ponownie.</p>
        <button class="button" @click="finish(op.id, op.resolveAs)">
          Sprawdź status
        </button>
      </div>
      <template v-else-if="stage === 'form'"
        ><fieldset class="field">
          <legend>Co chcesz przekazać?</legend>
          <label
            v-for="(label, value) in {
              found: 'Znaleziono kota podobnego do Luny',
              sighting: 'Widziano kota podobnego do Luny',
              suspicious: 'Przykład podejrzanego żądania zapłaty',
            }"
            :key="value"
            class="option"
            ><input
              v-model="type"
              type="radio"
              :value="value"
              name="reportType"
            /><span>{{ label }}</span></label
          >
        </fieldset>
        <template v-if="!finder"
          ><label class="field"
            >Rejestr<select v-model="registryId">
              <option value="">Wybierz rejestr</option>
              <option value="registry-a">Rejestr zwierząt A · DEMO</option>
              <option value="registry-b">Rejestr zwierząt B · DEMO</option>
            </select></label
          ><button class="button secondary" @click="chip = '999000000000001'">
            Użyj przykładowego wyniku odczytu
          </button>
          <p v-if="chip">
            {{ chip }} · Placówka przy Parkowej · DEMO
          </p></template
        ><button class="button" @click="review">
          Sprawdź wiadomość <Icon name="arrow" :size="18" /></button></template
      ><template v-else-if="stage === 'review'"
        ><h2>Sprawdź zgłoszenie</h2>
        <p class="reading-panel">{{ description }}</p>
        <p>
          Bez prywatnego telefonu i adresu opiekuna. Zatwierdzenie symulowane.
        </p>
        <p v-if="result" role="status">{{ result }}</p>
        <div class="actions">
          <button class="button" @click="confirm = true">
            Potwierdź zgłoszenie — demo</button
          ><button class="button secondary" @click="stage = 'form'">
            Wróć i popraw
          </button>
        </div></template
      >
      <div v-else class="result-panel" role="status">
        <Icon name="check" :size="40" />
        <h2>Wynik demonstracji</h2>
        <p>{{ result }}</p>
        <button
          class="button secondary"
          @click="
            stage = 'form';
            type = '';
            pendingId = '';
            result = '';
          "
        >
          Przygotuj kolejną wiadomość
        </button>
      </div></template
    >
  </section>
  <div v-else class="empty-state">
    <h1>Ten ekran jest dostępny dla znalazcy lub placówki</h1>
    <RouterLink to="/demo" class="button">Sterowanie demonstracją</RouterLink>
  </div>
  <Modal
    v-if="confirm"
    title="Zatwierdzenie demonstracyjne"
    :locked="running"
    @close="confirm = false"
    ><div class="confirmation-art" :class="{ running }">
      <Icon :name="running ? 'clock' : 'shield'" :size="56" />
    </div>
    <p>To animacja. Nie używamy aparatu ani danych biometrycznych.</p>
    <p>{{ description }}</p>
    <div class="actions">
      <button class="button" :disabled="running" @click="send">
        {{ running ? "Wykonywanie — symulacja" : "Zatwierdź — demo" }}</button
      ><button
        v-if="!running"
        class="button secondary"
        @click="confirm = false"
      >
        Anuluj
      </button>
    </div></Modal
  >
</template>
