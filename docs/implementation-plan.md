# mObywatel / koncepcja — implementation plan

Date: 2026-10-26. Status: proposed architecture and delivery plan; implementation has not started.

## 1. Scope and source interpretation

This plan answers the request to review the project and two documents. The embedded instruction to implement the application in the implementation specification is reference material, not authorization to start implementation.

Sources reviewed:

- `README.md`, Docker configuration, and the frontend/backend source structure.
- `mockup/index.html`, `core.js`, `scenarios.js`, `agent.js`, `osoby.js`, and `style.css`.
- Python HTTP routes and data/action modules under `serwer/`.
- `C:/Users/cirae/Downloads/mobywatel-design-system.md`, v0.1, 2026-10-24.
- `C:/Users/cirae/Downloads/mobywatel-implementation-spec.md`, v0.2, 2026-10-26.

For the proposed product, use implementation v0.2 for behavior and design-system v0.1 for visual tokens. Where the older design document leaves scenario decisions open, use the newer specification's explicit demo decisions. No NCU widget, Twitch, economy, or changelog conventions apply to this separate project.

## 2. Repository assessment

The supplied directory is a source snapshot: `git status` reports that it is not a Git repository. No package manifest, frontend build configuration, or test suite was found in the file inventory.

| Area | Current implementation | Target and consequence |
| --- | --- | --- |
| Frontend | Plain HTML/CSS and global JavaScript scripts in `mockup/` | Component-based mobile-first interface with explicit routes and typed state |
| Layout | 390 × 844 desktop phone frame, overlapping document cards, JavaScript positioning | Reflow from 320 px, normal scrolling, desktop content up to 1120 px |
| Navigation | Documents and conversation dominate; sheets and menus | Start / Dokumenty / Sprawy / Więcej; inbox and contextual assistant in header |
| Assistant | Scripted callbacks plus optional live `/api/agent` | Deterministic, local conversation that renders every supported workflow step |
| Backend | Python HTTP server, AI providers, speech and translation endpoints | Static asset hosting only for the new demo |
| Persistence | Persona selection and conversation-oriented state exist | One versioned world containing cases, entities, operations and access records |
| Confirmation | Callback-based cards and timed Face ID animation | Revision-bound confirmation, explicit demo approval, recoverable operation journal |
| Data | Existing personas and broad public-service scenarios | Exact Marta/Zosia/Luna seed and controlled demo clock |
| Assets | Official-looking document graphics, branding, person photos; external Google Font | Abstract DEMO assets, system fonts, clear independent-concept identity |

Reuse selected layout ideas, icon paths and interaction patterns only after checking suitability. Do not port old procedural claims, scenario callbacks, realistic document graphics, live integrations or persona data into the new model. Preserve license and attribution notices.

This assessment is based on source inspection; the existing application was not run or visually audited.

## 3. Recommended architecture

Create an isolated `prototype-app/` frontend, keeping `mockup/` and `serwer/` available as the legacy prototype. This is a substantial new product surface rather than a CSS reskin.

Selected stack: Vue 3 + TypeScript + Vite, Vue Router, and Pinia exposing pure domain transitions. Use Vue single-file components with `<script setup lang="ts">`, Vitest for domain behavior, and Playwright with axe for browser verification. Vue also matches the existing Project Babylon and Frontend Interview Guide frontends. Avoid a backend, remote fonts, analytics and AI SDKs in the new application's runtime.

```text
prototype-app/
  src/
    app/             # entry, routes, shell and providers
    domain/          # entities, commands, permissions, transitions, selectors
    stores/          # Pinia adapters; domain functions own business rules
    flows/           # F01–F08 and Q01 step definitions and validation
    persistence/     # versioned snapshots, journal recovery, editor ownership
    components/      # accessible controls, cards, summaries and dialogs
    pages/           # dashboard, lists, profiles and case views
    assistant/       # intent aliases and conversation presentation
    demo/            # seed, clock, fixture flags and external events
    styles/          # semantic tokens and responsive layout
    content/         # Polish labels and exact scenario copy
  public/demo/       # local sample previews and abstract illustrations
  tests/
    domain/
    e2e/
```

Forms and assistant dispatch identical commands. A step definition supplies field schema, options, validation, actions and summary data to both renderers. Presentation-specific markup is allowed; business transitions are never duplicated.

Persist one versioned snapshot in localStorage, including operations and their applied effects. Commit the next snapshot before announcing durable success; detect unavailable storage and show the required current-tab-only warning. Keep failed-save drafts in memory. F08 finalization must surface its specific save failure instead of claiming a saved plan.

Use explicit schema validation on restore. Unsupported or corrupt snapshots require the specified user-visible reset rather than partial reconstruction of permissions. Use an exclusive browser editor lock where supported, with a tested lease/fencing fallback and cross-tab notifications. Takeover issues a new editor token; every write and confirmation checks it. BroadcastChannel alone is not a lock.

## 4. Delivery sequence and gates

### Phase 0 — baseline and contracts

- Record legacy launch instructions and establish the isolated app boundary.
- Preserve versioned copies of the two reference documents in project documentation during implementation.
- Build a traceability checklist mapping every step, action and T01–T56 to code and evidence.
- Resolve minor specification ambiguities in an architecture decision record: use one canonical `consentVersion` despite the sample's `consentRevision` naming; explain validation of auxiliary operation targets and case-less reports.
- Define persistence failure semantics, editor takeover, and pending-operation recovery before UI work.

Gate: architecture, typed contracts and traceability cover all eight flows plus QR, without adding actual public-service integrations.

### Phase 1 — domain state and deterministic execution

- Implement exact seed, fixed Warsaw clock, entity IDs and active-case deduplication keys.
- Model documents, cases, consents, registry entries, tags, notices, reports, invitations, grants, draft proposals, messages and tasks independently.
- Implement commands, guarded transitions, history, selectors and permission-filtered projections.
- Implement G01: explicit approval, 800 ms animation, success/failure/unknown outcomes, status reconciliation and idempotent effects.
- Bind confirmation to revision, actor, world epoch and editor token. Validate authority again before committing.
- Implement autosave at 300 ms, navigation flush, restore, reset epoch, stale callbacks and single-editor takeover.
- Distinguish generic case revision from passport consent version and registry/contact verification key.

Gate: meaningful domain tests prove no duplicate effects, no unauthorized changes, no stale confirmation, and safe recovery after reset/reload/takeover. Prioritize T43–T55 and core permission invariants.

### Phase 2 — design system and navigation

- Implement all supplied semantic colors, typography, spacing, control sizes and motion tokens.
- Build shared buttons, fields, badges, alerts, tabs, lists, step indicators, confirmation/result panels and dialogs.
- Add permanent prototype banner and header assistant/inbox actions.
- Build Start, Dokumenty, Sprawy, Więcej, inbox, document details, children/pet lists and profiles.
- Use real filtered selectors for counts, deadlines, unread messages and next actions; preserve return context.
- Add keyboard focus management, error associations, status announcements, reduced motion and bottom safe-area spacing.

Gate: shell works at 320, 390, 768 and 1280 CSS px; 200% text zoom retains actions; no external font requests or device permissions.

### Phase 3 — implement workflow domain and screen paths

Implement each workflow with its problem paths and tests before moving to the next dependency group:

| Order | Workflows | Required outcome |
| --- | --- | --- |
| 1 | F01 document loss | Passport completes; school card waits for acknowledgement; found documents do not regain validity |
| 2 | F02 passport | Piotr's revision-bound consent; refusal/withdrawal; appointments; correction; separate processing, readiness and collection |
| 3 | F03 chip + Q01 tag | Independent A/B entries, contact verification, conflicts, separate tag activation/revocation/replacement |
| 4 | F04 recovery | Private notice preview; finder/institution reports; sightings versus found reports; matching, pickup, return and withdrawal; reports without a notice |
| 5 | F05 correspondence | Editable draft and sample attachments; sent, delivered and closed stages; corrections preserve history |
| 6 | F06 trusted access | Invitations, recipient decisions, permission dependencies, expiry/revocation, immediate restrictions and accepted expansions; helper proposals with version comparison |
| 7 | F07 birth | Submission creates no profile; confirmation creates one stable child; all follow-up plan tasks work |
| 8 | F08 bereavement | Concrete visit-preparation checklist, unknown/missing records, local save without biometrics, optional F06 help |

F05 and F08 must both support F06 grants. Implement the shared access machinery in Phase 1 and finish its presentation after both target workflows exist. Keep role-specific dashboards and denied direct routes functional throughout.

Gate: T01–T40 are covered by domain/integration tests and representative browser paths; all documented branches have a reachable view, action or explicit scope message.

### Phase 4 — assistant parity

- Render every field, earlier-field edit, summary, error and result inside the assistant itself.
- Add all intent aliases, normalization, negation handling, ambiguous-intent choices and fixed fallbacks.
- Preserve the same case ID, draft and revision across screen/conversation switching.
- Require buttons for final approval; typed “tak” never executes an operation.
- Handle topic changes explicitly, disable stale cards, and remove protected content after access loss.
- Provide full-screen mobile / approximately 400 px desktop panel, context label, focus return and 300 ms simulated responses.

Gate: all F01–F08 and Q01 complete through conversation; T41–T46 plus access and operation checks pass in both presentations.

### Phase 5 — complete demonstration controls

- Expose role switching, open/resume flow, warned whole-world reset and prepared fixtures.
- Add one-shot next-operation outcomes and per-operation unknown-result resolution.
- Add +1/+7/+30 day clock controls, permission-aware expiry and current appointment samples.
- Add every section 14 external event with its allowed-state guard, disabled reason and event deduplication.
- Add chip conflict, unavailable registry, occupied slot and stale contact fixtures; removing an obstacle never reruns an action automatically.

Build a minimal seed/reset/event test harness in Phase 1; finish its operator UI here so it does not delay workflow verification.

Gate: every acceptance scenario is reproducible without editing source or browser storage manually.

### Phase 6 — acceptance and handoff

- Run T01–T56 with a recorded pass/fail result and test or manual evidence; do not mark partial cases complete.
- Exercise both surfaces, all seven roles, failures, unknown results, revocation mid-operation, duplicate callbacks, reload, reset and tab takeover.
- Audit focus trapping/return, keyboard-only use, screen-reader announcements, contrast, long Polish copy, reduced motion and text resizing.
- Verify runtime traffic contains static application assets only; no `/api/*`, model, translation, analytics, camera or microphone activity.
- Add local start/build/preview instructions and a static-host deployment option independent of the existing Python service.

Gate: complete traceability report, passing required checks, explicit remaining defects and a reproducible demo guide.

## 5. Hosting alongside Aliceindev

User preference: deploy alongside the existing apps on Aliceindev. Repository inspection confirms two different local configurations:

- Frontend Interview Guide builds with Vite base `/WEREINTHISTOGETHER/`. Aliceindev's `server.js` serves its sibling `dist/` directory through Express, with authenticated SPA fallback routes.
- Project Babylon builds with base `/ispeakparseltongue/`. Aliceindev proxies that prefix to Babylon's separate backend on port 3050. Its handover says deployment is not yet complete; these observations establish local configuration, not verified live server state.

Use the static-file pattern for this prototype. Proposed public path: `/mobywatel/` (working default, final slug can change before build). No dedicated Python/Node process, port, database, API proxy or PM2 entry is needed for the prototype. The existing Aliceindev server remains the host.

Implementation tasks:

1. Configure Vite `base` from `MOBYWATEL_BASE`, default `/mobywatel/`, and Vue Router with `createWebHistory(import.meta.env.BASE_URL)`.
2. Use imported assets or `BASE_URL`-relative public assets; avoid root-relative links that escape the mount.
3. Build `prototype-app/dist/` and deploy it beside Aliceindev. Configure `MOBYWATEL_DIST_PATH` with a sibling-directory default in the existing host.
4. Add the isolated Express static mount, canonical trailing-slash redirect and SPA document fallback. Missing asset URLs must return 404 rather than HTML. Preserve all existing app routes and authentication behavior.
5. Keep the concept demo public by default, with no application login, matching the specification. Do not copy Interview Guide's session gate into this prototype.
6. Scope any new security/cache headers to this mount and check compatibility with the host's existing middleware. HTML should revalidate; hashed build assets may be immutable. Disable camera/microphone/geolocation for the demo.
7. Namespace browser storage and editor coordination, for example `mobywatel-concept:*`: these apps share an origin. Demo reset must remove only this application's keys, never call `localStorage.clear()`.
8. Verify the production build under its actual prefix: direct nested navigation, reload, assets, back/forward, persistence and missing-asset responses. Regression-check the Aliceindev root and both existing app prefixes.
9. Inspect the actual server update mechanism before deployment; no deployment workflow was found in Aliceindev's local `.github/workflows` inventory. Retain the previous build for rollback and use the existing host restart mechanism if its route configuration changes.

Plan revision only: the host has not been edited and nothing has been deployed.

## 6. Decisions and implementation risks

- The largest risks are G01 recovery, F06 permissions and shared screen/assistant behavior. Build and test these foundations before polishing individual screens.
- The old Python server redirects `/v2` to `/`; do not assume it can serve the new frontend there unchanged. Choose a separate static preview initially, then explicitly configure the final route if needed.
- Existing scenario results sometimes collapse sending and delivery or imply public-service effects. Replace their behavior and wording rather than treating existing callbacks as the target logic.
- localStorage is suitable for this small fictional world, but multi-tab writes need fencing and verification. Do not promise collaborative editing or production security.
- A fixed seed date must drive age calculations, relative dates, deadlines and expiry. Opening a screen must not advance the clock or append history.
- Do not reduce delivery to happy paths or a chat facade: full scope includes QR, institution/finder roles, corrections, permission changes and all T01–T56.

Recommended first implementation milestone: seed + domain commands + persistence + G01 tests, followed by the responsive shell and one complete F01 screen path. This establishes a reviewable foundation before building out the remaining flows.
