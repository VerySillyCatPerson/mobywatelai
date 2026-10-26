# mObywatel / koncepcja

Polski | [English](README.en.md)

Klikalny prototyp przygotowany na [mObywatel Challenge organizowany na mobywatel.ai](https://mobywatel.ai/). Pokazuje sprawy rodzinne i urzędowe: dokumenty dzieci, opiekę nad zwierzętami, odpowiedź na pismo i pomoc bliskiej osoby.

Aplikacja działa w ramce telefonu. Panel obok opisuje aktualny ekran i dostępne działania. Interfejs i opisy są po polsku.

To niezależna koncepcja. Wszystkie osoby, dokumenty i działania są fikcyjne. Projekt nie jest oficjalną aplikacją mObywatel, usługą administracji ani projektem organizatora konkursu. Nie wpisuj prawdziwych danych osobowych. Treści scenariuszy nie są instrukcjami prawnymi.

## Uruchomienie

Potrzebujesz Node.js 22.12 lub nowszego oraz npm.

```powershell
cd C:\Projects\mobywatel
npm.cmd ci
npm.cmd run dev -- --port 5174
```

Otwórz http://localhost:5174/mobywatel/. Jeśli port jest zajęty, Vite wybierze kolejny. Sprawdź adres w terminalu i dodaj `/mobywatel/`.

Zostaw terminal otwarty. Ctrl+C zatrzymuje serwer. Na macOS i Linuksie używaj `npm` zamiast `npm.cmd`.

Backend, baza danych i klucze API nie są potrzebne. Instalacja zależności wymaga dostępu do internetu.

## Co można sprawdzić

Start pokazuje sprawy wymagające uwagi, terminy i skróty do profili. W Dokumentach można otworzyć fikcyjne dokumenty Marty i Zosi, pokazać dane i sprawdzić status. Sprawy dzielą się na aktywne i zakończone, a Skrzynka zawiera pisma, zaproszenia i potwierdzenia.

Asystent prowadzi przez przygotowane scenariusze. Korzysta z tych samych danych co formularze, więc można zmienić sposób obsługi bez rozpoczynania sprawy od nowa.

| ID  | Scenariusz                                                                     |
| --- | ------------------------------------------------------------------------------ |
| F01 | Zgłoszenie utraty paszportu lub legitymacji dziecka                            |
| F02 | Nowy paszport Zosi: przygotowanie, zgoda Piotra, wizyta i odbiór               |
| F03 | Rejestracja mikroczipa i zmiana kontaktu w dwóch fikcyjnych rejestrach         |
| F04 | Zaginięcie Luny, zgłoszenia znalezienia i potwierdzenie powrotu                |
| F05 | Odpowiedź na pismo z przykładowymi załącznikami                                |
| F06 | Udostępnienie wybranych spraw bliskiej osobie i przegląd jej propozycji szkicu |
| F07 | Zgłoszenie narodzin i przygotowanie dalszych spraw dziecka                     |
| F08 | Lista pytań i plan wizyty po śmierci bliskiej osoby                            |
| Q01 | Aktywacja, wyłączenie i wymiana zawieszki QR, niezależnie od mikroczipa        |

## Sterowanie demonstracją

Wybierz `Więcej → Sterowanie demonstracją`, aby zmienić rolę, przesunąć zegar lub wywołać zdarzenie. Możesz przełączyć się na Martę, Piotra, Annę, znalazcę albo placówkę. Każdy profil ma własny zakres dostępu.

Panel pozwala też ustawić błąd lub niepewny wynik następnej operacji, zająć termin wizyty i zasymulować konflikt numeru chipa. Reset przywraca dane początkowe wszystkich ról.

Wysłanie pisma, doręczenie i zakończenie sprawy to osobne etapy. Aby pokazać kolejny etap, wywołaj odpowiednie zdarzenie w panelu. Tak samo działają potwierdzenie narodzin i gotowość paszportu do odbioru.

## Zapis danych

Postęp zapisuje się w przeglądarce. `localhost` i `127.0.0.1` mają osobne dane, podobnie jak różne przeglądarki. Demo obsługuje jedną edytującą kartę naraz. W drugiej karcie trzeba przejąć sesję.

Asystent odpowiada według gotowych scenariuszy. Prototyp nie łączy się z modelem AI ani rejestrem państwowym. Wysyłka pism, płatności i zgłoszenia pozostają symulacją. Kamera, mikrofon i biometria są wyłączone; telefon nie odczytuje mikroczipa zwierzęcia.

Uprawnienia służą do pokazania, co dana osoba widzi i może zrobić w interfejsie. Nie zabezpieczają produkcyjnego systemu.

## Budowanie i hosting

```powershell
npm.cmd run build
npm.cmd run preview
```

Build sprawdza typy i zapisuje pliki w `dist/`. Podgląd zwykle działa pod http://localhost:4173/mobywatel/. Sprawdź port w terminalu.

Domyślna ścieżka to `/mobywatel/`. Przed budowaniem można ją zmienić:

```powershell
$env:MOBYWATEL_BASE = '/inna-sciezka/'
npm.cmd run build
```

Serwer musi zwracać `index.html` dla adresów aplikacji, np. `/mobywatel/cases/letter-case`, aby odświeżenie ekranu działało.

Do hostowania obok Aliceindev służy [adapter Express](hosting/aliceindev-mount.cjs). Skopiuj go jako `aliceindev/mobywatel-mount.js` i dodaj w istniejącym serwerze:

```js
require("./mobywatel-mount")(app, express);
```

W tym położeniu adapter szuka plików w `../mobywatel/dist`. Inny katalog można wskazać przez `MOBYWATEL_DIST_PATH`. Prefiks adresu musi być taki sam w Vite i adapterze. Prototyp nie potrzebuje osobnego procesu na serwerze.

## Testy

```powershell
npm.cmd run build
npm.cmd test
npx.cmd playwright install chromium
```

Testy jednostkowe sprawdzają reguły spraw i adapter hostingu. Testy przeglądarkowe obejmują scenariusze, ramkę telefonu, uprawnienia, zapis postępu i automatyczne sprawdzenia dostępności.

Przed testami przeglądarkowymi uruchom serwer w osobnym terminalu:

```powershell
npm.cmd run dev -- --port 5174 --strictPort
```

Następnie uruchom testy:

```powershell
npm.cmd run test:e2e
```

Testy używają adresu `http://127.0.0.1:5174/mobywatel/`. Można go zmienić przez `TEST_BASE_URL`. Zmienna `PLAYWRIGHT_CHROMIUM_EXECUTABLE` wskazuje własny plik wykonywalny Chromium.

`npm.cmd run test:all` uruchamia build i oba zestawy testów. Serwer testowy musi już działać. Automatyczne testy nie potwierdzają pełnej zgodności z WCAG ani pokrycia każdego wariantu specyfikacji.

## Kod i dokumentacja

Vue 3, TypeScript, Vite, Vue Router i Pinia. Ikony pochodzą z Lucide. Do testów służą Vitest, Playwright i axe. Express jest zależnością deweloperską używaną w testach hostingu.

```text
src/components/   Ekrany, formularze, asystent i panel opisowy
src/domain/       Typy, scenariusze i reguły przejść
src/stores/       Stan Pinia, zapis lokalny i operacje
src/App.vue       Ramka telefonu i szkielet aplikacji
src/styles.css    Style aplikacji i prezentacji
tests/            Testy domeny, hostingu i przeglądarki
hosting/          Adapter serwera Aliceindev
docs/             Specyfikacje i plan implementacji
```

W `docs/` znajdują się [system projektowy](docs/design-system.md), [specyfikacja scenariuszy](docs/implementation-spec.md) i [pierwotny plan implementacji](docs/implementation-plan.md). Plan zawiera wcześniejsze założenia katalogów. Bieżąca aplikacja znajduje się bezpośrednio w tym projekcie.
