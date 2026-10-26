<script setup lang="ts">
import { dateLocale, t, verbatim } from "../i18n";
import { computed, ref, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import type {
  CaseRecord,
  Action,
  Field,
  Data,
  Permission,
} from "../domain/types";
import { flows, roles, permissionLabels, statusLabels } from "../domain/flows";
import * as E from "../domain/engine";
import { useDemo } from "../stores/demo";
import FieldControl from "./FieldControl.vue";
import Icon from "./Icon.vue";
import Modal from "./Modal.vue";
import PetAvatar from "./PetAvatar.vue";
const props = defineProps<{ caseId: string; chat?: boolean }>();
const s = useDemo(),
  router = useRouter();
const c = computed(() => s.getCase(props.caseId)),
  role = computed(() => s.world.role);
const readable = computed(() => !!c.value && E.canRead(s.world, c.value)),
  content = computed(() => !!c.value && E.canContent(s.world, c.value));
const helper = computed(
  () =>
    role.value !== "marta" &&
    !!c.value &&
    ["F05", "F08"].includes(c.value.flowId),
);
const consent = computed(() =>
    c.value ? E.currentConsent(s.world, c.value) : undefined,
  ),
  invitation = computed(() =>
    c.value ? E.currentInvitation(s.world, c.value) : undefined,
  );
const viewStep = computed(() => {
  if (!c.value) return "";
  if (
    c.value.flowId === "F02" &&
    role.value === "piotr" &&
    consent.value?.status === "pending"
  )
    return "consentDecision";
  if (c.value.flowId === "F06" && role.value !== "marta")
    return "invitationDecision";
  return c.value.currentStep;
});
const flow = computed(() => (c.value ? flows[c.value.flowId] : undefined)),
  node = computed(() => flow.value?.steps[viewStep.value]);
const validation = ref<Record<string, string>>({}),
  preview = ref(""),
  choice = ref<{
    title: string;
    description: string;
    confirm: string;
    run: () => void;
  } | null>(null),
  compareId = ref("");
const heading = ref<HTMLElement>();
watch(
  () => [props.caseId, viewStep.value, s.version],
  async () => {
    validation.value = {};
    s.error = "";
    preview.value = "";
    choice.value = null;
    compareId.value = "";
    await nextTick();
    if (!props.chat) heading.value?.focus();
  },
);
const op = computed(() =>
  s.world.operations.filter((o) => o.caseId === props.caseId).at(-1),
);
const progress = computed(() => {
  if (!c.value) return "";
  const paths: Record<string, string[]> = {
    F01: ["select", "details", "consequences", "review"],
    F02: ["child", "prepare", "consentReview"],
    F03: ["identify", "contact", "verify", "review"],
    Q01: ["select", "review"],
    F04: ["details", "preview", "review"],
    F05: ["letter", "draft", "attachments", "review"],
    F06: ["recipient", "scope", "permissions", "review"],
    F07: ["event", "details", "review"],
    F08: ["situation", "record", "checklist", "appointment", "review"],
  };
  const path = paths[c.value.flowId] || [],
    i = path.indexOf(viewStep.value);
  return i >= 0 && c.value.status !== "completed"
    ? `Krok ${i + 1} z ${path.length}`
    : "";
});
const busy = computed(
  () => op.value && ["pending", "unknown"].includes(op.value.status),
);
const summary = computed(() => {
  if (!c.value || !content.value) return [];
  const data =
    role.value === "piotr" && consent.value
      ? consent.value.snapshot
      : c.value.draftData;
  const pairs: { label: string; value: string; raw?: boolean }[] = [];
  const labels: Record<string, string> = {
    childId: "Dziecko",
    documentId: "Dokument",
    lossReason: "Zdarzenie",
    discoveredAt: "Data",
    reason: "Powód",
    photoId: "Zdjęcie",
    officeId: "Punkt obsługi",
    appointmentId: "Termin",
    chipNumber: "Numer przykładowy",
    registryId: "Rejestr",
    contactId: "Kontakt",
    disappearedAt: "Data zaginięcia",
    areaId: "Rejon",
    descriptionId: "Opis",
    responseText: "Treść odpowiedzi",
    attachmentIds: "Załączniki",
    recipient: "Odbiorca",
    duration: "Czas dostępu",
    birthEventId: "Zdarzenie",
    childName: "Imię",
    deliveryMode: "Potwierdzenie",
    recordAvailability: "Co już wiadomo",
    purpose: "Cel",
    slotId: "Termin wizyty",
    checklistSaved: "Lista pytań",
    helperNote: "Notatka",
  };
  const options = Object.values(flows)
    .flatMap((f) => Object.values(f.steps).flatMap((s) => s.fields || []))
    .flatMap((f) => f.options || []);
  for (const [key, label] of Object.entries(labels)) {
    if (data[key] === undefined) continue;
    if (
      key === "attachmentIds" &&
      role.value !== "marta" &&
      !s.grant(c.value.id, "readAttachments")
    )
      continue;
    const format = (value: any) =>
      options.find((o) => o.value === value)?.label ||
      (value === "today"
        ? date(s.world.demoDate)
        : value === "yesterday"
          ? date(
              new Date(Date.parse(s.world.demoDate) - 86400000).toISOString(),
            )
          : value === true
            ? "Zapisana"
            : String(value));
    pairs.push({
      label,
      raw: ["responseText", "helperNote"].includes(key),
      value: Array.isArray(data[key])
        ? data[key].map(format).join(", ")
        : format(data[key]),
    });
  }
  return pairs;
});
const fields = computed(() => {
  if (!c.value || !node.value) return [];
  return (node.value.fields || []).map((f) => {
    if (f.key === "caseIds")
      return {
        ...f,
        options: s.world.cases
          .filter((x) => ["F05", "F08"].includes(x.flowId))
          .map((x) => ({ value: x.id, label: flows[x.flowId].shortName })),
      };
    if (["appointmentId", "slotId"].includes(f.key)) {
      const past =
        Date.parse(s.world.demoDate) >
          Date.parse("2026-10-29T12:00:00+01:00") ||
        c.value!.history.some((h) => h.event.includes("Poprawa zdjęcia"));
      if (past) {
        const options = [1, 2].map((n) => {
          const d = new Date(Date.parse(s.world.demoDate) + n * 86400000);
          d.setHours(
            f.key === "slotId" ? (n === 1 ? 11 : 13) : n === 1 ? 10 : 12,
            0,
            0,
            0,
          );
          return {
            value: `relative-${d.toISOString()}`,
            label: date(d.toISOString(), true) + " · DEMO",
          };
        });
        if (f.key === "slotId")
          options.push({ value: "self", label: "Ustalę termin samodzielnie" });
        return { ...f, options };
      }
    }
    return f;
  });
});
const proposal = computed(() =>
  s.world.proposals.find((p) => p.id === compareId.value),
);
function permissionLabel(value: string) {
  return permissionLabels.find((p) => p.value === value)?.label || value;
}
function date(value: string, time = false) {
  return new Intl.DateTimeFormat(dateLocale.value, {
    dateStyle: "long",
    ...(time ? { timeStyle: "short" as const } : {}),
    timeZone: "Europe/Warsaw",
  }).format(new Date(value));
}
function change(key: string, value: any) {
  s.field(props.caseId, key, value);
  delete validation.value[key];
  if (key === "caseIds" && c.value) {
    const permissions = { ...c.value.draftData.permissions };
    for (const cid of value) permissions[cid] ??= ["viewStatus"];
    s.field(props.caseId, "permissions", permissions);
  }
}
function permission(cid: string, p: Permission, on: boolean) {
  if (!c.value) return;
  const rights: Permission[] = [
    ...(c.value.draftData.permissions?.[cid] || ["viewStatus"]),
  ];
  let required: Permission[] =
    p === "readAttachments" || p === "prepareDraft"
      ? ["viewStatus", "readContent"]
      : p === "readContent" || p === "receiveNotifications"
        ? ["viewStatus"]
        : [];
  required = required.filter((v) => !rights.includes(v));
  const dependents = rights.filter(
    (v) =>
      (p === "viewStatus" && v !== "viewStatus") ||
      (p === "readContent" && ["readAttachments", "prepareDraft"].includes(v)),
  );
  const apply = () => {
    const next = on
      ? [...new Set([...rights, ...required, p])]
      : rights.filter((v) => v !== p && !dependents.includes(v));
    s.field(props.caseId, "permissions", {
      ...c.value!.draftData.permissions,
      [cid]: next,
    });
  };
  if (on && required.length)
    choice.value = {
      title: "Wymagane uprawnienia",
      description:
        "Ta opcja wymaga: " +
        required
          .map((v) => permissionLabels.find((p) => p.value === v)!.label)
          .join(", "),
      confirm: "Włącz wymagane uprawnienia",
      run: apply,
    };
  else if (!on && dependents.length)
    choice.value = {
      title: "Zmiana zakresu",
      description:
        "Zostaną także wyłączone: " +
        dependents
          .map((v) => permissionLabels.find((p) => p.value === v)!.label)
          .join(", "),
      confirm: "Potwierdź ograniczenie",
      run: apply,
    };
  else apply();
}
function validate() {
  if (!c.value) return false;
  validation.value = E.errors(s.world, {
    ...c.value,
    currentStep: viewStep.value,
  });
  if (Object.keys(validation.value).length) {
    s.fail(Error("Sprawdź zaznaczone pola"));
    nextTick(() =>
      document
        .querySelector<HTMLElement>(
          `[data-case="${props.caseId}"] [aria-invalid="true"]`,
        )
        ?.focus(),
    );
    return false;
  }
  return true;
}
function act(action: Action) {
  if (!c.value) return;
  if (action.commit) {
    if (
      action.commit === "approveConsent" ||
      action.commit === "declineConsent"
    ) {
      s.request(c.value.id, action.commit);
      return;
    }
    if (!validate()) return;
    s.request(c.value.id, action.commit);
  } else if (action.next) {
    if (
      action.kind !== "secondary" &&
      ![
        "Nie ma mojego zdarzenia",
        "Mam już plan",
        "Wróć do planu",
        "Pokaż oryginał",
      ].includes(action.label) &&
      !validate()
    )
      return;
    s.step(c.value.id, action.next);
  } else if (action.event) event(action.event);
}
function openFlow(id: any, data: Data = {}) {
  const result = s.start(id, data);
  if (result) {
    if (props.chat) s.assistantCase = result.id;
    else router.push(`/cases/${result.id}`);
    if (result.existing)
      s.say("Masz już rozpoczętą sprawę. Kontynuujesz zapisany postęp.");
  }
}
function event(name: string) {
  if (!c.value) return;
  const cid = c.value.id;
  if (name === "openF02") openFlow("F02", { childId: "zosia", reason: "loss" });
  else if (name === "openQ01") openFlow("Q01");
  else if (name === "passportDocument")
    navigate("/documents/zosia-passport-new");
  else if (name === "petProfile") navigate("/pets/luna");
  else if (name === "newbornProfile") navigate("/children/ola");
  else if (name === "finder") {
    s.switchRole("finder");
    navigate("/report");
  } else if (name === "noChip")
    s.say(
      "Numer może odczytać placówka z odpowiednim czytnikiem. Możesz zachować przygotowanie.",
    );
  else if (name === "foundBeforeLoss")
    choice.value = {
      title: "Dokument się znalazł",
      description: "Zachować przygotowanie czy porzucić szkic?",
      confirm: "Porzuć szkic",
      run: () => {
        s.discard(cid);
        navigate("/cases");
      },
    };
  else if (name === "checkStatus")
    s.say(
      "Bieżący etap: " +
        node.value?.title +
        ". Oczekujesz na osobne zdarzenie demonstracyjne.",
    );
  else if (name === "updateContact") {
    s.attempt(() =>
      s.transact((w) => {
        const x = w.cases.find((c) => c.id === cid)!;
        x.status = "draft";
        x.currentStep = "contact";
        x.draftData.action = "updateContact";
        x.revision++;
      }),
    );
  } else if (name === "saveBereavement") s.savePlan(cid);
  else if (name === "viewChecklist")
    preview.value = "Lista pytań do punktu obsługi";
  else if (name === "sharePlan")
    openFlow("F06", { caseIds: [cid], permissions: { [cid]: ["viewStatus"] } });
  else if (name === "existingPlan")
    s.say(
      c.value.draftData.planStatus === "prepared"
        ? "Plan jest zapisany. Otwórz wynik w szczegółach sprawy."
        : "Nie ma jeszcze zapisanego planu. Wybierz „Przygotuj wizytę”.",
    );
  else if (name === "saveMissingPlan")
    s.say(
      "Plan przygotowania zachowano. Brak dziecka i brak zgłoszenia do rejestru.",
    );
  else if (name.startsWith("task")) {
    if (name === "taskInsurance" && !validate()) return;
    s.attempt(() =>
      s.transact((w) => {
        const x = w.cases.find((c) => c.id === cid)!;
        x.draftData.tasks ??= {};
        x.draftData.tasks[name] =
          name === "taskSupport" ? "outOfScope" : "prepared";
      }),
    );
    s.say(
      name === "taskInsurance"
        ? "Przygotowanie zapisane. Zgłoszenie nie zostało wysłane."
        : "Lista przygotowania zapisana.",
    );
  } else if (name.startsWith("other")) {
    const label =
      name === "otherInstitutions"
        ? "Kontakt z instytucjami"
        : name === "otherSupport"
          ? "Możliwe wsparcie"
          : "Sprawy spadkowe";
    choice.value = {
      title: label,
      description:
        "Ten temat wymaga osobnego ustalenia procedury i uprawnień. Nie jest częścią demonstracji. Możesz dodać go do własnej listy.",
      confirm: "Dodaj do sprawdzenia",
      run: () => {
        s.attempt(() =>
          s.transact((w) => {
            const x = w.cases.find((c) => c.id === cid)!;
            x.draftData.otherTasks ??= {};
            if (x.draftData.otherTasks[name])
              s.say("Ten temat jest już na liście");
            else {
              x.draftData.otherTasks[name] = "notStarted";
              s.say("Dodano do listy");
            }
          }),
        );
      },
    };
  }
}
function navigate(path: string) {
  s.assistant = false;
  router.push(path);
}
function selectReport(rid: string) {
  if (!c.value) return;
  s.attempt(() =>
    s.transact((w) => {
      const x = w.cases.find((c) => c.id === props.caseId)!;
      if (w.role !== "marta") throw Error(E.DENIED);
      x.draftData.selectedReportId = rid;
      x.currentStep = "reportDetails";
      x.revision++;
    }),
  );
}
function editPlan() {
  s.attempt(() =>
    s.transact((w) => {
      const x = w.cases.find((c) => c.id === props.caseId)!;
      if (w.role !== "marta") throw Error(E.DENIED);
      x.status = "draft";
      x.currentStep = "checklist";
      x.revision++;
      E.history(w, x, "Nowa rewizja planu");
    }),
  );
}
defineExpose({ fields, change, act, validate });
</script>
<template>
  <section
    v-if="c && readable"
    class="flow-panel"
    :class="{ chat }"
    :data-case="caseId"
  >
    <div class="flow-meta">
      <span class="badge" :class="c.status">{{ statusLabels[c.status] }}</span
      ><span class="eyebrow">{{
        content ? flow?.subject : "Udostępniona sprawa"
      }}</span>
    </div>
    <p v-if="progress && content && !helper" class="step-indicator">
      {{ progress }}
    </p>
    <template v-if="!content"
      ><h2 ref="heading" tabindex="-1">Udostępniona sprawa</h2>
      <p class="muted">
        Masz dostęp wyłącznie do statusu i terminu. Treść i załączniki pozostają
        niedostępne.
      </p>
      <p v-if="c.flowId === 'F05'">
        Termin z próbki: 30 października 2026
      </p></template
    >
    <template v-else>
      <div v-if="helper" class="info-banner">
        <Icon name="shield" />
        <div>
          Pomagasz w wybranej sprawie. Końcowe zatwierdzenie pozostaje po
          stronie Marty.
        </div>
      </div>
      <h2 ref="heading" tabindex="-1">
        {{ helper ? s.title(c) : node?.title }}
      </h2>
      <p v-if="!helper" class="flow-description">{{ node?.description }}</p>
      <div
        v-if="
          c.flowId === 'F05' &&
          Date.parse(s.world.demoDate) > Date.parse('2026-10-30T23:59:59+01:00')
        "
        class="info-banner amber"
      >
        Termin wskazany w próbce minął. Demonstracja pozwala przygotować
        odpowiedź, ale nie rozstrzyga skutków opóźnienia.
      </div>
      <div v-if="busy" class="operation-state" role="status">
        <Icon name="clock" :size="30" />
        <h3>
          {{
            op?.status === "pending"
              ? "Wykonywanie — symulacja"
              : "Nie mamy potwierdzenia wyniku"
          }}
        </h3>
        <p>Najpierw sprawdź status. Nie wysyłaj ponownie.</p>
        <button
          v-if="op?.status === 'unknown'"
          class="button"
          @click="s.resolve(op.id)"
        >
          Sprawdź status
        </button>
      </div>
      <template v-else-if="helper"
        ><div v-if="s.grant(c.id, 'readContent')" class="reading-panel">
          <h3>Treść udostępnionej sprawy</h3>
          <p>
            {{
              c.flowId === "F05"
                ? flows.F05.steps.letter?.description
                : "Plan Marty: przygotowanie pytań i wizyty. Nie daje dostępu do konta ani dokumentów Jana."
            }}
          </p>
          <p
            v-if="c.flowId === 'F05' && c.draftData.responseText"
            class="preserve"
          >
            {{ verbatim(c.draftData.responseText) }}
          </p>
          <p v-if="c.flowId === 'F08'">
            {{
              c.draftData.helperNote ||
              "Lista: rejestracja zdarzenia, prawo do odpisu, wymagane dokumenty, forma odbioru."
            }}
          </p>
        </div>
        <div v-if="s.grant(c.id, 'readAttachments')" class="attachment-list">
          <button
            v-for="attachment in c.draftData.attachmentIds || []"
            :key="attachment"
            class="text-button"
            @click="preview = attachment"
          >
            <Icon name="document" />{{ attachment }} · DEMO
          </button>
        </div>
        <div v-if="s.grant(c.id, 'prepareDraft')">
          <FieldControl
            :prefix="caseId + '-helper'"
            :field="{
              key: c.flowId === 'F05' ? 'responseText' : 'helperNote',
              label: 'Twoja propozycja — dane fikcyjne',
              kind: 'textarea',
              sample:
                c.flowId === 'F05'
                  ? flows.F05.steps.draft!.fields![0]!.sample
                  : 'Przygotowałam listę pytań do wizyty · DEMO',
            }"
            :value="
              c.draftData.helperDrafts?.[role]?.data[
                c.flowId === 'F05' ? 'responseText' : 'helperNote'
              ]
            "
            @change="
              s.helperField(
                c.id,
                c.flowId === 'F05' ? 'responseText' : 'helperNote',
                $event,
              )
            "
          /><button class="button" @click="s.submitHelper(c.id)">
            Przekaż do przeglądu
          </button>
        </div></template
      >
      <template v-else>
        <div
          v-if="op?.status === 'failed' || op?.status === 'notExecuted'"
          class="info-banner amber"
        >
          Nie udało się wykonać działania. Dane zostały zachowane. Możesz
          spróbować ponownie.
        </div>
        <template
          v-if="
            role === 'marta' ||
            (role === 'piotr' &&
              c.flowId === 'F02' &&
              consent?.status === 'pending')
          "
          ><FieldControl
            v-for="field in fields"
            :key="field.key"
            :field="field"
            :prefix="caseId + (chat ? '-chat' : '')"
            :value="c.draftData[field.key]"
            :error="validation[field.key]"
            @change="change(field.key, $event)"
            @preview="preview = $event"
        /></template>
        <div
          v-if="
            c.flowId === 'F06' && viewStep === 'permissions' && role === 'marta'
          "
          class="permission-groups"
        >
          <fieldset
            v-for="cid in c.draftData.caseIds || []"
            :key="cid"
            class="field permission-group"
          >
            <legend>{{ s.title(s.getCase(cid)!) }}</legend>
            <label
              v-for="p in permissionLabels.filter(
                (p) =>
                  !(
                    s.getCase(cid)?.flowId === 'F08' &&
                    p.value === 'readAttachments'
                  ),
              )"
              :key="p.value"
              class="option"
              ><input
                type="checkbox"
                :checked="
                  (c.draftData.permissions?.[cid] || []).includes(p.value)
                "
                @change="
                  permission(
                    cid,
                    p.value as Permission,
                    ($event.target as HTMLInputElement).checked,
                  )
                "
              /><span>{{ p.label }}</span></label
            >
          </fieldset>
        </div>
        <div
          v-if="
            node?.review ||
            c.status === 'completed' ||
            (role === 'piotr' && consent?.status === 'approved')
          "
          class="summary"
        >
          <dl>
            <div v-for="row in summary" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.raw ? verbatim(row.value) : row.value }}</dd>
            </div>
          </dl>
          <template v-if="c.flowId === 'F06'"
            ><div
              v-for="scope in role === 'marta'
                ? c.draftData.caseIds || []
                : invitation?.scopes.map((s) => s.caseId) || []"
              :key="scope"
              class="scope-summary"
            >
              <strong>{{
                role === "marta"
                  ? s.title(s.getCase(scope)!)
                  : "Udostępniona sprawa"
              }}</strong>
              <p>
                {{
                  (role === "marta"
                    ? c.draftData.permissions?.[scope] || []
                    : invitation?.scopes.find((s) => s.caseId === scope)
                        ?.permissions || []
                  )
                    .map(permissionLabel)
                    .join(" · ")
                }}
              </p>
              <p>
                Dostęp do:
                {{
                  date(
                    invitation?.accessUntil ||
                      new Date(
                        Date.parse(s.world.demoDate) +
                          Number(c.draftData.duration) * 86400000,
                      ).toISOString(),
                  )
                }}
              </p>
            </div></template
          >
        </div>
        <div
          v-if="c.flowId === 'F04' && viewStep === 'preview'"
          class="notice-preview"
        >
          <PetAvatar />
          <div>
            <h3>Luna</h3>
            <p>
              Kotka pręgowana ·
              {{ c.draftData.areaId === "park" ? "Park" : "Osiedle" }} · DEMO
            </p>
            <p>Kontakt przez formularz</p>
          </div>
        </div>
        <div
          v-if="c.flowId === 'F04' && viewStep === 'reports'"
          class="report-list"
        >
          <p
            v-if="
              !s.world.reports.filter(
                (r) => r.notificationDelivery !== 'noMatch',
              ).length
            "
            class="empty-inline"
          >
            Nie ma jeszcze zgłoszeń
          </p>
          <button
            v-for="report in s.world.reports.filter(
              (r) => r.notificationDelivery !== 'noMatch',
            )"
            :key="report.id"
            class="list-row"
            @click="selectReport(report.id)"
          >
            <span
              ><strong>{{ roles[report.source] }}</strong
              ><small
                >{{
                  report.type === "sighting"
                    ? "Sygnał o zauważeniu"
                    : "Znalezienie"
                }}
                · {{ report.status }}</small
              ></span
            ><Icon name="chevron" />
          </button>
        </div>
        <div
          v-if="c.flowId === 'F04' && viewStep === 'reportDetails'"
          class="reading-panel"
        >
          <template
            v-for="report in s.world.reports.filter(
              (r) => r.id === c?.draftData.selectedReportId,
            )"
            :key="report.id"
            ><strong>{{ roles[report.source] }} · {{ date(report.at) }}</strong>
            <p>{{ report.description }}</p>
            <p v-if="report.type === 'sighting'">
              Sygnał o zauważeniu. Nie potwierdza odbioru zwierzęcia.
            </p>
            <p v-if="report.description.includes('Zapłać')" class="field-error">
              Podejrzany kontakt — nie dokonuj płatności na podstawie tej
              wiadomości
            </p></template
          >
        </div>
        <div
          v-if="
            role === 'piotr' &&
            c.flowId === 'F02' &&
            consent?.status === 'approved'
          "
          class="actions"
        >
          <button
            v-if="
              ['readyForVisit', 'appointment', 'visitBooked'].includes(
                c.currentStep,
              )
            "
            class="button secondary"
            @click="s.request(c.id, 'withdrawPassportConsent')"
          >
            Wycofaj zgodę — demo
          </button>
          <p v-else>Zmiana wymaga wyjaśnienia w punkcie obsługi — demo</p>
        </div>
        <div
          v-if="
            role === 'marta' ||
            (role === 'piotr' &&
              c.flowId === 'F02' &&
              consent?.status === 'pending') ||
            c.flowId === 'F06'
          "
          class="actions"
        >
          <button
            v-for="(action, i) in node?.actions.filter(
              (a) =>
                !(
                  c?.flowId === 'F04' &&
                  viewStep === 'reportDetails' &&
                  a.next === 'matchReview' &&
                  s.world.reports.find(
                    (r) => r.id === c?.draftData.selectedReportId,
                  )?.type === 'sighting'
                ),
            )"
            :key="action.label"
            class="button"
            :class="
              action.kind === 'danger'
                ? 'danger'
                : action.kind === 'secondary' || i > 0
                  ? 'secondary'
                  : ''
            "
            @click="act(action)"
          >
            {{ action.label }}<Icon v-if="i === 0" name="arrow" :size="18" />
          </button>
        </div>
        <button
          v-if="
            c.flowId === 'F08' && c.status === 'completed' && role === 'marta'
          "
          class="text-button"
          @click="editPlan"
        >
          Edytuj plan
        </button>
        <div
          v-if="
            role === 'marta' &&
            s.world.proposals.some((p) => p.caseId === caseId && !p.reviewed)
          "
          class="proposal-card"
        >
          <h3>Bliska osoba przygotowała propozycję</h3>
          <button
            v-for="p in s.world.proposals.filter(
              (p) => p.caseId === caseId && !p.reviewed,
            )"
            :key="p.id"
            class="button secondary"
            @click="compareId = p.id"
          >
            Porównaj wersje
          </button>
        </div>
      </template>
      <p v-if="!helper" class="demo-note">
        <Icon name="shield" :size="15" />Wszystkie działania w tym scenariuszu
        są symulowane
      </p>
    </template>
    <div class="flow-footer">
      <button
        class="text-button"
        @click="
          s.persist();
          s.say('Plan zachowano. Możesz wrócić później.');
          navigate('/cases');
        "
      >
        Zapisz i wyjdź</button
      ><button
        v-if="
          role === 'marta' &&
          !s.world.operations.some((o) => o.caseId === caseId && o.applied) &&
          E.active(c)
        "
        class="text-button muted"
        @click="
          choice = {
            title: 'Porzucić przygotowanie?',
            description: 'Zapisane odpowiedzi tego szkicu zostaną usunięte.',
            confirm: 'Porzuć',
            run: () => {
              s.discard(caseId);
              navigate('/cases');
            },
          }
        "
      >
        Porzuć szkic
      </button>
    </div>
    <details
      v-if="content && role === 'marta' && c.history.length"
      class="history"
    >
      <summary>
        Historia sprawy <span>{{ c.history.length }}</span>
      </summary>
      <ol>
        <li v-for="h in c.history.slice().reverse()" :key="h.id">
          <strong>{{ h.event }}</strong
          ><small
            >{{ h.actorId === "demo" ? "Sterowanie demo" : roles[h.actorId] }} ·
            {{ date(h.at, true) }}</small
          >
        </li>
      </ol>
    </details>
  </section>
  <section v-else class="empty-state">
    <Icon name="shield" :size="36" />
    <h2>Ta pozycja nie jest już dostępna</h2>
    <p>W tym profilu nie masz dostępu do tej czynności.</p>
    <RouterLink to="/" class="button secondary">Wróć do Startu</RouterLink>
  </section>
  <Modal v-if="preview" :title="preview" @close="preview = ''"
    ><div class="demo-file">
      <Icon name="document" :size="48" /><strong>DEMO</strong>
      <p>{{ preview }}</p>
      <p v-if="preview.includes('Lista pytań')">
        Ustal rejestrację zdarzenia, prawo do odpisu, wymagane dokumenty oraz
        formę odbioru.
      </p>
      <p v-else>Przykładowa plansza. Wyłącznie dane demonstracyjne.</p>
    </div></Modal
  >
  <Modal v-if="choice" :title="choice.title" @close="choice = null"
    ><p>{{ choice.description }}</p>
    <div class="actions">
      <button
        class="button"
        @click="
          choice.run();
          choice = null;
        "
      >
        {{ choice.confirm }}</button
      ><button class="button secondary" @click="choice = null">Wróć</button>
    </div></Modal
  >
  <Modal
    v-if="proposal && c"
    title="Porównaj wersje"
    wide
    @close="compareId = ''"
    ><p v-if="proposal.baseRevision !== c.revision" class="info-banner amber">
      Twoja odpowiedź zmieniła się od czasu utworzenia propozycji. Porównaj obie
      wersje.
    </p>
    <div class="comparison">
      <div>
        <h3>Twoja wersja</h3>
        <p class="preserve">
          {{
            c.draftData.responseText || c.draftData.helperNote || "Brak notatki"
          }}
        </p>
      </div>
      <div>
        <h3>Propozycja {{ roles[proposal.authorId] }}</h3>
        <p v-for="(value, key) in proposal.data" :key="key" class="preserve">
          {{ verbatim(value) }}
        </p>
      </div>
    </div>
    <div class="actions">
      <button
        class="button"
        @click="
          s.reviewProposal(proposal.id, true);
          compareId = '';
        "
      >
        Użyj propozycji</button
      ><button
        class="button secondary"
        @click="
          s.reviewProposal(proposal.id, false);
          compareId = '';
        "
      >
        Zachowaj moją wersję
      </button>
    </div></Modal
  >
</template>
