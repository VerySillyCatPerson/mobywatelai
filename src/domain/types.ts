export type Role =
  "marta" | "piotr" | "anna" | "finder" | "vet" | "shelter" | "police";
export type FlowId =
  "F01" | "F02" | "F03" | "F04" | "F05" | "F06" | "F07" | "F08" | "Q01";
export type CaseStatus =
  | "draft"
  | "needsInput"
  | "awaitingConsent"
  | "submitting"
  | "submitted"
  | "completed"
  | "cancelled";
export type Data = Record<string, any>;
export interface History {
  id: string;
  actorId: Role | "demo";
  event: string;
  at: string;
}
export interface CaseRecord {
  id: string;
  flowId: FlowId;
  subjectId: string;
  ownerId: "marta";
  status: CaseStatus;
  currentStep: string;
  revision: number;
  consentVersion: number;
  draftData: Data;
  history: History[];
}
export interface Operation {
  id: string;
  targetType: "case" | "report" | "invitation" | "consent";
  targetId: string;
  caseId: string | null;
  action: string;
  revision: number;
  actorId: Role;
  worldEpoch: number;
  editorToken: string;
  status: "pending" | "failed" | "unknown" | "succeeded" | "notExecuted";
  returnStatus: CaseStatus;
  returnStep: string;
  resolveAs: "succeeded" | "notExecuted" | "unknown";
  outcome: "success" | "knownFailure" | "unknownOutcome";
  applied: boolean;
}
export interface Document {
  id: string;
  ownerId: string;
  title: string;
  number: string;
  status: "valid" | "lossReported" | "replacedInDemo";
  expiresAt?: string;
}
export type Permission =
  | "viewStatus"
  | "readContent"
  | "readAttachments"
  | "prepareDraft"
  | "receiveNotifications";
export interface Grant {
  id: string;
  recipient: Role;
  caseId: string;
  permissions: Permission[];
  expiresAt: string;
  status: "active" | "revoked" | "expired";
}
export interface Invitation {
  id: string;
  caseId: string;
  recipient: Role;
  scopes: { caseId: string; permissions: Permission[] }[];
  expiresAt: string;
  accessUntil: string;
  status: "pending" | "accepted" | "declined" | "withdrawn" | "expired";
}
export interface Consent {
  id: string;
  caseId: string;
  version: number;
  snapshot: Data;
  status: "pending" | "approved" | "declined" | "withdrawn" | "outdated";
  reason?: string;
}
export interface Message {
  id: string;
  recipient: Role;
  sender: string;
  subject: string;
  body: string;
  at: string;
  isUnread: boolean;
  caseId?: string;
  reportId?: string;
  invitationId?: string;
  consentId?: string;
}
export interface PetReport {
  id: string;
  source: Role;
  registryId?: string;
  type: "found" | "sighting";
  status: "new" | "rejected" | "matched" | "suspicious" | "resolved";
  description: string;
  at: string;
  notificationDelivery: "delivered" | "unavailable" | "noMatch";
}
export interface Proposal {
  id: string;
  caseId: string;
  authorId: Role;
  baseRevision: number;
  data: Data;
  at: string;
  reviewed: boolean;
}
export interface World {
  schemaVersion: 1;
  epoch: number;
  sequence: number;
  demoDate: string;
  role: Role;
  cases: CaseRecord[];
  documents: Document[];
  children: { id: string; name: string; birthDate: string }[];
  registries: Record<string, { contactId: string; chipNumber: string }>;
  tags: { id: string; status: "active" | "revoked" }[];
  petStatus: "home" | "missing";
  notice: {
    id: string;
    status: "active" | "closed" | "withdrawn";
    data: Data;
  } | null;
  reports: PetReport[];
  consents: Consent[];
  invitations: Invitation[];
  grants: Grant[];
  proposals: Proposal[];
  messages: Message[];
  operations: Operation[];
  eventIds: string[];
  flags: {
    chipConflict: boolean;
    registryUnavailable: boolean;
    occupiedSlot: boolean;
    staleContact: boolean;
  };
  nextOutcome: "success" | "knownFailure" | "unknownOutcome";
}
export interface Option {
  value: string;
  label: string;
}
export interface Field {
  key: string;
  label: string;
  kind?: "select" | "radio" | "checkboxes" | "textarea" | "text" | "check";
  options?: Option[];
  hint?: string;
  required?: boolean;
  maxLength?: number;
  sample?: string;
}
export interface Action {
  label: string;
  next?: string;
  commit?: string;
  kind?: "primary" | "secondary" | "danger";
  event?: string;
}
export interface Step {
  title: string;
  description?: string;
  question?: string;
  fields?: Field[];
  actions: Action[];
  review?: boolean;
}
export interface Flow {
  id: FlowId;
  name: string;
  shortName: string;
  subject: string;
  icon: string;
  description: string;
  first: string;
  steps: Record<string, Step>;
}
