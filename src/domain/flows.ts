import type { Flow, FlowId, Option, Field } from "./types";
const o = (value: string, label: string): Option => ({ value, label });
const radio = (
  key: string,
  label: string,
  options: Option[],
  hint?: string,
): Field => ({ key, label, kind: "radio", options, required: true, hint });
const next = (next: string, label = "Dalej") => ({ label, next });
const back = (next: string) => ({
  label: "Wróć i popraw",
  next,
  kind: "secondary" as const,
});
const commit = (commit: string, label: string) => ({ label, commit });
const registry = [
  o("registry-a", "Rejestr zwierząt A · DEMO"),
  o("registry-b", "Rejestr zwierząt B · DEMO"),
];
const contact = [
  o("contact-a", "Kontakt demonstracyjny A"),
  o("contact-b", "Kontakt demonstracyjny B"),
];
const permissionOptions = [
  o("viewStatus", "Status i termin"),
  o("readContent", "Treść pisma i szczegóły"),
  o("readAttachments", "Załączniki"),
  o("prepareDraft", "Przygotowanie szkicu"),
  o("receiveNotifications", "Powiadomienia o tej sprawie"),
];
export const flows: Record<FlowId, Flow> = {
  F01: {
    id: "F01",
    name: "Utrata dokumentu dziecka",
    shortName: "Utrata dokumentu",
    subject: "Zosia",
    icon: "document",
    description: "Zgłoś utratę paszportu lub legitymacji.",
    first: "select",
    steps: {
      select: {
        title: "Dokument dziecka",
        description: "Wybierz dziecko i dokument, którego dotyczy zgłoszenie",
        question: "Którego dziecka i dokumentu dotyczy utrata?",
        fields: [
          radio("childId", "Dziecko", [
            o("zosia", "Zosia Kowalska"),
            o("adam", "Adam Kowalski"),
          ]),
          radio("documentId", "Dokument", [
            o("zosia-passport", "Paszport"),
            o("zosia-school-card", "Legitymacja szkolna"),
          ]),
        ],
        actions: [next("details")],
      },
      details: {
        title: "Co się stało?",
        fields: [
          radio("lossReason", "Zdarzenie", [
            o("lost", "Zaginął"),
            o("stolen", "Został skradziony"),
          ]),
          radio("discoveredAt", "Kiedy zauważono utratę?", [
            o("today", "Dziś"),
            o("yesterday", "Wczoraj"),
          ]),
        ],
        actions: [next("consequences"), back("select")],
      },
      consequences: {
        title: "Skutki zgłoszenia",
        description:
          "W tej demonstracji potwierdzone zgłoszenie zmieni status przykładowego dokumentu na „Utrata zgłoszona”. Nie wykonuje to czynności w prawdziwym rejestrze. Dla legitymacji oczekiwanie na odpowiedź szkoły pokażemy jako osobny etap.",
        actions: [
          next("review", "Sprawdź podsumowanie"),
          {
            label: "Dokument się znalazł",
            event: "foundBeforeLoss",
            kind: "secondary",
          },
        ],
      },
      review: {
        title: "Sprawdź zgłoszenie",
        review: true,
        actions: [
          commit("reportLoss", "Potwierdź zgłoszenie — demo"),
          back("select"),
        ],
      },
      waitingSchool: {
        title: "Zgłoszenie do szkoły wysłane — demo",
        description:
          "Oczekuje na odpowiedź szkoły. Nie wydajemy nowej legitymacji automatycznie.",
        actions: [],
      },
      result: {
        title: "Zgłoszenie utraty zapisane",
        description:
          "Status zmieniono tylko w demonstracji. Znalezienie dokumentu po zgłoszeniu nie przywraca jego ważności.",
        actions: [{ label: "Przygotuj nowy paszport", event: "openF02" }],
      },
    },
  },
  F02: {
    id: "F02",
    name: "Nowy paszport dziecka",
    shortName: "Paszport Zosi",
    subject: "Zosia",
    icon: "document",
    description: "Przygotowanie, zgoda opiekuna i wizyta.",
    first: "child",
    steps: {
      child: {
        title: "Nowy paszport dziecka",
        description:
          "To proponowany przebieg demonstracyjny. Przygotowanie w aplikacji nie zastępuje wymaganych czynności poza nią.",
        fields: [
          radio("childId", "Dziecko", [o("zosia", "Zosia Kowalska")]),
          radio("reason", "Powód", [
            o("loss", "Utrata dokumentu"),
            o("expiry", "Kończy się ważność"),
          ]),
        ],
        actions: [next("prepare")],
      },
      prepare: {
        title: "Przygotuj dane",
        description: "Użyj gotowego zdjęcia i przykładowego miejsca obsługi.",
        fields: [
          radio("photoId", "Zdjęcie", [
            o("child-photo", "Użyj zdjęcia demonstracyjnego"),
          ]),
          radio("officeId", "Miejsce obsługi", [
            o("demo-office", "Punkt obsługi · DEMO"),
          ]),
        ],
        actions: [next("consentReview"), back("child")],
      },
      consentReview: {
        title: "Poproś o zgodę",
        description:
          "W tym wariancie Piotr sprawdza przygotowane dane Zosi. To jawne założenie próbki.",
        review: true,
        actions: [
          commit("requestPassportConsent", "Wyślij prośbę o zgodę — demo"),
          back("prepare"),
        ],
      },
      waitingConsent: {
        title: "Czekasz na zgodę Piotra",
        description:
          "Prośba czeka na odpowiedź. Możesz wrócić później albo poprawić dane. Rolę zmienisz w sterowaniu demonstracją.",
        actions: [back("prepare")],
      },
      consentDecision: {
        title: "Zgoda na przygotowaną sprawę",
        description: "Sprawdź dane Zosi. Możesz wyrazić zgodę albo odmówić.",
        review: true,
        fields: [
          radio("declineReason", "Powód odmowy", [
            o("correction", "Dane wymagają poprawy"),
            o("declined", "Nie wyrażam zgody"),
          ]),
        ],
        actions: [
          commit("approveConsent", "Wyraź zgodę — demo"),
          commit("declineConsent", "Odmów — demo"),
        ],
      },
      consentDeclined: {
        title: "Brak aktualnej zgody Piotra",
        description:
          "Rezerwacja jest zablokowana. Możesz poprawić dane, przygotować nową prośbę lub zakończyć przygotowanie.",
        actions: [
          next("prepare", "Popraw dane"),
          next("consentReview", "Poproś ponownie"),
          commit("cancelPassport", "Zakończ przygotowanie bez wniosku"),
        ],
      },
      readyForVisit: {
        title: "Przygotowanie gotowe",
        description:
          "Zgoda dotyczy aktualnej wersji. Następny krok w tej demonstracji to wizyta w punkcie obsługi.",
        actions: [next("appointment", "Wybierz termin demonstracyjny")],
      },
      appointment: {
        title: "Termin wizyty — demo",
        fields: [
          radio("appointmentId", "Przykładowy termin", [
            o("slot-1", "28 października, 10:00"),
            o("slot-2", "29 października, 12:00"),
          ]),
        ],
        actions: [commit("bookVisit", "Zapisz termin — demo")],
      },
      visitBooked: {
        title: "Wizyta zaplanowana — demo",
        description:
          "Przygotuj przykładowe potwierdzenie przygotowania. Dokumenty wskazane przez punkt obsługi — do sprawdzenia. Czynności w punkcie pokaże osobne zdarzenie demonstracyjne.",
        actions: [next("appointment", "Zmień termin")],
      },
      processing: {
        title: "Sprawa przyjęta w punkcie — demo",
        description:
          "Oczekujesz na dalszą wiadomość. Nie ma jeszcze informacji o gotowości dokumentu.",
        actions: [],
      },
      readyForPickup: {
        title: "Dokument gotowy do odbioru — demo",
        description:
          "Dotarła przykładowa informacja o gotowości. Odbiór w Punkcie obsługi · DEMO zostanie potwierdzony osobnym zdarzeniem.",
        actions: [],
      },
      result: {
        title: "Odbiór potwierdzony — demo",
        description: "Nowy dokument jest widoczny w profilu Zosi.",
        actions: [{ label: "Otwórz dokument", event: "passportDocument" }],
      },
    },
  },
  F03: {
    id: "F03",
    name: "Mikroczip i kontakt opiekuna",
    shortName: "Mikroczip Luny",
    subject: "Luna",
    icon: "paw",
    description: "Wpis w rejestrze i aktualizacja kontaktu.",
    first: "identify",
    steps: {
      identify: {
        title: "Mikroczip Luny",
        description:
          "Numer znajdziesz w dokumentacji. Telefon nie odczytuje mikroczipa.",
        fields: [
          {
            key: "chipNumber",
            label: "Numer chipa",
            kind: "text",
            sample: "999000000000001",
            required: true,
            hint: "Numer przykładowy powinien zawierać 15 cyfr.",
          },
          radio("registryId", "Rejestr", registry),
        ],
        actions: [
          next("contact"),
          { label: "Nie mam numeru", event: "noChip", kind: "secondary" },
        ],
      },
      contact: {
        title: "Kontakt opiekuna",
        description:
          "Te dane są przeznaczone do kontaktu w rejestrze. Nie publikujemy ich w ogłoszeniu.",
        fields: [radio("contactId", "Kontakt demonstracyjny", contact)],
        actions: [next("verify"), back("identify")],
      },
      verify: {
        title: "Potwierdź kontakt — demo",
        description: "Nie wysyłamy wiadomości. Użyj kodu przykładowego 123456.",
        fields: [
          {
            key: "verificationCode",
            label: "Kod demonstracyjny",
            kind: "text",
            sample: "123456",
            required: true,
          },
        ],
        actions: [next("review", "Sprawdź kod"), back("contact")],
      },
      review: {
        title: "Sprawdź wpis",
        review: true,
        actions: [
          commit("saveMicrochip", "Potwierdź wpis — demo"),
          back("identify"),
        ],
      },
      contactConflict: {
        title: "Numer wymaga wyjaśnienia",
        description:
          "W tej próbce numer jest już powiązany z innym opiekunem. Nie można samodzielnie przejąć wpisu.",
        actions: [next("identify", "Sprawdź ponownie")],
      },
      result: {
        title: "Wpis zapisany w rejestrze demonstracyjnym",
        description:
          "Potwierdzenie dotyczy tylko wybranego rejestru. Zawieszka QR jest osobną funkcją.",
        actions: [
          { label: "Zmień kontakt", event: "updateContact" },
          {
            label: "Zarządzaj zawieszką QR",
            event: "openQ01",
            kind: "secondary",
          },
        ],
      },
    },
  },
  Q01: {
    id: "Q01",
    name: "Zawieszka QR Luny",
    shortName: "Zawieszka QR",
    subject: "Luna",
    icon: "qr",
    description: "Oddzielny kontakt przez zawieszkę demonstracyjną.",
    first: "select",
    steps: {
      select: {
        title: "Zawieszka QR Luny",
        description:
          "Powiąż przykładową zawieszkę z profilem. To odrębne od mikroczipa.",
        actions: [next("review", "Aktywuj zawieszkę")],
      },
      review: {
        title: "Aktywacja zawieszki — demo",
        description:
          "Luna · tag-demo. Publiczne: imię i zdjęcie; kontakt przez formularz. Bez prywatnych danych opiekuna.",
        review: true,
        actions: [
          commit("activateTag", "Aktywuj zawieszkę — demo"),
          back("select"),
        ],
      },
      active: {
        title: "Zawieszka aktywna — demo",
        description:
          "Możesz zobaczyć przykładowy widok znalazcy. Nie uruchamiamy kamery ani zewnętrznego odnośnika.",
        actions: [
          { label: "Pokaż scenariusz znalazcy", event: "finder" },
          next("deactivateReview", "Wyłącz"),
          next("replaceReview", "Wymień zgubioną zawieszkę"),
        ],
      },
      deactivateReview: {
        title: "Wyłączyć zawieszkę?",
        description:
          "Formularz tej zawieszki przestanie być dostępny. Mikroczip i ogłoszenie pozostaną bez zmian.",
        actions: [
          commit("deactivateTag", "Wyłącz zawieszkę — demo"),
          back("active"),
        ],
      },
      replaceReview: {
        title: "Wymień zawieszkę — demo",
        description:
          "Stara zawieszka przestanie działać. Przypiszemy nową próbkę.",
        actions: [
          commit("replaceTag", "Wymień zawieszkę — demo"),
          back("active"),
        ],
      },
      result: {
        title: "Zmiana zawieszki zapisana — demo",
        description:
          "Zmiana dotyczy zawieszki; wpis chipa nie został zmieniony.",
        actions: [next("select", "Otwórz zawieszkę")],
      },
    },
  },
  F04: {
    id: "F04",
    name: "Zaginięcie i odnalezienie",
    shortName: "Poszukiwania Luny",
    subject: "Luna",
    icon: "paw",
    description: "Ogłoszenie, zgłoszenia i bezpieczny powrót.",
    first: "details",
    steps: {
      details: {
        title: "Zaginęła Luna",
        description: "Użyj danych przykładowych. Nie wpisuj swojego adresu.",
        fields: [
          radio("disappearedAt", "Kiedy?", [
            o("today", "Dziś"),
            o("yesterday", "Wczoraj"),
          ]),
          radio("areaId", "Rejon", [
            o("park", "Park · DEMO"),
            o("estate", "Osiedle · DEMO"),
          ]),
          radio("descriptionId", "Opis", [
            o("collar", "Kotka pręgowana, czerwona obroża"),
            o("noCollar", "Kotka pręgowana, bez obroży"),
          ]),
        ],
        actions: [next("preview")],
      },
      preview: {
        title: "Tak wygląda ogłoszenie",
        description:
          "Luna. Kontakt przez formularz. Bez adresu domowego, numeru telefonu i numeru chipa.",
        review: true,
        actions: [next("review", "Sprawdź podsumowanie"), back("details")],
      },
      review: {
        title: "Potwierdź ogłoszenie",
        description: "Publikacja nastąpi tylko w prototypie.",
        review: true,
        actions: [
          commit("publishNotice", "Potwierdź ogłoszenie — demo"),
          back("details"),
        ],
      },
      searching: {
        title: "Poszukiwania trwają — demo",
        description: "Nie ma jeszcze potwierdzenia powrotu Luny.",
        actions: [
          next("reports", "Sprawdź zgłoszenia"),
          next("details", "Edytuj ogłoszenie"),
          next("close", "Luna wróciła sama"),
          next("withdrawReview", "Wycofaj ogłoszenie"),
        ],
      },
      reports: {
        title: "Zgłoszenia znalezienia",
        description:
          "Sam sygnał nie potwierdza odnalezienia. Wybierz zgłoszenie poniżej.",
        actions: [],
      },
      reportDetails: {
        title: "Sprawdź zgłoszenie",
        description:
          "Czy zgłoszenie pasuje do Luny? Możesz je odrzucić lub oznaczyć jako podejrzane.",
        actions: [
          next("matchReview", "To może być Luna"),
          next("rejectReview", "To nie Luna"),
          next("suspiciousReview", "Podejrzany kontakt"),
          next("reports", "Wróć do zgłoszeń"),
        ],
      },
      matchReview: {
        title: "Potwierdź dopasowanie",
        description:
          "Zwierzę pozostanie oznaczone jako zaginione do potwierdzenia odbioru.",
        actions: [commit("matchReport", "Potwierdź dopasowanie — demo")],
      },
      pickupPending: {
        title: "Zgłoszono znalezienie. Odbiór niepotwierdzony",
        actions: [
          next("close", "Potwierdź powrót do domu"),
          next("rejectReview", "To jednak nie Luna"),
          next("reports", "Wróć do zgłoszeń"),
        ],
      },
      close: {
        title: "Luna wróciła do domu?",
        description:
          "Potwierdzenie zamknie ogłoszenie w demonstracji. Samo zgłoszenie znalezienia nie zamyka sprawy.",
        review: true,
        actions: [
          commit("confirmPetReturn", "Potwierdź powrót — demo"),
          next("reports", "Jeszcze nie"),
        ],
      },
      rejectReview: {
        title: "Odrzucić to zgłoszenie?",
        description: "Pozostałe zgłoszenia i ogłoszenie pozostaną bez zmian.",
        actions: [commit("rejectReport", "Odrzuć zgłoszenie — demo")],
      },
      suspiciousReview: {
        title: "Zgłosić podejrzany kontakt?",
        description:
          "Nie wysyłaj pieniędzy ani kodów. Tworzymy wyłącznie lokalny wpis zgłoszenia.",
        actions: [commit("flagReport", "Oznacz jako podejrzane — demo")],
      },
      withdrawReview: {
        title: "Wycofać ogłoszenie?",
        description: "Nie oznacza to potwierdzenia odnalezienia.",
        actions: [commit("withdrawNotice", "Wycofaj ogłoszenie — demo")],
      },
      withdrawn: {
        title: "Ogłoszenie wycofane — demo",
        description: "Powrót zwierzęcia nie został potwierdzony.",
        actions: [next("preview", "Wznów poszukiwania")],
      },
      result: {
        title: "Powrót Luny potwierdzony — demo",
        description: "Ogłoszenie zamknięte.",
        actions: [{ label: "Otwórz profil Luny", event: "petProfile" }],
      },
    },
  },
  F05: {
    id: "F05",
    name: "Odpowiedź na pismo",
    shortName: "Pismo do Marty",
    subject: "Marta",
    icon: "mail",
    description: "Wyjaśnienie, szkic i przykładowe załączniki.",
    first: "letter",
    steps: {
      letter: {
        title: "Pismo do Marty",
        description:
          "Wezwanie demonstracyjne do uzupełnienia dokumentów. Prosimy o przekazanie dwóch przykładowych faktur związanych z opisaną sprawą. Termin odpowiedzi wskazany w tej próbce: 30 października 2026. Pismo nie pochodzi z prawdziwego urzędu.",
        actions: [
          next("explanation", "Wyjaśnij pismo"),
          next("draft", "Przygotuj odpowiedź"),
        ],
      },
      explanation: {
        title: "Co trzeba zrobić?",
        description:
          "Przygotuj odpowiedź i dołącz Fakturę A oraz Fakturę B. Termin z tej próbki: 30 października. To wyjaśnienie demonstracyjne.",
        actions: [
          next("letter", "Pokaż oryginał"),
          next("draft", "Przygotuj odpowiedź"),
        ],
      },
      draft: {
        title: "Treść odpowiedzi",
        fields: [
          {
            key: "responseText",
            label: "Odpowiedź — używaj danych fikcyjnych",
            kind: "textarea",
            required: true,
            maxLength: 2000,
            sample:
              "W odpowiedzi na pismo PISMO-DEMO-001 przekazuję dwie przykładowe faktury dotyczące sprawy demonstracyjnej. Załączniki: Faktura A · DEMO oraz Faktura B · DEMO. Marta Kowalska · profil demonstracyjny.",
          },
        ],
        actions: [next("attachments")],
      },
      attachments: {
        title: "Załączniki",
        description:
          "Wybierz dwie przykładowe faktury. Podglądy zawierają wyłącznie plansze DEMO.",
        fields: [
          {
            key: "attachmentIds",
            label: "Pliki demonstracyjne",
            kind: "checkboxes",
            required: true,
            options: [
              o("invoice-a", "Faktura A · DEMO"),
              o("invoice-b", "Faktura B · DEMO"),
              o("wrong-file", "Notatka niezwiązana ze sprawą · DEMO"),
            ],
          },
        ],
        actions: [next("review", "Sprawdź podsumowanie"), back("draft")],
      },
      review: {
        title: "Sprawdź odpowiedź",
        description:
          "Adresat: Urząd Skarbowy · DEMO. Nadawca: Marta Kowalska · DEMO.",
        review: true,
        actions: [
          commit("sendLetterResponse", "Wyślij odpowiedź — demo"),
          back("draft"),
        ],
      },
      sent: {
        title: "Odpowiedź wysłana — demo",
        description:
          "Wysłanie nie oznacza jeszcze doręczenia ani zakończenia sprawy.",
        actions: [{ label: "Sprawdź status", event: "checkStatus" }],
      },
      delivered: {
        title: "Doręczenie potwierdzone — demo",
        description: "Sprawa nadal oczekuje na rozpatrzenie.",
        actions: [],
      },
      result: {
        title: "Sprawa zakończona — demo",
        description: "Przykładowy urząd potwierdził zakończenie tej sprawy.",
        actions: [],
      },
    },
  },
  F06: {
    id: "F06",
    name: "Pomoc bliskiej osoby",
    shortName: "Dostęp bliskiej osoby",
    subject: "Marta",
    icon: "users",
    description: "Udostępnij wybrane sprawy w określonym zakresie.",
    first: "recipient",
    steps: {
      recipient: {
        title: "Dodaj bliską osobę",
        description: "Dostęp przyznasz tylko do wybranych spraw.",
        fields: [
          radio("recipient", "Osoba", [
            o("anna", "Anna Nowak · DEMO"),
            o("piotr", "Piotr Kowalski · DEMO"),
          ]),
        ],
        actions: [next("scope")],
      },
      scope: {
        title: "Które sprawy udostępnić?",
        description: "Nowe sprawy nie zostaną dodane automatycznie.",
        fields: [
          {
            key: "caseIds",
            label: "Sprawy",
            kind: "checkboxes",
            required: true,
            options: [],
          },
        ],
        actions: [next("permissions")],
      },
      permissions: {
        title: "Co może zobaczyć i zrobić bliska osoba?",
        description:
          "Uprawnienia ustawiasz osobno dla każdej sprawy. Końcowe zatwierdzenie czynności pozostaje po Twojej stronie.",
        fields: [
          radio("duration", "Czas dostępu", [
            o("7", "7 dni"),
            o("30", "30 dni"),
          ]),
        ],
        actions: [next("review", "Sprawdź podsumowanie"), back("scope")],
      },
      review: {
        title: "Sprawdź zaproszenie",
        description:
          "Dostęp zacznie działać po przyjęciu zaproszenia. Ograniczenie dotychczasowych praw działa od razu; dodatkowe prawa dopiero po akceptacji.",
        review: true,
        actions: [
          commit("sendAccessInvitation", "Potwierdź zakres — demo"),
          back("permissions"),
        ],
      },
      waitingInvitation: {
        title: "Zaproszenie czeka na odpowiedź",
        description: "Zaproszenie nie daje jeszcze dostępu.",
        actions: [next("withdrawInvitationReview", "Wycofaj zaproszenie")],
      },
      invitationDecision: {
        title: "Marta zaprasza do pomocy",
        description:
          "Sprawdź proponowany zakres i datę końca. Treść spraw jest niedostępna przed akceptacją.",
        review: true,
        actions: [
          commit("acceptAccessInvitation", "Przyjmij zaproszenie — demo"),
          commit("declineAccessInvitation", "Odrzuć zaproszenie — demo"),
        ],
      },
      active: {
        title: "Dostęp aktywny",
        description:
          "Zakres obowiązuje do daty końca lub cofnięcia. Pomocnik nie może wysyłać pisma za właścicielkę.",
        actions: [
          next("permissions", "Zmień zakres"),
          next("revoke", "Cofnij dostęp"),
        ],
      },
      declined: {
        title: "Zaproszenie odrzucone",
        description: "Nie przyznano dodatkowego dostępu.",
        actions: [
          next("permissions", "Przygotuj nowe zaproszenie"),
          commit("finishInvitation", "Zakończ"),
        ],
      },
      withdrawInvitationReview: {
        title: "Wycofać oczekujące zaproszenie?",
        description: "Odbiorca nie uzyska dostępu.",
        actions: [
          commit("withdrawAccessInvitation", "Wycofaj zaproszenie — demo"),
        ],
      },
      revoke: {
        title: "Cofnąć dostęp?",
        description:
          "Dalszy dostęp zostanie zablokowany. Nie usunie to informacji wcześniej przeczytanych.",
        review: true,
        actions: [commit("revokeAccess", "Cofnij dostęp — demo")],
      },
      revoked: {
        title: "Dostęp cofnięty — demo",
        description:
          "Nowe odczyty i edycje zostały zablokowane w demonstracji.",
        actions: [],
      },
      expired: {
        title: "Zaproszenie wygasło",
        description: "Przygotuj nowe, jeśli nadal chcesz udostępnić sprawy.",
        actions: [next("permissions", "Przygotuj nowe zaproszenie")],
      },
    },
  },
  F07: {
    id: "F07",
    name: "Narodziny dziecka",
    shortName: "Zgłoszenie narodzin",
    subject: "Marta",
    icon: "baby",
    description: "Zgłoszenie demonstracyjne i plan dalszych spraw.",
    first: "event",
    steps: {
      event: {
        title: "Urodziło mi się dziecko",
        description:
          "Wybierz przykładowe zdarzenie. Nie wpisuj prawdziwych danych.",
        fields: [
          radio("birthEventId", "Zdarzenie", [
            o("birth-event-1", "Narodziny 25 października · DEMO"),
          ]),
        ],
        actions: [
          next("details"),
          next("missingRecord", "Nie ma mojego zdarzenia"),
        ],
      },
      details: {
        title: "Dane zgłoszenia",
        fields: [
          radio("childName", "Imię", [o("Ola", "Ola"), o("Lena", "Lena")]),
          radio("deliveryMode", "Sposób potwierdzenia", [
            o("digitalDemo", "Skrzynka · DEMO"),
            o("officeDemo", "Punkt obsługi · DEMO"),
          ]),
        ],
        actions: [next("review", "Sprawdź podsumowanie")],
      },
      review: {
        title: "Sprawdź zgłoszenie narodzin",
        description:
          "Przykładowy rodzic: Marta Kowalska. Samo wysłanie nie utworzy jeszcze potwierdzonego profilu dziecka.",
        review: true,
        actions: [
          commit("submitBirthRegistration", "Wyślij zgłoszenie — demo"),
          back("details"),
        ],
      },
      waiting: {
        title: "Zgłoszenie wysłane — demo",
        description: "Oczekuje na osobne potwierdzenie.",
        actions: [{ label: "Sprawdź status", event: "checkStatus" }],
      },
      correction: {
        title: "Uzupełnij zgłoszenie",
        description: "W demonstracji poproszono o ponowne sprawdzenie imienia.",
        fields: [
          radio("childName", "Imię", [o("Ola", "Ola"), o("Lena", "Lena")]),
        ],
        actions: [next("review")],
      },
      plan: {
        title: "Profil dziecka dodany — demo",
        description: "Wybierz następną sprawę. Każda jest osobnym działaniem.",
        actions: [
          next("newbornDocumentPlan", "Dokument dziecka"),
          next("newbornInsurancePlan", "Ubezpieczenie"),
          next("newbornSupportPlan", "Wsparcie dla rodziny"),
          { label: "Otwórz profil dziecka", event: "newbornProfile" },
        ],
      },
      newbornDocumentPlan: {
        title: "Dokument dziecka",
        description:
          "Przygotowanie dokumentu dla noworodka nie jest objęte pokazanym wariantem paszportu Zosi. Wymagania należy sprawdzić dla wieku dziecka. Ustal rodzaj dokumentu. Sprawdź wymagania dla wieku dziecka.",
        actions: [
          { label: "Zapisz listę przygotowania", event: "taskDocument" },
          next("plan", "Wróć do planu"),
        ],
      },
      newbornInsurancePlan: {
        title: "Ubezpieczenie",
        description:
          "To lista do przygotowania, nie zgłoszenie do ubezpieczenia.",
        fields: [
          radio("insuranceChannel", "Przygotowanie", [
            o("employer", "Kontakt z pracodawcą · DEMO"),
            o("channel", "Ustalenie właściwego kanału"),
          ]),
        ],
        actions: [
          { label: "Zapisz przygotowanie", event: "taskInsurance" },
          next("plan", "Wróć do planu"),
        ],
      },
      newbornSupportPlan: {
        title: "Wsparcie dla rodziny",
        description:
          "Składanie wniosku o świadczenie nie jest częścią demonstracji. Lista nie potwierdza prawa do świadczenia. Sprawdź warunki. Ustal właściwy kanał.",
        actions: [
          { label: "Zapisz do sprawdzenia", event: "taskSupport" },
          next("plan", "Wróć do planu"),
        ],
      },
      missingRecord: {
        title: "Brak zdarzenia w demonstracji",
        description:
          "Możesz zachować listę przygotowania, ale nie utworzymy zgłoszenia bez danych.",
        actions: [
          { label: "Zapisz plan przygotowania", event: "saveMissingPlan" },
          next("event", "Wybierz zdarzenie przykładowe"),
        ],
      },
    },
  },
  F08: {
    id: "F08",
    name: "Sprawy po śmierci bliskiej osoby",
    shortName: "Plan wizyty",
    subject: "Marta",
    icon: "heart",
    description: "Przygotuj spokojnie jeden krok i wróć później.",
    first: "situation",
    steps: {
      situation: {
        title: "Zmarła bliska osoba",
        description:
          "Możesz przejść przez sprawy etapami i wrócić później. Plan dotyczy Jana Zielińskiego · DEMO.",
        actions: [
          next("record", "Przygotuj wizytę"),
          { label: "Mam już plan", event: "existingPlan" },
        ],
      },
      record: {
        title: "Co już masz?",
        description: "Nie musisz znać wszystkich odpowiedzi.",
        fields: [
          radio("recordAvailability", "Dokument lub informacja o rejestracji", [
            o("available", "Mam dokument lub informację o rejestracji"),
            o("missing", "Nie mam jeszcze"),
            o("unknown", "Nie wiem"),
          ]),
          radio("purpose", "Cel", [
            o("ownFormalities", "Własne formalności"),
            o("supportFamily", "Pomoc rodzinie"),
          ]),
        ],
        actions: [next("checklist")],
      },
      checklist: {
        title: "Przygotuj pytania do punktu obsługi",
        description:
          "Ustal, czy zdarzenie jest zarejestrowane. Zapytaj, kto może uzyskać odpis. Sprawdź wymagane dokumenty. Ustal formę i sposób odbioru.",
        fields: [
          {
            key: "checklistSaved",
            label: "Mam zapisaną listę pytań",
            kind: "check",
          },
        ],
        actions: [next("appointment")],
      },
      appointment: {
        title: "Wizyta demonstracyjna",
        description: "Nie rezerwujemy prawdziwego terminu.",
        fields: [
          radio("slotId", "Termin", [
            o("visit-1", "28 października, 11:00 · DEMO"),
            o("visit-2", "29 października, 13:00 · DEMO"),
            o("self", "Ustalę termin samodzielnie"),
          ]),
        ],
        actions: [next("review", "Sprawdź podsumowanie")],
      },
      review: {
        title: "Sprawdź plan wizyty",
        description:
          "Plan nie potwierdza uprawnienia do uzyskania odpisu. Zapis nie wysyła wniosku ani nie daje dostępu do konta bliskiej osoby.",
        review: true,
        actions: [
          { label: "Zapisz przygotowanie", event: "saveBereavement" },
          back("record"),
        ],
      },
      result: {
        title: "Przygotowanie zapisane",
        description:
          "Możesz wrócić do listy pytań lub poprosić o pomoc przy tym planie.",
        actions: [
          { label: "Otwórz listę", event: "viewChecklist" },
          { label: "Poproś bliską osobę o pomoc", event: "sharePlan" },
          next("otherTasks", "Pozostałe sprawy"),
        ],
      },
      otherTasks: {
        title: "Pozostałe sprawy do sprawdzenia",
        description:
          "Możesz zapisać kolejne tematy do sprawdzenia. Ta demonstracja ich nie rozstrzyga.",
        actions: [
          { label: "Kontakt z instytucjami", event: "otherInstitutions" },
          { label: "Możliwe wsparcie", event: "otherSupport" },
          { label: "Sprawy spadkowe", event: "otherInheritance" },
          next("result", "Wróć do planu"),
        ],
      },
    },
  },
};
export const flowIds = Object.keys(flows) as FlowId[];
export const permissionLabels = permissionOptions;
export const roles = {
  marta: "Marta Kowalska",
  piotr: "Piotr Kowalski",
  anna: "Anna Nowak",
  finder: "Znalazca · DEMO",
  vet: "Gabinet weterynaryjny · DEMO",
  shelter: "Schronisko · DEMO",
  police: "Policja · DEMO",
};
export const statusLabels = {
  draft: "W przygotowaniu",
  needsInput: "Wymaga uzupełnienia",
  awaitingConsent: "Czeka na zgodę",
  submitting: "Wysyłanie — symulacja",
  submitted: "Wysłano — oczekuje na odpowiedź",
  completed: "Zakończona",
  cancelled: "Anulowana",
};
