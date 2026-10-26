# mObywatel / concept

[Polski](README.md) | English

A clickable prototype built for the [mObywatel Challenge at mobywatel.ai](https://mobywatel.ai/). It covers family and administrative tasks: children's documents, pet care, replying to a letter, and getting help from a trusted person.

The app sits inside a phone frame. A panel beside it describes the current screen and available actions. The interface and screen descriptions are in Polish.

This is an independent concept. All people, documents, and actions are fictional. It is not the official mObywatel app, a government service, or a project of the challenge organizer. Do not enter real personal data. Scenario content is not legal advice.

## Run locally

You need Node.js 22.12 or later and npm.

```powershell
cd C:\Projects\mobywatel
npm.cmd ci
npm.cmd run dev -- --port 5174
```

Open http://localhost:5174/mobywatel/. If the port is busy, Vite selects another one. Check the terminal output and append `/mobywatel/` to the address.

Keep the terminal open. Press Ctrl+C to stop the server. On macOS and Linux, use `npm` instead of `npm.cmd`.

You don't need a backend, database, or API keys. Installing dependencies requires internet access.

## What to try

Home shows cases that need attention, deadlines, and profile shortcuts. Documents contains Marta's and Zosia's sample documents, with controls to reveal data and check status. Cases separates active and completed work. Inbox contains letters, invitations, and confirmations.

The assistant walks through prepared scenarios. It shares data with the forms, so you can switch between them without starting the case again.

| ID  | Scenario                                                                                     |
| --- | -------------------------------------------------------------------------------------------- |
| F01 | Report a child's passport or school card as lost                                             |
| F02 | Prepare Zosia's passport case, obtain Piotr's consent, plan a visit, and simulate collection |
| F03 | Register a microchip and update contact details in two fictional registries                  |
| F04 | Report Luna missing, review finder reports, and confirm her return                           |
| F05 | Reply to a sample letter with example attachments                                            |
| F06 | Share selected cases with a trusted person and review their draft proposal                   |
| F07 | Submit a sample birth registration and prepare the child's next tasks                        |
| F08 | Prepare questions and a visit plan after the death of a loved one                            |
| Q01 | Activate, deactivate, or replace a QR tag separately from the microchip                      |

## Demo controls

Open `Więcej → Sterowanie demonstracją` (More → Demo controls) to change roles, advance the clock, or trigger an event. You can use Marta's, Piotr's, Anna's, a finder's, or an institution's profile. Each role has its own access permissions.

The panel also lets you set a failed or uncertain operation result, make an appointment unavailable, or simulate a microchip conflict. Reset restores the starting data for every role.

Sending a letter, confirming delivery, and closing a case are separate stages. Trigger the corresponding event in the panel to move to the next stage. Birth confirmation and passport readiness work the same way.

## Saved data

Progress is stored in your browser. `localhost` and `127.0.0.1` have separate data, as do different browsers. One tab can edit the demo at a time. A second tab must take over the session.

The assistant follows prepared scripts. The prototype makes no calls to an AI model or government registry. Letters, payments, and submissions are simulated. Camera, microphone, and biometric access are disabled; the phone does not read a pet's microchip.

Permission checks demonstrate what each person can see and do in the interface. They do not secure a production system.

## Build and hosting

```powershell
npm.cmd run build
npm.cmd run preview
```

The build checks TypeScript and writes files to `dist/`. Preview usually runs at http://localhost:4173/mobywatel/. Check the terminal for the port.

The default base path is `/mobywatel/`. To change it before building:

```powershell
$env:MOBYWATEL_BASE = '/another-path/'
npm.cmd run build
```

The host must return `index.html` for app routes such as `/mobywatel/cases/letter-case`, so reloading a screen works.

For hosting alongside Aliceindev, use the [Express adapter](hosting/aliceindev-mount.cjs). Copy it to `aliceindev/mobywatel-mount.js` and add this to the existing server:

```js
require("./mobywatel-mount")(app, express);
```

From that location, the adapter looks for files in `../mobywatel/dist`. Set `MOBYWATEL_DIST_PATH` to use another directory. The URL prefix must match in Vite and the adapter. The prototype needs no separate server process.

## Tests

```powershell
npm.cmd run build
npm.cmd test
npx.cmd playwright install chromium
```

Unit tests check case rules and the hosting adapter. Browser tests cover scenarios, the phone frame, permissions, saved progress, and automated accessibility checks.

Before running browser tests, start the server in a separate terminal:

```powershell
npm.cmd run dev -- --port 5174 --strictPort
```

Then run:

```powershell
npm.cmd run test:e2e
```

Tests use `http://127.0.0.1:5174/mobywatel/`. Set `TEST_BASE_URL` to use another address. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` points to a custom Chromium executable.

`npm.cmd run test:all` runs the build and both test suites. The test server must already be running. Automated tests do not establish full WCAG compliance or coverage of every specification variant.

## Code and documentation

Vue 3, TypeScript, Vite, Vue Router, and Pinia. Icons come from Lucide. Tests use Vitest, Playwright, and axe. Express is a development dependency used in hosting tests.

```text
src/components/   Screens, forms, assistant, and screen descriptions
src/domain/       Types, scenarios, and transition rules
src/stores/       Pinia state, local persistence, and operations
src/App.vue       Phone frame and application shell
src/styles.css    App and presentation styles
tests/            Domain, hosting, and browser tests
hosting/          Aliceindev server adapter
docs/             Specifications and implementation plan
```

The Polish reference documents are in `docs/`: [design system](docs/design-system.md), [scenario specification](docs/implementation-spec.md), and [original implementation plan](docs/implementation-plan.md). The plan includes earlier directory-layout assumptions. The current app lives directly in this project.
