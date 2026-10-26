import type {
  World,
  CaseRecord,
  FlowId,
  Role,
  Data,
  Permission,
  Operation,
  Message,
} from "./types";
import { flows } from "./flows";
export const DENIED = "W tym profilu nie masz dostępu do tej czynności";
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export function seed(epoch = 1): World {
  return {
    schemaVersion: 1,
    epoch,
    sequence: 0,
    demoDate: "2026-10-26T10:00:00+01:00",
    role: "marta",
    cases: [
      {
        id: "letter-case",
        flowId: "F05",
        subjectId: "marta",
        ownerId: "marta",
        status: "draft",
        currentStep: "letter",
        revision: 0,
        consentVersion: 0,
        draftData: { letterId: "letter-1", attachmentIds: [] },
        history: [],
      },
    ],
    documents: [
      {
        id: "marta-id",
        ownerId: "marta",
        title: "mDowód",
        number: "Dane demonstracyjne",
        status: "valid",
      },
      {
        id: "marta-driving",
        ownerId: "marta",
        title: "Prawo jazdy",
        number: "Dane demonstracyjne",
        status: "valid",
      },
      {
        id: "marta-family",
        ownerId: "marta",
        title: "Karta Dużej Rodziny",
        number: "Dane demonstracyjne",
        status: "valid",
      },
      {
        id: "zosia-passport",
        ownerId: "zosia",
        title: "Paszport",
        number: "Numer demonstracyjny P-001",
        status: "valid",
        expiresAt: "2026-12-10",
      },
      {
        id: "zosia-school-card",
        ownerId: "zosia",
        title: "Legitymacja szkolna",
        number: "Numer demonstracyjny L-001",
        status: "valid",
      },
    ],
    children: [
      { id: "zosia", name: "Zosia Kowalska", birthDate: "2018-05-12" },
      { id: "adam", name: "Adam Kowalski", birthDate: "2011-02-03" },
    ],
    registries: {},
    tags: [],
    petStatus: "home",
    notice: null,
    reports: [],
    consents: [],
    invitations: [],
    grants: [],
    proposals: [],
    messages: [
      {
        id: "letter-1",
        recipient: "marta",
        sender: "Urząd Skarbowy · DEMO",
        subject: "Wezwanie do uzupełnienia dokumentów",
        body: flows.F05.steps.letter!.description!,
        at: "2026-10-23T10:00:00+02:00",
        isUnread: true,
        caseId: "letter-case",
      },
    ],
    operations: [],
    eventIds: [],
    flags: {
      chipConflict: false,
      registryUnavailable: false,
      occupiedSlot: false,
      staleContact: false,
    },
    nextOutcome: "success",
  };
}
export function id(w: World, prefix: string) {
  return `${prefix}-${w.epoch}-${++w.sequence}`;
}
export function history(
  w: World,
  c: CaseRecord,
  event: string,
  actor: Role | "demo" = w.role,
) {
  c.history.push({
    id: id(w, "history"),
    actorId: actor,
    event,
    at: w.demoDate,
  });
}
export function notify(
  w: World,
  recipient: Role,
  sender: string,
  subject: string,
  body: string,
  links: Partial<Message> = {},
) {
  w.messages.push({
    ...links,
    id: id(w, "message"),
    recipient,
    sender,
    subject,
    body,
    at: w.demoDate,
    isUnread: true,
  });
  if (recipient === "marta" && links.caseId) {
    const seen = new Set<Role>();
    for (const g of w.grants.filter(
      (g) =>
        g.caseId === links.caseId &&
        g.status === "active" &&
        g.permissions.includes("receiveNotifications") &&
        Date.parse(g.expiresAt) > Date.parse(w.demoDate),
    )) {
      if (seen.has(g.recipient)) continue;
      seen.add(g.recipient);
      w.messages.push({
        ...links,
        id: id(w, "message"),
        recipient: g.recipient,
        sender,
        subject: g.permissions.includes("readContent")
          ? subject
          : "Udostępniona sprawa",
        body: g.permissions.includes("readContent")
          ? body
          : "Status udostępnionej sprawy został zaktualizowany.",
        at: w.demoDate,
        isUnread: true,
      });
    }
  }
}
export function hasPermission(
  w: World,
  c: CaseRecord,
  p: Permission,
  role: Role = w.role,
) {
  return (
    role === "marta" ||
    w.grants.some(
      (g) =>
        g.recipient === role &&
        g.caseId === c.id &&
        g.status === "active" &&
        Date.parse(g.expiresAt) > Date.parse(w.demoDate) &&
        g.permissions.includes(p),
    )
  );
}
export function currentConsent(w: World, c: CaseRecord) {
  return [...w.consents]
    .reverse()
    .find((s) => s.caseId === c.id && s.version === c.consentVersion);
}
export function currentInvitation(w: World, c: CaseRecord) {
  return [...w.invitations]
    .reverse()
    .find((i) => i.caseId === c.id && i.status === "pending");
}
export function canRead(w: World, c: CaseRecord, role: Role = w.role) {
  if (role === "marta") return true;
  if (c.flowId === "F02" && role === "piotr")
    return (
      !!currentConsent(w, c) &&
      ["pending", "approved", "declined"].includes(currentConsent(w, c)!.status)
    );
  if (c.flowId === "F06")
    return w.invitations.some(
      (i) =>
        i.caseId === c.id &&
        i.recipient === role &&
        i.status === "pending" &&
        Date.parse(i.expiresAt) > Date.parse(w.demoDate),
    );
  return hasPermission(w, c, "viewStatus", role);
}
export function canContent(w: World, c: CaseRecord) {
  return (
    w.role === "marta" ||
    (c.flowId === "F02" && w.role === "piotr" && canRead(w, c)) ||
    (c.flowId === "F06" && canRead(w, c)) ||
    hasPermission(w, c, "readContent")
  );
}
export function canEdit(w: World, c: CaseRecord, role = w.role) {
  return (
    role === "marta" ||
    (["F05", "F08"].includes(c.flowId) &&
      hasPermission(w, c, "prepareDraft", role))
  );
}
export function active(c: CaseRecord) {
  return !["completed", "cancelled"].includes(c.status);
}
export function openCase(
  w: World,
  flowId: FlowId,
  initial: Data = {},
): { case: CaseRecord; existing: boolean } {
  if (w.role !== "marta") throw Error(DENIED);
  const list = w.cases.filter((c) => c.flowId === flowId);
  let existing = list.find(
    (c) =>
      active(c) &&
      Object.entries(initial).every(
        ([k, v]) => !c.draftData[k] || c.draftData[k] === v,
      ),
  );
  if (
    flowId === "F01" &&
    initial.documentId &&
    w.documents.find((d) => d.id === initial.documentId)?.status !== "valid"
  )
    existing = list.find((c) => c.draftData.documentId === initial.documentId);
  if (["F05", "F07", "F08"].includes(flowId)) existing = list[0];
  if (flowId === "Q01") existing = list.at(-1);
  if (
    flowId === "F03" &&
    initial.registryId &&
    w.registries[initial.registryId]
  )
    existing = list
      .slice()
      .reverse()
      .find((c) => c.draftData.registryId === initial.registryId);
  if (flowId === "F06" && initial.recipient)
    existing =
      list
        .slice()
        .reverse()
        .find(
          (c) =>
            c.draftData.recipient === initial.recipient &&
            w.grants.some(
              (g) => g.recipient === initial.recipient && g.status === "active",
            ),
        ) || existing;
  if (existing) return { case: existing, existing: true };
  const c: CaseRecord = {
    id: id(w, "case"),
    flowId,
    subjectId: ["F01", "F02"].includes(flowId)
      ? "zosia"
      : ["F03", "F04", "Q01"].includes(flowId)
        ? "luna"
        : "marta",
    ownerId: "marta",
    status: "draft",
    currentStep: flows[flowId].first,
    revision: 0,
    consentVersion: 0,
    draftData: { ...initial },
    history: [],
  };
  if (flowId === "F02") c.draftData = { childId: "zosia", ...initial };
  if (flowId === "F06")
    c.draftData = { permissions: {}, duration: "7", ...initial };
  w.cases.push(c);
  history(w, c, "Sprawa rozpoczęta");
  return { case: c, existing: false };
}
export function update(w: World, c: CaseRecord, key: string, value: any) {
  if (
    w.role !== "marta" &&
    !(
      c.flowId === "F02" &&
      w.role === "piotr" &&
      key === "declineReason" &&
      currentConsent(w, c)?.status === "pending"
    )
  )
    throw Error(DENIED);
  if (
    w.operations.some(
      (o) => o.caseId === c.id && ["pending", "unknown"].includes(o.status),
    )
  )
    throw Error("Najpierw sprawdź status operacji");
  if (JSON.stringify(c.draftData[key]) === JSON.stringify(value)) return;
  c.draftData[key] = value;
  c.revision++;
  if (
    c.flowId === "F02" &&
    ["childId", "reason", "photoId", "officeId"].includes(key)
  ) {
    c.consentVersion++;
    w.consents
      .filter(
        (s) => s.caseId === c.id && ["pending", "approved"].includes(s.status),
      )
      .forEach((s) => (s.status = "outdated"));
    if (c.draftData.appointmentId) c.draftData.appointmentRequiresReview = true;
  }
  if (c.flowId === "F03" && ["registryId", "contactId"].includes(key)) {
    delete c.draftData.verifiedKey;
    c.draftData.verificationCode = "";
  }
  if (c.flowId === "F01" && ["childId", "documentId"].includes(key)) {
    delete c.draftData.lossReason;
    delete c.draftData.discoveredAt;
  }
}
export function errors(
  w: World,
  c: CaseRecord,
  step = c.currentStep,
): Record<string, string> {
  const result: Record<string, string> = {};
  const d = c.draftData;
  for (const f of flows[c.flowId].steps[step]?.fields || []) {
    const v = d[f.key];
    if (f.required && (!v || (Array.isArray(v) && !v.length)))
      result[f.key] = "Wybierz odpowiedź, aby przejść dalej";
    if (f.kind === "textarea" && typeof v === "string" && !v.trim())
      result[f.key] = "Wpisz odpowiedź albo użyj szkicu demonstracyjnego";
    if (f.maxLength && v?.length > f.maxLength)
      result[f.key] = `Odpowiedź może mieć do ${f.maxLength} znaków`;
  }
  if (c.flowId === "F01" && step === "select") {
    if (d.childId === "adam")
      result.childId = "Dla Adama nie przygotowano tego scenariusza";
    const doc = w.documents.find((x) => x.id === d.documentId);
    if (doc && doc.status !== "valid")
      result.documentId = "Utrata tego dokumentu jest już zgłoszona";
  }
  if (
    c.flowId === "F03" &&
    step === "identify" &&
    d.chipNumber &&
    !/^\d{15}$/.test(d.chipNumber)
  )
    result.chipNumber = "Numer przykładowy powinien zawierać 15 cyfr";
  if (
    c.flowId === "F03" &&
    step === "verify" &&
    d.verificationCode !== "123456"
  )
    result.verificationCode =
      "Kod demonstracyjny jest nieprawidłowy. Użyj 123456";
  if (c.flowId === "F05" && step === "attachments") {
    const missing = ["invoice-a", "invoice-b"].filter(
      (v) => !d.attachmentIds?.includes(v),
    );
    if (missing.length)
      result.attachmentIds =
        "Brakuje: " +
        missing
          .map((v) =>
            v === "invoice-a" ? "Faktura A · DEMO" : "Faktura B · DEMO",
          )
          .join(", ");
  }
  return result;
}
export function go(w: World, c: CaseRecord, next: string) {
  if (w.role !== "marta") throw Error(DENIED);
  if (!flows[c.flowId].steps[next]) throw Error("Nieznany krok");
  if (
    w.operations.some(
      (o) => o.caseId === c.id && ["pending", "unknown"].includes(o.status),
    )
  )
    throw Error("Najpierw sprawdź status operacji");
  if (c.flowId === "F03" && c.currentStep === "verify" && next === "review")
    c.draftData.verifiedKey = `${c.draftData.registryId}:${c.draftData.contactId}`;
  if (
    c.flowId === "Q01" &&
    next === "select" &&
    w.tags.some((t) => t.status === "active")
  )
    next = "active";
  if (
    c.flowId === "F08" &&
    c.status === "completed" &&
    !["otherTasks", "result"].includes(next)
  )
    throw Error("Wybierz „Edytuj plan”, aby zmienić zapisane przygotowanie");
  if (c.flowId === "F04" && next === "close" && c.currentStep === "searching") {
    delete c.draftData.selectedReportId;
    c.draftData.closureReason = "returnedAlone";
  }
  if (
    c.flowId === "F04" &&
    next === "matchReview" &&
    w.reports.find((r) => r.id === c.draftData.selectedReportId)?.type ===
      "sighting"
  )
    throw Error(
      "To sygnał o zauważeniu. Nie potwierdza znalezienia ani możliwości odbioru",
    );
  c.currentStep = next;
}
const actionSteps: Record<string, string[]> = {
  reportLoss: ["review"],
  requestPassportConsent: ["consentReview"],
  approveConsent: ["waitingConsent", "consentDecision"],
  declineConsent: ["waitingConsent", "consentDecision"],
  withdrawPassportConsent: ["readyForVisit", "appointment", "visitBooked"],
  cancelPassport: ["consentDeclined"],
  bookVisit: ["appointment"],
  saveMicrochip: ["review"],
  activateTag: ["review"],
  deactivateTag: ["deactivateReview"],
  replaceTag: ["replaceReview"],
  publishNotice: ["review"],
  matchReport: ["matchReview"],
  confirmPetReturn: ["close"],
  rejectReport: ["rejectReview"],
  flagReport: ["suspiciousReview"],
  withdrawNotice: ["withdrawReview"],
  sendLetterResponse: ["review"],
  submitHelperDraft: [
    "letter",
    "explanation",
    "draft",
    "attachments",
    "review",
    "situation",
    "record",
    "checklist",
    "appointment",
    "result",
  ],
  sendAccessInvitation: ["review"],
  acceptAccessInvitation: ["waitingInvitation", "invitationDecision"],
  declineAccessInvitation: ["waitingInvitation", "invitationDecision"],
  withdrawAccessInvitation: ["withdrawInvitationReview"],
  revokeAccess: ["revoke"],
  finishInvitation: ["declined"],
  submitBirthRegistration: ["review"],
};
const actionFlows: Record<string, FlowId> = {
  reportLoss: "F01",
  requestPassportConsent: "F02",
  approveConsent: "F02",
  declineConsent: "F02",
  withdrawPassportConsent: "F02",
  cancelPassport: "F02",
  bookVisit: "F02",
  saveMicrochip: "F03",
  activateTag: "Q01",
  deactivateTag: "Q01",
  replaceTag: "Q01",
  publishNotice: "F04",
  matchReport: "F04",
  confirmPetReturn: "F04",
  rejectReport: "F04",
  flagReport: "F04",
  withdrawNotice: "F04",
  sendLetterResponse: "F05",
  sendAccessInvitation: "F06",
  acceptAccessInvitation: "F06",
  declineAccessInvitation: "F06",
  withdrawAccessInvitation: "F06",
  revokeAccess: "F06",
  finishInvitation: "F06",
  submitBirthRegistration: "F07",
};
export function assertAction(
  w: World,
  c: CaseRecord,
  action: string,
  role: Role = w.role,
  originalStep = c.currentStep,
) {
  if (action === "submitHelperDraft") {
    if (
      !["F05", "F08"].includes(c.flowId) ||
      role === "marta" ||
      !hasPermission(w, c, "prepareDraft", role)
    )
      throw Error(DENIED);
  } else if (
    ["approveConsent", "declineConsent", "withdrawPassportConsent"].includes(
      action,
    )
  ) {
    const s = currentConsent(w, c);
    if (
      role !== "piotr" ||
      !s ||
      s.status !==
        (action === "withdrawPassportConsent" ? "approved" : "pending")
    )
      throw Error(DENIED);
  } else if (
    ["acceptAccessInvitation", "declineAccessInvitation"].includes(action)
  ) {
    const i = currentInvitation(w, c);
    if (
      !i ||
      i.recipient !== role ||
      Date.parse(i.expiresAt) <= Date.parse(w.demoDate)
    )
      throw Error(DENIED);
  } else if (role !== "marta") throw Error(DENIED);
  if (actionFlows[action] && c.flowId !== actionFlows[action])
    throw Error("Nieprawidłowa czynność dla tej sprawy");
  if (!actionSteps[action]?.includes(originalStep))
    throw Error("Podsumowanie jest nieaktualne. Sprawdź aktualne dane");
  const d = c.draftData;
  if (
    action === "reportLoss" &&
    (d.childId !== "zosia" ||
      !d.lossReason ||
      !d.discoveredAt ||
      w.documents.find((x) => x.id === d.documentId)?.status !== "valid")
  )
    throw Error("Sprawdź dziecko, dokument i okoliczności zgłoszenia");
  if (
    action === "requestPassportConsent" &&
    (!d.childId || !d.reason || !d.photoId || !d.officeId)
  )
    throw Error("Uzupełnij dane przygotowania");
  if (action === "declineConsent" && !d.declineReason)
    throw Error("Wybierz powód odmowy");
  if (action === "bookVisit") {
    if (currentConsent(w, c)?.status !== "approved")
      throw Error("Brak aktualnej zgody Piotra");
    if (!d.appointmentId) throw Error("Wybierz termin");
    if (w.flags.occupiedSlot && d.appointmentId === "slot-1")
      throw Error("Ten przykładowy termin nie jest dostępny. Wybierz drugi");
  }
  if (action === "saveMicrochip") {
    if (
      d.verifiedKey !== `${d.registryId}:${d.contactId}` ||
      !/^\d{15}$/.test(d.chipNumber || "")
    )
      throw Error("Zweryfikuj bieżący kontakt i numer");
    if (w.flags.chipConflict)
      throw Error(
        "Numer jest powiązany z innym opiekunem. Zapisz do wyjaśnienia",
      );
    if (w.flags.registryUnavailable)
      throw Error(
        "Rejestr demonstracyjny jest niedostępny. Dane zostały zachowane",
      );
  }
  if (
    ["deactivateTag", "replaceTag"].includes(action) &&
    !w.tags.some((t) => t.status === "active")
  )
    throw Error("Ta zawieszka jest nieaktywna");
  if (
    action === "publishNotice" &&
    (!d.disappearedAt || !d.areaId || !d.descriptionId)
  )
    throw Error("Uzupełnij dane ogłoszenia");
  if (
    ["matchReport", "rejectReport", "flagReport"].includes(action) &&
    !w.reports.some(
      (r) =>
        r.id === d.selectedReportId && r.notificationDelivery !== "noMatch",
    )
  )
    throw Error("Wybierz zgłoszenie");
  if (
    action === "matchReport" &&
    w.reports.find((r) => r.id === d.selectedReportId)?.type === "sighting"
  )
    throw Error("Sygnał o zauważeniu nie potwierdza znalezienia");
  if (
    action === "sendLetterResponse" &&
    (!d.responseText?.trim() ||
      d.responseText.trim().length > 2000 ||
      !["invoice-a", "invoice-b"].every((v) => d.attachmentIds?.includes(v)))
  )
    throw Error("Sprawdź treść i obie wymagane faktury");
  if (action === "sendAccessInvitation") {
    if (!["anna", "piotr"].includes(d.recipient) || !d.caseIds?.length)
      throw Error("Wybierz odbiorcę i sprawy");
    for (const cid of d.caseIds) {
      const target = w.cases.find((c) => c.id === cid);
      if (!target || !["F05", "F08"].includes(target.flowId))
        throw Error("Ta sprawa nie podlega udostępnieniu");
      const p = d.permissions?.[cid] || [];
      if (
        !p.includes("viewStatus") ||
        ((p.includes("readAttachments") || p.includes("prepareDraft")) &&
          !p.includes("readContent"))
      )
        throw Error("Sprawdź zależności uprawnień");
    }
  }
  if (
    action === "submitBirthRegistration" &&
    (!d.birthEventId || !d.childName || !d.deliveryMode)
  )
    throw Error("Uzupełnij dane zgłoszenia");
}
export function begin(
  w: World,
  c: CaseRecord,
  action: string,
  revision: number,
  editorToken: string,
): Operation {
  if (c.revision !== revision)
    throw Error("Podsumowanie jest nieaktualne. Sprawdź aktualne dane");
  if (
    w.operations.some(
      (o) => o.caseId === c.id && ["pending", "unknown"].includes(o.status),
    )
  )
    throw Error("Nie mamy potwierdzenia wyniku. Najpierw sprawdź status");
  assertAction(w, c, action);
  const targetType = [
    "approveConsent",
    "declineConsent",
    "withdrawPassportConsent",
  ].includes(action)
    ? "consent"
    : ["acceptAccessInvitation", "declineAccessInvitation"].includes(action)
      ? "invitation"
      : "case";
  const op: Operation = {
    id: id(w, "operation"),
    targetType,
    targetId:
      targetType === "consent"
        ? currentConsent(w, c)!.id
        : targetType === "invitation"
          ? currentInvitation(w, c)!.id
          : c.id,
    caseId: c.id,
    action,
    revision,
    actorId: w.role,
    worldEpoch: w.epoch,
    editorToken,
    status: "pending",
    returnStatus: c.status,
    returnStep: c.currentStep,
    resolveAs: "unknown",
    outcome: w.nextOutcome,
    applied: false,
  };
  w.nextOutcome = "success";
  w.operations.push(op);
  c.status = "submitting";
  return op;
}
export function settle(
  w: World,
  opId: string,
  token: string,
  resolved?: "succeeded" | "notExecuted" | "unknown",
) {
  const op = w.operations.find((o) => o.id === opId);
  if (
    !op ||
    op.applied ||
    op.worldEpoch !== w.epoch ||
    op.editorToken !== token
  )
    return;
  if (!["pending", "unknown"].includes(op.status)) return;
  const c = w.cases.find((c) => c.id === op.caseId);
  if (!c) return;
  try {
    if (c.revision !== op.revision) throw Error("Stara wersja");
    assertAction(w, c, op.action, op.actorId, op.returnStep);
  } catch {
    op.status = "notExecuted";
    c.status = op.returnStatus;
    c.currentStep = op.returnStep;
    return;
  }
  const result =
    resolved ??
    (op.outcome === "success"
      ? "succeeded"
      : op.outcome === "knownFailure"
        ? "notExecuted"
        : "unknown");
  if (result === "unknown") {
    op.status = "unknown";
    return;
  }
  if (result === "notExecuted") {
    op.status = op.outcome === "knownFailure" ? "failed" : "notExecuted";
    c.status = op.returnStatus;
    c.currentStep = op.returnStep;
    return;
  }
  applyEffect(w, c, op);
  op.status = "succeeded";
  op.applied = true;
  history(w, c, actionNames[op.action] || op.action, op.actorId);
}
export const actionNames: Record<string, string> = {
  reportLoss: "Zgłoszenie utraty zapisane",
  requestPassportConsent: "Prośba o zgodę wysłana",
  approveConsent: "Piotr wyraził zgodę",
  declineConsent: "Piotr odmówił zgody",
  withdrawPassportConsent: "Piotr wycofał zgodę",
  bookVisit: "Termin wizyty zapisany",
  saveMicrochip: "Wpis w rejestrze zapisany",
  activateTag: "Zawieszka aktywowana",
  deactivateTag: "Zawieszka wyłączona",
  replaceTag: "Zawieszka wymieniona",
  publishNotice: "Ogłoszenie zapisane",
  matchReport: "Dopasowanie zapisane",
  confirmPetReturn: "Powrót Luny potwierdzony",
  rejectReport: "Zgłoszenie odrzucone",
  flagReport: "Podejrzany kontakt zgłoszony lokalnie",
  withdrawNotice: "Ogłoszenie wycofane",
  sendLetterResponse: "Odpowiedź wysłana",
  sendAccessInvitation: "Zakres dostępu zatwierdzony",
  acceptAccessInvitation: "Zaproszenie przyjęte",
  declineAccessInvitation: "Zaproszenie odrzucone",
  revokeAccess: "Dostęp cofnięty",
  withdrawAccessInvitation: "Zaproszenie wycofane",
  submitBirthRegistration: "Zgłoszenie narodzin wysłane",
  submitHelperDraft: "Propozycja przekazana do przeglądu",
  finishInvitation: "Przygotowanie zakończone",
  cancelPassport: "Przygotowanie paszportu zakończone",
};
function applyEffect(w: World, c: CaseRecord, op: Operation) {
  const d = c.draftData;
  const done = (step = "result") => {
    c.status = "completed";
    c.currentStep = step;
  };
  const wait = (step: string) => {
    c.status = "submitted";
    c.currentStep = step;
  };
  switch (op.action) {
    case "reportLoss":
      w.documents.find((x) => x.id === d.documentId)!.status = "lossReported";
      if (d.documentId === "zosia-school-card") wait("waitingSchool");
      else done();
      notify(
        w,
        "marta",
        "Dokumenty · DEMO",
        "Zgłoszenie utraty dokumentu",
        "Status zmieniono tylko w demonstracji.",
        { caseId: c.id },
      );
      break;
    case "requestPassportConsent":
      w.consents
        .filter((s) => s.caseId === c.id && s.status === "pending")
        .forEach((s) => (s.status = "outdated"));
      {
        const s = {
          id: id(w, "consent"),
          caseId: c.id,
          version: c.consentVersion,
          snapshot: clone(d),
          status: "pending" as const,
        };
        w.consents.push(s);
        c.status = "awaitingConsent";
        c.currentStep = "waitingConsent";
        notify(
          w,
          "piotr",
          "Marta · DEMO",
          "Prośba o zgodę",
          "Przygotowana sprawa paszportowa czeka na Twoją decyzję.",
          { caseId: c.id, consentId: s.id },
        );
      }
      break;
    case "approveConsent":
      w.consents.find((s) => s.id === op.targetId)!.status = "approved";
      c.status = "draft";
      c.currentStep = "readyForVisit";
      notify(
        w,
        "marta",
        "Piotr · DEMO",
        "Zgoda zapisana",
        "Piotr wyraził zgodę na aktualny zakres przygotowania.",
        { caseId: c.id },
      );
      break;
    case "declineConsent": {
      const s = w.consents.find((s) => s.id === op.targetId)!;
      s.status = "declined";
      s.reason = d.declineReason;
      c.status = "needsInput";
      c.currentStep = "consentDeclined";
      notify(
        w,
        "marta",
        "Piotr · DEMO",
        "Brak zgody",
        d.declineReason === "correction"
          ? "Dane wymagają poprawy"
          : "Nie wyrażam zgody",
        { caseId: c.id },
      );
      break;
    }
    case "withdrawPassportConsent":
      w.consents.find((s) => s.id === op.targetId)!.status = "withdrawn";
      d.appointmentRequiresReview = true;
      c.status = "needsInput";
      c.currentStep = "consentDeclined";
      break;
    case "cancelPassport":
      c.status = "cancelled";
      c.currentStep = "consentDeclined";
      break;
    case "bookVisit":
      c.status = "draft";
      c.currentStep = "visitBooked";
      d.appointmentRequiresReview = false;
      break;
    case "saveMicrochip":
      w.registries[d.registryId] = {
        contactId: d.contactId,
        chipNumber: d.chipNumber,
      };
      done();
      notify(
        w,
        "marta",
        `Rejestr zwierząt ${d.registryId === "registry-a" ? "A" : "B"} · DEMO`,
        "Rejestracja chipa",
        "Symulowane potwierdzenie wpisu do rejestru",
        { caseId: c.id },
      );
      break;
    case "activateTag":
      if (!w.tags.some((t) => t.status === "active"))
        w.tags.push({ id: id(w, "tag-demo"), status: "active" });
      done("active");
      break;
    case "deactivateTag":
      w.tags
        .filter((t) => t.status === "active")
        .forEach((t) => (t.status = "revoked"));
      done();
      break;
    case "replaceTag":
      w.tags
        .filter((t) => t.status === "active")
        .forEach((t) => (t.status = "revoked"));
      w.tags.push({ id: id(w, "tag-demo"), status: "active" });
      done("active");
      break;
    case "publishNotice":
      w.petStatus = "missing";
      w.notice = {
        id: w.notice?.id || id(w, "notice"),
        status: "active",
        data: {
          disappearedAt: d.disappearedAt,
          areaId: d.areaId,
          descriptionId: d.descriptionId,
        },
      };
      wait("searching");
      break;
    case "matchReport":
      w.reports.find((r) => r.id === d.selectedReportId)!.status = "matched";
      wait("pickupPending");
      break;
    case "rejectReport":
      w.reports.find((r) => r.id === d.selectedReportId)!.status = "rejected";
      delete d.selectedReportId;
      wait("reports");
      break;
    case "flagReport":
      w.reports.find((r) => r.id === d.selectedReportId)!.status = "suspicious";
      wait("reports");
      break;
    case "confirmPetReturn":
      w.petStatus = "home";
      if (w.notice) w.notice.status = "closed";
      w.reports
        .filter((r) => r.status === "matched")
        .forEach((r) => (r.status = "resolved"));
      done();
      break;
    case "withdrawNotice":
      if (w.notice) w.notice.status = "withdrawn";
      c.status = "cancelled";
      c.currentStep = "withdrawn";
      break;
    case "sendLetterResponse":
      wait("sent");
      d.responseId = id(w, "response");
      notify(
        w,
        "marta",
        "Skrzynka · DEMO",
        "Odpowiedź wysłana",
        "Oczekuje na odrębne potwierdzenie doręczenia.",
        { caseId: c.id },
      );
      break;
    case "sendAccessInvitation": {
      const existing = w.grants.filter(
        (g) => g.recipient === d.recipient && g.status === "active",
      );
      for (const g of existing) {
        const rights = d.caseIds.includes(g.caseId)
          ? d.permissions[g.caseId] || []
          : [];
        g.permissions = g.permissions.filter((p) => rights.includes(p));
        if (!g.permissions.length) g.status = "revoked";
      }
      const expiry = new Date(
        Date.parse(w.demoDate) + Number(d.duration) * 86400000,
      ).toISOString();
      const scopes = d.caseIds.map((cid: string) => ({
        caseId: cid,
        permissions: clone(d.permissions[cid] || ["viewStatus"]),
      }));
      const expanded = scopes.some((s: any) =>
        s.permissions.some(
          (p: Permission) =>
            !existing.some(
              (g) =>
                g.caseId === s.caseId &&
                g.status === "active" &&
                g.permissions.includes(p) &&
                Date.parse(g.expiresAt) >= Date.parse(expiry),
            ),
        ),
      );
      w.invitations
        .filter((i) => i.caseId === c.id && i.status === "pending")
        .forEach((i) => (i.status = "withdrawn"));
      if (!expanded) {
        done("active");
        break;
      }
      const invitation = {
        id: id(w, "invitation"),
        caseId: c.id,
        recipient: d.recipient,
        scopes,
        expiresAt: new Date(
          Date.parse(w.demoDate) + 7 * 86400000,
        ).toISOString(),
        accessUntil: expiry,
        status: "pending" as const,
      };
      w.invitations.push(invitation);
      wait("waitingInvitation");
      notify(
        w,
        d.recipient,
        "Marta · DEMO",
        "Zaproszenie do pomocy",
        "Sprawdź zakres przed przyjęciem zaproszenia.",
        { caseId: c.id, invitationId: invitation.id },
      );
      break;
    }
    case "acceptAccessInvitation": {
      const i = w.invitations.find((i) => i.id === op.targetId)!;
      i.status = "accepted";
      for (const s of i.scopes) {
        w.grants
          .filter(
            (g) =>
              g.recipient === i.recipient &&
              g.caseId === s.caseId &&
              g.status === "active",
          )
          .forEach((g) => (g.status = "revoked"));
        w.grants.push({
          id: id(w, "grant"),
          recipient: i.recipient,
          caseId: s.caseId,
          permissions: s.permissions,
          expiresAt: i.accessUntil,
          status: "active",
        });
      }
      done("active");
      notify(
        w,
        "marta",
        "Bliska osoba · DEMO",
        "Zaproszenie przyjęte",
        "Dostęp działa w zatwierdzonym zakresie.",
        { caseId: c.id },
      );
      break;
    }
    case "declineAccessInvitation":
      w.invitations.find((i) => i.id === op.targetId)!.status = "declined";
      c.status = "needsInput";
      c.currentStep = "declined";
      break;
    case "withdrawAccessInvitation":
      w.invitations
        .filter((i) => i.caseId === c.id && i.status === "pending")
        .forEach((i) => (i.status = "withdrawn"));
      c.status = "cancelled";
      c.currentStep = "waitingInvitation";
      break;
    case "revokeAccess":
      w.grants
        .filter(
          (g) => g.recipient === d.recipient && d.caseIds.includes(g.caseId),
        )
        .forEach((g) => (g.status = "revoked"));
      done("revoked");
      break;
    case "finishInvitation":
      done("declined");
      break;
    case "submitBirthRegistration":
      wait("waiting");
      break;
    case "submitHelperDraft":
      w.proposals.push({
        id: id(w, "proposal"),
        caseId: c.id,
        authorId: op.actorId,
        baseRevision: d.proposalBaseRevision ?? c.revision,
        data: clone(d.helperDraft || {}),
        at: w.demoDate,
        reviewed: false,
      });
      c.status = op.returnStatus;
      c.currentStep = op.returnStep;
      notify(
        w,
        "marta",
        "Bliska osoba · DEMO",
        "Nowa propozycja szkicu",
        "Porównaj wersje przed przyjęciem.",
        { caseId: c.id },
      );
      break;
  }
}
export const eventDefinitions = [
  {
    id: "schoolAcknowledged",
    label: "Szkoła przyjęła zgłoszenie",
    flow: "F01",
    step: "waitingSchool",
  },
  {
    id: "visitAccepted",
    label: "Przyjęcie wizyty",
    flow: "F02",
    step: "visitBooked",
  },
  {
    id: "passportCorrectionRequested",
    label: "Poprawa zdjęcia paszportowego",
    flow: "F02",
    step: "processing",
  },
  {
    id: "passportReady",
    label: "Paszport gotowy do odbioru",
    flow: "F02",
    step: "processing",
  },
  {
    id: "passportCollected",
    label: "Odbiór paszportu",
    flow: "F02",
    step: "readyForPickup",
  },
  {
    id: "chipConflictCleared",
    label: "Usunięcie konfliktu chipa",
    flow: "F03",
    step: "contactConflict",
  },
  {
    id: "responseDelivered",
    label: "Doręczenie odpowiedzi",
    flow: "F05",
    step: "sent",
  },
  {
    id: "responseCaseClosed",
    label: "Zakończenie sprawy pisma",
    flow: "F05",
    step: "delivered",
  },
  {
    id: "responseCorrectionRequested",
    label: "Prośba o uzupełnienie pisma",
    flow: "F05",
    step: "sent|delivered",
  },
  {
    id: "birthConfirmed",
    label: "Potwierdzenie narodzin",
    flow: "F07",
    step: "waiting",
  },
  {
    id: "birthCorrectionRequested",
    label: "Poprawa zgłoszenia narodzin",
    flow: "F07",
    step: "waiting",
  },
];
export function appointmentDate(_w: World, slot: string) {
  if (slot?.startsWith("relative-")) return slot.slice(9);
  return slot === "slot-1"
    ? "2026-10-28T10:00:00+01:00"
    : "2026-10-29T12:00:00+01:00";
}
export function eventReason(w: World, event: string, c?: CaseRecord) {
  const def = eventDefinitions.find((e) => e.id === event);
  if (
    !def ||
    !c ||
    def.flow !== c.flowId ||
    !def.step.split("|").includes(c.currentStep) ||
    c.status === "submitting"
  )
    return "Najpierw przejdź do wymaganego etapu sprawy";
  if (event === "visitAccepted") {
    if (
      Date.parse(w.demoDate) <
      Date.parse(appointmentDate(w, c.draftData.appointmentId))
    )
      return "Przesuń zegar do terminu wizyty";
    if (currentConsent(w, c)?.status !== "approved")
      return "Brak aktualnej zgody";
  }
  return "";
}
export function external(
  w: World,
  event: string,
  caseId: string,
  eventId: string,
) {
  if (w.eventIds.includes(eventId)) return;
  const c = w.cases.find((c) => c.id === caseId);
  const reason = eventReason(w, event, c);
  if (reason) throw Error(reason);
  if (!c) return;
  w.eventIds.push(eventId);
  const d = c.draftData;
  switch (event) {
    case "schoolAcknowledged":
      c.status = "completed";
      c.currentStep = "result";
      notify(
        w,
        "marta",
        "Szkoła · DEMO",
        "Przyjęcie zgłoszenia",
        "Szkoła · DEMO potwierdziła przyjęcie zgłoszenia",
        { caseId: c.id },
      );
      break;
    case "visitAccepted":
      c.status = "submitted";
      c.currentStep = "processing";
      break;
    case "passportCorrectionRequested":
      c.status = "needsInput";
      c.currentStep = "prepare";
      d.photoId = "";
      c.revision++;
      c.consentVersion++;
      w.consents
        .filter((s) => s.caseId === c.id)
        .forEach((s) => (s.status = "outdated"));
      break;
    case "passportReady":
      c.currentStep = "readyForPickup";
      notify(
        w,
        "marta",
        "Punkt obsługi · DEMO",
        "Dokument gotowy do odbioru",
        "Paszport Zosi czeka na odbiór w scenariuszu.",
        { caseId: c.id },
      );
      break;
    case "passportCollected":
      if (!w.documents.some((x) => x.id === "zosia-passport-new")) {
        w.documents.find((x) => x.id === "zosia-passport")!.status =
          "replacedInDemo";
        w.documents.push({
          id: "zosia-passport-new",
          ownerId: "zosia",
          title: "Nowy paszport",
          number: "Numer demonstracyjny P-002",
          status: "valid",
        });
      }
      c.status = "completed";
      c.currentStep = "result";
      break;
    case "chipConflictCleared":
      w.flags.chipConflict = false;
      c.status = "needsInput";
      c.currentStep = "identify";
      break;
    case "responseDelivered":
      c.currentStep = "delivered";
      notify(
        w,
        "marta",
        "Skrzynka · DEMO",
        "Potwierdzenie doręczenia",
        "Dowód demonstracyjny. Sprawa nadal oczekuje na rozpatrzenie.",
        { caseId: c.id },
      );
      break;
    case "responseCaseClosed":
      c.status = "completed";
      c.currentStep = "result";
      notify(
        w,
        "marta",
        "Urząd Skarbowy · DEMO",
        "Sprawa zakończona",
        "Potwierdzenie zakończenia sprawy demonstracyjnej.",
        { caseId: c.id },
      );
      break;
    case "responseCorrectionRequested":
      c.status = "needsInput";
      c.currentStep = "draft";
      c.revision++;
      break;
    case "birthConfirmed":
      if (!w.children.some((x) => x.id === "ola")) {
        w.children.push({
          id: "ola",
          name: `${d.childName} Kowalska`,
          birthDate: "2026-10-25",
        });
        notify(
          w,
          "marta",
          "Urząd · DEMO",
          "Potwierdzenie narodzin · DEMO",
          "Profil dziecka dodano do demonstracji.",
          { caseId: c.id },
        );
      }
      c.status = "completed";
      c.currentStep = "plan";
      break;
    case "birthCorrectionRequested":
      c.status = "needsInput";
      c.currentStep = "correction";
      c.revision++;
      break;
  }
  history(w, c, eventDefinitions.find((e) => e.id === event)!.label, "demo");
}
export function advance(w: World, days: number) {
  w.demoDate = new Date(Date.parse(w.demoDate) + days * 86400000).toISOString();
  for (const i of w.invitations) {
    if (
      i.status === "pending" &&
      Date.parse(i.expiresAt) <= Date.parse(w.demoDate)
    ) {
      i.status = "expired";
      const c = w.cases.find((c) => c.id === i.caseId)!;
      c.status = "cancelled";
      c.currentStep = "expired";
      history(w, c, "Zaproszenie wygasło", "demo");
    }
  }
  for (const g of w.grants)
    if (
      g.status === "active" &&
      Date.parse(g.expiresAt) <= Date.parse(w.demoDate)
    )
      g.status = "expired";
}
export function createReport(w: World, data: Data, operationId: string) {
  if (w.operations.some((o) => o.id === operationId && o.applied)) return;
  if (!["finder", "vet", "shelter", "police"].includes(w.role))
    throw Error(DENIED);
  if (
    w.role === "finder" &&
    !w.tags.some((t) => t.id === data.tagId && t.status === "active")
  )
    throw Error(
      "Ta zawieszka jest nieaktywna. Nie można wysłać wiadomości tym formularzem",
    );
  if (!data.type || !data.description)
    throw Error("Wybierz przykładową wiadomość");
  if (w.role !== "finder" && (!data.registryId || !data.chipNumber))
    throw Error("Wybierz rejestr i przykładowy wynik odczytu");
  const matched =
    w.role === "finder" ||
    w.registries[data.registryId]?.chipNumber === data.chipNumber;
  const report = {
    id: id(w, "report"),
    source: w.role,
    registryId: data.registryId,
    type: data.type,
    status: "new" as const,
    description: data.description,
    at: w.demoDate,
    notificationDelivery: !matched
      ? ("noMatch" as const)
      : w.flags.staleContact
        ? ("unavailable" as const)
        : ("delivered" as const),
  };
  w.reports.push(report);
  const existing = w.operations.find((o) => o.id === operationId);
  if (existing) {
    existing.targetId = report.id;
    existing.status = "succeeded";
    existing.applied = true;
  } else
    w.operations.push({
      id: operationId,
      targetType: "report",
      targetId: report.id,
      caseId: null,
      action:
        w.role === "finder" ? "sendFinderMessage" : "sendInstitutionReport",
      revision: 0,
      actorId: w.role,
      worldEpoch: w.epoch,
      editorToken: "report",
      status: "succeeded",
      returnStatus: "draft",
      returnStep: "report",
      resolveAs: "succeeded",
      outcome: "success",
      applied: true,
    });
  if (report.notificationDelivery === "delivered")
    notify(
      w,
      "marta",
      "Kontakt ze znalazcą · DEMO",
      "Nowe zgłoszenie dotyczące Luny",
      "Sprawdź zgłoszenie. Sam raport nie potwierdza powrotu zwierzęcia.",
      { reportId: report.id },
    );
  return report;
}
export function validWorld(v: unknown): v is World {
  if (!v || typeof v !== "object") return false;
  const w = v as World;
  return (
    w.schemaVersion === 1 &&
    Number.isInteger(w.epoch) &&
    Number.isInteger(w.sequence) &&
    typeof w.demoDate === "string" &&
    !Number.isNaN(Date.parse(w.demoDate)) &&
    ["marta", "piotr", "anna", "finder", "vet", "shelter", "police"].includes(
      w.role,
    ) &&
    [
      "cases",
      "documents",
      "children",
      "tags",
      "reports",
      "consents",
      "invitations",
      "grants",
      "proposals",
      "messages",
      "operations",
      "eventIds",
    ].every((k) => Array.isArray((w as any)[k])) &&
    typeof w.registries === "object" &&
    !!w.flags &&
    w.cases.every(
      (c) =>
        !!c.id &&
        !!flows[c.flowId] &&
        !!flows[c.flowId].steps[c.currentStep] &&
        Number.isInteger(c.revision) &&
        Array.isArray(c.history) &&
        !!c.draftData,
    ) &&
    w.grants.every(
      (g) => Array.isArray(g.permissions) && !!g.caseId && !!g.recipient,
    ) &&
    w.operations.every((o) => !!o.id && !!o.action && !!o.status)
  );
}
