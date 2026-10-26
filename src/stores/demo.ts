import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  World,
  CaseRecord,
  FlowId,
  Role,
  Data,
  Permission,
} from "../domain/types";
import * as E from "../domain/engine";
import { flows, roles } from "../domain/flows";
const KEY = "mobywatel-concept:world:v1",
  LOCK = "mobywatel-concept:editor:v1";
export const useDemo = defineStore("demo", () => {
  const token = crypto.randomUUID(),
    world = ref<World>(E.seed()),
    persistent = ref(true),
    corrupt = ref(false),
    blocked = ref(false),
    toast = ref(""),
    error = ref(""),
    version = ref(0);
  const assistant = ref(false),
    assistantCase = ref(""),
    confirmation = ref<{
      caseId: string;
      action: string;
      revision: number;
      role: Role;
      epoch: number;
      token: string;
    } | null>(null),
    executing = ref(false);
  let toastTimer: ReturnType<typeof setTimeout>,
    saveTimer: ReturnType<typeof setTimeout>,
    heartbeat: ReturnType<typeof setInterval>,
    releaseNative: (() => void) | undefined;
  const memoryToken = ref(token);
  function say(text: string) {
    toast.value = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.value = ""), 6500);
  }
  function fail(e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
  }
  function readLock() {
    try {
      return JSON.parse(localStorage.getItem(LOCK) || "null");
    } catch {
      return null;
    }
  }
  function owned() {
    if (!persistent.value) return !blocked.value;
    const lock = readLock();
    return !blocked.value && lock?.token === token && lock.expires > Date.now();
  }
  function writeLock() {
    localStorage.setItem(
      LOCK,
      JSON.stringify({ token, expires: Date.now() + 10000 }),
    );
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!E.validWorld(parsed)) {
          corrupt.value = true;
          return;
        }
        world.value = parsed;
      }
    } catch (e) {
      try {
        localStorage.setItem("mobywatel-concept:probe", "1");
        localStorage.removeItem("mobywatel-concept:probe");
        corrupt.value = true;
      } catch {
        persistent.value = false;
      }
    }
  }
  load();
  function claimLease(force = false, exclusive = false) {
    try {
      const lock = readLock();
      if (
        !force &&
        !exclusive &&
        lock &&
        lock.token !== token &&
        lock.expires > Date.now()
      ) {
        blocked.value = true;
        return;
      }
      writeLock();
      blocked.value = false;
      if (force) {
        load();
        confirmation.value = null;
        assistant.value = false;
        version.value++;
      }
      recover();
      clearInterval(heartbeat);
      heartbeat = setInterval(() => {
        if (!persistent.value) return;
        if (readLock()?.token !== token) {
          blocked.value = true;
          confirmation.value = null;
          assistant.value = false;
          clearInterval(heartbeat);
          return;
        }
        try {
          writeLock();
        } catch {
          persistent.value = false;
        }
      }, 2000);
    } catch {
      persistent.value = false;
      blocked.value = false;
    }
  }
  function claim(force = false) {
    if (navigator.locks && persistent.value) {
      const options = force ? { steal: true } : { ifAvailable: true };
      navigator.locks
        .request(LOCK, options, async (lock) => {
          if (!lock) {
            blocked.value = true;
            return;
          }
          await new Promise<void>((release) => {
            releaseNative = release;
            claimLease(force, true);
          });
        })
        .catch(() => {
          blocked.value = true;
          assistant.value = false;
          confirmation.value = null;
          clearInterval(heartbeat);
        });
    } else claimLease(force);
  }
  function persist() {
    if (corrupt.value || !owned()) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(world.value));
      return true;
    } catch {
      persistent.value = false;
      return false;
    }
  }
  function transact(fn: (w: World) => void, requireDurable = false) {
    error.value = "";
    if (corrupt.value)
      throw Error("Nie można odtworzyć postępu. Rozpocznij nowe demo");
    if (!owned()) {
      blocked.value = true;
      throw Error(
        "Demo jest już otwarte w innej karcie. Przejmij sesję, aby zapisać zmiany.",
      );
    }
    const next = E.clone(world.value);
    fn(next);
    if (requireDurable) {
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        persistent.value = false;
        throw Error(
          "Nie udało się zapisać planu. Pozostań na ekranie i spróbuj ponownie",
        );
      }
    }
    world.value = next;
    persist();
    return true;
  }
  function attempt(fn: () => void) {
    try {
      fn();
    } catch (e) {
      fail(e);
    }
  }
  function recover() {
    if (corrupt.value) return;
    let changed = false;
    for (const op of world.value.operations)
      if (["pending", "unknown"].includes(op.status)) {
        op.status = "unknown";
        op.editorToken = token;
        changed = true;
      }
    if (changed) persist();
  }
  claim();
  window.addEventListener("storage", (e) => {
    if (e.key === LOCK && readLock()?.token !== token) {
      blocked.value = true;
      confirmation.value = null;
      assistant.value = false;
    }
    if (e.key === KEY && !owned()) {
      load();
      version.value++;
    }
  });
  window.addEventListener("pagehide", () => {
    clearTimeout(saveTimer);
    persist();
    releaseNative?.();
    clearInterval(heartbeat);
    if (owned())
      try {
        localStorage.removeItem(LOCK);
      } catch {}
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) claim();
  });
  const visibleCases = computed(() =>
    world.value.cases.filter((c) => E.canRead(world.value, c)),
  );
  const messages = computed(() =>
    world.value.messages
      .filter((m) => {
        if (m.recipient !== world.value.role) return false;
        if (world.value.role === "marta") return true;
        if (m.invitationId) {
          const i = world.value.invitations.find(
            (i) => i.id === m.invitationId,
          );
          return i?.status === "pending" && i.recipient === world.value.role;
        }
        if (m.consentId)
          return visibleCases.value.some((c) => c.id === m.caseId);
        if (m.caseId) {
          const c = world.value.cases.find((c) => c.id === m.caseId);
          return !!c && E.hasPermission(world.value, c, "receiveNotifications");
        }
        return false;
      })
      .map((m) => {
        if (world.value.role === "marta" || m.invitationId || m.consentId)
          return m;
        const c = world.value.cases.find((c) => c.id === m.caseId);
        return c && !E.hasPermission(world.value, c, "readContent")
          ? {
              ...m,
              subject: "Udostępniona sprawa",
              body: "Status udostępnionej sprawy został zaktualizowany.",
            }
          : m;
      })
      .slice()
      .reverse(),
  );
  const unread = computed(
    () => messages.value.filter((m) => m.isUnread).length,
  );
  function getCase(cid: string) {
    return world.value.cases.find((c) => c.id === cid);
  }
  function title(c: CaseRecord) {
    return E.canContent(world.value, c)
      ? flows[c.flowId].shortName
      : "Udostępniona sprawa";
  }
  function start(
    flow: FlowId,
    data: Data = {},
  ): { id: string; existing: boolean } | undefined {
    try {
      let result: any;
      transact((w) => {
        const r = E.openCase(w, flow, data);
        result = { id: r.case.id, existing: r.existing };
      });
      return result;
    } catch (e) {
      fail(e);
    }
  }
  function field(cid: string, key: string, value: any) {
    attempt(() => {
      if (!owned()) throw Error("Sesja została przejęta w innej karcie");
      const c = getCase(cid)!;
      E.update(world.value, c, key, value);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persist, 300);
    });
  }
  function step(cid: string, next: string) {
    attempt(() =>
      transact((w) => {
        const c = w.cases.find((c) => c.id === cid)!;
        E.go(w, c, next);
      }),
    );
  }
  function request(cid: string, action: string) {
    attempt(() => {
      const c = getCase(cid)!;
      E.assertAction(world.value, c, action);
      confirmation.value = {
        caseId: cid,
        action,
        revision: c.revision,
        role: world.value.role,
        epoch: world.value.epoch,
        token,
      };
      error.value = "";
    });
  }
  async function execute() {
    const card = confirmation.value;
    if (!card || executing.value) return;
    let opid = "";
    attempt(() => {
      if (
        card.role !== world.value.role ||
        card.epoch !== world.value.epoch ||
        card.token !== token
      )
        throw Error("Podsumowanie jest nieaktualne. Sprawdź aktualne dane");
      transact((w) => {
        opid = E.begin(
          w,
          w.cases.find((c) => c.id === card.caseId)!,
          card.action,
          card.revision,
          token,
        ).id;
      });
    });
    if (!opid) return;
    executing.value = true;
    await new Promise((r) => setTimeout(r, 800));
    try {
      if (!owned()) return;
      transact((w) => E.settle(w, opid, token));
      const op = world.value.operations.find((o) => o.id === opid);
      if (op?.actorId === world.value.role) {
        say(
          op.status === "succeeded"
            ? "Działanie zapisane w demonstracji"
            : op.status === "unknown"
              ? "Nie mamy potwierdzenia wyniku. Najpierw sprawdź status"
              : "Nie udało się wykonać działania. Dane zostały zachowane",
        );
      }
    } catch (e) {
      fail(e);
    } finally {
      executing.value = false;
      confirmation.value = null;
    }
  }
  function resolve(opid: string) {
    attempt(() =>
      transact((w) => {
        const op = w.operations.find((o) => o.id === opid)!;
        const c = w.cases.find((c) => c.id === op.caseId);
        if (c && !E.canRead(w, c)) throw Error(E.DENIED);
        E.settle(w, opid, token, op.resolveAs);
        say(
          op.status === "unknown"
            ? "Nadal brak rozstrzygnięcia. Zapisz sprawę i wróć później"
            : op.status === "succeeded"
              ? "Wynik potwierdzony w demonstracji"
              : "Działanie nie zostało wykonane. Możesz spróbować ponownie",
        );
      }),
    );
  }
  function switchRole(role: Role) {
    attempt(() => {
      clearTimeout(saveTimer);
      transact((w) => {
        w.role = role;
      });
      assistant.value = false;
      assistantCase.value = "";
      confirmation.value = null;
      version.value++;
      say(`Profil demonstracyjny: ${roles[role]}`);
    });
  }
  function reset() {
    attempt(() => {
      const epoch = world.value.epoch + 1;
      corrupt.value = false;
      if (blocked.value) claim(true);
      world.value = E.seed(epoch);
      writeLock();
      persist();
      assistant.value = false;
      assistantCase.value = "";
      confirmation.value = null;
      error.value = "";
      version.value++;
    });
  }
  function readMessage(mid: string) {
    attempt(() =>
      transact((w) => {
        const m = w.messages.find((m) => m.id === mid);
        if (m && messages.value.some((m) => m.id === mid)) m.isUnread = false;
      }),
    );
  }
  function openAssistant(cid = "") {
    persist();
    assistantCase.value = cid;
    assistant.value = true;
  }
  function external(event: string, cid: string) {
    attempt(() => transact((w) => E.external(w, event, cid, E.id(w, "event"))));
  }
  function advance(days: number) {
    attempt(() => {
      transact((w) => E.advance(w, days));
      confirmation.value = null;
      assistant.value = false;
    });
  }
  function grant(cid: string, permission: Permission) {
    const c = getCase(cid);
    return !!c && E.hasPermission(world.value, c, permission);
  }
  function discard(cid: string) {
    attempt(() =>
      transact((w) => {
        const c = w.cases.find((c) => c.id === cid)!;
        if (w.role !== "marta") throw Error(E.DENIED);
        if (w.operations.some((o) => o.caseId === cid && o.applied))
          throw Error(
            "Zgłoszenie zostało już wykonane. Użyj dedykowanego działania.",
          );
        c.draftData = {};
        c.status = "cancelled";
        E.history(w, c, "Szkic porzucony");
      }),
    );
  }
  function savePlan(cid: string) {
    attempt(() => {
      transact((w) => {
        const c = w.cases.find((c) => c.id === cid)!;
        if (w.role !== "marta") throw Error(E.DENIED);
        if (!c.draftData.checklistSaved)
          throw Error(
            "Najpierw zaznacz, że masz zapisaną listę pytań, albo zachowaj plan jako szkic",
          );
        c.status = "completed";
        c.currentStep = "result";
        c.draftData.planStatus = "prepared";
        E.history(w, c, "Przygotowanie zapisane");
      }, true);
      say("Przygotowanie zapisane");
    });
  }
  function helperField(cid: string, key: string, value: any) {
    attempt(() =>
      transact((w) => {
        const c = w.cases.find((c) => c.id === cid)!;
        if (w.role === "marta" || !E.hasPermission(w, c, "prepareDraft"))
          throw Error(E.DENIED);
        c.draftData.helperDrafts ??= {};
        const helper = c.draftData.helperDrafts[w.role] ?? {
          baseRevision: c.revision,
          data: {},
        };
        helper.data[key] = value;
        c.draftData.helperDrafts[w.role] = helper;
      }),
    );
  }
  function submitHelper(cid: string) {
    attempt(() => {
      const c = getCase(cid)!;
      if (!grant(cid, "prepareDraft")) throw Error(E.DENIED);
      const h = c.draftData.helperDrafts?.[world.value.role];
      if (!h || !Object.values(h.data).some(Boolean))
        throw Error("Najpierw przygotuj propozycję");
      c.draftData.helperDraft = h.data;
      c.draftData.proposalBaseRevision = h.baseRevision;
      request(cid, "submitHelperDraft");
    });
  }
  function reviewProposal(pid: string, accept: boolean) {
    attempt(() =>
      transact((w) => {
        if (w.role !== "marta") throw Error(E.DENIED);
        const p = w.proposals.find((p) => p.id === pid)!;
        if (p.reviewed) return;
        const c = w.cases.find((c) => c.id === p.caseId)!;
        if (accept) {
          Object.assign(c.draftData, p.data);
          c.revision++;
          E.history(w, c, "Propozycja pomocnika przyjęta");
        }
        p.reviewed = true;
      }),
    );
  }
  return {
    world,
    persistent,
    corrupt,
    blocked,
    toast,
    error,
    version,
    assistant,
    assistantCase,
    confirmation,
    executing,
    memoryToken,
    visibleCases,
    messages,
    unread,
    token,
    say,
    fail,
    persist,
    transact,
    attempt,
    claim,
    start,
    field,
    step,
    request,
    execute,
    resolve,
    switchRole,
    reset,
    readMessage,
    openAssistant,
    external,
    advance,
    getCase,
    title,
    grant,
    discard,
    savePlan,
    helperField,
    submitHelper,
    reviewProposal,
  };
});
