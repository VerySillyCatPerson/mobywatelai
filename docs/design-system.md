# System projektowy — mObywatel / koncepcja

Wersja: 0.1 • Data: 24.10.2026 • Status: specyfikacja do implementacji prototypu

## 1. Cel i zakres

Dokument definiuje wspólny wygląd i zachowanie interaktywnego prototypu: Start, Dokumenty, Sprawy, Skrzynka, Moje dzieci, Moje zwierzęta oraz Asystent. Opisy i treści interfejsu są po polsku. Nazwy komponentów, właściwości, zmiennych i tokenów są po angielsku.

To niezależna koncepcja konkursowa, nie oficjalna usługa administracji. Wszystkie dane i działania są fikcyjne. Nie podłączamy API modeli, rejestrów, płatności, kamery, mikrofonu ani biometrii. Face ID, skanowanie i wysyłka mają wyłącznie pokazywać przebieg. Odpowiedzi asystenta są przygotowanymi scenariuszami.

Wygenerowane plansze są kierunkiem wizualnym. W razie rozbieżności implementacja korzysta z tego dokumentu; dotyczy to szczególnie statusów spraw, nadawców wiadomości, rozmiarów i kontrastu. Nie traktujemy tekstów z makiet jako zweryfikowanej instrukcji urzędowej.

## 2. Zasady projektowe

1. Użytkownik widzi, czego dotyczy sprawa, kogo dotyczy i co może zrobić dalej.
2. Dokumenty i formularze mają bezpośrednie działania. Asystent jest dodatkowym sposobem przejścia przez ten sam proces.
3. Jeden stan sprawy obowiązuje na wszystkich ekranach. Rozmowa nie tworzy osobnego stanu dokumentu.
4. Potwierdzenie opisuje konkretną czynność i jej skutki. Wynik pokazuje dopiero zakończenie symulacji.
5. Status zawsze ma tekst; kolor jest wsparciem.
6. Interfejs nie prosi o prawdziwe dane. Korzystamy z wyboru przykładowych danych zamiast rzeczywistego uploadu.
7. Nowe moduły korzystają z tych samych komponentów i zasad nawigacji.

## 3. Język i nazewnictwo

| Obszar | Konwencja | Przykład |
| --- | --- | --- |
| Komponenty | PascalCase | `ChildProfile`, `CaseListItem` |
| Właściwości i zmienne | camelCase | `subjectName`, `isSubmitting` |
| Stałe | UPPER_SNAKE_CASE | `DEMO_DATE`, `SIMULATION_DELAY_MS` |
| Tokeny CSS | kebab-case | `--color-text-primary` |
| Warianty i statusy | angielskie stringi | `variant="secondary"`, `status="draft"` |
| Teksty interfejsu | naturalny polski | „Wróć i popraw”, „Zgłoś utratę dokumentu” |
| Identyfikatory tekstów | angielskie klucze | `document.reportLoss`, `case.status.draft` |

Nie stosujemy polskich identyfikatorów typu `imieDziecka`. Mapowanie na polski tekst jest jawne, np. `draft` → „W przygotowaniu”. Zmienna `childName` nie determinuje języka widocznego tekstu.

## 4. Kolory

Proponowane wartości do pierwszej implementacji; nie są próbkami zmierzonymi z wygenerowanych obrazów. Wprowadzamy tokeny semantyczne, bez wpisywania hexów bezpośrednio w komponentach.

| Token | Wartość | Zastosowanie |
| --- | --- | --- |
| `--color-bg-page` | `#F5F7FA` | Tło aplikacji |
| `--color-bg-surface` | `#FFFFFF` | Karty, panele, formularze |
| `--color-bg-subtle` | `#EEF2F6` | Wtórne powierzchnie |
| `--color-text-primary` | `#172033` | Nagłówki i treść |
| `--color-text-secondary` | `#475569` | Opisy pomocnicze |
| `--color-brand-primary` | `#0052CC` | Główne akcje, aktywna nawigacja |
| `--color-brand-hover` | `#0043A6` | Wskazanie kursorem |
| `--color-brand-pressed` | `#003580` | Wciśnięcie |
| `--color-info-bg` | `#EAF2FF` | Informacja i kontekst |
| `--color-info-text` | `#174EA6` | Tekst informacji |
| `--color-success-bg` | `#E8F5EC` | Zakończenie, ważność |
| `--color-success-text` | `#166534` | Tekst sukcesu |
| `--color-warning-bg` | `#FFF4DF` | Zbliżający się termin |
| `--color-warning-text` | `#854D0E` | Tekst ostrzeżenia |
| `--color-danger-bg` | `#FDECEC` | Błąd, istotne zagrożenie |
| `--color-danger-text` | `#B42318` | Tekst i akcja destrukcyjna |
| `--color-border-subtle` | `#D8E0EB` | Dekoracyjny podział kart |
| `--color-border-control` | `#64748B` | Granica pól, gdy konieczna do ich rozpoznania |
| `--color-focus-ring` | `#0052CC` | Widoczny fokus |

Delikatna granica karty nie jest wystarczającą granicą pola formularza. Dla kontrolek stosujemy wyraźniejszy obrys. Kolor nie identyfikuje właściciela ani nie zastępuje etykiety statusu. Utrata dokumentu jest działaniem ostrzegawczym; kolor czerwony rezerwujemy dla konkretnego nieodwracalnego zatwierdzenia, jeśli występuje w opracowanym scenariuszu.

## 5. Typografia, odstępy i kształty

Krój bazowy: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Bez zależności od zewnętrznego serwisu fontów. Polskie znaki muszą działać w całym interfejsie.

| Token | Rozmiar / interlinia | Grubość | Użycie |
| --- | --- | --- | --- |
| `--font-size-page-title` | 28 / 34 px | 700 | Tytuł ekranu |
| `--font-size-section-title` | 20 / 28 px | 600 | Nagłówek sekcji |
| `--font-size-card-title` | 18 / 26 px | 600 | Tytuł ważnej karty |
| `--font-size-body` | 16 / 24 px | 400 | Treść |
| `--font-size-label` | 16 / 24 px | 600 | Przyciski, etykiety |
| `--font-size-caption` | 14 / 20 px | 400 | Metadane, informacje pomocnicze |

W kodzie wartości tekstu zapisujemy w rem, przy bazie 16 px. Nie zmniejszamy tekstu, żeby zmieścić długą treść. Etykiety zawijają się, a wysokość komponentu rośnie. Kluczowe instrukcje nie korzystają z rozmiaru mniejszego niż tekst podstawowy.

| Grupa | Tokeny i wartości |
| --- | --- |
| Odstępy | `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-5: 20px`, `--space-6: 24px`, `--space-8: 32px`, `--space-10: 40px`, `--space-12: 48px` |
| Zaokrąglenia | `--radius-control: 8px`, `--radius-card: 12px`, `--radius-panel: 16px`, `--radius-pill: 999px` |
| Ikony | `--icon-size-sm: 20px`, `--icon-size-md: 24px`, `--icon-size-lg: 32px` |
| Pole dotyku | `--control-min-height: 48px`, `--icon-button-size: 48px` |
| Cień nakładki | `--shadow-overlay: 0 8px 32px rgb(23 32 51 / 16%)` |

Margines ekranu: 16 px na małych telefonach, 24 px od szerokości 480 px. Odstęp między sekcjami: 24–32 px; padding kart: 16 px. Zwykłe karty korzystają z obrysu zamiast cienia.

## 6. Układ i nawigacja

Projektujemy przede wszystkim na telefon, od szerokości 320 CSS px. Przy 768 px i więcej treść może mieć dwie kolumny, jeśli zachowuje logiczną kolejność. Główna szerokość treści na dużym ekranie: maksymalnie 1120 px. Formularze i rozmowy: maksymalnie 640 px. Nie rozciągamy mobilnych wierszy na całą szerokość monitora.

### `AppHeader`

Po lewej nazwa „mObywatel / koncepcja” i niewielki `DemoBadge`. Po prawej `NotificationButton` oraz `AssistantButton`. Widoczny nagłówek jest responsywny: na wąskim ekranie nazwa może być skrócona do „Koncepcja”, bez zmniejszania pól dotyku. Przycisk powrotu znajduje się przy tytule ekranu podrzędnego.

Asystent ma ikonę dymku z małym znakiem wyróżniającym; etykieta dostępna dla czytnika: „Otwórz asystenta”. Nie występuje w dolnej nawigacji ani jako przycisk zasłaniający treść.

### `BottomNavigation`

| Wartość | Etykieta | Zakres |
| --- | --- | --- |
| `home` | Start | Podsumowanie, dzieci, zwierzęta |
| `documents` | Dokumenty | Dokumenty i pojazdy |
| `cases` | Sprawy | Sprawy aktywne i zakończone |
| `more` | Więcej | Pozostałe funkcje, ustawienia, informacje o demo |

Aktywna pozycja ma kolor, wyróżnienie kształtem lub tłem i `aria-current="page"`. Ekrany dzieci i zwierząt należą do Startu; Skrzynka otwiera się z górnego paska i zachowuje kontekst powrotu. Nie oznaczamy jej jako aktywnych Spraw tylko dlatego, że wiadomość może prowadzić do sprawy.

Uwzględniamy `env(safe-area-inset-bottom)`. Treść ma dolny padding równy wysokości nawigacji i strefy bezpiecznej. Dłuższe ekrany przewijają się pionowo. Przy klawiaturze ekranowej pole wiadomości i główna akcja pozostają widoczne.

## 7. Katalog komponentów

| Komponent | Właściwości / warianty | Reguły |
| --- | --- | --- |
| `Button` | `variant: primary / secondary / ghost / danger`, `isLoading`, `disabled` | Jedna dominująca akcja na etap; etykieta opisuje czynność |
| `IconButton` | `icon`, `label`, `isActive` | Pole min. 48 × 48 px; etykieta także dla czytnika |
| `TextField` | `label`, `value`, `hint`, `error`, `required` | Stała etykieta, błąd pod polem; placeholder nie zastępuje etykiety |
| `SelectField` | `label`, `options`, `value`, `error` | Do wyboru fikcyjnego dokumentu, rejestru lub przykładu |
| `CheckboxField` | `label`, `description`, `checked` | Pełna etykieta klikalna; widoczny fokus |
| `StatusBadge` | `tone: neutral / info / success / warning / danger`, `label` | Tekst obowiązkowy, ikona opcjonalna; sam nie jest przyciskiem |
| `AlertBanner` | `tone`, `title`, `description`, `action` | Opisuje powód i możliwe działanie; nie każdy termin jest alarmem |
| `ProfileCard` | `subjectType: child / pet`, `name`, `description`, `avatar`, `attentionCount` | Prowadzi do profilu; rozróżnienie podmiotów również tekstem |
| `DocumentCard` | `documentType`, `ownerName`, `status`, `expiresAt`, `isDataVisible` | Dane domyślnie ukryte, osobne akcje poza klikalną kartą |
| `CaseListItem` | `title`, `subjectName`, `status`, `nextStep`, `dueAt` | Właściciel i etap widoczni przed wejściem w sprawę |
| `MessageListItem` | `sender`, `subject`, `preview`, `receivedAt`, `isUnread` | Nieprzeczytana wiadomość wyróżniona także typografią |
| `SegmentedControl` | `items`, `value`, `onChange` | Używamy semantyki zakładek, gdy przełącza powiązane panele |
| `StepIndicator` | `currentStep`, `totalSteps`, `label` | Tekst „Krok 2 z 3”; możliwość poprawy wcześniejszego kroku |
| `SummaryList` | `items` | Czytelne pary etykieta–wartość; semantyka `dl` |
| `ConfirmationPanel` | `title`, `summary`, `consequences`, `confirmLabel` | Skutki czynności widoczne przed zatwierdzeniem |
| `ResultPanel` | `status`, `title`, `description`, `nextAction` | Sukces dopiero po zakończeniu symulacji; czytelny dalszy krok |
| `EmptyState` | `title`, `description`, `action` | Wyjaśnia brak zawartości i ewentualny następny krok |
| `AssistantPanel` | `context`, `messages`, `suggestions`, `isResponding` | Przygotowane odpowiedzi, stała informacja o symulacji |
| `SimulationDialog` | `simulationType`, `status` | Animacja Face ID lub skanowania, bez uprawnień urządzenia |

Nie zagnieżdżamy przycisków i linków w innym przycisku. Karta z wieloma akcjami jest kontenerem; tytuł i akcje mają osobne kontrolki. Link służy nawigacji, przycisk wykonuje czynność.

## 8. Stany i interakcje

Każda interaktywna kontrolka przewiduje `default`, `hover`, `focusVisible`, `pressed`, `disabled` i, jeśli potrzebny, `loading`. `hover` nie jest warunkiem odkrycia funkcji na telefonie.

Fokus: obrys 3 px, odsunięty o 2 px, z jasną separacją przy niebieskiej powierzchni. Nie usuwamy go przez `outline: none`. Wyłączone akcje mają obok wyjaśnienie, gdy powód nie jest oczywisty. Ładowanie zachowuje rozmiar przycisku i blokuje ponowne zatwierdzenie.

| Status techniczny sprawy | Etykieta | Zakładka |
| --- | --- | --- |
| `draft` | W przygotowaniu | W toku |
| `needsInput` | Wymaga uzupełnienia | W toku |
| `awaitingConsent` | Czeka na zgodę | W toku |
| `submitting` | Wysyłanie — symulacja | W toku |
| `submitted` | Wysłano — oczekuje na odpowiedź | W toku |
| `completed` | Zakończona | Zakończone |
| `cancelled` | Anulowana | Zakończone |

`error` jest stanem operacji, nie automatycznie nowym statusem całej sprawy. Po błędzie zapisujemy poprzedni stan, pokazujemy „Spróbuj ponownie” i zachowujemy wprowadzone dane demonstracyjne. Termin `dueAt` i uwaga `attentionLevel` są niezależne od statusu; sprawa w przygotowaniu może być pilna albo niepilna.

Zakończona rejestracja chipa Luny znajduje się wyłącznie w „Zakończonych”. W „W toku” nie umieszczamy specjalnego odnośnika dla tej jednej zakończonej sprawy. Liczniki zakładek wyliczamy z danych, nie wpisujemy ręcznie.

## 9. Wzorce ekranów

### `HomePage`

Powitanie → „Wymaga uwagi” (maksymalnie 3 pozycje i „Zobacz wszystkie”) → szybki dostęp do „Moich dzieci” i „Moich zwierząt” → aktywne sprawy → skrót do dokumentu. Skrót dokumentu nie musi być zawsze tym samym dokumentem. Nie pokazujemy dużego pustego pola rozmowy na starcie.

### `DocumentsPage` i `DocumentDetailsPage`

Główny dokument ma wyróżnioną kartę, pozostałe czytelną listę. Bez nakładającego się stosu zasłaniającego zawartość. Dokumenty dzieci pokazują właściciela. Dane są ukryte do świadomego użycia „Pokaż dane”. „Potwierdź dane” uruchamia przygotowaną symulację; nie otwiera kamery.

### `ChildrenPage` i `ChildProfilePage`

Lista dzieci z imieniem, wiekiem i liczbą spraw wymagających uwagi. Profil: dokumenty → sprawy w toku → dostępne działania. Utrata dokumentu jest dostępna również z jego szczegółów. Przed zatwierdzeniem pokazujemy nazwę dziecka, rodzaj dokumentu i skutki.

Zgoda drugiego rodzica występuje tylko tam, gdzie przewiduje ją zweryfikowany scenariusz. Nie dodajemy jej automatycznie do każdego działania. Przełączanie fikcyjnego rodzica jest funkcją demonstracji, odrębną od właściwych uprawnień interfejsu.

### `PetsPage` i `PetProfilePage`

Lista zwierząt → profil → identyfikacja, dokumenty, terminy i działania. `MicrochipSection` rozdziela numer chipa, rejestr i aktualność kontaktu. Nie pokazujemy możliwości odczytu mikroczipa telefonem. `QrTagSection` dotyczy osobnej zawieszki QR i ma oddzielny status.

Zgłoszenie zaginięcia prowadzi przez przygotowanie ogłoszenia i podsumowanie widocznych danych. Kontakt w scenariuszu odbywa się przez fikcyjny formularz pośredniczący; adres i telefon opiekuna nie są publiczne. Nadawca potwierdzenia to „Rejestr zwierząt · DEMO”, a treść: „Symulowane potwierdzenie wpisu do rejestru”.

### `CasesPage` i `CaseDetailsPage`

Zakładki „W toku” i „Zakończone”. Szczegóły pokazują właściciela, bieżący etap, następny krok, załączniki i historię zdarzeń. Wniosek wysłany nie oznacza automatycznie pozytywnego rozstrzygnięcia ani zakończenia sprawy.

### `InboxPage` i `MessageDetailsPage`

Skrzynka pokazuje nadawcę, temat, datę i stan odczytania. Lista nie prezentuje szczegółów wybranego pisma bez wyraźnego zaznaczenia wyboru. Na telefonie szczegóły otwierają osobny ekran. Akcje „Otwórz sprawę” i „Wyjaśnij z asystentem” dotyczą właśnie otwartego pisma.

### `ConfirmationPage`

Podsumowanie → skutki → „Wróć i popraw” oraz konkretne zatwierdzenie, np. „Potwierdź zgłoszenie”. Etykieta „Zatwierdzenie symulowane” jest widoczna. Animacja biometrii nie skanuje twarzy, nie wymaga aparatu i nie udaje wykonania prawdziwej czynności.

## 10. Asystent

`AssistantButton` jest jedną z ikon górnego paska. Na telefonie otwiera pełnoekranowy panel; na szerokim ekranie może otwierać panel boczny o szerokości około 400 px. Rozmowa nie wymaga ponownego wybierania dziecka lub dokumentu, jeśli kontekst jest jednoznaczny.

Nagłówek: „Asystent”, przycisk „Zamknij asystenta”, informacja „Odpowiedzi symulowane” i znacznik np. „Dotyczy: Zosia · Dokumenty”. Jeśli użytkownik zmienia kontekst, rozpoczynamy odpowiedni scenariusz i komunikujemy zmianę; nie mieszamy danych różnych osób.

Obsługujemy sugestie i jawnie wspierane frazy. Po pytaniu poza zakresem: „Ten scenariusz nie jest dostępny w demonstracji. Wybierz jedną z dostępnych spraw”. Nie generujemy pozornej odpowiedzi na dowolne pytanie. Po przejściu do formularza rozmowa i ekran korzystają z tej samej sprawy.

## 11. Dostępność i ruch

Celem implementacyjnym jest WCAG 2.2 AA; ten dokument nie stanowi deklaracji zgodności. Sprawdzamy gotowe ekrany ręcznie i narzędziami.

- Tekst zwykły: kontrast co najmniej 4,5:1. Duży tekst oraz istotne elementy graficzne i granice kontrolek: co najmniej 3:1 w wymaganych przypadkach.
- Obszary dotyku projektujemy na minimum 48 × 48 CSS px. Ikona może być mniejsza.
- Cały proces dostępny z klawiatury. Kolejność fokusu odpowiada kolejności czytania.
- Panel modalny przechwytuje fokus, zamyka się Escape i oddaje fokus kontrolce otwierającej. Tło jest nieaktywne; nie ukrywamy przed czytnikiem elementu zawierającego bieżący fokus.
- Błędy pól połączone przez `aria-describedby`; `aria-invalid` przy błędnym polu. Po nieudanym wysłaniu formularza fokus trafia do podsumowania błędów lub pierwszego błędnego pola.
- Wyniki operacji ogłaszamy zwięzłym `role="status"`; ważne błędy stosownie przez `role="alert"`. Nie odczytujemy całej historii rozmowy od nowa.
- Powiększenie tekstu do 200% i reflow na 320 CSS px nie powodują utraty działań ani poziomego przewijania zwykłej treści.
- Awatar obok widocznego imienia jest dekoracyjny (`alt=""`); znaczące zdjęcie ma opis. Placeholder ma inicjał lub neutralną ikonę.

Tokeny ruchu: `--motion-fast: 120ms`, `--motion-standard: 180ms`, `--motion-slow: 240ms`. Ruch wyjaśnia zmianę stanu, nie opóźnia działania. `prefers-reduced-motion: reduce` usuwa przesunięcia i ozdobne animacje; wynik symulacji nadal jest widoczny i opisany. Dla demonstracji czas jest ustalony, np. `SIMULATION_DELAY_MS = 800`; nie stosujemy nieskończonego oczekiwania.

## 12. Treści i dane demonstracyjne

Daty formatujemy w `pl-PL`; strefa: `Europe/Warsaw`. Ustalamy `DEMO_DATE`, dzięki czemu terminy i liczby dni pozostają spójne z przykładowymi zdarzeniami. Nie łączymy stałej daty dokumentu z rzeczywistym „za 3 dni”. Liczby i odmianę („1 sprawa”, „2 sprawy”, „5 spraw”) wyliczamy w warstwie prezentacji.

Przyciski: czasownik i obiekt, np. „Zgłoś utratę dokumentu”, „Zmień dane kontaktowe”, „Otwórz sprawę”. Unikamy „OK” przy decyzjach mających skutki. Komunikat błędu mówi, co się nie udało i jak kontynuować. „Przyjęto zgłoszenie” nie zastępuje „Dokument unieważniony”.

Stosujemy fikcyjne profile: Marta, Zosia, Adam, Luna i Bruno. W module danych każdy podmiot ma stabilny angielski identyfikator. Żaden scenariusz nie przełącza się na inną osobę przez użycie wspólnego tekstu. Przykładowe dane kontaktowe nie prowadzą do prawdziwych osób; numery dokumentów najlepiej zastąpić etykietą „Numer demonstracyjny” lub maską.

Nie zakładamy, że chip jest zapisany we wszystkich rejestrach. Nie przedstawiamy fikcyjnej instytucji jako rzeczywistego organu. Szczegółowe procedury dotyczące dokumentów dzieci wymagają osobnej weryfikacji przed opracowaniem treści scenariuszy.

## 13. Przykład kontraktu komponentu

```ts
type CaseStatus =
  | 'draft'
  | 'needsInput'
  | 'awaitingConsent'
  | 'submitting'
  | 'submitted'
  | 'completed'
  | 'cancelled';

type CaseListItemProps = {
  id: string;
  title: string;
  subjectName: string;
  status: CaseStatus;
  nextStep?: string;
  dueAt?: string; // ISO 8601; formatowanie dopiero przy wyświetlaniu
  href: string;
};

const caseStatusLabels: Record<CaseStatus, string> = {
  draft: 'W przygotowaniu',
  needsInput: 'Wymaga uzupełnienia',
  awaitingConsent: 'Czeka na zgodę',
  submitting: 'Wysyłanie — symulacja',
  submitted: 'Wysłano — oczekuje na odpowiedź',
  completed: 'Zakończona',
  cancelled: 'Anulowana',
};
```

## 14. Zakres pierwszej implementacji

Najpierw fundamenty i komponenty bazowe, następnie wspólny szkielet nawigacji i ekrany. Nie tworzymy osobnych wariantów przycisków dla dzieci i zwierząt.

| Etap | Rezultat |
| --- | --- |
| 1 | Tokeny, typografia, ikony, przyciski, pola, fokus i statusy |
| 2 | `AppHeader`, `BottomNavigation`, karty, listy, panele i stany puste |
| 3 | Start, Dokumenty, Sprawy, Skrzynka |
| 4 | Moje dzieci, profil dziecka i utrata wybranego dokumentu |
| 5 | Moje zwierzęta, profil, chip, zawieszka QR i zaginięcie |
| 6 | Kontekstowy asystent, animacje symulacji i reset demo |

## 15. Kryteria odbioru

- Wszystkie teksty użytkowe są po polsku; nazwy techniczne po angielsku.
- Asystent jest dostępny w górnym pasku i wraca do miejsca, z którego go otwarto.
- Zakończone sprawy nie występują w aktywnej zakładce; liczniki są spójne.
- Dokumenty i sprawy zachowują poprawnego właściciela na całej ścieżce.
- Nieprzeczytane wiadomości, aktywne zakładki i błędy są rozpoznawalne bez koloru.
- Formularz zachowuje dane po błędzie i pozwala poprawić podsumowanie.
- Nie występują prawdziwe połączenia do AI, rejestrów ani prośby o dostęp do urządzenia.
- QR jest wyraźnie oddzielony od mikroczipa; nie ma skanowania mikroczipa telefonem.
- Wszystkie stany da się obejrzeć z przykładowych scenariuszy; reset przywraca ten sam zestaw fikcyjnych danych.
- Weryfikacja obejmuje 320, 390, 768 i 1280 CSS px, powiększenie tekstu, klawiaturę, podstawowy odczyt czytnikiem i kontrast rzeczywistych komponentów.
- Makiety nie sugerują oficjalnej usługi ani wykonania prawdziwej czynności.

## 16. Decyzje pozostawione na kolejny etap

Dokładny zestaw ikon, treść procedur urzędowych, reprezentacja zgód rodzicielskich i warunki poszczególnych rejestrów wymagają doprecyzowania. Stanowią zakres projektowania scenariuszy, nie powód do podłączania produkcyjnych integracji. Rejestr zmian dokumentu zaczyna się od wersji 0.1; kolejne zmiany komponentów i tokenów aktualizują tę samą specyfikację.
