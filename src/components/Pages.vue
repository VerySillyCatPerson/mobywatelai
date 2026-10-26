<script setup lang="ts">
import { dateLocale, t } from "../i18n";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDemo } from "../stores/demo";
import { flows, flowIds, roles, statusLabels } from "../domain/flows";
import * as E from "../domain/engine";
import type { FlowId, Data } from "../domain/types";
import Icon from "./Icon.vue";
import CaseRow from "./CaseRow.vue";
import PetAvatar from "./PetAvatar.vue";
import FlowPanel from "./FlowPanel.vue";
import Modal from "./Modal.vue";
import DemoControls from "./DemoControls.vue";
import ReportPanel from "./ReportPanel.vue";
const s = useDemo(),
  route = useRoute(),
  router = useRouter(),
  caseTab = ref("active"),
  inboxTab = ref("all"),
  reveal = ref(false),
  search = ref(""),
  info = ref(""),
  pending = ref<{ id: string; flow: FlowId } | null>(null);
const segments = computed(() => route.path.split("/").filter(Boolean)),
  area = computed(() => segments.value[0] || "home"),
  selected = computed(() => segments.value[1] || "");
watch(
  () => route.path,
  () => {
    reveal.value = false;
    search.value = "";
    s.error = "";
    if (area.value === "inbox" && selected.value) s.readMessage(selected.value);
  },
);
const owner = computed(() => s.world.role === "marta"),
  activeCases = computed(() => s.visibleCases.filter(E.active)),
  completedCases = computed(() => s.visibleCases.filter((c) => !isActive(c))),
  documents = computed(() =>
    owner.value ? s.world.documents.filter((d) => d.ownerId === "marta") : [],
  );
const filteredCases = computed(() =>
  (caseTab.value === "active"
    ? activeCases.value
    : completedCases.value
  ).filter((c) =>
    s
      .title(c)
      .toLocaleLowerCase("pl")
      .includes(search.value.toLocaleLowerCase("pl")),
  ),
);
const attention = computed(() =>
  activeCases.value
    .filter(
      (c) => !["submitted", "submitting", "awaitingConsent"].includes(c.status),
    )
    .slice(0, 3),
);
const message = computed(() => s.messages.find((m) => m.id === selected.value)),
  document = computed(() =>
    owner.value
      ? s.world.documents.find((d) => d.id === selected.value)
      : undefined,
  ),
  child = computed(() =>
    owner.value
      ? s.world.children.find((c) => c.id === selected.value)
      : undefined,
  );
const pet = computed(() =>
  selected.value === "bruno"
    ? { name: "Bruno", description: "Pies · 6 lat" }
    : { name: "Luna", description: "Kotka · 4 lata" },
);
const isActive = E.active;
function date(v: string) {
  return new Intl.DateTimeFormat(dateLocale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date(v));
}
function age(birth: string) {
  const now = new Date(s.world.demoDate),
    b = new Date(birth);
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  if (
    now.getUTCMonth() < b.getUTCMonth() ||
    (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())
  )
    age--;
  return age < 1 ? "Noworodek" : `${age} lat`;
}
function start(id: FlowId, data: Data = {}) {
  const r = s.start(id, data);
  if (!r) return;
  if (r.existing) {
    pending.value = { id: r.id, flow: id };
    return;
  }
  router.push(`/cases/${r.id}`);
}
function openMessage() {
  if (!message.value) return;
  if (message.value.caseId) router.push(`/cases/${message.value.caseId}`);
  else if (message.value.reportId)
    router.push(`/reports/${message.value.reportId}`);
}
function explainMessage() {
  if (message.value?.caseId) s.openAssistant(message.value.caseId);
  else s.openAssistant();
}
function reportAction(rid: string, missing: boolean) {
  s.attempt(() => {
    if (!owner.value) throw Error(E.DENIED);
    if (!missing) {
      s.transact((w) => {
        const r = w.reports.find((r) => r.id === rid)!;
        r.status = "rejected";
      });
      s.say("Zgłoszenie odrzucone. Luna pozostaje w domu.");
      return;
    }
    const r = s.start("F04");
    if (r) {
      s.transact((w) => {
        const c = w.cases.find((c) => c.id === r.id)!;
        c.status = "submitted";
        c.currentStep = "reports";
        c.draftData.selectedReportId = rid;
        w.petStatus = "missing";
      });
      router.push(`/cases/${r.id}`);
    }
  });
}
</script>
<template>
  <template v-if="area === 'home'">
    <div class="page-heading home-heading">
      <div>
        <p class="eyebrow">{{ date(s.world.demoDate) }}</p>
        <h1>
          {{
            owner
              ? "Dzień dobry, Marto"
              : `Dzień dobry${["anna", "piotr"].includes(s.world.role) ? ", " + (s.world.role === "anna" ? "Anno" : "Piotrze") : ""}`
          }}<span class="greeting-dot">.</span>
        </h1>
        <p>Twoje sprawy, w jednym miejscu.</p>
      </div>
      <span class="profile-initials" aria-hidden="true">{{
        owner
          ? "MK"
          : roles[s.world.role]
              .split(" ")
              .map((v) => v[0])
              .slice(0, 2)
              .join("")
      }}</span>
    </div>
    <template v-if="owner"
      ><div class="home-grid">
        <div class="home-primary">
          <section class="attention-panel">
            <div class="section-top">
              <h2><span class="attention-mark"></span>Wymaga uwagi</h2>
              <RouterLink to="/cases" class="text-link"
                >Zobacz wszystkie <Icon name="arrow" :size="16"
              /></RouterLink>
            </div>
            <CaseRow v-for="item in attention" :key="item.id" :item="item" />
            <p v-if="!attention.length" class="empty-inline">
              Nie ma teraz spraw wymagających Twojej uwagi
            </p>
            <div
              class="deadline-note"
              v-if="
                s.world.cases.find((c) => c.id === 'letter-case')?.status !==
                'completed'
              "
            >
              <Icon name="calendar" :size="18" /><span
                >Termin odpowiedzi na pismo:
                <strong>30 października</strong></span
              >
            </div>
          </section>
          <section class="family-section">
            <div class="section-top">
              <h2>Bliscy pod Twoją opieką</h2>
              <span class="section-caption">Szybki dostęp</span>
            </div>
            <div class="family-grid">
              <RouterLink to="/children" class="family-card blue"
                ><div class="family-card-top">
                  <span class="tile-icon"><Icon name="users" :size="25" /></span
                  ><Icon name="arrow" :size="20" />
                </div>
                <div class="mini-avatars">
                  <span>Z</span><span>A</span
                  ><span v-if="s.world.children.length > 2">{{
                    s.world.children[2]?.name[0]
                  }}</span>
                </div>
                <h3>Moje dzieci</h3>
                <p>
                  {{
                    s.world.children.map((c) => c.name.split(" ")[0]).join(", ")
                  }}
                </p></RouterLink
              ><RouterLink to="/pets" class="family-card sage"
                ><div class="family-card-top">
                  <span class="tile-icon sage"
                    ><Icon name="paw" :size="25" /></span
                  ><Icon name="arrow" :size="20" />
                </div>
                <div class="pet-mini"><PetAvatar /><PetAvatar dog /></div>
                <h3>Moje zwierzęta</h3>
                <p>Luna i Bruno</p></RouterLink
              >
            </div>
          </section>
          <section>
            <div class="section-top">
              <h2>Twoje sprawy</h2>
              <RouterLink to="/cases" class="text-link"
                >Wszystkie <Icon name="arrow" :size="16"
              /></RouterLink>
            </div>
            <div class="panel">
              <CaseRow
                v-for="item in activeCases.slice(0, 3)"
                :key="item.id"
                :item="item"
              />
              <div v-if="!activeCases.length" class="empty-inline">
                Nie masz spraw w toku
              </div>
              <RouterLink to="/services" class="list-row new-case"
                ><span class="tile-icon"><Icon name="plus" /></span
                ><strong>Rozpocznij nową sprawę</strong
                ><Icon name="chevron" :size="18"
              /></RouterLink>
            </div>
          </section>
        </div>
        <aside class="home-aside">
          <section class="document-shortcut">
            <div class="section-top">
              <h2>Twój dokument</h2>
              <RouterLink to="/documents" class="text-link"
                >Wszystkie</RouterLink
              >
            </div>
            <RouterLink to="/documents/marta-id" class="concept-document"
              ><div class="doc-topline">
                <span>mDowód</span><span class="demo-chip">DEMO</span>
              </div>
              <div class="document-art" aria-hidden="true">
                <span class="art-orbit"></span><Icon name="shield" :size="40" />
              </div>
              <div class="document-bottom">
                <span
                  ><small>Profil demonstracyjny</small
                  ><strong>Marta Kowalska</strong></span
                ><Icon name="arrow" /></div
            ></RouterLink>
            <p class="document-caption">
              <Icon name="shield" :size="14" />Dane ukryte do chwili otwarcia
            </p>
          </section>
          <section class="assistant-teaser">
            <span class="assistant-spark"
              ><Icon name="assistant" :size="28" /><i>✦</i></span
            >
            <h2>Możemy przejść<br />przez to razem.</h2>
            <p>Asystent pomoże Ci przygotować sprawę, krok po kroku.</p>
            <button class="button secondary" @click="s.openAssistant()">
              Zapytaj asystenta <Icon name="arrow" :size="18" /></button
            ><span class="small-muted">Odpowiedzi symulowane</span>
          </section>
        </aside>
      </div></template
    >
    <template
      v-else-if="['finder', 'vet', 'shelter', 'police'].includes(s.world.role)"
      ><ReportPanel
    /></template>
    <template v-else
      ><section class="panel section-pad">
        <div class="section-top">
          <h2>Sprawy bliskich</h2>
          <Icon name="users" />
        </div>
        <CaseRow v-for="item in s.visibleCases" :key="item.id" :item="item" />
        <div v-if="!s.visibleCases.length" class="empty-state">
          <Icon name="users" :size="36" />
          <h3>Nie masz teraz udostępnionych spraw</h3>
          <p>Zaproszenia i prośby o zgodę pojawią się tutaj.</p>
        </div>
      </section></template
    >
  </template>
  <template v-else-if="area === 'cases' && selected"
    ><div class="detail-heading">
      <RouterLink to="/cases" class="text-button"
        ><Icon name="back" :size="18" />Sprawy</RouterLink
      ><button class="text-button" @click="s.openAssistant(selected)">
        <Icon name="assistant" :size="18" />Wyjaśnij z asystentem
      </button>
    </div>
    <div class="narrow panel section-pad"><FlowPanel :case-id="selected" /></div
  ></template>
  <template v-else-if="area === 'cases'"
    ><div class="page-heading">
      <div>
        <p class="eyebrow">Wszystko pod kontrolą</p>
        <h1>Twoje sprawy</h1>
        <p>Sprawdź etap i wróć do przygotowania.</p>
      </div>
      <button v-if="owner" class="button" @click="router.push('/services')">
        <Icon name="plus" :size="19" />Nowa sprawa
      </button>
    </div>
    <div class="tabs" role="tablist" aria-label="Status spraw">
      <button
        role="tab"
        :aria-selected="caseTab === 'active'"
        :tabindex="caseTab === 'active' ? 0 : -1"
        :class="{ active: caseTab === 'active' }"
        @click="caseTab = 'active'"
        @keydown.right="
          caseTab = 'completed';
          (
            ($event.currentTarget as HTMLElement)
              .nextElementSibling as HTMLElement
          )?.focus();
        "
      >
        W toku <span>{{ activeCases.length }}</span></button
      ><button
        role="tab"
        :aria-selected="caseTab === 'completed'"
        :tabindex="caseTab === 'completed' ? 0 : -1"
        :class="{ active: caseTab === 'completed' }"
        @click="caseTab = 'completed'"
        @keydown.left="
          caseTab = 'active';
          (
            ($event.currentTarget as HTMLElement)
              .previousElementSibling as HTMLElement
          )?.focus();
        "
      >
        Zakończone <span>{{ completedCases.length }}</span>
      </button>
    </div>
    <label class="search-field"
      ><Icon name="search" :size="20" /><input
        v-model="search"
        type="search"
        aria-label="Szukaj sprawy"
        placeholder="Szukaj sprawy"
    /></label>
    <div
      class="panel"
      role="tabpanel"
      :aria-label="caseTab === 'active' ? 'W toku' : 'Zakończone'"
    >
      <CaseRow v-for="item in filteredCases" :key="item.id" :item="item" />
      <div v-if="!filteredCases.length" class="empty-state">
        <Icon name="cases" :size="40" />
        <h2>
          {{
            caseTab === "active"
              ? "Nie masz spraw w toku"
              : "Nie masz jeszcze zakończonych spraw"
          }}
        </h2>
        <p>Nowe i zapisane sprawy będą widoczne w tym miejscu.</p>
      </div>
    </div></template
  >
  <template v-else-if="area === 'documents' && selected"
    ><RouterLink to="/documents" class="text-button back-link"
      ><Icon name="back" :size="18" />Dokumenty</RouterLink
    >
    <div v-if="document" class="narrow panel section-pad">
      <span class="eyebrow">{{
        document.ownerId === "marta"
          ? "Twój dokument"
          : s.world.children.find((c) => c.id === document?.ownerId)?.name
      }}</span>
      <h1>{{ document.title }}</h1>
      <div class="concept-document detail-document">
        <div class="doc-topline">
          <span>{{ document.title }}</span
          ><span class="demo-chip">DEMO</span>
        </div>
        <div class="document-art"><Icon name="shield" :size="52" /></div>
        <div class="document-bottom">
          <span
            ><small>{{ reveal ? "Dane demonstracyjne" : "Dane ukryte" }}</small
            ><strong>{{
              reveal
                ? document.ownerId === "marta"
                  ? "Marta Kowalska"
                  : s.world.children.find((c) => c.id === document?.ownerId)
                      ?.name
                : "•••• ••••••••"
            }}</strong></span
          >
        </div>
      </div>
      <button class="text-button" @click="reveal = !reveal">
        <Icon name="eye" :size="18" />{{ reveal ? "Ukryj dane" : "Pokaż dane" }}
      </button>
      <div class="summary">
        <dl>
          <div>
            <dt>Status</dt>
            <dd>
              {{
                document.status === "valid"
                  ? "Ważny"
                  : document.status === "lossReported"
                    ? "Utrata zgłoszona"
                    : "Zastąpiony w demonstracji"
              }}
            </dd>
          </div>
          <div v-if="document.expiresAt">
            <dt>Ważny do</dt>
            <dd>{{ date(document.expiresAt) }}</dd>
          </div>
          <div v-if="reveal">
            <dt>Numer</dt>
            <dd>{{ document.number }}</dd>
          </div>
        </dl>
      </div>
      <div class="actions">
        <button
          v-if="
            document.ownerId === 'zosia' &&
            ['zosia-passport', 'zosia-school-card'].includes(document.id)
          "
          class="button"
          @click="start('F01', { childId: 'zosia', documentId: document.id })"
        >
          Zgłoś utratę dokumentu</button
        ><button
          class="button secondary"
          @click="
            info =
              'Ta funkcja nie jest dostępna w demonstracji. Skaner się nie uruchomi.'
          "
        >
          Potwierdź dane</button
        ><button
          v-if="document.ownerId === 'zosia'"
          class="text-button"
          @click="
            info =
              'Udostępnianie spraw dziecka nie jest częścią tego wariantu demonstracji.'
          "
        >
          Udostępnij
        </button>
      </div>
    </div>
    <div v-else class="empty-state">
      <h1>Dokument jest niedostępny</h1>
    </div></template
  >
  <template v-else-if="area === 'documents'"
    ><div class="page-heading">
      <div>
        <p class="eyebrow">Zawsze pod ręką</p>
        <h1>Dokumenty</h1>
        <p>Twoje dokumenty i pojazdy demonstracyjne.</p>
      </div>
      <Icon name="documents" :size="36" />
    </div>
    <template v-if="owner"
      ><div class="documents-grid">
        <RouterLink to="/documents/marta-id" class="concept-document"
          ><div class="doc-topline">
            <span>mDowód</span><span class="demo-chip">DEMO</span>
          </div>
          <div class="document-art">
            <span class="art-orbit"></span><Icon name="shield" :size="45" />
          </div>
          <div class="document-bottom">
            <span><small>Dane ukryte</small><strong>Twój dokument</strong></span
            ><Icon name="arrow" /></div
        ></RouterLink>
        <div class="panel">
          <RouterLink
            v-for="doc in documents.filter((d) => d.id !== 'marta-id')"
            :key="doc.id"
            :to="`/documents/${doc.id}`"
            class="list-row"
            ><span class="tile-icon"><Icon name="document" /></span
            ><span class="row-main"
              ><strong>{{ doc.title }}</strong
              ><small>Ważny · Marta Kowalska</small></span
            ><Icon name="chevron" :size="18"
          /></RouterLink>
        </div>
      </div>
      <section class="section-gap">
        <h2>Dokumenty dzieci</h2>
        <div class="panel">
          <RouterLink
            v-for="doc in s.world.documents.filter(
              (d) => d.ownerId === 'zosia',
            )"
            :key="doc.id"
            :to="`/documents/${doc.id}`"
            class="list-row"
            ><span class="tile-icon lilac"><Icon name="document" /></span
            ><span class="row-main"
              ><strong>{{ doc.title }}</strong
              ><small
                >Zosia Kowalska ·
                {{
                  doc.status === "valid"
                    ? "Ważny"
                    : doc.status === "lossReported"
                      ? "Utrata zgłoszona"
                      : "Zastąpiony w demonstracji"
                }}</small
              ></span
            ><Icon name="chevron" :size="18"
          /></RouterLink>
        </div>
      </section>
      <section class="section-gap">
        <h2>Pojazdy</h2>
        <button
          class="panel list-row full-width"
          @click="
            info =
              'Toyota Corolla · DEMO. Ten profil służy wyłącznie do odczytu. Nie łączymy się z rejestrem pojazdów.'
          "
        >
          <span class="tile-icon sage"><Icon name="car" /></span
          ><span class="row-main"
            ><strong>Toyota Corolla</strong
            ><small>Pojazd demonstracyjny</small></span
          ><Icon name="chevron" :size="18" />
        </button></section
    ></template>
    <div v-else class="empty-state">
      <Icon name="shield" :size="36" />
      <h2>Dokumenty są niedostępne w tym profilu</h2>
      <p>Dostęp do sprawy nie daje dostępu do dokumentów właścicielki.</p>
    </div></template
  >
  <template v-else-if="area === 'children' && selected"
    ><RouterLink to="/children" class="text-button back-link"
      ><Icon name="back" :size="18" />Moje dzieci</RouterLink
    ><template v-if="child"
      ><div class="profile-header">
        <span class="child-avatar large">{{ child.name[0] }}</span>
        <div>
          <p class="eyebrow">Profil dziecka · DEMO</p>
          <h1>{{ child.name }}</h1>
          <p>{{ age(child.birthDate) }} · ur. {{ date(child.birthDate) }}</p>
        </div>
      </div>
      <section class="section-gap">
        <h2>Dokumenty</h2>
        <div class="panel">
          <RouterLink
            v-for="doc in s.world.documents.filter(
              (d) => d.ownerId === child?.id,
            )"
            :key="doc.id"
            :to="`/documents/${doc.id}`"
            class="list-row"
            ><span class="tile-icon"><Icon name="document" /></span
            ><span class="row-main"
              ><strong>{{ doc.title }}</strong
              ><small>{{
                doc.status === "valid"
                  ? "Ważny"
                  : doc.status === "lossReported"
                    ? "Utrata zgłoszona"
                    : "Zastąpiony w demonstracji"
              }}</small></span
            ><Icon name="chevron"
          /></RouterLink>
          <p
            v-if="!s.world.documents.some((d) => d.ownerId === child?.id)"
            class="empty-inline"
          >
            Brak dokumentów w tym wariancie demonstracji
          </p>
        </div>
      </section>
      <section class="section-gap">
        <h2>Sprawy w toku</h2>
        <div class="panel">
          <CaseRow
            v-for="item in activeCases.filter((c) => c.subjectId === child?.id)"
            :key="item.id"
            :item="item"
          />
          <p
            v-if="!activeCases.some((c) => c.subjectId === child?.id)"
            class="empty-inline"
          >
            Nie ma spraw w toku
          </p>
        </div>
      </section>
      <section class="section-gap">
        <h2>Dostępne działania</h2>
        <div v-if="child.id === 'zosia'" class="actions">
          <button class="button" @click="start('F01', { childId: 'zosia' })">
            Zgłoś utratę dokumentu</button
          ><button
            class="button secondary"
            @click="start('F02', { childId: 'zosia' })"
          >
            Przygotuj nowy paszport
          </button>
        </div>
        <p v-else class="info-banner">
          {{
            child.id === "adam"
              ? "Dla Adama nie przygotowano tego scenariusza."
              : "Dokument noworodka ma osobny plan przygotowania w sprawie narodzin."
          }}
        </p>
      </section></template
    >
    <div v-else class="empty-state">
      <h1>Profil jest niedostępny</h1>
    </div></template
  >
  <template v-else-if="area === 'children'"
    ><div class="page-heading">
      <div>
        <p class="eyebrow">Bliscy pod Twoją opieką</p>
        <h1>Moje dzieci</h1>
        <p>Dokumenty i sprawy Twoich dzieci.</p>
      </div>
      <Icon name="users" :size="36" />
    </div>
    <div v-if="owner" class="profile-grid">
      <RouterLink
        v-for="(person, i) in s.world.children"
        :key="person.id"
        :to="`/children/${person.id}`"
        class="profile-card"
        ><span class="child-avatar" :class="{ peach: i % 2 === 1 }">{{
          person.name[0]
        }}</span>
        <h2>{{ person.name }}</h2>
        <p>{{ age(person.birthDate) }}</p>
        <div class="profile-card-bottom">
          <span
            >{{
              activeCases.filter((c) => c.subjectId === person.id).length
            }}
            spraw w toku</span
          ><Icon name="arrow" :size="20" /></div
      ></RouterLink>
    </div>
    <p v-else class="info-banner">
      W tym profilu nie masz dostępu do dzieci Marty.
    </p></template
  >
  <template v-else-if="area === 'pets' && selected"
    ><RouterLink to="/pets" class="text-button back-link"
      ><Icon name="back" :size="18" />Moje zwierzęta</RouterLink
    ><template v-if="owner && ['luna', 'bruno'].includes(selected)"
      ><div class="profile-header">
        <PetAvatar large :dog="selected === 'bruno'" />
        <div>
          <p class="eyebrow">Profil zwierzęcia · DEMO</p>
          <h1>{{ pet.name }}</h1>
          <p>{{ pet.description }}</p>
          <span
            class="badge"
            :class="
              s.world.petStatus === 'missing' && selected === 'luna'
                ? 'needsInput'
                : 'completed'
            "
            >{{
              selected === "bruno" || s.world.petStatus === "home"
                ? "W domu"
                : "Zaginiona"
            }}</span
          >
        </div>
      </div>
      <template v-if="selected === 'luna'"
        ><div class="profile-detail-grid">
          <section class="panel section-pad">
            <span class="tile-icon sage"><Icon name="shield" /></span>
            <h2>Mikroczip</h2>
            <p class="muted">
              Numer, rejestr i kontakt to osobne informacje. Telefon nie
              odczytuje mikroczipa.
            </p>
            <div
              v-for="reg in ['registry-a', 'registry-b']"
              :key="reg"
              class="registry-row"
            >
              <strong
                >Rejestr {{ reg === "registry-a" ? "A" : "B" }} · DEMO</strong
              >
              <p v-if="s.world.registries[reg]">
                {{ s.world.registries[reg].chipNumber }}<br />{{
                  s.world.registries[reg].contactId === "contact-a"
                    ? "Kontakt demonstracyjny A"
                    : "Kontakt demonstracyjny B"
                }}
              </p>
              <p v-else class="muted">Brak wpisu</p>
              <button
                class="text-button"
                @click="start('F03', { petId: 'luna', registryId: reg })"
              >
                {{ s.world.registries[reg] ? "Otwórz wpis" : "Zarejestruj chip"
                }}<Icon name="arrow" :size="16" />
              </button>
            </div>
          </section>
          <section class="panel section-pad">
            <span class="tile-icon"><Icon name="qr" /></span>
            <h2>Zawieszka QR</h2>
            <p class="muted">
              Osobna zawieszka umożliwia kontakt przez formularz demonstracyjny.
            </p>
            <span
              class="badge"
              :class="
                s.world.tags.some((t) => t.status === 'active')
                  ? 'completed'
                  : 'draft'
              "
              >{{
                s.world.tags.some((t) => t.status === "active")
                  ? "Aktywna"
                  : "Nieaktywna"
              }}</span
            ><button class="button secondary" @click="start('Q01')">
              Zarządzaj zawieszką
            </button>
          </section>
        </div>
        <section class="section-gap">
          <div class="section-top">
            <h2>Sprawy Luny</h2>
            <button class="text-button" @click="start('F04')">
              {{
                s.world.petStatus === "missing"
                  ? "Otwórz poszukiwania"
                  : "Zgłoś zaginięcie"
              }}<Icon name="arrow" :size="16" />
            </button>
          </div>
          <div class="panel">
            <CaseRow
              v-for="item in activeCases.filter((c) => c.subjectId === 'luna')"
              :key="item.id"
              :item="item"
            />
            <p
              v-if="!activeCases.some((c) => c.subjectId === 'luna')"
              class="empty-inline"
            >
              Nie ma spraw w toku
            </p>
          </div>
        </section>
        <section class="section-gap">
          <h2>Kontakt i terminy</h2>
          <div class="panel section-pad">
            <p>Dokumentacja i szczepienia: dane przykładowe do sprawdzenia.</p>
            <p>Kontakt publiczny nie zawiera telefonu ani adresu opiekuna.</p>
          </div>
        </section></template
      >
      <div v-else class="info-banner">
        Ten scenariusz pokazujemy na profilu Luny
      </div></template
    >
    <div v-else class="empty-state">
      <h1>Profil jest niedostępny</h1>
    </div></template
  >
  <template v-else-if="area === 'pets'"
    ><div class="page-heading">
      <div>
        <p class="eyebrow">Twoi mali towarzysze</p>
        <h1>Moje zwierzęta</h1>
        <p>Identyfikacja, dokumenty i bezpieczny kontakt.</p>
      </div>
      <Icon name="paw" :size="36" />
    </div>
    <div v-if="owner" class="profile-grid">
      <RouterLink
        v-for="dog in [false, true]"
        :key="String(dog)"
        :to="dog ? '/pets/bruno' : '/pets/luna'"
        class="profile-card pet-card"
        ><PetAvatar :dog="dog" large />
        <h2>{{ dog ? "Bruno" : "Luna" }}</h2>
        <p>{{ dog ? "Pies · 6 lat" : "Kotka · 4 lata" }}</p>
        <div class="profile-card-bottom">
          <span>{{
            dog || s.world.petStatus === "home" ? "W domu" : "Zaginiona"
          }}</span
          ><Icon name="arrow" :size="20" /></div
      ></RouterLink>
    </div>
    <p v-else class="info-banner">
      Profile zwierząt są niedostępne w tym profilu.
    </p></template
  >
  <template v-else-if="area === 'inbox' && selected"
    ><RouterLink to="/inbox" class="text-button back-link"
      ><Icon name="back" :size="18" />Skrzynka</RouterLink
    >
    <div v-if="message" class="narrow panel section-pad letter-panel">
      <p class="eyebrow">{{ message.sender }}</p>
      <h1>{{ message.subject }}</h1>
      <p class="muted">{{ date(message.at) }}</p>
      <div class="letter-body">{{ message.body }}</div>
      <div class="actions">
        <button class="button" @click="openMessage">
          {{ message.reportId ? "Sprawdź zgłoszenie" : "Otwórz sprawę"
          }}<Icon name="arrow" :size="18" /></button
        ><button class="button secondary" @click="explainMessage">
          Wyjaśnij z asystentem
        </button>
      </div>
    </div>
    <div v-else class="empty-state">
      <h1>Ta pozycja nie jest już dostępna</h1>
    </div></template
  >
  <template v-else-if="area === 'inbox'"
    ><div class="page-heading">
      <div>
        <p class="eyebrow">Wiadomości i potwierdzenia</p>
        <h1>Skrzynka</h1>
        <p>
          {{
            s.unread
              ? s.unread + " nieprzeczytanych wiadomości"
              : "Wszystkie wiadomości przeczytane"
          }}
        </p>
      </div>
      <Icon name="mail" :size="36" />
    </div>
    <div class="tabs">
      <button
        :class="{ active: inboxTab === 'all' }"
        :aria-pressed="inboxTab === 'all'"
        @click="inboxTab = 'all'"
      >
        Wszystkie <span>{{ s.messages.length }}</span></button
      ><button
        :class="{ active: inboxTab === 'unread' }"
        :aria-pressed="inboxTab === 'unread'"
        @click="inboxTab = 'unread'"
      >
        Nieprzeczytane <span>{{ s.unread }}</span>
      </button>
    </div>
    <div class="panel">
      <RouterLink
        v-for="m in s.messages.filter((m) => inboxTab === 'all' || m.isUnread)"
        :key="m.id"
        :to="`/inbox/${m.id}`"
        class="list-row message-row"
        :class="{ unread: m.isUnread }"
        @click="s.readMessage(m.id)"
        ><span class="tile-icon"><Icon name="mail" /></span
        ><span class="row-main"
          ><span class="message-sender"
            >{{ m.sender
            }}<span v-if="m.isUnread" class="unread-label">Nowa</span></span
          ><strong>{{ m.subject }}</strong
          ><small>{{ date(m.at) }}</small></span
        ><Icon name="chevron" :size="18"
      /></RouterLink>
      <div
        v-if="
          !s.messages.filter((m) => inboxTab === 'all' || m.isUnread).length
        "
        class="empty-state"
      >
        <Icon name="mail" :size="38" />
        <h2>Nie ma wiadomości</h2>
        <p>Potwierdzenia i zaproszenia pojawią się tutaj.</p>
      </div>
    </div></template
  >
  <template v-else-if="area === 'reports'"
    ><div
      v-if="
        owner &&
        s.world.reports.find(
          (r) => r.id === selected && r.notificationDelivery !== 'noMatch',
        )
      "
      class="narrow panel section-pad"
    >
      <h1>Zgłoszenie dotyczące Luny</h1>
      <template
        v-for="r in s.world.reports.filter((r) => r.id === selected)"
        :key="r.id"
        ><p>{{ r.description }}</p>
        <p class="muted">{{ roles[r.source] }} · {{ date(r.at) }}</p>
        <div
          v-if="!s.world.cases.some((c) => c.flowId === 'F04' && isActive(c))"
          class="info-banner"
        >
          Zgłoszono znalezienie Luny. Nie masz aktywnego ogłoszenia.
        </div>
        <div class="actions">
          <button class="button" @click="reportAction(r.id, true)">
            Luna rzeczywiście zaginęła</button
          ><button
            class="button secondary"
            @click="
              info = 'Odrzucenie raportu nie zmieni statusu Luny.';
              reportAction(r.id, false);
            "
          >
            Luna jest ze mną
          </button>
        </div></template
      >
    </div>
    <div v-else class="empty-state">
      <h1>Ta pozycja nie jest już dostępna</h1>
    </div></template
  >
  <template v-else-if="area === 'services'"
    ><div class="page-heading">
      <div>
        <p class="eyebrow">Krok po kroku</p>
        <h1>W czym możemy pomóc?</h1>
        <p>Wybierz jedną ze spraw demonstracyjnych.</p>
      </div>
    </div>
    <div class="services-grid">
      <button
        v-for="fid in flowIds"
        :key="fid"
        class="service-card"
        @click="start(fid)"
      >
        <span
          class="tile-icon"
          :class="
            ['F03', 'F04', 'Q01'].includes(fid)
              ? 'sage'
              : ['F07', 'F08'].includes(fid)
                ? 'peach'
                : ''
          "
          ><Icon :name="flows[fid].icon" :size="25"
        /></span>
        <h2>{{ flows[fid].name }}</h2>
        <p>{{ flows[fid].description }}</p>
        <span class="service-card-bottom"
          >Otwórz sprawę <Icon name="arrow" :size="18"
        /></span>
      </button></div
  ></template>
  <template v-else-if="area === 'demo'"><DemoControls /></template>
  <template v-else-if="area === 'report'"><ReportPanel /></template>
  <template v-else-if="area === 'more'"
    ><div class="page-heading">
      <div>
        <p class="eyebrow">Dopasuj demonstrację</p>
        <h1>Więcej</h1>
        <p>Pozostałe funkcje i informacje o koncepcji.</p>
      </div>
      <Icon name="more" :size="36" />
    </div>
    <div class="panel more-list">
      <RouterLink to="/services" class="list-row"
        ><span class="tile-icon"><Icon name="plus" /></span
        ><span class="row-main"
          ><strong>Wszystkie sprawy</strong
          ><small>Dostępne demonstracje i zawieszka QR</small></span
        ><Icon name="chevron" /></RouterLink
      ><RouterLink to="/trusted" class="list-row"
        ><span class="tile-icon lilac"><Icon name="users" /></span
        ><span class="row-main"
          ><strong>Bliskie osoby</strong
          ><small>Zakres pomocy i aktywne udostępnienia</small></span
        ><Icon name="chevron" /></RouterLink
      ><RouterLink to="/demo" class="list-row"
        ><span class="tile-icon sage"><Icon name="settings" /></span
        ><span class="row-main"
          ><strong>Sterowanie demonstracją</strong
          ><small>Role, zegar i zdarzenia przykładowe</small></span
        ><Icon name="chevron" /></RouterLink
      ><button
        class="list-row full-width"
        @click="
          info =
            'To niezależna koncepcja, nie oficjalna usługa administracji. Wszystkie dane i działania są fikcyjne. Postęp zapisujemy tylko w Twojej przeglądarce. Asystent korzysta z przygotowanych scenariuszy. Nie podłączamy rejestrów ani modeli AI.'
        "
      >
        <span class="tile-icon peach"><Icon name="help" /></span
        ><span class="row-main"
          ><strong>O prototypie</strong
          ><small>Założenia, prywatność i zakres</small></span
        ><Icon name="chevron" />
      </button>
    </div>
    <div class="about-card">
      <span class="wordmark">m<span>O</span>bywatel</span
      ><span class="demo-chip">KONCEPCJA</span>
      <p>
        Zaprojektowane wokół Twoich spraw.<br />Prototyp działa wyłącznie na
        danych fikcyjnych.
      </p>
    </div></template
  >
  <template v-else-if="area === 'trusted'"
    ><div class="page-heading">
      <div>
        <p class="eyebrow">Pomoc na Twoich zasadach</p>
        <h1>Bliskie osoby</h1>
        <p>Udostępniaj konkretne sprawy i wybrane uprawnienia.</p>
      </div>
      <button v-if="owner" class="button" @click="start('F06')">
        <Icon name="plus" :size="18" />Dodaj bliską osobę
      </button>
    </div>
    <div class="panel">
      <div
        v-for="g in s.world.grants.filter(
          (g) => owner || g.recipient === s.world.role,
        )"
        :key="g.id"
        class="list-row"
      >
        <span class="child-avatar small">{{ roles[g.recipient][0] }}</span
        ><span class="row-main"
          ><strong>{{ roles[g.recipient] }}</strong
          ><small
            >{{
              g.status === "active"
                ? "Dostęp aktywny"
                : g.status === "expired"
                  ? "Dostęp wygasł"
                  : "Dostęp cofnięty"
            }}
            · do {{ date(g.expiresAt) }}</small
          ><small>{{ g.permissions.join(" · ") }}</small></span
        ><button
          v-if="owner && g.status === 'active'"
          class="text-button"
          @click="
            start('F06', {
              recipient: g.recipient,
              caseIds: [g.caseId],
              permissions: { [g.caseId]: g.permissions },
            })
          "
        >
          Zarządzaj
        </button>
      </div>
      <p
        v-if="
          !s.world.grants.filter((g) => owner || g.recipient === s.world.role)
            .length
        "
        class="empty-inline"
      >
        Nie ma jeszcze aktywnych udostępnień
      </p>
    </div></template
  >
  <template v-else
    ><div class="empty-state">
      <Icon name="search" :size="40" />
      <h1>Nie znaleziono strony</h1>
      <RouterLink to="/" class="button">Wróć do Startu</RouterLink>
    </div></template
  >
  <Modal v-if="info" title="Informacja o demonstracji" @close="info = ''"
    ><p>{{ info }}</p>
    <button class="button secondary" @click="info = ''">Wróć</button></Modal
  >
  <Modal
    v-if="pending"
    title="Masz już rozpoczętą sprawę"
    @close="pending = null"
    ><p>
      Kontynuować zapisany postęp? Dla zakończonej sprawy otworzymy poprzedni
      rezultat.
    </p>
    <div class="actions">
      <button
        class="button"
        @click="
          router.push(`/cases/${pending.id}`);
          pending = null;
        "
      >
        Kontynuuj</button
      ><button class="button secondary" @click="pending = null">Wróć</button>
    </div></Modal
  >
</template>
