export type Surface = 'azure' | 'client' | 'desktop' | 'notes';
export type PortalPage = 'home' | 'apps' | 'groups' | 'plans' | 'subscriptions' | 'activity' | 'app' | 'group' | 'plan';
export type Scope = 'lab' | 'demo';
export type AppStatus = 'running' | 'stopped' | 'starting' | 'stopping';
export type OperationKind = 'start' | 'stop' | 'restart';
export type Phase = 'welcome' | 'explain' | 'demo' | 'predict' | 'guided' | 'guided-reason' | 'transfer' | 'summary';
export interface Group { id: string; name: string; subscription: string; region: string }
export interface Plan { id: string; name: string; groupId: string; region: string; sku: string }
export interface WebApp {
  id: string; name: string; application: string; host: string; groupId: string; planId: string;
  version: string; commit: string; status: AppStatus;
  operation: { id: string; kind: OperationKind; completeAt: number } | null;
}
export type EventKind = 'inspected' | 'browsed' | 'start-requested' | 'stop-requested' | 'restart-requested' | 'started' | 'stopped';
export interface WorldEvent { seq: number; kind: EventKind; appId: string; at: number; status: AppStatus; version: string; code?: number }
export interface World { groups: Group[]; plans: Plan[]; apps: WebApp[]; events: WorldEvent[]; sequence: number }
export interface Response { appId: string; address: string; code: 200 | 403 | 503 | 404; version: string; status: AppStatus | null; at: number }
export type Reason = 'service' | 'group' | 'code';
export interface Attempt {
  id: number; mode: 'guided' | 'transfer'; appId: string; caseName: string; startSeq: number;
  assistance: number; hintLevel: number; reason: Reason | null; feedback: string; submitted: boolean;
}
export interface Evidence {
  attemptId: number; mode: 'guided' | 'transfer'; caseName: string; assistance: number;
  beforeSeq: number; inspectionSeq: number; startSeq: number; afterSeq: number; version: string; at: number;
}
export interface LearningState {
  version: 2;
  world: World; demo: World;
  lesson: { phase: Phase; demoStep: number; prediction: Reason | null; feedback: string; round: number };
  attempts: Attempt[]; currentAttemptId: number | null; evidence: Evidence[];
  ui: { surface: Surface; scope: Scope; page: PortalPage; selectedId: string; appTab: 'overview' | 'properties' | 'deployment'; collapsed: boolean; maximized: boolean; panelView: 'lesson' | 'evidence' | 'reference' | 'reset' };
  response: Response | null; notes: string;
}
export type Action =
  | { type: 'UI'; patch: Partial<LearningState['ui']> }
  | { type: 'NEXT' }
  | { type: 'DEMO_NEXT'; now: number }
  | { type: 'PREDICT'; value: Reason }
  | { type: 'CHECK_PREDICTION' }
  | { type: 'BEGIN_GUIDED'; now: number }
  | { type: 'BEGIN_TRANSFER'; now: number }
  | { type: 'INSPECT'; scope: Scope; appId: string; now: number }
  | { type: 'OBSERVE_APP'; scope: Scope; appId: string; now: number }
  | { type: 'OPERATE'; scope: Scope; appId: string; kind: OperationKind; now: number }
  | { type: 'SETTLE'; now: number }
  | { type: 'BROWSE'; scope: Scope; appId: string; now: number }
  | { type: 'ADDRESS'; address: string; now: number }
  | { type: 'REASON'; value: Reason }
  | { type: 'CHECK'; now: number }
  | { type: 'HINT' }
  | { type: 'REVIEW_EXPLANATION' }
  | { type: 'OPEN_PORTAL_HELP' }
  | { type: 'REPLAY' }
  | { type: 'NOTES'; text: string }
  | { type: 'SYNC'; state: LearningState };
