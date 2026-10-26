<script setup lang="ts">
import { dateLocale, t } from "../i18n";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDemo } from "../stores/demo";
import { flows, flowIds, roles } from "../domain/flows";
import { eventDefinitions, eventReason, notify, id } from "../domain/engine";
import type { Role, FlowId } from "../domain/types";
import Icon from "./Icon.vue";
import Modal from "./Modal.vue";
const s = useDemo(),
  router = useRouter(),
  resetDialog = ref(false),
  flow = ref<FlowId>("F01"),
  eventCase = ref(""),
  resetFlow = ref(false);
function open() {
  if (s.world.role !== "marta") {
    s.say("Przełącz na profil Marty, aby rozpocząć własną sprawę.");
    return;
  }
  const r = s.start(flow.value);
  if (r) router.push(`/cases/${r.id}`);
}
function reset() {
  s.reset();
  if (resetFlow.value) {
    const r = s.start(flow.value);
    if (r) router.push(`/cases/${r.id}`);
  }
  resetDialog.value = false;
}
function setOutcome(value: string) {
  s.attempt(() => s.transact((w) => (w.nextOutcome = value as any)));
}
function flag(key: string, value: boolean) {
  s.attempt(() => s.transact((w) => ((w.flags as any)[key] = value)));
}
function resend(rid: string) {
  s.attempt(() =>
    s.transact((w) => {
      const r = w.reports.find((r) => r.id === rid)!;
      if (r.notificationDelivery !== "unavailable") return;
      if (w.flags.staleContact) throw Error("Kontakt wymaga aktualizacji");
      r.notificationDelivery = "delivered";
      notify(
        w,
        "marta",
        "Kontakt ze znalazcą · DEMO",
        "Znalezienie Luny",
        "Ponowione powiadomienie demonstracyjne.",
        { reportId: r.id },
      );
    }),
  );
}
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">Narzędzia prezentacji</p>
      <h1>Sterowanie demonstracją</h1>
      <p>
        Nie jest częścią usługi. Wszystkie role działają na jednym urządzeniu.
      </p>
    </div>
    <Icon name="settings" :size="36" />
  </div>
  <div class="info-banner">
    <Icon name="alert" /><span
      >Sterowanie demonstracją — nie jest częścią usługi</span
    >
  </div>
  <div class="demo-grid">
    <section class="panel section-pad">
      <h2>Profil demonstracyjny</h2>
      <p class="muted">Zmiana profilu zamyka chronione ekrany i asystenta.</p>
      <label class="field"
        >Wybierz rolę<select
          :value="s.world.role"
          @change="
            s.switchRole(($event.target as HTMLSelectElement).value as Role);
            router.push('/');
          "
        >
          <option v-for="(name, key) in roles" :key="key" :value="key">
            {{ name }}
          </option>
        </select></label
      >
      <p class="small-muted">
        Rola placówki lub znalazcy jest dostępna wyłącznie przez ten panel.
      </p>
    </section>
    <section class="panel section-pad">
      <h2>Zegar demonstracji</h2>
      <p class="clock-display">
        {{
          new Intl.DateTimeFormat(dateLocale, {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "Europe/Warsaw",
          }).format(new Date(s.world.demoDate))
        }}
      </p>
      <div class="actions">
        <button
          v-for="days in [1, 7, 30]"
          :key="days"
          class="button secondary"
          @click="s.advance(days)"
        >
          +{{ days }} {{ days === 1 ? "dzień" : "dni" }}
        </button>
      </div>
    </section>
    <section class="panel section-pad">
      <h2>Otwórz demonstrację</h2>
      <label class="field"
        >Scenariusz<select v-model="flow">
          <option v-for="fid in flowIds" :key="fid" :value="fid">
            {{ fid }} · {{ flows[fid].name }}
          </option>
        </select></label
      ><button class="button" @click="open">
        Otwórz lub kontynuuj <Icon name="arrow" :size="18" /></button
      ><button
        class="text-button"
        @click="
          resetFlow = true;
          resetDialog = true;
        "
      >
        Odtwórz przykład od początku
      </button>
    </section>
    <section class="panel section-pad">
      <h2>Wynik następnej operacji</h2>
      <label class="field"
        >Wariant<select
          aria-label="Wariant"
          :value="s.world.nextOutcome"
          @change="setOutcome(($event.target as HTMLSelectElement).value)"
        >
          <option value="success">Sukces</option>
          <option value="knownFailure">Znany błąd</option>
          <option value="unknownOutcome">Niepewny wynik</option>
        </select></label
      >
      <p class="muted">
        Ustawienie jest zużywane raz. Kolejna operacja wraca do sukcesu.
      </p>
    </section>
  </div>
  <section class="panel section-pad section-gap">
    <h2>Zdarzenia zewnętrzne</h2>
    <p class="muted">
      Zdarzenia są dostępne tylko w odpowiednim stanie. Samo otwarcie ekranu nie
      przyspiesza sprawy.
    </p>
    <label class="field"
      >Sprawa<select v-model="eventCase" aria-label="Sprawa">
        <option value="">Wybierz sprawę</option>
        <option v-for="c in s.world.cases" :key="c.id" :value="c.id">
          {{ flows[c.flowId].shortName }} ·
          {{ flows[c.flowId].steps[c.currentStep]?.title }}
        </option>
      </select></label
    >
    <div class="event-grid">
      <div v-for="event in eventDefinitions" :key="event.id" class="event-item">
        <button
          class="button secondary"
          :disabled="!!eventReason(s.world, event.id, s.getCase(eventCase))"
          @click="s.external(event.id, eventCase)"
        >
          {{ event.label }}</button
        ><small v-if="eventReason(s.world, event.id, s.getCase(eventCase))">{{
          eventReason(s.world, event.id, s.getCase(eventCase))
        }}</small>
      </div>
    </div>
  </section>
  <section
    v-if="s.world.operations.some((o) => o.status === 'unknown')"
    class="panel section-pad section-gap"
  >
    <h2>Rozstrzygnij niepewny wynik</h2>
    <div
      v-for="op in s.world.operations.filter((o) => o.status === 'unknown')"
      :key="op.id"
      class="operation-control"
    >
      <code>{{ op.id }}</code
      ><label class="field"
        >Wynik do sprawdzenia<select
          aria-label="Wynik do sprawdzenia"
          :value="op.resolveAs"
          @change="
            s.attempt(() =>
              s.transact(
                (w) =>
                  (w.operations.find((o) => o.id === op.id)!.resolveAs = (
                    $event.target as HTMLSelectElement
                  ).value as any),
              ),
            )
          "
        >
          <option value="unknown">Nadal brak informacji</option>
          <option value="succeeded">Wykonano</option>
          <option value="notExecuted">Nie wykonano</option>
        </select></label
      >
      <p class="muted">Efekt nastąpi dopiero po „Sprawdź status” w sprawie.</p>
    </div>
  </section>
  <section class="panel section-pad section-gap">
    <h2>Przeszkody w próbce</h2>
    <div class="flag-grid">
      <label
        v-for="(label, key) in {
          chipConflict: 'Konflikt numeru chipa',
          registryUnavailable: 'Niedostępny rejestr',
          occupiedSlot: 'Pierwszy termin zajęty',
          staleContact: 'Nieaktualny kontakt opiekuna',
        }"
        :key="key"
        class="option"
        ><input
          type="checkbox"
          :checked="s.world.flags[key]"
          @change="flag(key, ($event.target as HTMLInputElement).checked)"
        /><span>{{ label }}</span></label
      >
    </div>
    <button
      class="text-button"
      @click="
        s.attempt(() =>
          s.transact((w) => {
            w.flags = {
              chipConflict: false,
              registryUnavailable: false,
              occupiedSlot: false,
              staleContact: false,
            };
          }),
        )
      "
    >
      Usuń przeszkody
    </button>
    <p class="small-muted">
      Usunięcie przeszkody nie wykonuje poprzedniej operacji automatycznie.
    </p>
    <div
      v-for="r in s.world.reports.filter(
        (r) => r.notificationDelivery === 'unavailable',
      )"
      :key="r.id"
    >
      <p>Kontakt wymaga aktualizacji · {{ r.id }}</p>
      <button class="button secondary" @click="resend(r.id)">
        Ponów powiadomienie — demo
      </button>
    </div>
  </section>
  <section class="reset-card section-gap">
    <div>
      <h2>Rozpocznij od nowa</h2>
      <p>
        Reset przywraca ten sam zestaw fikcyjnych danych dla wszystkich ról.
      </p>
    </div>
    <button
      class="button secondary"
      @click="
        resetFlow = false;
        resetDialog = true;
      "
    >
      <Icon name="reset" :size="18" />Resetuj demo
    </button>
  </section>
  <Modal
    v-if="resetDialog"
    title="Reset demonstracji"
    @close="resetDialog = false"
    ><p>Reset usunie postęp wszystkich fikcyjnych osób. Rozpocząć od nowa?</p>
    <div class="actions">
      <button class="button danger" @click="reset">Resetuj demo</button
      ><button class="button secondary" @click="resetDialog = false">
        Wróć
      </button>
    </div></Modal
  >
</template>
