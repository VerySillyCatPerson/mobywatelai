<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useDemo } from "../stores/demo";
import { flows, roles, statusLabels } from "../domain/flows";
import { canRead, canContent, currentConsent } from "../domain/engine";
import Icon from "./Icon.vue";
const route = useRoute(),
  s = useDemo();
const caseRecord = computed(() => {
  const id = s.assistant
    ? s.assistantCase
    : route.path.startsWith("/cases/")
      ? route.path.split("/")[2]
      : "";
  return s.getCase(id || "");
});
const screen = computed(() => {
  if (s.confirmation)
    return {
      title: "Zatwierdzenie działania",
      label: "Potwierdzenie",
      description:
        "Ostatni krok przed wykonaniem wybranej czynności w fikcyjnym świecie prototypu.",
      actions: [
        "Sprawdź podsumowanie i skutki działania.",
        "Zatwierdź symulację lub wróć bez wykonywania czynności.",
        "Po zatwierdzeniu zobacz wynik albo informację o błędzie.",
      ],
      icon: "shield",
    };
  if (s.assistant && !caseRecord.value)
    return {
      title: "Asystent",
      label: "Pomoc w rozmowie",
      description:
        "Dodatkowy sposób przejścia przez te same sprawy, które są dostępne na ekranach aplikacji.",
      actions: [
        "Wybierz temat z podpowiedzi lub wpisz przykładową prośbę.",
        "Uzupełniaj pola i zatwierdzaj kolejne kroki w panelu rozmowy.",
        "Wróć do formularza — postęp i dane pozostaną wspólne.",
      ],
      icon: "assistant",
    };
  const c = caseRecord.value;
  if (c && canRead(s.world, c)) {
    if (!canContent(s.world, c))
      return {
        title: "Udostępniona sprawa",
        label: "Ograniczony dostęp",
        description:
          "Ten profil ma dostęp do statusu i terminu. Treść sprawy i załączniki pozostają ukryte.",
        actions: [
          "Sprawdź bieżący status sprawy.",
          "Zobacz termin, jeśli został wskazany.",
          "Zakres widoku wynika z uprawnień przyznanych przez Martę.",
        ],
        icon: "shield",
      };
    const flow = flows[c.flowId],
      step =
        flow.steps[
          c.flowId === "F02" &&
          s.world.role === "piotr" &&
          currentConsent(s.world, c)?.status === "pending"
            ? "consentDecision"
            : c.currentStep
        ];
    return {
      title: step?.title || flow.name,
      label: s.assistant ? "Sprawa w asystencie" : flow.name,
      description: step?.description || flow.description,
      actions: step?.actions.map((a) => a.label) || [],
      icon: flow.icon,
    };
  }
  const [area, detail] = route.path.split("/").filter(Boolean);
  const screens: Record<
    string,
    {
      title: string;
      label: string;
      description: string;
      actions: string[];
      icon: string;
    }
  > = {
    home: {
      title: "Start",
      label: "Pulpit użytkownika",
      description:
        "Najważniejsze sprawy, dokumenty i osoby pod opieką w jednym miejscu. To punkt wyjścia do całej demonstracji.",
      actions: [
        "Sprawdź sprawy wymagające uwagi i zbliżające się terminy.",
        "Przejdź do profili dzieci lub zwierząt.",
        "Kontynuuj zapisaną sprawę albo rozpocznij nową.",
        "Otwórz dokument lub poproś asystenta o pomoc.",
      ],
      icon: "home",
    },
    documents: {
      title: detail ? "Szczegóły dokumentu" : "Dokumenty",
      label: "Dokumenty i pojazdy",
      description:
        "Przegląd fikcyjnych dokumentów Marty i Zosi. Dane na kartach są domyślnie ukryte.",
      actions: detail
        ? [
            "Świadomie pokaż lub ukryj dane demonstracyjne.",
            "Sprawdź właściciela, status i termin ważności.",
            "Z dokumentu Zosi rozpocznij zgłoszenie utraty.",
          ]
        : [
            "Otwórz mDowód, prawo jazdy lub Kartę Dużej Rodziny.",
            "Sprawdź dokumenty Zosi wraz z ich aktualnym statusem.",
            "Zobacz przykładowy profil pojazdu.",
          ],
      icon: "documents",
    },
    children: {
      title: detail ? "Profil dziecka" : "Moje dzieci",
      label: "Rodzina",
      description:
        "Dokumenty i sprawy są przypisane do konkretnego dziecka. Nowy profil pojawia się po potwierdzeniu zgłoszenia narodzin.",
      actions: [
        "Wybierz Zosię lub Adama i sprawdź ich profil.",
        "Dla Zosi zgłoś utratę paszportu lub legitymacji.",
        "Przygotuj nowy paszport, z osobnym etapem zgody Piotra.",
      ],
      icon: "users",
    },
    pets: {
      title: detail ? "Profil zwierzęcia" : "Moje zwierzęta",
      label: "Opieka nad zwierzętami",
      description:
        "Identyfikacja, wpisy w rejestrach i bezpieczny kontakt. Pełny scenariusz pokazujemy na profilu Luny.",
      actions: [
        "Zarejestruj mikroczip Luny lub zmień kontakt przy wpisie.",
        "Osobno aktywuj, wyłącz lub wymień zawieszkę QR.",
        "Przygotuj ogłoszenie zaginięcia i przejrzyj zgłoszenia.",
        "Potwierdź powrót zwierzęcia do domu.",
      ],
      icon: "paw",
    },
    cases: {
      title: "Twoje sprawy",
      label: "Postęp i historia",
      description:
        "Wspólna lista spraw rozpoczętych w formularzach i przez asystenta. Liczniki i statusy wynikają z aktualnych danych.",
      actions: [
        "Przełącz widok „W toku” i „Zakończone”.",
        "Wyszukaj sprawę i wróć do zapisanego kroku.",
        "Otwórz rezultat oraz historię zakończonej sprawy.",
      ],
      icon: "cases",
    },
    inbox: {
      title: detail ? "Szczegóły wiadomości" : "Skrzynka",
      label: "Wiadomości i potwierdzenia",
      description:
        "Pisma, zaproszenia i wyniki działań zapisane w demonstracji. Otwarcie wiadomości nie zmienia statusu powiązanej sprawy.",
      actions: [
        "Filtruj wszystkie lub nieprzeczytane wiadomości.",
        "Sprawdź nadawcę, treść i datę pisma.",
        "Otwórz powiązaną sprawę lub wyjaśnij pismo z asystentem.",
      ],
      icon: "mail",
    },
    more: {
      title: "Więcej",
      label: "Pozostałe funkcje",
      description:
        "Dostęp do katalogu spraw, pomocy bliskich osób i narzędzi prezentacji.",
      actions: [
        "Zobacz wszystkie dostępne scenariusze.",
        "Sprawdź udostępnienia i zakres pomocy bliskich.",
        "Otwórz sterowanie demonstracją i zmień profil.",
      ],
      icon: "more",
    },
    services: {
      title: "Wybór sprawy",
      label: "Katalog funkcjonalności",
      description:
        "Osiem głównych demonstracji i dodatkowy scenariusz zawieszki QR. Każda sprawa prowadzi przez przygotowanie, podsumowanie i wynik.",
      actions: [
        "Wybierz sprawę dziecka, zwierzęcia lub właścicielki.",
        "Rozpocznij przygotowanie na danych przykładowych.",
        "Jeśli sprawa już istnieje, wróć do zapisanego postępu.",
      ],
      icon: "plus",
    },
    trusted: {
      title: "Bliskie osoby",
      label: "Pomoc na Twoich zasadach",
      description:
        "Udostępnienie dotyczy wybranych spraw i wybranego zakresu. Pomocnik może przygotować propozycję, ale nie wysyła pisma za Martę.",
      actions: [
        "Zaproś Annę lub Piotra do konkretnej sprawy.",
        "Ustal uprawnienia i czas dostępu.",
        "Zmień zakres albo cofnij dostęp.",
        "Porównaj propozycję pomocnika ze swoją wersją.",
      ],
      icon: "users",
    },
    demo: {
      title: "Sterowanie demonstracją",
      label: "Panel prezentera",
      description:
        "Narzędzia do pokazania ról, oczekiwania na odpowiedź, błędów i zdarzeń zewnętrznych. Panel jest oddzielony od właściwej usługi.",
      actions: [
        "Przełącz profil Marty, Piotra, Anny, znalazcy lub placówki.",
        "Przesuń fikcyjny zegar i sprawdź wygaśnięcie dostępu.",
        "Wywołaj dozwolone zdarzenie, np. gotowość paszportu.",
        "Ustaw błąd lub niepewny wynik następnej operacji.",
        "Zresetuj dane i odtwórz scenariusz od początku.",
      ],
      icon: "settings",
    },
    report: {
      title: "Zgłoszenie znalezienia",
      label: "Kontakt z opiekunem",
      description:
        "Znalazca korzysta z aktywnej zawieszki QR, a placówka z przykładowego dopasowania wpisu chipa. Dane opiekuna pozostają prywatne.",
      actions: [
        "Wybierz przygotowaną wiadomość o znalezieniu lub zauważeniu.",
        "Sprawdź podsumowanie przed zapisaniem zgłoszenia.",
        "Sam raport nie oznacza jeszcze potwierdzenia powrotu Luny.",
      ],
      icon: "search",
    },
    reports: {
      title: "Zgłoszenie dotyczące Luny",
      label: "Weryfikacja kontaktu",
      description:
        "Przykładowy sygnał od znalazcy lub placówki, który wymaga oceny przez opiekunkę.",
      actions: [
        "Przeczytaj zgłoszenie i sprawdź jego źródło.",
        "Potwierdź, czy Luna rzeczywiście zaginęła.",
        "Odrzuć błędny sygnał bez zmieniania statusu zwierzęcia.",
      ],
      icon: "paw",
    },
  };
  return (
    screens[area || "home"] || {
      title: "Ekran niedostępny",
      label: "Nawigacja",
      description:
        "Ta strona nie jest dostępna w bieżącym kontekście demonstracji.",
      actions: ["Wróć do Startu lub wybierz inną sprawę."],
      icon: "help",
    }
  );
});
const modules = [
  {
    title: "Dzieci i dokumenty",
    icon: "users",
    text: "Utrata dokumentu, nowy paszport i zgoda drugiego opiekuna.",
  },
  {
    title: "Zwierzęta",
    icon: "paw",
    text: "Mikroczip, zawieszka QR, zaginięcie i odnalezienie.",
  },
  {
    title: "Pisma i pomoc bliskich",
    icon: "mail",
    text: "Odpowiedź z załącznikami oraz dostęp do wybranej sprawy.",
  },
  {
    title: "Ważne wydarzenia",
    icon: "heart",
    text: "Narodziny dziecka i przygotowanie spraw po śmierci bliskiej osoby.",
  },
];
</script>
<template>
  <aside class="presentation-overview" aria-label="Opis aktualnego ekranu">
    <div class="presentation-kicker"><span></span>INTERAKTYWNY PROTOTYP</div>
    <h1 class="presentation-title">
      Twoje sprawy.<br /><span>Prościej, krok po kroku.</span>
    </h1>
    <p class="presentation-intro">
      Przeglądaj aplikację w telefonie. Tutaj znajdziesz opis ekranu, który
      właśnie oglądasz, i jego możliwości.
    </p>
    <section class="screen-overview">
      <div class="overview-section-label">
        AKTUALNY EKRAN <span class="overview-live-dot"></span>
      </div>
      <div class="overview-screen-heading">
        <span class="overview-icon"
          ><Icon :name="screen.icon" :size="24"
        /></span>
        <div>
          <p>{{ screen.label }}</p>
          <h2>{{ screen.title }}</h2>
        </div>
      </div>
      <p class="overview-description">{{ screen.description }}</p>
      <div class="overview-role">
        <Icon name="users" :size="15" />{{ roles[s.world.role]
        }}<span v-if="caseRecord && canRead(s.world, caseRecord)"
          >· {{ statusLabels[caseRecord.status] }}</span
        >
      </div>
      <h3>Co możesz zrobić?</h3>
      <ul v-if="screen.actions.length">
        <li v-for="action in screen.actions" :key="action">
          <Icon name="check" :size="16" /><span>{{ action }}</span>
        </li>
      </ul>
      <p v-else class="overview-waiting">
        Ten etap oczekuje na odpowiedź. Kolejny krok pojawi się po odpowiednim
        zdarzeniu w sterowaniu demonstracją.
      </p>
    </section>
    <details class="overview-catalog">
      <summary>
        Co jeszcze znajdziesz w prototypie?<Icon name="plus" :size="18" />
      </summary>
      <div
        v-for="module in modules"
        :key="module.title"
        class="overview-module"
      >
        <Icon :name="module.icon" :size="19" />
        <div>
          <h3>{{ module.title }}</h3>
          <p>{{ module.text }}</p>
        </div>
      </div>
    </details>
    <div class="overview-footnote">
      <Icon name="shield" :size="18" />
      <p>
        Niezależna koncepcja. Wszystkie dane i działania są fikcyjne. Asystent
        korzysta z przygotowanych scenariuszy.
      </p>
    </div>
  </aside>
</template>
