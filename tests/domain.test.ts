import { describe, it, expect } from "vitest";
import {
  seed,
  openCase,
  begin,
  settle,
  update,
  external,
  advance,
  canRead,
  hasPermission,
  canContent,
  errors,
  currentConsent,
  createReport,
  go,
  eventReason,
  validWorld,
} from "../src/domain/engine";
import type { World, CaseRecord, FlowId, Data } from "../src/domain/types";
function start(w: World, f: FlowId, d: Data = {}, step = "review") {
  const c = openCase(w, f, d).case;
  c.currentStep = step;
  return c;
}
function run(w: World, c: CaseRecord, a: string) {
  const op = begin(w, c, a, c.revision, "editor");
  settle(w, op.id, "editor");
  return op;
}
function passport(w: World) {
  return start(
    w,
    "F02",
    {
      childId: "zosia",
      reason: "loss",
      photoId: "child-photo",
      officeId: "demo-office",
    },
    "consentReview",
  );
}
function approved(w: World) {
  const c = passport(w);
  run(w, c, "requestPassportConsent");
  w.role = "piotr";
  run(w, c, "approveConsent");
  w.role = "marta";
  return c;
}
function loss(w: World, documentId = "zosia-passport") {
  return start(w, "F01", {
    childId: "zosia",
    documentId,
    lossReason: "lost",
    discoveredAt: "today",
  });
}
function invite(
  w: World,
  permissions = ["viewStatus", "readContent", "prepareDraft"],
) {
  return start(w, "F06", {
    recipient: "anna",
    caseIds: ["letter-case"],
    permissions: { "letter-case": permissions },
    duration: "7",
  });
}
describe("seed and case consistency", () => {
  it("uses the exact fixed seed without pre-registered chip or QR", () => {
    const w = seed();
    expect(w.children.map((c) => c.id)).toEqual(["zosia", "adam"]);
    expect(w.cases).toHaveLength(1);
    expect(w.tags).toHaveLength(0);
    expect(w.registries).toEqual({});
    expect(w.demoDate).toBe("2026-10-26T10:00:00+01:00");
    expect(validWorld(w)).toBe(true);
  });
  it("T01/T03 passport loss affects only the chosen document", () => {
    const w = seed(),
      c = loss(w);
    run(w, c, "reportLoss");
    expect(c.status).toBe("completed");
    expect(w.documents.find((d) => d.id === "zosia-passport")?.status).toBe(
      "lossReported",
    );
    expect(w.documents.find((d) => d.id === "zosia-school-card")?.status).toBe(
      "valid",
    );
    expect(openCase(w, "F01", { documentId: "zosia-passport" }).case.id).toBe(
      c.id,
    );
  });
  it("T02 school card waits for acknowledgement", () => {
    const w = seed(),
      c = loss(w, "zosia-school-card");
    run(w, c, "reportLoss");
    expect(c.status).toBe("submitted");
    external(w, "schoolAcknowledged", c.id, "school-1");
    expect(c.status).toBe("completed");
    expect(w.documents).toHaveLength(5);
  });
  it("T04 starts a separate passport case with the same child", () => {
    const w = seed(),
      c = loss(w);
    run(w, c, "reportLoss");
    const next = openCase(w, "F02", { childId: c.draftData.childId }).case;
    expect(next.id).not.toBe(c.id);
    expect(next.draftData.childId).toBe("zosia");
    expect(next.status).toBe("draft");
  });
  it("deduplicates active cases without changing revision on reads", () => {
    const w = seed(),
      a = openCase(w, "F08").case,
      b = openCase(w, "F08").case;
    expect(a.id).toBe(b.id);
    expect(a.revision).toBe(0);
  });
  it("rejects unsupported persistence versions", () => {
    expect(validWorld({ ...seed(), schemaVersion: 9 })).toBe(false);
    expect(validWorld({ schemaVersion: 1 })).toBe(false);
  });
});
describe("passport consent and external events", () => {
  it("T05 only the named Piotr can decide", () => {
    const w = seed(),
      c = passport(w);
    run(w, c, "requestPassportConsent");
    w.role = "anna";
    expect(canRead(w, c)).toBe(false);
    expect(() => run(w, c, "approveConsent")).toThrow();
    w.role = "piotr";
    expect(canRead(w, c)).toBe(true);
    run(w, c, "approveConsent");
    expect(c.currentStep).toBe("readyForVisit");
  });
  it("T06 declined consent blocks reservation", () => {
    const w = seed(),
      c = passport(w);
    run(w, c, "requestPassportConsent");
    w.role = "piotr";
    update(w, c, "declineReason", "correction");
    run(w, c, "declineConsent");
    w.role = "marta";
    c.currentStep = "appointment";
    c.draftData.appointmentId = "slot-1";
    expect(() => run(w, c, "bookVisit")).toThrow("Brak aktualnej zgody");
  });
  it("T07/T08 passport fields invalidate consent; appointment does not", () => {
    const w = seed(),
      c = approved(w);
    update(w, c, "appointmentId", "slot-2");
    expect(currentConsent(w, c)?.status).toBe("approved");
    update(w, c, "photoId", "other-photo");
    expect(currentConsent(w, c)).toBeUndefined();
  });
  it("T09/T10 issues a document only at collection and enforces event order", () => {
    const w = seed(),
      c = approved(w);
    expect(() => external(w, "passportReady", c.id, "too-early")).toThrow();
    c.currentStep = "appointment";
    update(w, c, "appointmentId", "slot-1");
    run(w, c, "bookVisit");
    expect(eventReason(w, "visitAccepted", c)).toContain("Przesuń");
    advance(w, 2);
    external(w, "visitAccepted", c.id, "visit");
    external(w, "passportReady", c.id, "ready");
    expect(w.documents).toHaveLength(5);
    external(w, "passportCollected", c.id, "collected");
    expect(w.documents).toHaveLength(6);
    expect(c.status).toBe("completed");
    expect(w.documents.find((d) => d.id === "zosia-passport")?.status).toBe(
      "replacedInDemo",
    );
  });
  it("repeated event IDs never duplicate output", () => {
    const w = seed(),
      c = approved(w);
    c.status = "submitted";
    c.currentStep = "readyForPickup";
    external(w, "passportCollected", c.id, "one");
    external(w, "passportCollected", c.id, "one");
    expect(w.documents).toHaveLength(6);
  });
});
describe("chip, QR and pet reports", () => {
  it("T11 registers only the selected registry without activating QR", () => {
    const w = seed(),
      c = start(w, "F03", {
        petId: "luna",
        registryId: "registry-a",
        contactId: "contact-a",
        chipNumber: "999000000000001",
        verifiedKey: "registry-a:contact-a",
      });
    run(w, c, "saveMicrochip");
    expect(w.registries["registry-a"]?.contactId).toBe("contact-a");
    expect(w.registries["registry-b"]).toBeUndefined();
    expect(w.tags).toHaveLength(0);
  });
  it("T12 contact changes invalidate verification without altering saved contact", () => {
    const w = seed(),
      c = start(w, "F03", {
        registryId: "registry-a",
        contactId: "contact-a",
        chipNumber: "999000000000001",
        verifiedKey: "registry-a:contact-a",
      });
    run(w, c, "saveMicrochip");
    update(w, c, "contactId", "contact-b");
    expect(c.draftData.verifiedKey).toBeUndefined();
    expect(w.registries["registry-a"]?.contactId).toBe("contact-a");
  });
  it("T13 conflict never takes over an entry", () => {
    const w = seed(),
      c = start(w, "F03", {
        registryId: "registry-a",
        contactId: "contact-a",
        chipNumber: "999000000000001",
        verifiedKey: "registry-a:contact-a",
      });
    w.flags.chipConflict = true;
    expect(() => run(w, c, "saveMicrochip")).toThrow();
    expect(w.registries).toEqual({});
  });
  it("T14/T15 replacing and revoking a tag leaves chip entries unchanged", () => {
    const w = seed(),
      c = start(w, "Q01");
    run(w, c, "activateTag");
    const old = w.tags[0]!.id;
    c.currentStep = "replaceReview";
    run(w, c, "replaceTag");
    expect(w.tags.find((t) => t.id === old)?.status).toBe("revoked");
    expect(w.tags.filter((t) => t.status === "active")).toHaveLength(1);
    c.currentStep = "deactivateReview";
    run(w, c, "deactivateTag");
    expect(w.tags.every((t) => t.status === "revoked")).toBe(true);
    w.role = "finder";
    expect(() =>
      createReport(
        w,
        { tagId: old, type: "found", description: "próbka" },
        "r1",
      ),
    ).toThrow("nieaktywna");
  });
  it("T17/T20 reports alone never change pet status", () => {
    const w = seed();
    w.tags.push({ id: "t1", status: "active" });
    w.role = "finder";
    createReport(
      w,
      { tagId: "t1", type: "found", description: "Kot jest bezpieczny" },
      "report1",
    );
    expect(w.petStatus).toBe("home");
    expect(w.cases.filter((c) => c.flowId === "F04")).toHaveLength(0);
    expect(w.messages.filter((m) => m.reportId)).toHaveLength(1);
  });
  it("T18 sighting cannot become a pickup", () => {
    const w = seed();
    w.tags.push({ id: "t1", status: "active" });
    w.role = "finder";
    const report = createReport(
      w,
      { tagId: "t1", type: "sighting", description: "Kot w parku" },
      "r1",
    )!;
    w.role = "marta";
    const c = start(w, "F04", { selectedReportId: report.id }, "reportDetails");
    expect(() => go(w, c, "matchReview")).toThrow("sygnał");
    c.currentStep = "matchReview";
    expect(() => run(w, c, "matchReport")).toThrow();
  });
  it("T19 institution report without a registry match never notifies a random owner", () => {
    const w = seed();
    w.role = "vet";
    createReport(
      w,
      {
        registryId: "registry-b",
        chipNumber: "999000000000001",
        type: "found",
        description: "Placówka przy Parkowej",
      },
      "r1",
    );
    expect(w.messages.filter((m) => m.reportId)).toHaveLength(0);
    expect(w.reports[0]?.notificationDelivery).toBe("noMatch");
  });
  it("T21/T23 rejecting one report and withdrawing do not confirm return", () => {
    const w = seed();
    w.reports.push(
      {
        id: "r1",
        source: "finder",
        type: "found",
        status: "new",
        description: "DEMO",
        at: w.demoDate,
        notificationDelivery: "delivered",
      },
      {
        id: "r2",
        source: "finder",
        type: "found",
        status: "new",
        description: "DEMO",
        at: w.demoDate,
        notificationDelivery: "delivered",
      },
    );
    w.petStatus = "missing";
    const c = start(w, "F04", { selectedReportId: "r1" }, "rejectReview");
    run(w, c, "rejectReport");
    expect(w.reports[1]?.status).toBe("new");
    w.notice = { id: "n", status: "active", data: {} };
    c.currentStep = "withdrawReview";
    run(w, c, "withdrawNotice");
    expect(w.petStatus).toBe("missing");
    expect(w.notice.status).toBe("withdrawn");
  });
  it("T22 pet can return independently without a finder report", () => {
    const w = seed();
    w.petStatus = "missing";
    const c = start(w, "F04", { closureReason: "returnedAlone" }, "close");
    run(w, c, "confirmPetReturn");
    expect(w.petStatus).toBe("home");
    expect(c.status).toBe("completed");
  });
});
describe("letters, sharing and births", () => {
  it("T25 identifies missing invoices while preserving the draft", () => {
    const w = seed(),
      c = w.cases[0]!;
    c.currentStep = "attachments";
    c.draftData = {
      responseText: "Zachowana odpowiedź",
      attachmentIds: ["invoice-a"],
    };
    expect(errors(w, c).attachmentIds).toContain("Faktura B");
    expect(c.draftData.responseText).toBe("Zachowana odpowiedź");
  });
  it("T26 sending, delivery and completion are three distinct stages", () => {
    const w = seed(),
      c = start(w, "F05", {
        responseText: "Odpowiedź",
        attachmentIds: ["invoice-a", "invoice-b"],
      });
    Object.assign(c.draftData, {
      responseText: "Odpowiedź",
      attachmentIds: ["invoice-a", "invoice-b"],
    });
    run(w, c, "sendLetterResponse");
    expect(c.currentStep).toBe("sent");
    expect(c.status).toBe("submitted");
    external(w, "responseDelivered", c.id, "delivery");
    expect(c.currentStep).toBe("delivered");
    expect(c.status).toBe("submitted");
    external(w, "responseCaseClosed", c.id, "close");
    expect(c.status).toBe("completed");
  });
  it("T27/T28 pending invitation grants no access, viewStatus reveals no content", () => {
    const w = seed(),
      c = invite(w, ["viewStatus"]);
    run(w, c, "sendAccessInvitation");
    w.role = "anna";
    expect(canRead(w, w.cases[0]!)).toBe(false);
    run(w, c, "acceptAccessInvitation");
    expect(canRead(w, w.cases[0]!)).toBe(true);
    expect(canContent(w, w.cases[0]!)).toBe(false);
    expect(hasPermission(w, w.cases[0]!, "prepareDraft")).toBe(false);
  });
  it("T29/T33 helper permission never permits final sending", () => {
    const w = seed(),
      c = invite(w);
    run(w, c, "sendAccessInvitation");
    w.role = "anna";
    run(w, c, "acceptAccessInvitation");
    expect(hasPermission(w, w.cases[0]!, "prepareDraft")).toBe(true);
    w.cases[0]!.currentStep = "review";
    expect(() => run(w, w.cases[0]!, "sendLetterResponse")).toThrow();
  });
  it("T30 mixed restrictions take effect before expanded rights are accepted", () => {
    const w = seed(),
      c = invite(w, ["viewStatus", "readContent", "readAttachments"]);
    run(w, c, "sendAccessInvitation");
    w.role = "anna";
    run(w, c, "acceptAccessInvitation");
    w.role = "marta";
    c.currentStep = "review";
    c.draftData.permissions["letter-case"] = [
      "viewStatus",
      "prepareDraft",
      "readContent",
    ];
    run(w, c, "sendAccessInvitation");
    w.role = "anna";
    expect(hasPermission(w, w.cases[0]!, "readAttachments")).toBe(false);
    expect(hasPermission(w, w.cases[0]!, "prepareDraft")).toBe(false);
    run(w, c, "declineAccessInvitation");
    expect(hasPermission(w, w.cases[0]!, "readAttachments")).toBe(false);
  });
  it("T31 grants expire against the demo clock", () => {
    const w = seed(),
      c = invite(w);
    run(w, c, "sendAccessInvitation");
    w.role = "anna";
    run(w, c, "acceptAccessInvitation");
    advance(w, 7);
    expect(canRead(w, w.cases[0]!)).toBe(false);
  });
  it("T34/T35 submission creates no child until an idempotent confirmation", () => {
    const w = seed(),
      c = start(w, "F07", {
        birthEventId: "birth-event-1",
        childName: "Lena",
        deliveryMode: "digitalDemo",
      });
    run(w, c, "submitBirthRegistration");
    expect(w.children).toHaveLength(2);
    external(w, "birthConfirmed", c.id, "birth");
    external(w, "birthConfirmed", c.id, "birth");
    expect(w.children).toHaveLength(3);
    expect(w.children[2]).toMatchObject({ id: "ola", name: "Lena Kowalska" });
    expect(
      w.messages.filter((m) => m.subject === "Potwierdzenie narodzin · DEMO"),
    ).toHaveLength(1);
  });
});
describe("G01 operation recovery", () => {
  it("T44 stale confirmation cannot execute changed fields", () => {
    const w = seed(),
      c = loss(w),
      revision = c.revision;
    update(w, c, "lossReason", "stolen");
    expect(() => begin(w, c, "reportLoss", revision, "editor")).toThrow(
      "nieaktualne",
    );
  });
  it("T47 known failure restores previous state and preserves data", () => {
    const w = seed(),
      c = loss(w);
    w.nextOutcome = "knownFailure";
    const op = run(w, c, "reportLoss");
    expect(op.status).toBe("failed");
    expect(c.status).toBe("draft");
    expect(c.draftData.lossReason).toBe("lost");
    expect(w.documents[3]?.status).toBe("valid");
  });
  it("T48/T49 unknown result blocks resend until resolved not executed", () => {
    const w = seed(),
      c = loss(w);
    w.nextOutcome = "unknownOutcome";
    const op = run(w, c, "reportLoss");
    expect(op.status).toBe("unknown");
    expect(() => begin(w, c, "reportLoss", c.revision, "editor")).toThrow();
    settle(w, op.id, "editor", "notExecuted");
    expect(c.status).toBe("draft");
    expect(c.currentStep).toBe("review");
    run(w, c, "reportLoss");
    expect(c.status).toBe("completed");
  });
  it("T50 duplicate callback applies the effect and notification only once", () => {
    const w = seed(),
      c = loss(w);
    const op = run(w, c, "reportLoss");
    settle(w, op.id, "editor");
    expect(
      c.history.filter((h) => h.event === "Zgłoszenie utraty zapisane"),
    ).toHaveLength(1);
    expect(w.messages.filter((m) => m.caseId === c.id)).toHaveLength(1);
  });
  it("T51 old world epoch callback has no effect", () => {
    const w = seed(),
      c = loss(w);
    const op = begin(w, c, "reportLoss", c.revision, "editor");
    w.epoch++;
    settle(w, op.id, "editor");
    expect(w.documents[3]?.status).toBe("valid");
    expect(op.applied).toBe(false);
  });
  it("T52 switching UI role does not change the original actor or target", () => {
    const w = seed(),
      c = loss(w);
    const op = begin(w, c, "reportLoss", c.revision, "editor");
    w.role = "anna";
    settle(w, op.id, "editor");
    expect(op.actorId).toBe("marta");
    expect(w.documents[3]?.status).toBe("lossReported");
    expect(canRead(w, c)).toBe(false);
  });
  it("revoked permission before commit means no helper effect", () => {
    const w = seed(),
      inviteCase = invite(w);
    run(w, inviteCase, "sendAccessInvitation");
    w.role = "anna";
    run(w, inviteCase, "acceptAccessInvitation");
    const c = w.cases[0]!;
    c.draftData.helperDraft = { responseText: "Propozycja" };
    const op = begin(w, c, "submitHelperDraft", c.revision, "editor");
    w.grants.forEach((g) => (g.status = "revoked"));
    settle(w, op.id, "editor");
    expect(op.status).toBe("notExecuted");
    expect(w.proposals).toHaveLength(0);
  });
  it("T53 persisted pending operation can be reconciled without resending", () => {
    const w = seed(),
      c = loss(w);
    const op = begin(w, c, "reportLoss", c.revision, "editor");
    const restored = JSON.parse(JSON.stringify(w)) as World;
    restored.operations[0]!.status = "unknown";
    settle(restored, op.id, "editor", "succeeded");
    expect(restored.cases.find((x) => x.id === c.id)?.status).toBe("completed");
    expect(restored.operations).toHaveLength(1);
  });
  it("T54 old editor callback is fenced out", () => {
    const w = seed(),
      c = loss(w);
    const op = begin(w, c, "reportLoss", c.revision, "old-editor");
    op.editorToken = "new-editor";
    settle(w, op.id, "old-editor");
    expect(op.applied).toBe(false);
    settle(w, op.id, "new-editor", "succeeded");
    expect(op.applied).toBe(true);
  });
});
