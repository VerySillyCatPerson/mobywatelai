# mObywatel / koncepcja — specyfikacja implementacji przepływów

Wersja 0.2 • 26.10.2026 • Język interfejsu: polski • Nazwy techniczne: angielski

## 0. Instrukcja dla Codexa

Zaimplementuj interaktywny prototyp opisany w tym dokumencie oraz wygląd z `mobywatel-design-system.md`. Ten dokument zastępuje wcześniejsze opisy zachowania z `mobywatel-user-flows.md` v0.1. W razie konfliktu zachowania obowiązuje ta specyfikacja; w sprawie tokenów i wyglądu obowiązuje design system. Nie korzystaj z innych plików `SPEC.md` ani handoverów niezwiązanych z tym projektem.

Zrealizuj wszystkie osiem przepływów, ścieżki problemowe, role i podprzepływ zawieszki QR. Nie podłączaj modelu AI, rejestrów, serwera usługowego, logowania, płatności, poczty, SMS, powiadomień systemowych ani uprawnień urządzenia. Nie implementuj odczytu chipa telefonem. Przełączanie ról i zdarzenia zewnętrzne to jawne funkcje demo na jednym urządzeniu. Wszystkie formularze, ogłoszenia, wiadomości i udostępnienia działają wyłącznie lokalnie.

Nie zastępuj działających ekranów opisowymi placeholderami. Pozycje poza zakresem mają jawne komunikaty określone dalej, nie martwe przyciski. Nie rozszerzaj procedur o domniemane wymagania urzędowe. Proponowane procesy nie są instrukcjami prawnymi ani odwzorowaniem aktualnych usług państwowych. Stała belka: „Prototyp. Dane i działania są fikcyjne”.

Wykonuj pracę kolejno: model stanu i dane → wspólne kontrolki i nawigacja → F01–F08 → asystent → panel demonstracyjny → kryteria akceptacji. Wybór konkretnych bibliotek pozostaje do osobnej architektury; reguły produktowe, treści i rezultaty nie wymagają dodatkowych decyzji.

## 1. Zakres, identyfikatory i granice

| ID | `flowId` | Realny zakres prototypu |
| --- | --- | --- |
| F01 | `childDocumentLoss` | Utrata paszportu albo legitymacji Zosi; dwa osobne rezultaty demonstracyjne |
| F02 | `childPassportApplication` | Przygotowanie paszportu, zgoda, wizyta demonstracyjna, oczekiwanie, gotowość i odbiór |
| F03 | `petMicrochipRegistration` | Rejestracja i zmiana kontaktu w dwóch fikcyjnych rejestrach |
| F04 | `missingPetRecovery` | Ogłoszenie, kontakt QR lub zgłoszenie placówki, dopasowanie, odbiór; również znalezienie bez ogłoszenia |
| F05 | `officialLetterResponse` | Wyjaśnienie, szkic, przykładowe załączniki, wysłanie, doręczenie i zakończenie |
| F06 | `trustedPersonAccess` | Zaproszenie, zakres, akceptacja, edycja szkicu, odebranie i wygaśnięcie dostępu |
| F07 | `childBirth` | Zgłoszenie, potwierdzenie, nowy profil i dalszy plan z działającymi zadaniami |
| F08 | `bereavementSupport` | Plan oraz konkretne przygotowanie wizyty po odpis dokumentu; bez przejęcia konta zmarłego |
| Q01 | `petQrTag` | Aktywacja, dezaktywacja i wymiana demonstracyjnej zawieszki |

F08 kończy wybrane przygotowanie, nie obiecuje elektronicznego zarejestrowania zgonu, rozstrzygnięcia spadku lub uzyskania świadczenia. F01 pokazuje proponowane skutki w fikcyjnym świecie, bez deklaracji faktycznych skutków prawnych.

### 1.1 Dane startowe — obowiązkowy seed

`DEMO_DATE = 2026-10-26T10:00:00+01:00`. Zegar przesuwa wyłącznie panel demonstracyjny. Daty prezentuj w `pl-PL`, strefa `Europe/Warsaw`.

| ID | Rekord startowy |
| --- | --- |
| `marta` | Marta Kowalska, właścicielka konta; opiekunka Zosi, Adama i Luny; domyślna rola |
| `piotr` | Piotr Kowalski, drugi opiekun Zosi; dostęp do własnej prośby o zgodę i minimalnego podsumowania paszportowego |
| `anna` | Anna Nowak, dorosła bliska osoba; początkowo brak udostępnionych spraw |
| `finder` | Znalazca · DEMO; tylko podgląd QR i formularz wiadomości |
| `vet`, `shelter`, `police` | Gabinet weterynaryjny · DEMO, Schronisko · DEMO, Policja · DEMO; tylko symulacja zgłoszenia znalezienia |
| `zosia` | Zosia Kowalska, ur. 2018-05-12, 8 lat; Marta i Piotr w scenariuszu opiekunami |
| `adam` | Adam Kowalski, ur. 2011-02-03, 15 lat; profil do wyboru, bez dokumentu objętego F01 |
| `luna` | Luna, kot, 4 lata, domyślnie `home`; brak aktywnej rejestracji w A i B, brak aktywnego QR |
| `bruno` | Bruno, pies, 6 lat; fikcyjny profil tylko do odczytu, „Ten scenariusz pokazujemy na profilu Luny” |
| `zosia-passport` | Paszport Zosi, `valid`, ważny do 2026-12-10; „Numer demonstracyjny P-001” |
| `zosia-school-card` | Legitymacja szkolna Zosi, `valid`; „Numer demonstracyjny L-001” |
| `registry-a`, `registry-b` | Rejestr zwierząt A · DEMO, Rejestr zwierząt B · DEMO; oba fikcyjne |
| `chip-sample` | Numer przykładowy `999000000000001`; nie deklaruj ważności fizycznego chipa |
| `contact-a`, `contact-b` | Kontakt demonstracyjny A / B, e-mail `opiekun-a@example.invalid` / `opiekun-b@example.invalid`; nie tworzyć linków wysyłających pocztę |
| `birth-event-1` | Narodziny dziecka · DEMO, data 2026-10-25; przykładowy rodzic Marta; docelowy profil `ola` |
| `deceased-jan` | Jan Zieliński · DEMO; odrębny fikcyjny podmiot planu F08, bez konta do przejęcia |
| `letter-1` | Pismo demonstracyjne do Marty, „Urząd Skarbowy · DEMO”, odebrane 2026-10-23; termin odpowiedzi z próbki 2026-10-30 |
| `letter-case` | Startowy szkic F05, `draft`, `currentStep=letter`, powiązany z `letter-1`; to jego można udostępnić Annie |

Seed zawiera wyłącznie dwie listy przykładowych plików: `invoice-a` („Faktura A · DEMO”), `invoice-b` („Faktura B · DEMO”), `wrong-file` („Notatka niezwiązana ze sprawą · DEMO”) oraz obraz `child-photo` („Zdjęcie przykładowe dziecka”). Podglądy to lokalne plansze z napisem DEMO; nie wymagają zewnętrznych URL-i.

Nie wczytuj naraz sprzecznych seedów. Odtworzenie wybranego scenariusza resetuje cały świat do odpowiedniej próbki po ostrzeżeniu; samo „Otwórz przepływ” nie resetuje postępu.

## 2. Model wspólny i reguły przejść

### 2.1 Minimalny kontrakt sprawy

```ts
type CaseStatus = 'draft' | 'needsInput' | 'awaitingConsent'
  | 'submitting' | 'submitted' | 'completed' | 'cancelled';
type OperationStatus = 'idle' | 'pending' | 'failed'
  | 'unknown' | 'succeeded' | 'notExecuted';
type CaseRecord = {
  id: string;
  flowId: string;
  subjectId: string;
  ownerId: 'marta';
  status: CaseStatus;
  currentStep: string;
  revision: number;
  draftData: Record<string, unknown>;
  history: { id: string; actorId: string; event: string; at: string }[];
};
type OperationRecord = {
  id: string;
  targetType: 'case' | 'report' | 'invitation' | 'consent';
  targetId: string;
  caseId: string | null;
  action: string;
  revision: number;
  actorId: string;
  worldEpoch: number;
  status: OperationStatus;
  returnStatus: CaseStatus;
  returnStep: string;
  resolveAs: 'succeeded' | 'notExecuted' | 'unknown';
};
```

`draftData` ma pola określone w danym flow. Stan błędu nie nadpisuje informacji, czy sprawa jest przygotowywana lub oczekuje na urząd. Statusy dokumentu, zwierzęcia, zgody, zaproszenia i ogłoszenia są osobnymi rekordami. `completed` oznacza zakończenie konkretnego celu sprawy, nie wszystkich spraw danej osoby. `revision` zwiększaj po zmianie danych, nie po samym otwarciu, walidacji lub przejściu między identycznymi widokami. Odpowiedź na wybór, następny krok oraz aktualizacja danych zapisują się spójnie jako jedno przejście.

Zgoda F02 wiąże się z `consentVersion`, zwiększaną tylko po zmianie dziecka, powodu, zdjęcia lub punktu obsługi. Nie porównuj jej z ogólną rewizją sprawy po zapisaniu terminu. Weryfikacja F03 wiąże się z `verificationKey = registryId + contactId`; zapisanie kroku lub otwarcie podsumowania jej nie unieważnia. Końcowa karta zatwierdzenia zawsze wiąże się z aktualną ogólną `revision`.

Deduplikacja: aktywna sprawa F01 na `documentId`, F02 na `childId`, F03 na `petId + registryId + action`, F04 na `petId`, F05 na `letterId`, F06 na `ownerId + recipientId`, F07 na `birthEventId`, F08 na `ownerId + deceasedId`, Q01 na `petId`. Dla istniejącej aktywnej: „Masz już rozpoczętą sprawę. Kontynuować?” → „Kontynuuj”, „Wróć”. Nie twórz kopii. F01 po zakończeniu pokazuje poprzedni rezultat, jeśli status dokumentu nie pozwala zgłosić nowej utraty. Nowe zaginięcie po powrocie zwierzęcia tworzy nową sprawę i nie usuwa poprzedniej historii.

### 2.2 Wspólna maszyna zatwierdzenia — G01

Każda tabela przepływu wskazuje akcję `COMMIT(action)`. Oznacza to dokładnie poniższe przejścia, także dla operacji pomocniczych. Zapis szkicu, podgląd, zmiana ekranu i oznaczenie zadania jako przygotowanego nie wymagają biometrii.

| Stan → akcja | Warunek | Wynik / kolejny krok |
| --- | --- | --- |
| krok edycji → `NEXT` | wszystkie wskazane pola poprawne | Zapis danych, `revision += 1`, przejście do następnego kroku |
| podsumowanie → `CONFIRM` | aktualne uprawnienia, aktualna wersja, brak `pending/unknown` | Otwórz „Zatwierdzenie demonstracyjne”; opis „To animacja. Nie używamy aparatu ani danych biometrycznych” |
| otwarta animacja → „Anuluj” | przed rozpoczęciem wykonania | Zamknij; bez operacji, zmiany dokumentów i zgód |
| otwarta animacja → „Zatwierdź — demo” | ponownie sprawdzone warunki | Utwórz `operationId`, zablokuj powtórzenie, `submitting`; animacja 800 ms |
| wykonanie → `success` | zgodny cel, `revision`, pierwotny `actorId`, `worldEpoch`, aktualne uprawnienia aktora | Jeden spójny zapis efektu, historii i wiadomości. Rezultat z tabeli danego flow |
| wykonanie → `knownFailure` | wariant demo | Brak efektu; przywróć `returnStatus/returnStep`; „Nie udało się wykonać działania. Dane zostały zachowane” |
| wykonanie → `unknownOutcome` | wariant demo | `operation.status=unknown`, sprawa `submitting`; „Nie mamy potwierdzenia wyniku. Najpierw sprawdź status” |
| `unknown` → „Sprawdź status” | wynik wybrany w panelu demo | `succeeded`: zastosuj efekt raz; `notExecuted`: przywróć edycję i „Działanie nie zostało wykonane. Możesz spróbować ponownie”; `unknown`: zachowaj i „Nadal brak rozstrzygnięcia. Zapisz sprawę i wróć później” |
| `unknown` → ponowne wysłanie | zawsze | Zablokowane do ustalenia wyniku; dostępne „Sprawdź status”, „Zapisz i wyjdź” |
| rezultat → ponowna obsługa tego samego `operationId` | operacja już zastosowana | Zwróć istniejący wynik, bez nowego zdarzenia |
| stara karta zatwierdzenia → `CONFIRM` | inna wersja, rola lub zakres | „Podsumowanie jest nieaktualne. Sprawdź aktualne dane” → nowe podsumowanie |

Przed rozpoczęciem wykonania utrata uprawnienia uniemożliwia operację. Po rozpoczęciu, lecz przed utrwaleniem efektu: jeśli prawo już nie obowiązuje, operacja kończy się `notExecuted`, bez skutku i z komunikatem o braku dostępu. Jeśli efekt był już utrwalony przed cofnięciem prawa, pozostaje wykonany; nie cofaj go wyłącznie dlatego, że później odczyt jest zabroniony. Przy `unknown` prezentacja wyniku wymaga bieżącego prawa odczytu. Rezultat nie jest renderowany aktorowi, który utracił do niego dostęp.

Przejścia powyżej stosują się do mutacji istniejącej sprawy, np. zamknięcia ogłoszenia, oraz do zgody Piotra w F02. `returnStatus` i `returnStep` zapamiętują stan sprzed tej konkretnej operacji. Przy nieudanym zamknięciu zaginięcia sprawa nadal pozostaje aktywna.

### 2.3 Przerwanie, role, przeładowanie

- Zapisuj fikcyjne szkice po zmianie pola; debounce 300 ms. Przy zamknięciu panelu, przejściu między ekranem i asystentem oraz zwykłej nawigacji wymuś zapis. Walidacja nie jest warunkiem zapisu szkicu.
- „Zapisz i wyjdź” nie anuluje sprawy. „Porzuć szkic” pokazuje „Porzucić przygotowanie? Zapisane odpowiedzi tego szkicu zostaną usunięte” → „Porzuć”, „Wróć”. Dozwolone tylko przed pierwszym wykonanym zgłoszeniem. Po wykonaniu użyj dedykowanego działania, np. wycofania ogłoszenia.
- Przy odświeżeniu w trakcie animacji wróć do ostatnio utrwalonej operacji. Nie pokazuj sukcesu na podstawie upływu czasu. Wystaw lokalny wynik w scenariuszu demo albo przejdź do `unknown`.
- Brak trwałego zapisu: „Postęp jest dostępny tylko w tej otwartej karcie”. Uszkodzony lub nieobsługiwany zapis: „Nie można odtworzyć postępu. Rozpocznij nowe demo” → jawny reset; nie próbuj odtwarzać części uprawnień.
- Zmiana roli zapisuje szkice, zamyka asystenta, karty zatwierdzenia i chronione widoki; nowa rola trafia do własnego pulpitu. `pending` rozstrzyga się dla pierwotnego aktora, bez otwierania wyniku na ekranie nowej osoby. Uprawnienia sprawdź ponownie przed efektem: cofnięta edycja pomocnika oznacza brak zapisu.
- Reset zwiększa `worldEpoch` i usuwa operacje, zdarzenia i role. Każdy opóźniony callback z poprzedniej epoki jest ignorowany.
- Dwie karty przeglądarki: wspieramy jednego aktywnego edytora. Druga karta pokazuje „Demo jest już otwarte w innej karcie. Wróć do niej albo przejmij sesję”. Przejęcie unieważnia stare karty zatwierdzenia i ponownie wczytuje stan; nie obiecujemy współpracy sieciowej.

### 2.4 Dokładne komunikaty wspólne

| Klucz | Tekst / kontrolki |
| --- | --- |
| `common.required` | „Wybierz odpowiedź, aby przejść dalej” |
| `common.back` | „Wstecz” |
| `common.next` | „Dalej” |
| `common.review` | „Sprawdź podsumowanie” |
| `common.edit` | „Wróć i popraw” |
| `common.saveExit` | „Zapisz i wyjdź” |
| `common.resume` | „Kontynuuj sprawę” |
| `common.denied` | „W tym profilu nie masz dostępu do tej czynności” |
| `common.retry` | „Spróbuj ponownie” |
| `common.demoOnly` | „Wszystkie działania w tym scenariuszu są symulowane” |
| `common.outOfScope` | „Ta czynność nie jest częścią demonstracji. Możesz wrócić do planu” → „Wróć do planu” |
| `common.reset` | „Reset usunie postęp wszystkich fikcyjnych osób. Rozpocząć od nowa?” → „Resetuj demo”, „Wróć” |

## 3. Asystent — pełna projekcja tych samych kroków

Każdy wiersz kroków F01–F08 zawiera tytuł/treść, kontrolki i pytanie asystenta. To jeden węzeł procesu prezentowany na dwa sposoby. Asystent renderuje pytanie, wszystkie pola i te same akcje jako karty rozmowy; nie odsyła obowiązkowo do formularza. Krok podsumowania renderuje pełną kartę, nie sam tekst „sprawdź dane”. Rezultat i błędy korzystają z dokładnych tekstów wspólnych lub przypisanych do flow.

Po „Wróć i popraw” asystent pokazuje wybór wcześniejszych pól. Zmienione dane unieważniają późniejsze pochodne odpowiedzi: wybór innego dokumentu usuwa jego okoliczności i podsumowanie; zmiana rejestru usuwa jego weryfikację kontaktu; zmiana zakresu dostępu tworzy nową rewizję zaproszenia; zmiana treści paszportowej unieważnia zgodę. Nie usuwa niezależnych danych innych spraw.

### 3.1 Wejście i rozpoznawanie intencji

Normalizacja: małe litery, usunięcie diakrytyków, interpunkcji i wielokrotnych spacji. Bez modelu, sieci ani nieograniczonej interpretacji. Zdefiniuj aliasy z tabeli, także w formie bez polskich znaków. Fraza z zanegowaniem („nie chcę”, „nie zgubiłam”) nie uruchamia akcji. Pasujące dwie intencje → pokaż wybór. Nieznana fraza → stały fallback; nie stosuj ogólnego dopasowania „dokument” do dowolnej utraty.

| Intencja / sugestia | Aliasy przykładowe | Węzeł wejścia |
| --- | --- | --- |
| „Zgłoś utratę dokumentu dziecka” | „Zosia zgubiła paszport”, „dziecko zgubiło legitymację” | F01 `select` |
| „Przygotuj paszport dziecka” | „nowy paszport Zosi”, „paszport dla dziecka” | F02 `child` |
| „Zarejestruj chip” | „zarejestruj chip Luny”, „rejestracja chipa” | F03 `identify` |
| „Zgłoś zaginięcie zwierzęcia” | „zaginęła Luna”, „zaginął kot” | F04 `details` |
| „Sprawdź znalezienie” | „czy znaleziono Lunę”, „wiadomość o Lunie” | F04 `reports` |
| „Zwierzę wróciło do domu” | „odebrałam Lunę”, „Luna wróciła” | F04 `close` |
| „Wyjaśnij pismo” | „co oznacza to pismo”, „pomóż odpowiedzieć” | F05 `letter` |
| „Dodaj bliską osobę” | „Anna ma mi pomagać”, „udostępnij sprawę” | F06 `recipient` |
| „Cofnij dostęp” | „odbierz Annie dostęp” | F06 `revoke` |
| „Zgłoś narodziny” | „urodziło mi się dziecko”, „zgłoszenie narodzin” | F07 `event` |
| „Uporządkuj sprawy po śmierci bliskiej osoby” | „zmarła bliska osoba”, „zmarł mi tata” | F08 `situation` |
| „Zarządzaj zawieszką QR” | „aktywuj QR Luny”, „wyłącz zawieszkę” | Q01 `select` |
| „Kontynuuj sprawę” | „wróć do sprawy” | Wybór dostępnych spraw albo bieżąca sprawa |

Początek bez kontekstu: „W czym pomóc? Wybierz sprawę albo wpisz jedną z przykładowych próśb”. Sugestie obejmują wszystkie osiem flow i QR; można je grupować. Z kontekstem: „Dotyczy: {subjectName} · {caseTitle}. Jesteś na etapie: {stepTitle}”. Wybór podmiotu jest wymagany, jeśli nie jest jednoznaczny. Seed wprost wspiera Zosię i Lunę; inne profile otrzymują jawny komunikat zakresu zamiast podszywania się pod wybraną osobę.

### 3.2 Odpowiedzi, walidacja i przełączanie tematu

- Przy pytaniu wyboru wpisany tekst jest porównywany z etykietami i ich aliasami. Niepasująca odpowiedź: „Wybierz jedną z widocznych odpowiedzi”. Pola tekstowe przyjmują tylko tekst dla bieżącego pola; nie traktuj go jako polecenia akcji.
- „tak” jest wyborem tylko przy bieżącym pytaniu binarnym; nigdy zatwierdzeniem operacji. Swobodny tekst na podsumowaniu: „Sprawdź kartę i użyj przycisku, aby zatwierdzić”.
- „popraw”, „wstecz” pokazują wcześniejsze pola z wartościami. „anuluj” otwiera wybór „Zapisz i wyjdź” / „Porzuć szkic” / „Kontynuuj”; nie usuwa od razu.
- Nowa obsługiwana intencja w trakcie: „Masz rozpoczętą sprawę. Zapisać ją i przejść do nowej?” → „Zapisz i przejdź” / „Zostań tutaj”.
- Fallback: „Tego pytania nie obsługuje demonstracja. Wybierz dostępną sprawę”. Nie zmieniaj stanu bieżącej sprawy.
- Stare karty mają wyłączone akcje i dopisek „Nieaktualne — przejdź do bieżącego kroku”. Cofnięty dostęp usuwa chronione treści także z widocznej historii rozmowy.
- Stopka „Odpowiedzi symulowane”. Brak przycisku mikrofonu. Czas „Przygotowuję odpowiedź…”: 300 ms, dostępny wariant ograniczonego ruchu. Nie przesyłaj treści do analityki.

## 4. F01 — Utrata dokumentu dziecka

Sprawa zawiera `childId`, `documentId`, `lossReason: lost | stolen`, `discoveredAt`. Wybory dat: „Dziś” lub „Wczoraj”; wartości z zegara demo. Nie zbieramy opisu kradzieży ani adresu.

| `step` | Tytuł i dokładna treść ekranu | Pola / przyciski → przejście | Pytanie asystenta |
| --- | --- | --- | --- |
| `select` | „Dokument dziecka”. „Wybierz dziecko i dokument, którego dotyczy zgłoszenie” | Dziecko: Zosia / Adam. Adam: „Dla Adama nie przygotowano tego scenariusza” i powrót. Zosia: Paszport / Legitymacja szkolna. Oba wymagane; „Dalej” → `details` | „Którego dziecka i dokumentu dotyczy utrata?” |
| `details` | „Co się stało?” | „Zaginął” / „Został skradziony”; „Dziś” / „Wczoraj”; oba wymagane → `consequences` | „Co się stało i kiedy zauważono utratę?” |
| `consequences` | Paszport: „W tej demonstracji potwierdzone zgłoszenie zmieni status przykładowego paszportu na »Utrata zgłoszona«. Nie wykonuje to czynności w prawdziwym rejestrze”. Legitymacja: „Przygotujesz zgłoszenie do szkoły demonstracyjnej. Oczekiwanie na odpowiedź szkoły pokażemy jako osobny etap” | „Sprawdź podsumowanie” → `review`; „Dokument się znalazł” → wybór zapisu lub porzucenia szkicu | „Pokażę skutki wybranego zgłoszenia. Chcesz sprawdzić podsumowanie?” |
| `review` | „Sprawdź zgłoszenie”. Wiersze: Dziecko, Dokument, Zdarzenie, Data, Skutek w demo | „Potwierdź zgłoszenie — demo” → G01 `reportLoss`; „Wróć i popraw” → `select/details` | „Czy dane dotyczą właściwego dziecka i dokumentu? Sprawdź kartę przed zatwierdzeniem” |
| `result` | Paszport: „Zgłoszenie utraty zapisane”. „Status zmieniono tylko w demonstracji”. Legitymacja: „Zgłoszenie do szkoły wysłane — demo”. „Oczekuje na odpowiedź szkoły” | Paszport: „Przygotuj nowy paszport” → F02, „Otwórz sprawę”. Legitymacja: „Otwórz sprawę” | „Zgłoszenie ma potwierdzony wynik w demonstracji. Wybierz następny krok” |

Efekt `reportLoss`: paszport `document.status=lossReported`, sprawa `completed/result`; legitymacja `document.status=lossReported`, sprawa `submitted/waitingSchool`. Zdarzenie demo `schoolAcknowledged` dla drugiej ścieżki → `completed/result`, wiadomość „Szkoła · DEMO potwierdziła przyjęcie zgłoszenia”. Nie wydawaj nowej legitymacji automatycznie.

Unhappy paths: brak pola → `common.required`; brak uprawnienia → `common.denied`; dokument już `lossReported` → „Utrata tego dokumentu jest już zgłoszona” i istniejący wynik; znaleziony po zgłoszeniu → „Dokument znaleziony po zgłoszeniu” / „Nie przywracamy ważności dokumentu przez zamknięcie tej sprawy. Sprawdź dalszy krok właściwy dla dokumentu” → „Otwórz szczegóły”, „Wróć”. Błąd operacji → G01. Nie proponuj automatycznej zgody drugiego rodzica. Każde zachowanie działa również jako karta rozmowy.

## 5. F02 — Paszport dziecka od przygotowania do odbioru

`childId=zosia`, `reason: loss | expiry`, `photoId`, `officeId=demo-office`, `consentRevision`, `appointmentId`, `passportStage`. Domyślny scenariusz wymaga zgody Piotra; to jawne założenie próbki, nie reguła dla każdej rodziny. Numer nowego dokumentu: „Numer demonstracyjny P-002”.

| `step` | Tytuł i treść | Kontrolki → przejście | Asystent |
| --- | --- | --- | --- |
| `child` | „Nowy paszport dziecka”. „To proponowany przebieg demonstracyjny. Przygotowanie w aplikacji nie zastępuje wymaganych czynności poza nią” | Zosia; powód „Utrata dokumentu” / „Kończy się ważność” → `prepare` | „Dla którego dziecka przygotować sprawę i z jakiego powodu?” |
| `prepare` | „Przygotuj dane”. „Użyj gotowego zdjęcia i przykładowego miejsca obsługi” | „Użyj zdjęcia demonstracyjnego”; „Punkt obsługi · DEMO”. Oba wymagane → `consentReview` | „Wybierz przykładowe zdjęcie i miejsce obsługi” |
| `consentReview` | „Poproś o zgodę”. „W tym wariancie drugi opiekun sprawdza przygotowane dane” | Piotr, dziecko, powód, zdjęcie, punkt → „Wyślij prośbę o zgodę — demo” → G01 `requestPassportConsent` | „Prośba trafi do Piotra w demonstracji. Sprawdź jej zakres” |
| `waitingConsent` | „Czekasz na zgodę Piotra” | „Zapisz i wyjdź”; „Popraw dane”; panel demo przełącza rolę | „Prośba czeka na odpowiedź. Możesz wrócić później albo poprawić dane” |
| `consentDecision` | Widok Piotra: „Zgoda na przygotowaną sprawę”. Te same pola z rewizji prośby | „Wyraź zgodę — demo” → G01 `approveConsent`; „Odmów” → powód „Dane wymagają poprawy” / „Nie wyrażam zgody”, potem G01 `declineConsent` | „Sprawdź dane Zosi. Możesz wyrazić zgodę albo odmówić” |
| `consentDeclined` | „Piotr nie wyraził zgody”. Pokaż wybrany powód | „Popraw dane” → `prepare`; „Poproś ponownie” → `consentReview`; „Zapisz i wyjdź”; „Zakończ przygotowanie bez wniosku” → potwierdzenie anulowania | „Zgody nie ma. Chcesz poprawić dane, przygotować nową prośbę czy zakończyć przygotowanie?” |
| `readyForVisit` | „Przygotowanie gotowe”. „Zgoda dotyczy aktualnej wersji. Następny krok w tej demonstracji to wizyta w punkcie obsługi” | „Wybierz termin demonstracyjny” → `appointment` | „Zgoda jest zapisana. Chcesz zaplanować przykładową wizytę?” |
| `appointment` | „Termin wizyty — demo” | Dwa sloty: „28 października, 10:00” / „29 października, 12:00”; „Zapisz termin — demo” → G01 `bookVisit` | „Wybierz jeden z dwóch przykładowych terminów” |
| `visitBooked` | „Wizyta zaplanowana — demo”. Lista: „Przykładowe potwierdzenie przygotowania”, „Dokumenty wskazane przez punkt obsługi — do sprawdzenia” | „Zmień termin” → `appointment`; „Zapisz i wyjdź”. Zdarzenie demo `visitAccepted` → `processing` | „Termin zapisano. Czynności w punkcie pokaże osobne zdarzenie demonstracyjne” |
| `processing` | „Sprawa przyjęta w punkcie — demo”. „Oczekujesz na dalszą wiadomość” | „Otwórz historię”; zdarzenie `passportReady` → `readyForPickup` | „Nie ma jeszcze informacji o gotowości dokumentu” |
| `readyForPickup` | „Dokument gotowy do odbioru — demo” | „Pokaż szczegóły odbioru”; zdarzenie `passportCollected` → `result` | „Dotarła przykładowa informacja o gotowości. Otworzyć szczegóły?” |
| `result` | „Odbiór potwierdzony — demo”. „Nowy dokument jest widoczny w profilu Zosi” | „Otwórz dokument”, „Otwórz sprawę” | „W demonstracji potwierdzono odbiór nowego paszportu” |

Przejścia: `requestPassportConsent` → `awaitingConsent/waitingConsent`, zgoda `pending`; `approveConsent` wymaga roli Piotra i zgodnej rewizji → zgoda `approved`, sprawa `draft/readyForVisit`; odmowa → `needsInput/consentDeclined`. Ponowna prośba tworzy nowy rekord zgody, stary zachowuje w historii. Istotna zmiana dziecka, powodu lub zdjęcia unieważnia zgodę; zmiana terminu wizyty jej nie unieważnia. Zmiana punktu obsługi wymaga ponownego przeglądu przygotowania, bez domniemania konieczności nowej zgody na podstawie prawa; w tym demo zalicz ją do danych objętych zgodą.

`bookVisit` → `draft/visitBooked`, termin zapisany. `visitAccepted` dozwolone tylko po wizycie w scenariuszu → `submitted/processing`; `passportReady` tylko z `processing` → `submitted/readyForPickup`; `passportCollected` tylko z `readyForPickup` → `completed/result`, utwórz nowy dokument, poprzedni `replacedInDemo` („Zastąpiony w demonstracji”). Zachowaj historię dawnej utraty.

Warianty problemowe: brak zdjęcia → „Wybierz zdjęcie demonstracyjne”; zajęty termin → „Ten przykładowy termin nie jest dostępny. Wybierz drugi”; brak zgody → nie wolno rezerwować; wycofanie zgody przed `visitAccepted` → `needsInput/consentDeclined`, termin oznacz `requiresReview`, bez automatycznego usunięcia; po przyjęciu sprawy nie cofaj stanu urzędu, pokaż „Zmiana wymaga wyjaśnienia w punkcie obsługi — demo”. Zdarzenie `passportCorrectionRequested` z `processing` → `needsInput/prepare`, unieważnij zgodę, jeśli zmiana dotyczy jej zakresu; ponowna wizyta używa tych samych kroków. G01 obsługuje błędy operacji. „Zakończ przygotowanie bez wniosku” przed przyjęciem sprawy → `cancelled`; po przyjęciu tylko informacja „Wycofanie przyjętej sprawy nie jest częścią demonstracji” i powrót.

## 6. F03 — Mikroczip i kontakt opiekuna

Pola: `petId=luna`, `registryId`, `chipNumber`, `contactId`, `verificationStatus`, `action: register | updateContact`. Przyciski próbki nie skanują urządzenia. Numer w tym demo musi zawierać 15 cyfr, lecz sama walidacja nie dowodzi istnienia chipa; komunikat błędu: „Numer przykładowy powinien zawierać 15 cyfr”.

| `step` | Tytuł i treść | Kontrolki → przejście | Asystent |
| --- | --- | --- | --- |
| `identify` | „Mikroczip Luny”. „Numer znajdziesz w dokumentacji. Telefon nie odczytuje mikroczipa” | Pole „Numer chipa”, „Wstaw numer przykładowy”; rejestr A / B; oba wymagane → `contact` | „Wybierz rejestr i wstaw przykładowy numer chipa Luny” |
| `contact` | „Kontakt opiekuna”. „Te dane są przeznaczone do kontaktu w rejestrze. Nie publikujemy ich w ogłoszeniu” | Kontakt A / B → `verify` | „Który kontakt demonstracyjny powiązać z wpisem?” |
| `verify` | „Potwierdź kontakt — demo”. „Nie wysyłamy wiadomości. Użyj kodu przykładowego” | Kod `123456`; „Wstaw kod demonstracyjny”; „Sprawdź kod” → `review` | „Użyj kodu demonstracyjnego 123456. Nie wpisuj prawdziwego kodu z telefonu” |
| `review` | „Sprawdź wpis”. Luna, wybrany rejestr, numer, kontakt, działanie | „Potwierdź rejestrację — demo” albo „Potwierdź zmianę kontaktu — demo” → G01; „Wróć i popraw” | „Sprawdź rejestr i kontakt. Potwierdzenie dotyczy tylko tego wpisu” |
| `result` | Rejestracja: „Wpis zapisany w rejestrze demonstracyjnym”. Aktualizacja: „Kontakt przy wpisie zmieniony — demo” | „Otwórz wpis”, „Zarządzaj zawieszką QR” → Q01 | „Wpis ma potwierdzony wynik. Zawieszka QR jest osobną funkcją” |

`registerMicrochip` wymaga `verified` dla bieżącego `verificationKey`; efekt wpis `registered`, sprawa `completed/result`, wiadomość „Rejestr zwierząt {A/B} · DEMO” / „Rejestracja chipa” / „Symulowane potwierdzenie wpisu do rejestru”. `updateMicrochipContact` wymaga istniejącego wpisu; zamienia kontakt dopiero po sukcesie. Zmiana kontaktu lub rejestru resetuje weryfikację. Sam numer nie stanowi uprawnienia do przejęcia profilu.

Niepoprawny kod: „Kod demonstracyjny jest nieprawidłowy. Użyj 123456” i pozostanie `verify`. Brak numeru → „Nie mam numeru” / „Numer może odczytać placówka z odpowiednim czytnikiem. Możesz zachować przygotowanie” → „Zapisz i wyjdź”. Wpis już istnieje dla Luny → „Luna ma już wpis w tym rejestrze” → „Otwórz wpis” / „Zmień kontakt”. Konflikt z innym opiekunem (wariant panelu): „W tej próbce numer jest już powiązany z innym opiekunem. Nie można samodzielnie przejąć wpisu” → „Zapisz do wyjaśnienia”, `needsInput/contactConflict`. Niedostępność rejestru: G01 `knownFailure`; nie zmieniaj profilu. W `contactConflict` dostępne „Sprawdź ponownie”; zdarzenie `chipConflictCleared` usuwa konflikt, po czym wróć do `identify`.

## 7. Q01 — Zawieszka QR: aktywacja, wyłączenie i wymiana

Wspólny podprzepływ dostępny z profilu Luny, wyniku F03 oraz przez asystenta. Rekord `tag` ma `id`, `petId`, `status: inactive | active | revoked`. Nigdy nie odczytujemy kamery; „Pokaż scenariusz znalazcy” to lokalny widok demo. Nie generuj działającego zewnętrznego odnośnika ani zakodowanych danych osobowych.

| `step` | Tytuł i treść | Kontrolki / wynik | Asystent |
| --- | --- | --- | --- |
| `select` | „Zawieszka QR Luny”. Przy braku aktywnej: „Powiąż przykładową zawieszkę z profilem. To odrębne od mikroczipa” | „Aktywuj zawieszkę” → `review`; przy aktywnej: „Pokaż podgląd”, „Wyłącz”, „Wymień zgubioną zawieszkę” | „Chcesz aktywować, wyłączyć czy wymienić zawieszkę?” |
| `review` | „Aktywacja zawieszki — demo”. Luna, `tag-demo-1`, publiczne: imię i zdjęcie; kontakt przez formularz | G01 `activateTag` → `active`; „Wróć” | „Zawieszka pokaże imię i zdjęcie Luny oraz formularz kontaktu. Sprawdź podsumowanie” |
| `active` | „Zawieszka aktywna — demo” | „Pokaż scenariusz znalazcy” → F04 `tagLanding`; „Wróć do Luny” | „Zawieszka jest aktywna. Możesz zobaczyć przykładowy widok znalazcy” |
| `deactivateReview` | „Wyłączyć zawieszkę?”. „Formularz tej zawieszki przestanie być dostępny. Mikroczip i ogłoszenie pozostaną bez zmian” | G01 `deactivateTag` → stara zawieszka `revoked`, `result` | „Wyłączenie dotyczy tylko zawieszki. Chcesz sprawdzić podsumowanie?” |
| `replaceReview` | „Wymień zawieszkę — demo”. „Stara zawieszka przestanie działać. Przypiszemy nową próbkę” | G01 `replaceTag` → stara `revoked`, nowa `active` (`tag-demo-{counter}`) | „Sprawdź wymianę. Stary kod nie będzie już otwierał formularza” |
| `result` | „Zmiana zawieszki zapisana — demo” | „Otwórz zawieszkę”, „Wróć do Luny” | „Zmiana dotyczy zawieszki; wpis chipa nie został zmieniony” |

Ścieżka „Wyłącz” z `select` prowadzi do `deactivateReview`, „Wymień” do `replaceReview`. Aktywacja istniejącej aktywnej próbki otwiera ją bez duplikatu. Odwołany QR pokazuje „Ta zawieszka jest nieaktywna. Nie można wysłać wiadomości tym formularzem” i „Wróć do demonstracji”. Aktywny QR zwierzęcia bez ogłoszenia pokazuje formularz kontaktu do opiekuna bez informacji, że zwierzę zaginęło. Błędy i wynik niepewny: G01. Każda mutacja Q01 ma własny pomocniczy zapis sprawy kończący się `completed/active` albo `completed/result`, nie nadpisuje sprawy zaginięcia.

## 8. F04 — Zaginięcie i odnalezienie

Pola: `petId`, `disappearedAt`, `areaId`, `descriptionId`, `noticeId`, `selectedReportId`, `closureReason`. Ogłoszenie i zgłoszenia znalezienia są odrębnymi rekordami. `petStatus: home | missing`, `noticeStatus: draft | active | closed | withdrawn`; `reportStatus: new | rejected | matched | suspicious | resolved`. Jeden aktywny przypadek zaginięcia na zwierzę.

| `step` | Tytuł i treść | Kontrolki → przejście | Asystent |
| --- | --- | --- | --- |
| `details` | „Zaginęła Luna”. „Użyj danych przykładowych. Nie wpisuj swojego adresu” | Data „Dziś” / „Wczoraj”; rejon „Park · DEMO” / „Osiedle · DEMO”; opis „Kotka pręgowana, czerwona obroża” / „Kotka pręgowana, bez obroży”; wymagane → `preview` | „Kiedy i w jakim przykładowym rejonie zaginęła Luna? Wybierz opis” |
| `preview` | „Tak wygląda ogłoszenie”. Imię, zdjęcie Luny, data, przybliżony rejon i opis. „Kontakt przez formularz. Bez adresu domowego, numeru telefonu i numeru chipa” | „Sprawdź podsumowanie” → `review` | „Pokażę dokładnie te informacje, które będą widoczne w ogłoszeniu demonstracyjnym” |
| `review` | „Potwierdź ogłoszenie”. Ten sam podgląd i zakres kontaktu | G01 `publishNotice` → `searching`; „Wróć i popraw” | „Sprawdź treść i zakres danych. Publikacja nastąpi tylko w prototypie” |
| `searching` | „Poszukiwania trwają — demo” | „Sprawdź zgłoszenia” → `reports`; „Edytuj ogłoszenie” → `details`; „Luna wróciła sama” → `close`; „Wycofaj ogłoszenie” → `withdrawReview` | „Nie ma jeszcze potwierdzenia powrotu Luny. Chcesz sprawdzić wiadomości czy zmienić ogłoszenie?” |
| `reports` | „Zgłoszenia znalezienia”. Lista z nazwą źródła, datą i statusem | Wybierz zgłoszenie → `reportDetails`; pusto: „Nie ma jeszcze zgłoszeń”, „Wróć” | „Wybierz zgłoszenie, które chcesz sprawdzić. Sam sygnał nie potwierdza odnalezienia” |
| `reportDetails` | „Sprawdź zgłoszenie”. Źródło, przykładowy opis, miejsce odbioru jeśli placówka | „To może być Luna” → `matchReview`; „To nie Luna” → `rejectReview`; „Podejrzany kontakt” → `suspiciousReview` | „Czy zgłoszenie pasuje do Luny? Możesz odrzucić je lub oznaczyć jako podejrzane” |
| `matchReview` | „Potwierdź dopasowanie”. „Zwierzę pozostanie oznaczone jako zaginione do potwierdzenia odbioru” | G01 `matchReport` → `pickupPending` | „Zapiszę dopasowanie, ale nie zamknę poszukiwań przed odbiorem” |
| `pickupPending` | „Zgłoszono znalezienie. Odbiór niepotwierdzony” | „Potwierdź powrót do domu” → `close`; „To jednak nie Luna” → `rejectReview`; „Wróć do zgłoszeń” | „Czy Luna jest już z Tobą, czy chcesz wrócić do zgłoszeń?” |
| `close` | „Luna wróciła do domu?”. „Potwierdzenie zamknie ogłoszenie w demonstracji”. Źródło: wybrane zgłoszenie albo „Wróciła sama” | G01 `confirmPetReturn` → `result`; „Jeszcze nie” → poprzedni etap | „Sprawdź kartę powrotu. Samo zgłoszenie znalezienia nie zamyka sprawy” |
| `result` | „Powrót Luny potwierdzony — demo”. „Ogłoszenie zamknięte” | „Otwórz profil Luny”, „Otwórz historię” | „W demonstracji Luna wróciła do domu, a ogłoszenie jest zamknięte” |
| `withdrawReview` | „Wycofać ogłoszenie?”. „Nie oznacza to potwierdzenia odnalezienia” | G01 `withdrawNotice` → `withdrawn` | „Możesz zakończyć publikację bez potwierdzania powrotu. Sprawdź ten wybór” |
| `withdrawn` | „Ogłoszenie wycofane — demo”. „Powrót zwierzęcia nie został potwierdzony” | „Wznów poszukiwania” → `preview`; „Otwórz profil” | „Ogłoszenie jest wycofane. Możesz wznowić poszukiwania” |

Efekty: `publishNotice`/`updateNotice` → `petStatus=missing`, ogłoszenie `active`, sprawa `submitted/searching`; edycja aktywnego ogłoszenia zachowuje starą wersję publiczną do udanego `updateNotice`. Przycisk w `review` uruchamia `updateNotice`, jeśli ogłoszenie już aktywne, w innym przypadku `publishNotice`. Nie blokuj deduplikacją nowej sprawy edycji tej samej pozycji. `matchReport` → zgłoszenie `matched`, sprawa `submitted/pickupPending`. `confirmPetReturn` → `home`, ogłoszenie `closed` jeśli istnieje, zgłoszenie `resolved` jeśli wybrane, sprawa `completed/result`. `withdrawNotice` → ogłoszenie `withdrawn`, sprawa `cancelled/withdrawn`, status zwierzęcia nadal `missing`. Wznowienie przywraca tę samą sprawę do `draft/preview`, po zatwierdzeniu `submitted/searching`; nie zmieniaj historii. Nowe zaginięcie po `home` zakłada nową sprawę.

### 8.1 Znalazca i zawieszka — wariant A

`tagLanding` w roli `finder`: „Luna — kontakt z opiekunem”. Imię i zdjęcie, informacja „Ogłoszenie zaginięcia jest aktywne” tylko przy aktywnym ogłoszeniu. Akcje „Napisz do opiekuna” / „Wróć do demonstracji”. `finderMessage`: „Co chcesz przekazać?” → gotowe wiadomości „Znaleziono kota podobnego do Luny. Jest bezpieczny w miejscu demonstracyjnym” lub „Widziano kota podobnego do Luny w parku demonstracyjnym”. „Sprawdź wiadomość” → podsumowanie → G01 `sendFinderMessage`. Wynik „Wiadomość zapisana — demo. Nie otrzymujesz danych kontaktowych opiekuna”.

Pierwsza wiadomość tworzy zgłoszenie `new` i powiadomienie Marty; druga ma `reportType=sighting`, pokazuje „Sygnał o zauważeniu”, nie pozwala przejść bezpośrednio do `pickupPending`; można potwierdzić użyteczność jako wpis historii lub odrzucić. Odbiór zwierzęcia wymaga zgłoszenia typu `found` albo wyboru „Luna wróciła sama”.

### 8.2 Placówka i mikroczip — wariant B

Rola `vet/shelter/police`, ekran `InstitutionFoundPetPage`: „Zgłoszenie znalezienia — demo”. „Odczyt odpowiednim czytnikiem został zasymulowany”; pola: rejestr A/B, „Użyj przykładowego wyniku odczytu”, miejsce „Placówka przy Parkowej · DEMO”. Wymagane → podsumowanie z nazwą placówki → G01 `sendInstitutionReport`.

Wpis chipa w wybranym rejestrze istnieje i jest przypisany do Luny: utwórz raport `new`, powiadomienie „{Placówka} zgłosiła znalezienie zwierzęcia z numerem chipa przypisanym do Luny”. Instytucja nie dostaje w tym demo listy spraw opiekuna. Brak dopasowania → „W tym rejestrze nie znaleziono powiązania z opiekunem. Nie wysłano powiadomienia”; brak mutacji losowego profilu. Nieaktualny kontakt to jawny wariant: raport istnieje, lecz `notificationDelivery=unavailable`; w kontroli demo pokaż „Kontakt wymaga aktualizacji”. Po F03 nie wysyłaj wstecz wiadomości automatycznie; przycisk „Ponów powiadomienie — demo” tworzy jeden wpis dla tego raportu.

### 8.3 Znalezienie bez wcześniejszego ogłoszenia

Aktywny QR albo dopasowany chip może utworzyć `PetContactReport` bez sprawy zaginięcia. Marta dostaje kartę „Zgłoszono znalezienie Luny. Nie masz aktywnego ogłoszenia”. Akcje: „Sprawdź zgłoszenie” → ten sam `reportDetails`; „Luna jest ze mną” → potwierdzenie odrzucenia raportu, bez zmiany `home`; „Luna rzeczywiście zaginęła” → nowa F04 `submitted/reports` bez publikacji ogłoszenia (`noticeId=null`, `petStatus=missing`). Dalej dopasowanie i odbiór jak wyżej; nie publikuj ogłoszenia bez podsumowania. Raport nie jest dowodem utraty zwierzęcia i nie zmienia jej statusu samodzielnie.

### 8.4 Pozostałe unhappy paths

`rejectReview`: „Odrzucić to zgłoszenie? Pozostałe zgłoszenia i ogłoszenie pozostaną bez zmian” → G01 `rejectReport`: raport `rejected`, wybór dopasowania wyczyszczony, powrót `reports`, nadal `missing`. `suspiciousReview`: „Zgłosić podejrzany kontakt? Nie wysyłaj pieniędzy ani kodów” → G01 `flagReport`: raport `suspicious`, lokalny wpis zgłoszenia, powrót `reports`. Nie sugeruj realnego zawiadomienia policji.

Wariant żądania zapłaty ma tekst „Zapłać, aby odebrać zwierzę” i baner „Podejrzany kontakt — nie dokonuj płatności na podstawie tej wiadomości”; brak aktywnego linku płatności. Kilka raportów ma niezależne stany; zamknięcie sprawy nie usuwa ich historii. Nieaktywny QR → Q01 komunikat bez formularza. Brak chipa/QR nie blokuje ogłoszenia. Nieznany wynik dowolnej mutacji → G01; nie zmieniaj `home` ani nie zamykaj ogłoszenia przed potwierdzonym wynikiem. Asystent dla każdego raportu pyta o jego wybór, jeśli jest więcej niż jeden.

## 9. F05 — Pismo i odpowiedź

Oryginał próbki: „Wezwanie demonstracyjne do uzupełnienia dokumentów. Prosimy o przekazanie dwóch przykładowych faktur związanych z opisaną sprawą. Termin odpowiedzi wskazany w tej próbce: 30 października 2026. Pismo nie pochodzi z prawdziwego urzędu”. Identyfikator „PISMO-DEMO-001”.

Szkic: „W odpowiedzi na pismo PISMO-DEMO-001 przekazuję dwie przykładowe faktury dotyczące sprawy demonstracyjnej. Załączniki: Faktura A · DEMO oraz Faktura B · DEMO. Marta Kowalska · profil demonstracyjny”. To gotowy tekst do edycji; zmiana listy plików aktualizuje wyliczenie załączników w podsumowaniu, nie przepisuje samowolnie edytowanej treści.

| `step` | Tytuł i treść | Kontrolki → przejście | Asystent |
| --- | --- | --- | --- |
| `letter` | „Pismo do Marty”. Oryginał, nadawca, data i termin próbki | „Wyjaśnij pismo” → `explanation`; „Przygotuj odpowiedź” → `draft` | „To pismo prosi o dwie przykładowe faktury. Chcesz wyjaśnienie czy przygotowanie odpowiedzi?” |
| `explanation` | „Co trzeba zrobić?”. „Przygotuj odpowiedź i dołącz Fakturę A oraz Fakturę B. Termin z tej próbki: 30 października. To wyjaśnienie demonstracyjne” | „Pokaż oryginał”, „Przygotuj odpowiedź” → `draft` | Ten sam tekst co na ekranie |
| `draft` | „Treść odpowiedzi”. Etykieta „Odpowiedź — używaj danych fikcyjnych” | Tekst 1–2000 znaków po trim; „Użyj szkicu demonstracyjnego”; „Dalej” → `attachments`; pomocnik „Przekaż do przeglądu” zamiast wysyłki | „Przejrzyj lub popraw szkic. Nie wpisuj prawdziwych danych” |
| `attachments` | „Załączniki”. „Wybierz dwie przykładowe faktury” | Checkboxy A/B/Notatka; podgląd; wymagane A i B, notatka dozwolona tylko jako dodatkowa → `review` | „Które pliki dołączyć? W tym scenariuszu potrzebne są Faktura A i Faktura B” |
| `review` | „Sprawdź odpowiedź”. Nadawca, adresat z pisma, pełny tekst, lista plików | G01 `sendLetterResponse`; „Wróć i popraw” | „Sprawdź pełną treść, adresata i załączniki przed wysyłką demonstracyjną” |
| `sent` | „Odpowiedź wysłana — demo”. „Wysłanie nie oznacza jeszcze doręczenia ani zakończenia sprawy” | „Sprawdź status”, „Otwórz sprawę” | „Zapisano wysyłkę. Oczekujesz na osobne potwierdzenie doręczenia” |
| `delivered` | „Doręczenie potwierdzone — demo”. „Sprawa nadal oczekuje na rozpatrzenie” | „Otwórz historię” | „Jest potwierdzenie doręczenia. Nie ma jeszcze zakończenia sprawy” |
| `result` | „Sprawa zakończona — demo” | „Otwórz potwierdzenie”, „Wróć do spraw” | „Przykładowy urząd potwierdził zakończenie tej sprawy” |

Walidacja: pusty tekst → „Wpisz odpowiedź albo użyj szkicu demonstracyjnego”; ponad 2000 → „Odpowiedź może mieć do 2000 znaków”; brak A/B → „Brakuje: {nazwy brakujących faktur}”. Adresata nie edytujemy — powiązany z pismem. Termin po przesunięciu zegara: „Termin wskazany w próbce minął. Demonstracja pozwala przygotować odpowiedź, ale nie rozstrzyga skutków opóźnienia”.

`sendLetterResponse` → sprawa `submitted/sent`, jeden rekord wysyłki. `responseDelivered` tylko z `sent` → `submitted/delivered`; `responseCaseClosed` tylko z `delivered` → `completed/result`. `responseCorrectionRequested` z `sent/delivered` → `needsInput/draft`, nowa rewizja i odpowiedź powiązana z pierwotną; zachowaj historię wysyłek. Ponowna próba tego samego `operationId` nie tworzy nowej odpowiedzi. „Sprawdź status” bez zdarzenia pokazuje bieżący stan, nie przyspiesza urzędu.

Pomocnik może edytować przy właściwych uprawnieniach. „Przekaż do przeglądu” → G01 `submitHelperDraft`, utrwala wersję pomocnika i powiadomienie właścicielki; nie zmienia `caseStatus` na `submitted`, bo pismo nie zostało wysłane. Marta widzi „Anna przygotowała propozycję” → „Porównaj wersje”, „Użyj propozycji”, „Zachowaj moją wersję”. Przyjęcie propozycji zwiększa rewizję; wysyłka nadal wymaga jej własnego zatwierdzenia. G01 obsługuje błędy i wynik niepewny.

## 10. F06 — Bliska osoba, uprawnienia i ich zmiana

Domyślny przykład: Marta zaprasza Annę do `letter-case`. Innych spraw dzieci i zwierząt nie udostępniamy automatycznie. Wybór spraw obejmuje również własny plan F08, gdy istnieje. Dla dokumentu dziecka przycisk „Udostępnij” pokazuje „Udostępnianie spraw dziecka nie jest częścią tego wariantu demonstracji”, zamiast przekazywać dostęp do dziecka przez F06.

### 10.1 Macierz praw

| `permission` | Etykieta | Zakres i zależność |
| --- | --- | --- |
| `viewStatus` | „Status i termin” | Wymagane minimum; nazwa „Udostępniona sprawa”, stan i termin, bez treści i danych podmiotów |
| `readContent` | „Treść pisma i szczegóły” | Wymaga `viewStatus`; nie obejmuje załączników |
| `readAttachments` | „Załączniki” | Wymaga `readContent`; wyłączenie treści wyłącza załączniki |
| `prepareDraft` | „Przygotowanie szkicu” | Wymaga `readContent`; nie daje prawa do wysyłki ani zmiany danych właściciela |
| `receiveNotifications` | „Powiadomienia o tej sprawie” | Wymaga `viewStatus`; treść dopasowana do pozostałych praw |

Przy włączeniu zależnego prawa pokaż „Ta opcja wymaga: {lista}” i zaznacz je po wyborze „Włącz wymagane uprawnienia”; nie zaznaczaj po cichu. Wyłączenie prawa nadrzędnego pokazuje listę praw, które także zostaną wyłączone, i wymaga potwierdzenia. Na etapie tworzenia minimum `viewStatus` jest zaznaczone i opisane, pozostałe domyślnie wyłączone.

Dla planu F08 `readContent` oznacza treść zadań właścicielki; `readAttachments` ukryte, ponieważ przykładowy plan nie ma prywatnych załączników; `prepareDraft` oznacza propozycję notatki i oznaczenia przygotowania, nie prawo do formalnej czynności. Za każdym razem ekran podsumowania pokazuje opis właściwy dla wybranej sprawy.

### 10.2 Kroki

| `step` | Tytuł i treść | Kontrolki → przejście | Asystent |
| --- | --- | --- | --- |
| `recipient` | „Dodaj bliską osobę”. „Dostęp przyznasz tylko do wybranych spraw” | Anna Nowak · DEMO / Piotr Kowalski · DEMO; wybór wymagany → `scope` | „Komu chcesz udostępnić wybrane sprawy? Wybierz fikcyjną osobę” |
| `scope` | „Które sprawy udostępnić?” | Lista kwalifikujących się spraw, żadna domyślnie zaznaczona; min. jedna → `permissions` | „Wybierz konkretne sprawy. Nowe sprawy nie zostaną dodane automatycznie” |
| `permissions` | „Co może zobaczyć i zrobić bliska osoba?” | Macierz praw osobno na sprawę; okres „7 dni” / „30 dni”; wymagany → `review` | „Wybierz zakres dla każdej sprawy i czas dostępu” |
| `review` | „Sprawdź zaproszenie”. Odbiorca, sprawy, prawa, data końca; „Końcowe zatwierdzenie czynności pozostaje po Twojej stronie” | G01 `sendAccessInvitation` → `waitingInvitation` | „Sprawdź osobę, sprawy i uprawnienia. Dostęp zacznie działać po przyjęciu zaproszenia” |
| `waitingInvitation` | „Zaproszenie czeka na odpowiedź” | „Wycofaj zaproszenie” → `withdrawInvitationReview`; „Zapisz i wyjdź” | „Zaproszenie nie daje jeszcze dostępu. Możesz poczekać albo je wycofać” |
| `invitationDecision` | Widok odbiorcy: „Marta zaprasza do pomocy”. Zakres i data końca, bez treści samych spraw | G01 `acceptAccessInvitation` lub G01 `declineAccessInvitation` | „Sprawdź proponowany dostęp. Chcesz przyjąć czy odrzucić zaproszenie?” |
| `active` | „Dostęp aktywny”. Kto, zakres, data końca i historia | „Zmień zakres” → `permissions`; „Cofnij dostęp” → `revoke`; „Otwórz historię” | „Dostęp jest aktywny. Możesz sprawdzić historię, zmienić zakres albo go cofnąć” |
| `declined` | „Zaproszenie odrzucone”. „Nie przyznano dostępu” | „Przygotuj nowe zaproszenie” → `permissions`; „Zakończ” → sprawa `completed` | „Zaproszenie odrzucono. Nowa prośba wymaga ponownego potwierdzenia” |
| `revoke` | „Cofnąć dostęp?”. Osoba i lista grantów. „Dalszy dostęp zostanie zablokowany. Nie usunie to informacji wcześniej przeczytanych” | G01 `revokeAccess` → `revoked` | „Sprawdź, komu i do których spraw odbierasz dostęp” |
| `revoked` | „Dostęp cofnięty — demo” | „Wróć do bliskich osób” | „Nowe odczyty i edycje zostały zablokowane w demonstracji” |

`sendAccessInvitation`: zaproszenie `pending`, ważne 7 dni od wysłania, sprawa `submitted/waitingInvitation`; data końca dostępu to wysłanie + wybrane 7/30 dni i jest znana przed akceptacją. `acceptAccessInvitation`: tylko wskazany odbiorca, nie po wygaśnięciu → granty `active`, sprawa `completed/active`. Zakończone zaproszenie jest zamkniętą sprawą, lecz aktywny grant pozostaje widoczny na liście bliskich osób. `declineAccessInvitation` → zaproszenie `declined`, sprawa `needsInput/declined`; nie pokazuj szczegółów nieprzyznanych spraw. `revokeAccess`: właścicielka, wszystkie wymienione granty `revoked`, nowe zdarzenie historii; osobny pomocniczy zapis zakończonej zmiany, bez zmiany historii oryginalnego zaproszenia.

`withdrawInvitationReview`: „Wycofać oczekujące zaproszenie? Odbiorca nie uzyska dostępu” → G01 `withdrawAccessInvitation`: zaproszenie `withdrawn`, sprawa `cancelled`, bez grantów. Wygasłe oczekujące zaproszenie → `expired`, sprawa `cancelled`; komunikat „Zaproszenie wygasło. Przygotuj nowe, jeśli nadal chcesz udostępnić sprawy”. Wygaśnięcie grantu: `expired`, brak odczytu i edycji, oryginalna sprawa zaproszenia pozostaje zakończona.

### 10.3 Zmiana zakresu i konflikty

Ograniczenie praw lub usunięcie spraw działa po zatwierdzeniu właścicielki od razu, bez zgody pomocnika. Rozszerzenie lub wydłużenie wymaga nowego zaproszenia: dotychczasowy zakres działa do akceptacji lub wygaśnięcia; nowy nie działa przed akceptacją. Gdy zmiana jednocześnie ogranicza i rozszerza: ograniczenie działa natychmiast po zatwierdzeniu, dodatkowe prawa dopiero po akceptacji. Odmowa rozszerzenia nie przywraca odebranych praw. Komunikat podsumowania wymienia oba skutki osobno.

Pomocnik nie edytuje oryginalnego szkicu Marty. Tworzy `DraftProposal` z `baseRevision`, `authorId` i swoją treścią. Właścicielka porównuje wersje i wybiera „Użyj propozycji” lub „Zachowaj moją wersję”. Jeżeli jej wersja zmieniła się po przygotowaniu propozycji, pokaż „Twoja odpowiedź zmieniła się od czasu utworzenia propozycji. Porównaj obie wersje”; brak automatycznego nadpisania.

Zdarzenie utraty praw zamyka chroniony ekran i usuwa jego zawartość z bieżącej rozmowy. Niedokończona nieprzekazana propozycja staje się niedostępna; wcześniej przekazana pozostaje u Marty jako element historii. Uprawnienia obowiązują również w bezpośrednim adresie ekranu i asystencie. `common.denied` nie pokazuje tytułu prywatnego pisma. Po aktywacji w pulpicie pomocnika widoczna sekcja „Sprawy bliskich”, po cofnięciu pusta: „Nie masz teraz udostępnionych spraw”.

## 11. F07 — Narodziny i dalsze zadania

Pola: `birthEventId=birth-event-1`, `childName: Ola | Lena`, `deliveryMode: digitalDemo | officeDemo`; przykładowy rodzic Marta. To przygotowany wariant, nie weryfikacja rodzicielstwa. Nowy profil ma stabilny `id=ola` nawet przy wyborze imienia Lena; nazwę wyświetlaną bierz z danych, nie z ID.

| `step` | Tytuł i treść | Kontrolki → przejście | Asystent |
| --- | --- | --- | --- |
| `event` | „Urodziło mi się dziecko”. „Wybierz przykładowe zdarzenie. Nie wpisuj prawdziwych danych” | „Narodziny 25 października · DEMO”; „Nie ma mojego zdarzenia” → `missingRecord`; wybór → `details` | „Wybierz zdarzenie demonstracyjne albo sprawdź, co zrobić, gdy go nie ma” |
| `details` | „Dane zgłoszenia” | Imię Ola / Lena; sposób potwierdzenia „Skrzynka · DEMO” / „Punkt obsługi · DEMO”; oba wymagane → `review` | „Wybierz przykładowe imię i sposób otrzymania potwierdzenia” |
| `review` | „Sprawdź zgłoszenie narodzin”. Zdarzenie, dane rodzica, imię i sposób potwierdzenia | G01 `submitBirthRegistration` → `waiting` | „Sprawdź kartę. Samo wysłanie nie utworzy jeszcze potwierdzonego profilu dziecka” |
| `waiting` | „Zgłoszenie wysłane — demo”. „Oczekuje na osobne potwierdzenie” | „Sprawdź status”, „Zapisz i wyjdź”; zdarzenie `birthConfirmed` → `plan` | „Nie ma jeszcze potwierdzenia. Możesz wrócić później” |
| `correction` | „Uzupełnij zgłoszenie”. „W demonstracji poproszono o ponowne sprawdzenie imienia” | Wybór imienia → `review`; zachowaj poprzednią historię | „Wybierz poprawne imię i ponownie sprawdź podsumowanie” |
| `plan` | „Profil dziecka dodany — demo”. „Wybierz następną sprawę. Każda jest osobnym działaniem” | „Dokument dziecka”, „Ubezpieczenie”, „Wsparcie dla rodziny”, „Otwórz profil dziecka” | „Dziecko ma już profil w demonstracji. Którą następną sprawę chcesz przygotować?” |
| `missingRecord` | „Brak zdarzenia w demonstracji”. „Możesz zachować listę przygotowania, ale nie utworzymy zgłoszenia bez danych” | „Zapisz plan przygotowania”, „Wybierz zdarzenie przykładowe” | „Brakuje danych do zgłoszenia. Wolisz listę przygotowania czy przykład?” |

`submitBirthRegistration` → `submitted/waiting`; `birthConfirmed` dozwolone wyłącznie dla wysłanego zdarzenia → jedno dziecko w profilu, `completed/plan`, jedna wiadomość „Potwierdzenie narodzin · DEMO”. Zdarzenie powtórzone niczego nie duplikuje. `birthCorrectionRequested` → `needsInput/correction`. Ponowne wysłanie zwiększa rewizję, nie tworzy drugiego zgłoszenia ani profilu. Rola Piotra/Anny bez uprawnienia dla tego zdarzenia → `common.denied`.

### 11.1 Zamknięty zakres planu po narodzinach

Każde zadanie jest klikalne i ma własne `taskStatus: notStarted | prepared | outOfScope`; zakończenie zadania nie jest zgłoszeniem do instytucji.

| Zadanie / ekran | Dokładna treść i pola | Wynik i ścieżka powrotu |
| --- | --- | --- |
| „Dokument dziecka” / `newbornDocumentPlan` | „Przygotowanie dokumentu dla noworodka nie jest objęte pokazanym wariantem paszportu Zosi. Wymagania należy sprawdzić dla wieku dziecka”. Lista „Ustal rodzaj dokumentu”, „Sprawdź wymagania dla wieku dziecka” | „Zapisz listę przygotowania” → `prepared`; nie odsyłaj noworodka do F02 Zosi. „Wróć do planu” |
| „Ubezpieczenie” / `newbornInsurancePlan` | „To lista do przygotowania, nie zgłoszenie do ubezpieczenia”. Wybór „Kontakt z pracodawcą · DEMO” / „Ustalenie właściwego kanału” | „Zapisz przygotowanie” → `prepared`; „Przygotowanie zapisane. Zgłoszenie nie zostało wysłane”. Powrót do planu |
| „Wsparcie dla rodziny” / `newbornSupportPlan` | „Składanie wniosku o świadczenie nie jest częścią demonstracji. Lista nie potwierdza prawa do świadczenia”. Dwie pozycje „Sprawdź warunki”, „Ustal właściwy kanał” | `outOfScope`; „Zapisz do sprawdzenia” dodaje lokalne zadanie i powrót do planu |

Asystent przy wyborze zadania pokazuje dokładnie ten tekst, kontrolki i rezultat. Nie odpowiada sam „złożono wniosek”. Zapis planu bez rekordu narodzin tworzy tylko własny plan właścicielki `draft/missingRecord`; brak dziecka i brak czynności rejestrowej. Po wyborze istniejącego zdarzenia użyj tej samej sprawy, a nie drugiego planu.

## 12. F08 — Śmierć bliskiej osoby: konkretna ścieżka przygotowania wizyty

Wersja 0.2 obejmuje jeden pełny proces: **przygotowanie do wizyty w celu wyjaśnienia uzyskania odpisu dokumentu dotyczącego śmierci bliskiej osoby**. Nie udajemy wydania odpisu ani rozstrzygnięcia uprawnień. To lista i plan czynności, dzięki czemu może działać bez zweryfikowanej procedury urzędowej. Główna sprawa ma `caseGoal=prepareVisit`, a nie `registerDeath`.

Pola: `deceasedId=deceased-jan`, `recordAvailability: available | missing | unknown`, `purpose: ownFormalities | supportFamily`, `checklist`, `slotId`, `helperNote`. Wszystkie dane osoby są fikcyjne; nie ma podglądu jej konta ani dokumentów z innych modułów.

| `step` | Tytuł i treść | Kontrolki → przejście | Asystent |
| --- | --- | --- | --- |
| `situation` | „Zmarła bliska osoba”. „Możesz przejść przez sprawy etapami i wrócić później” | „Przygotuj wizytę”, „Mam już plan”; wybór osoby Jan Zieliński · DEMO → `record` | „Pomogę przygotować jeden krok. Wolisz rozpocząć plan wizyty czy wrócić do zapisanego?” |
| `record` | „Co już masz?”. „Nie musisz znać wszystkich odpowiedzi” | „Mam dokument lub informację o rejestracji”, „Nie mam jeszcze”, „Nie wiem”; cel: własne formalności / pomoc rodzinie → `checklist` | „Czy masz już dokument lub informację o rejestracji zdarzenia? Możesz wybrać »Nie wiem«” |
| `checklist` | „Przygotuj pytania do punktu obsługi”. Lista: „Ustal, czy zdarzenie jest zarejestrowane”, „Zapytaj, kto może uzyskać odpis”, „Sprawdź wymagane dokumenty”, „Ustal formę i sposób odbioru” | Checkbox „Mam zapisaną listę pytań”; wymagany tylko do finalnego zakończenia przygotowania. „Dalej” → `appointment` | „Oto lista pytań do wyjaśnienia. Chcesz zachować ją i zaplanować przykładową wizytę?” |
| `appointment` | „Wizyta demonstracyjna”. „Nie rezerwujemy prawdziwego terminu” | „28 października, 11:00 · DEMO”, „29 października, 13:00 · DEMO”, „Ustalę termin samodzielnie”; wybór wymagany → `review` | „Wybierz termin demonstracyjny albo zaznacz, że ustalisz go samodzielnie” |
| `review` | „Sprawdź plan wizyty”. Osoba, cel, co już wiadomo, pytania, termin albo brak rezerwacji. „Plan nie potwierdza uprawnienia do uzyskania odpisu” | „Zapisz przygotowanie” → `result` bez biometrii; „Wróć i popraw” | „Sprawdź plan. Zapis nie wysyła wniosku ani nie daje dostępu do konta bliskiej osoby” |
| `result` | „Przygotowanie zapisane”. „Możesz wrócić do listy pytań lub poprosić o pomoc przy tym planie” | „Otwórz listę”, „Poproś bliską osobę o pomoc” → F06 z tym planem, „Pozostałe sprawy” → `otherTasks` | „Plan jest zapisany. Na dziś możesz zakończyć albo udostępnić wybrany zakres pomocnikowi” |
| `otherTasks` | „Pozostałe sprawy do sprawdzenia” | „Kontakt z instytucjami”, „Możliwe wsparcie”, „Sprawy spadkowe” → osobne karty zakresu | „Możesz zapisać kolejne tematy do sprawdzenia. Ta demonstracja ich nie rozstrzyga” |

Efekt „Zapisz przygotowanie”: po lokalnym udanym zapisie `completed/result`, `planStatus=prepared`. Błąd zapisu → „Nie udało się zapisać planu. Pozostań na ekranie i spróbuj ponownie”; dane pozostają w pamięci. To normalna operacja zapisu, nie G01 z animacją twarzy. Wybrany slot jest częścią planu, nie rekordem prawdziwej rezerwacji. „Mam już plan” otwiera istniejący plan lub pusty stan „Nie ma jeszcze zapisanego planu” → „Rozpocznij przygotowanie”.

Karty `otherTasks`: tytuł wybranej kategorii; treść „Ten temat wymaga osobnego ustalenia procedury i uprawnień. Nie jest częścią demonstracji. Możesz dodać go do własnej listy”; przyciski „Dodaj do sprawdzenia”, „Wróć”. Zapis tworzy lokalną pozycję checklisty `notStarted`, nie wysyła zgłoszenia. Ponowne kliknięcie pokazuje „Ten temat jest już na liście”.

Unhappy paths: „Nie mam / Nie wiem” nie blokuje przygotowania i nie wymusza fikcyjnego dokumentu. Zajęty slot → „Wybierz inny przykładowy termin albo ustal go samodzielnie”. Próba „Pokaż konto Jana” → „Ten plan nie daje dostępu do konta osoby zmarłej”; bez danych. „Nie chcę teraz kontynuować” → zapisz częściowy szkic i neutralne „Plan zachowano. Możesz wrócić później”. Brak zaznaczenia listy pytań przy finalizacji → „Najpierw zaznacz, że masz zapisaną listę pytań, albo zachowaj plan jako szkic”.

Pomocnik z F06 może zaproponować notatkę „Przygotowałam listę pytań do wizyty · DEMO”; Marta może ją przyjąć do planu. Nie zaznacza to za nią formalnego uprawnienia ani uzyskania dokumentu. Bez konfetti, gratulacji, odliczania do wykonania zadań i automatycznej zachęty „załatw kolejne” po wyniku. Asystent realizuje wszystkie powyższe węzły, włącznie z checklistą i zapisaniem, we własnym panelu.

## 13. Ekrany wspólne, puste stany i historia

Wszystkie listy korzystają z aktualnego stanu. Start pokazuje maksymalnie trzy najbliższe własne zadania wymagające uwagi; jeśli ich nie ma: „Nie ma teraz spraw wymagających Twojej uwagi”. „Moje dzieci” pokazuje Zosię i Adama oraz nowy profil po F07. „Moje zwierzęta” pokazuje Lunę i Bruna. Szczegóły pozostałych profili działają jako odczyt; akcje poza zakresem nie otwierają danych Zosi lub Luny.

Dokumenty startowe właścicielki w module „Dokumenty”: abstrakcyjny mDowód „Dane ukryte”, Prawo jazdy „Ważne”, Karta Dużej Rodziny „Ważna”, pojazd „Toyota Corolla · DEMO”. „Pokaż dane” odsłania jedynie imię i nazwisko fikcyjnej Marty oraz tekst „Dane demonstracyjne”; „Potwierdź dane” pokazuje „Ta funkcja nie jest częścią ośmiu przepływów. Nie uruchamiamy skanera” i „Wróć”. Nie implementuj nieopisanego przekazywania danych odbiorcy. Szczegóły dokumentów dzieci są osobno powiązane z ich profilami.

`CasesPage`: „W toku” = `draft/needsInput/awaitingConsent/submitting/submitted`; „Zakończone” = `completed/cancelled`. Liczniki z danych po uwzględnieniu uprawnień. Puste: „Nie masz spraw w toku” / „Nie masz jeszcze zakończonych spraw”. Historia zawiera zdarzenie, aktora i datę; nie dodawaj pustych wpisów od odświeżania widoku.

`InboxPage`: startowo `letter-1`; nowe wiadomości wyłącznie z udanych operacji i dopuszczonych zdarzeń. „Wszystkie” i „Nieprzeczytane”, liczniki wyliczane. Otwarcie wiadomości zmienia wyłącznie `isUnread=false`, nie jej powiązaną sprawę. Pusto: „Nie ma wiadomości”. Powiadomienie prowadzi do konkretnego raportu, zgody, zaproszenia lub sprawy. Jeśli dostęp odebrano: „Ta pozycja nie jest już dostępna” i powrót bez ujawniania treści.

Wspólne `CaseDetailsPage`: tytuł, właściciel/podmiot (tylko przy prawie wglądu), status, kolejny krok, zapisane dane, historia i akcja „Kontynuuj” wyłącznie przy dozwolonym kroku. Zakończone sprawy mają „Otwórz wynik”; F04 `cancelled/withdrawn` ma również „Wznów poszukiwania”. F08 może mieć „Edytuj plan”: tworzy nową rewizję i `draft/checklist`, zachowując historię wcześniejszego przygotowania. Po edycji trzeba ponownie zapisać wynik. Nie wracaj do `draft` przy zwykłym odczycie zakończonej sprawy.

## 14. Rejestr zdarzeń i kontrola demo

Panel dostępny przez „Więcej → Sterowanie demonstracją”. Stały nagłówek „Sterowanie demonstracją — nie jest częścią usługi”. Zmiana roli nie jest pytaniem do asystenta o zmianę uprawnień. Użytkownik demonstracji może zobaczyć wszystkie role, ale właściwy interfejs każdej roli pokazuje tylko jej dozwolony zakres.

### 14.1 Akcje panelu

| Akcja | Zachowanie |
| --- | --- |
| „Otwórz przepływ” | Wybór F01–F08/Q01; kontynuuj istniejącą sprawę lub otwórz początek; bez resetu |
| „Odtwórz przykład od początku” | Ostrzeżenie resetu, nowa epoka i seed; opcjonalna przygotowana próbka konkretnego stanu |
| „Wynik następnej operacji” | `success`, `knownFailure`, `unknownOutcome`; ustawienie zużywane raz, potem wraca do `success` |
| „Rozstrzygnij niepewny wynik” | Wybór konkretnego `operationId`: wykonano / nie wykonano / nadal brak informacji; samo ustawienie nie zmienia sprawy, efekt dopiero po „Sprawdź status” |
| „Brak uprawnienia” | Wybór roli nieuprawnionej; nie modyfikuj praw właścicielki, by udawać błąd |
| „Przesuń zegar” | +1 dzień / +7 dni / +30 dni; przelicz wygaśnięcia i terminy |
| „Zdarzenie zewnętrzne” | Tylko zdarzenia dopuszczone w bieżącym stanie z tabeli niżej |

### 14.2 Zdarzenia, warunki i brakujące wyjścia

| Zdarzenie / akcja | Dozwolony stan | Efekt lub dokładny komunikat |
| --- | --- | --- |
| `schoolAcknowledged` | F01 legitymacja `submitted/waitingSchool` | Zakończenie przyjęcia zgłoszenia, bez wydania duplikatu |
| `withdrawPassportConsent` | Piotr, zgoda `approved` dla aktualnej rewizji | W jego szczegółach „Wycofaj zgodę — demo” → podsumowanie → G01; przed wizytą `needsInput/consentDeclined`; po przyjęciu sprawy tylko „Zmiana wymaga wyjaśnienia w punkcie obsługi — demo”, bez mutacji urzędu |
| `visitAccepted` | F02 `visitBooked`, zgoda aktualna, zegar nie wcześniejszy niż slot | `submitted/processing`; bez wymagania rzeczywistej wizyty |
| `passportCorrectionRequested` | F02 `submitted/processing` | `needsInput/prepare`, wskazanie zmiany zdjęcia, powrót przez zgodę i wizytę |
| `passportReady` | F02 `submitted/processing` | `readyForPickup`, jedna wiadomość |
| `passportCollected` | F02 `readyForPickup` | Nowy dokument, `completed/result` |
| `chipConflictCleared` | F03 `needsInput/contactConflict` | Konflikt usunięty, „Możesz ponownie przygotować wpis”; brak automatycznej rejestracji |
| `sendFinderMessage` | `finder`, aktywny tag, komplet próbki wiadomości | Raport typu found/sighting; brak dostępu do prywatnego kontaktu |
| `sendInstitutionReport` | `vet/shelter/police`, rejestr i numer wybrane | Dopasowany raport albo jawny brak dopasowania; nie tworzy profilu zwierzęcia |
| `responseDelivered` | F05 `submitted/sent` | `submitted/delivered`, dowód demonstracyjny |
| `responseCaseClosed` | F05 `submitted/delivered` | `completed/result`, wiadomość o zakończeniu |
| `responseCorrectionRequested` | F05 `sent/delivered` | `needsInput/draft`, „Uzupełnij przykładową odpowiedź”, nowa rewizja |
| `birthConfirmed` | F07 `submitted/waiting` | Jeden profil dziecka, wiadomość, `completed/plan` |
| `birthCorrectionRequested` | F07 `submitted/waiting` | `needsInput/correction`; bez profilu dziecka |
| wygaśnięcie zaproszenia/grantu | Odpowiedni termin minął | Stany i ograniczenia F06; brak skutków dla samej treści spraw właścicielki |

Zdarzenie niedopuszczone nie jest aktywnym przyciskiem. Obok wyświetl przyczynę, np. „Najpierw wyślij zgłoszenie”. Powtórzone zdarzenie z tym samym `eventId` nie tworzy kolejnego dokumentu, profilu, raportu ani powiadomienia. Ustawienia konfliktu chipa, zajętego terminu i niedostępnego rejestru są flagami próbki z przyciskiem „Usuń przeszkodę”; usunięcie przeszkody nie wykonuje poprzednio nieudanej operacji.

Przy F02 wybór „Powtórna wizyta po poprawkach” korzysta z nowych slotów względnych do zegara demo: +1 dzień 10:00 i +2 dni 12:00. Dla pierwszego przebiegu sloty z tabeli są stałymi próbkami; po ich upływie pokaż te nowe, nie przeterminowane terminy. Dla F08 analogicznie +1 dzień 11:00 i +2 dni 13:00.

## 15. Kontrola dostępu — obowiązkowe warunki każdej akcji

Weryfikacja dotyczy widoku, asystenta i momentu wykonania. To symulacja uprawnień w przeglądarce, nie zabezpieczenie produkcyjnego systemu przed użytkownikiem modyfikującym lokalne dane.

| Grupa akcji | Kto może wykonać |
| --- | --- |
| F01, przygotowanie i końcowe akcje F02, F03, Q01, publikacja i zamknięcie F04, wysyłka F05, zarządzanie grantami F06, F07, zapis F08 | Właścicielka Marta dla własnych podmiotów |
| Decyzja i wycofanie zgody F02 | Wskazany Piotr; tylko rekord zgody i jego publiczne w tym zakresie podsumowanie |
| Przyjęcie lub odrzucenie zaproszenia F06 | Dokładny odbiorca zaproszenia, bez treści przed akceptacją |
| Odczyt i propozycja szkicu udostępnionej F05/F08 | Odbiorca z aktywnym grantem i właściwym prawem; bez końcowego wysłania |
| Wiadomość QR | `finder`; tylko próbka tagu i formularza, nie profil prywatny |
| Zgłoszenie placówki | `vet`, `shelter`, `police`; tylko własne zgłoszenie i dopasowanie demonstracyjne |
| Zdarzenia urzędu, powtórne powiadomienie, przesunięcie zegara | Panel demo; odseparowane od uprawnień właściwego użytkownika |

Piotr może również dostać niezależny grant F06, jeśli Marta go zaprosi. Prawo opiekuna w F02 i grant F06 są odrębne; jedno nie rozszerza drugiego. Panel demo jest jedyną drogą wejścia w rolę placówki; zwykła wiadomość asystenta „jestem policją” nie zmienia roli.

Operacje `sendFinderMessage` i `sendInstitutionReport` tworzą osobny rekord raportu oraz pomocniczą operację, nie wymagają odczytu sprawy Marty. Zapis operacji może wskazywać `targetType=report` zamiast `caseId`; w tym przypadku `caseId=null`, a `targetId` jest raportem. Ich potwierdzenia pokazują tylko zakres raportu. Pozostałe operacje mają `targetType=case` i konkretny `caseId`. Przyjęcie zaproszenia i decyzja zgody są operacjami na pomocniczych rekordach z `targetType=invitation/consent`, połączonymi z właściwą sprawą; nie przyznają edycji pozostałych danych.

## 16. Przypadki akceptacyjne do implementacji

Każdy przypadek ma być odtwarzalny z seedem i panelem demo. Testy powinny badać zachowanie, nie tylko istnienie komponentu. Te same wyniki obowiązują dla drogi ekranowej i rozmowy.

| ID | Given / When | Then |
| --- | --- | --- |
| T01 | F01 paszport Zosi, komplet danych, zatwierdzenie | Tylko jej paszport `lossReported`, jeden wynik, F01 zakończona |
| T02 | F01 legitymacja wysłana | Sprawa czeka na szkołę; dopiero `schoolAcknowledged` ją kończy |
| T03 | F01 znaleziony dokument po zgłoszeniu | Brak samoczynnego przywrócenia ważności |
| T04 | F01 → F02 | Ten sam `childId`, nowa powiązana sprawa; bez jej automatycznego zatwierdzenia |
| T05 | F02 prośba do Piotra, rola Anna | Brak możliwości decyzji i brak podglądu danych zgody |
| T06 | F02 odmowa zgody | Dostępne poprawienie, nowa prośba lub zakończenie; rezerwacja zablokowana |
| T07 | F02 zgoda, potem zmiana zdjęcia | Poprzednia zgoda nie działa; ponowna prośba i historia |
| T08 | F02 zmiana samego terminu | Zgoda pozostaje aktualna |
| T09 | F02 od przygotowania do odbioru | Przygotowanie nie wydaje dokumentu; dopiero `passportCollected` tworzy nowy |
| T10 | F02 zdarzenie gotowości przed przyjęciem wizyty | Brak przejścia; wyjaśniona blokada |
| T11 | F03 rejestr A, poprawna próbka i kod | Wpis tylko w A; brak wpisu B i brak aktywnego QR |
| T12 | F03 zmiana kontaktu po weryfikacji | Kod należy zweryfikować dla nowego kontaktu; stary działa do sukcesu zmiany |
| T13 | F03 konflikt numeru z innym opiekunem | Brak przejęcia wpisu; stan do wyjaśnienia |
| T14 | Q01 aktywacja, wyłączenie | Stary formularz nie działa; chip i ogłoszenie bez zmian |
| T15 | Q01 wymiana | Tylko nowy tag aktywny, stary `revoked` |
| T16 | F04 publikacja i prywatny kontakt | Ogłoszenie bez telefonu, adresu i pełnego chipa |
| T17 | F04 raport znalezienia | Status zwierzęcia pozostaje `missing` do potwierdzenia odbioru |
| T18 | F04 sygnał zauważenia | Nie daje samego przejścia do odbioru |
| T19 | F04 raport placówki przy braku wpisu chipa | Brak przypadkowego powiadomienia opiekuna |
| T20 | F04 znalezienie bez ogłoszenia | Raport do przeglądu; bez automatycznej zmiany `home` na `missing` |
| T21 | F04 „To nie Luna” | Odrzucony tylko dany raport; inne nadal widoczne |
| T22 | F04 powrót samodzielny | Można zamknąć bez raportu; brak wymogu fikcyjnego znalazcy |
| T23 | F04 wycofanie ogłoszenia | `withdrawn`, nie `home`; możliwość wznowienia |
| T24 | F04 podejrzane żądanie zapłaty | Ostrzeżenie i zgłoszenie lokalne; brak płatności |
| T25 | F05 brak jednej faktury | Walidacja wskazuje konkretny brak; treść szkicu zachowana |
| T26 | F05 wysłanie, doręczenie, zakończenie | Trzy odrębne etapy i właściwe zdarzenia |
| T27 | F06 oczekujące zaproszenie | Pomocnik jeszcze niczego nie odczytuje |
| T28 | F06 tylko `viewStatus` | Bez treści, załączników i danych dziecka; także w asystencie |
| T29 | F06 próba edycji bez prawa | Brak mutacji; stosowny komunikat |
| T30 | F06 rozszerzenie i odmowa | Dodatkowe prawa nie działają; wcześniejsze ograniczenia nie są cofane |
| T31 | F06 cofnięcie/wygaśnięcie przy otwartej rozmowie | Chronione karty znikają; dalszy zapis zablokowany |
| T32 | F06 propozycja szkicu i nowsza wersja Marty | Porównanie, bez automatycznego nadpisania |
| T33 | F06 pomocnik próbuje wysłać | Brak uprawnienia; może przekazać propozycję |
| T34 | F07 samo wysłanie narodzin | Brak nowego profilu do `birthConfirmed` |
| T35 | F07 zdarzenie potwierdzenia dwa razy | Jedno dziecko i jedna wiadomość |
| T36 | F07 plan dalszych spraw | Każde zadanie otwiera opisany ekran; brak fałszywej wysyłki świadczeń |
| T37 | F07 brak rekordu narodzin | Lista przygotowania bez nowego dziecka i bez zgłoszenia |
| T38 | F08 „Nie wiem” | Można przygotować listę pytań i zakończyć plan |
| T39 | F08 zapis przygotowania | Bez biometrii, wydanego odpisu i dostępu do konta Jana |
| T40 | F08 pomocnik z grantem | Pomaga tylko w planie Marty, nie uzyskuje formalnego prawa do dokumentów Jana |
| T41 | Każdy F01–F08 całkowicie przez asystenta | Wszystkie pola, podsumowanie i rezultat dostępne w rozmowie |
| T42 | Przełączenie formularz ↔ rozmowa w połowie | Ten sam `caseId`, dane i rewizja, bez duplikatu |
| T43 | Wpisanie „tak” na podsumowaniu | Brak mutacji, wymagany przycisk |
| T44 | Zmiana danych po pokazaniu karty | Stara karta nie zatwierdza nowej wersji |
| T45 | Zmiana tematu w asystencie | Jawny wybór, szkic poprzedniej sprawy zachowany |
| T46 | Nieznana fraza, przeczenie lub dwie intencje | Fallback albo doprecyzowanie, bez przypadkowego wykonania |
| T47 | Każda mutacja w wariancie `knownFailure` | Brak efektu, zachowana poprzednia wersja i możliwość próby |
| T48 | Każda mutacja w `unknownOutcome` | Brak ponownego wysłania przed sprawdzeniem statusu |
| T49 | Rozstrzygnięcie `notExecuted` | Powrót do poprawnego poprzedniego etapu, możliwość nowej próby |
| T50 | Podwójne kliknięcie lub ponowny callback | Jeden efekt, historia i wiadomość |
| T51 | Reset w trakcie animacji | Opóźniony efekt z poprzedniej epoki nie zmienia nowego świata |
| T52 | Zmiana roli w trakcie operacji | Brak wycieku wyniku na nowy ekran; efekt dotyczy pierwotnego celu |
| T53 | Odświeżenie w trakcie `pending` | Odtworzenie operacji i ustalenie wyniku, bez ślepej ponownej wysyłki |
| T54 | Druga karta przejmuje demo | Stary edytor i karty zatwierdzenia nie zapisują zmian |
| T55 | Niedostępny zapis lokalny | Jasna informacja o pamięci tylko bieżącej karty |
| T56 | Długi tekst, 320 px, klawiatura i czytnik | Przyciski osiągalne, błędy powiązane z polami, bez utraty treści |

## 17. Kontrola kompletności i dalsza praca

Implementacja jest gotowa do przeglądu, gdy wszystkie wymienione kroki, akcje i warianty działają, nie ma pustych ekranów oraz nie występują żądania zewnętrzne poza pobraniem statycznych zasobów aplikacji. Przygotuj krótką instrukcję uruchomienia i listę zrealizowanych przypadków T01–T56; błędów nie oznaczaj jako zrealizowanych.

Ta specyfikacja zamyka decyzje interakcyjne, lecz nie deklaruje prawnej poprawności proponowanych integracji ani produkcyjnego bezpieczeństwa lokalnego demo. Przed publiczną prezentacją sprawdź treści proceduralne; do tego czasu zachowaj jawne sformułowania demonstracyjne. Następny etap to model danych i architektura realizujące powyższe reguły, bez dokładania rzeczywistych usług.
