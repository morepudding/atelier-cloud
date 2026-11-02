export type ScenarioKey = 'demandesetude' | 'suiviinterventions';
export type AppName = 'tickets' | 'azure' | 'notes';
export type PortalPage = 'home' | 'subscriptions' | 'groups' | 'create' | 'detail' | 'activity';
export type HintTopic = 'subscription' | 'find' | 'tags' | 'region';
export type Tags = Record<string, string>;
export interface TagRow { key: string; value: string }
export interface CloudResource { name: string; type: string; location: string }
export interface ResourceGroup {
  id: string;
  name: string;
  subscriptionId: string;
  location: string;
  tags: Tags;
  resources: CloudResource[];
  origin: 'baseline' | 'session';
  createdAt: number;
}
export interface CreateDraft {
  subscriptionId: string;
  name: string;
  location: string;
  tags: TagRow[];
}
export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  groupId?: string;
}
export interface ReportSnapshot {
  groupId: string;
  name: string;
  subscriptionId: string;
  location: string;
  tags: Tags;
  resourceCount: number;
}
export interface RunState {
  scenarioKey: ScenarioKey;
  groups: ResourceGroup[];
  startedAt: number | null;
  draft: CreateDraft;
  wizardStep: number;
  pending: { group: ResourceGroup; completeAt: number } | null;
  notifications: Notification[];
  error: string | null;
  hints: Record<HintTopic, number>;
  attachedId: string;
  comment: string;
  report: ReportSnapshot | null;
  reportSubmittedAt: number | null;
  quiz: { answers: number[]; submitted: boolean };
  completedAt: number | null;
}
export interface UiState {
  activeApp: AppName | null;
  portalPage: PortalPage;
  selectedGroupId: string;
  selectedSubscriptionId: string;
  filterSubId: string;
  groupSearch: string;
  maximized: boolean;
  notesTab: 'notes' | 'course';
}
export interface WorkspaceState {
  version: 1;
  run: RunState;
  savedRuns: Partial<Record<ScenarioKey, RunState>>;
  notes: string;
  ui: UiState;
}
export interface Criterion { id: string; label: string; detail: string; passed: boolean }
export interface Assessment { checks: Criterion[]; passed: number; complete: boolean; technicalReady: boolean }
export type Action =
  | { type: 'UI'; patch: Partial<UiState> }
  | { type: 'TAKE_TICKET'; now: number }
  | { type: 'DRAFT'; draft: CreateDraft }
  | { type: 'WIZARD_STEP'; step: number }
  | { type: 'START_CREATE'; id: string; now: number }
  | { type: 'COMPLETE_CREATE'; now: number }
  | { type: 'SAVE_TAGS'; groupId: string; rows: TagRow[]; now: number }
  | { type: 'DELETE_GROUP'; groupId: string; confirmation: string; now: number }
  | { type: 'ATTACH'; groupId: string }
  | { type: 'COMMENT'; text: string }
  | { type: 'SUBMIT_REPORT'; now: number }
  | { type: 'ANSWER'; question: number; answer: number }
  | { type: 'CHECK_QUIZ' }
  | { type: 'HINT'; topic: HintTopic }
  | { type: 'NOTES'; text: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'COMPLETE_MISSION'; now: number }
  | { type: 'RESET' }
  | { type: 'SWITCH_SCENARIO'; key: ScenarioKey };
