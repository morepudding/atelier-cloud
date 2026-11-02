import type { LearningState, World } from './types';
import { initialLearningState } from './reducer';

export const LEARNING_KEY = 'atelier-cloud.learning.v2';
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const text = (value: unknown) => typeof value === 'string';
const status = (value: unknown) => ['running', 'stopped', 'starting', 'stopping'].includes(String(value));
function worldValid(value: unknown): value is World {
  if (!record(value) || !Array.isArray(value.groups) || !value.groups.length || !Array.isArray(value.plans) || !Array.isArray(value.apps) || !value.apps.length || !Array.isArray(value.events) || !Number.isInteger(value.sequence) || (value.sequence as number) < 0) return false;
  if (!value.groups.every(group => record(group) && ['id', 'name', 'subscription', 'region'].every(key => text(group[key])))) return false;
  const groups = value.groups as { id: string }[];
  if (!value.plans.every(plan => record(plan) && ['id', 'name', 'groupId', 'region', 'sku'].every(key => text(plan[key])) && groups.some(group => group.id === plan.groupId))) return false;
  const plans = value.plans as { id: string }[];
  if (!value.apps.every(app => record(app) && ['id', 'name', 'application', 'host', 'groupId', 'planId', 'version', 'commit'].every(key => text(app[key]))
    && status(app.status) && groups.some(group => group.id === app.groupId) && plans.some(plan => plan.id === app.planId)
    && (app.operation === null || record(app.operation) && text(app.operation.id) && ['start', 'stop', 'restart'].includes(String(app.operation.kind)) && finite(app.operation.completeAt))
    && (['starting', 'stopping'].includes(String(app.status)) === Boolean(app.operation))
    && (!app.operation || ((app.operation as { kind: string }).kind === 'stop' ? app.status === 'stopping' : app.status === 'starting')))) return false;
  const apps = value.apps as { id: string }[];
  if (new Set(apps.map(app => app.id)).size !== apps.length || new Set(groups.map(group => group.id)).size !== groups.length || new Set(plans.map(plan => plan.id)).size !== plans.length) return false;
  let last = 0;
  return value.events.length <= 400 && value.events.every(event => {
    if (!record(event) || !Number.isInteger(event.seq) || (event.seq as number) <= last || (event.seq as number) > (value.sequence as number)
      || !['inspected', 'browsed', 'start-requested', 'stop-requested', 'restart-requested', 'started', 'stopped'].includes(String(event.kind))
      || !apps.some(app => app.id === event.appId) || !finite(event.at) || !status(event.status) || !text(event.version)
      || (event.kind === 'browsed' && ![200, 403, 503].includes(event.code as number))) return false;
    last = event.seq as number; return true;
  });
}
export function deserializeLearning(raw: string | null): { state: LearningState; recovered: boolean } {
  if (!raw) return { state: initialLearningState(), recovered: false };
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 2 || !worldValid(value.world) || !worldValid(value.demo)) throw new Error('world');
    const state = value as unknown as LearningState;
    if (!record(state.lesson) || !['welcome', 'explain', 'demo', 'predict', 'guided', 'guided-reason', 'transfer', 'summary'].includes(state.lesson.phase)
      || !Number.isInteger(state.lesson.demoStep) || state.lesson.demoStep < 0 || state.lesson.demoStep > 5 || !Number.isInteger(state.lesson.round) || state.lesson.round < 0
      || ![null, 'service', 'group', 'code'].includes(state.lesson.prediction) || !text(state.lesson.feedback)) throw new Error('lesson');
    if (!record(state.ui) || !['azure', 'client', 'desktop', 'notes'].includes(state.ui.surface) || !['lab', 'demo'].includes(state.ui.scope)
      || !['home', 'apps', 'groups', 'plans', 'subscriptions', 'activity', 'app', 'group', 'plan'].includes(state.ui.page)
      || !text(state.ui.selectedId) || !['overview', 'properties', 'deployment'].includes(state.ui.appTab) || typeof state.ui.collapsed !== 'boolean' || typeof state.ui.maximized !== 'boolean'
      || !['lesson', 'evidence', 'reference', 'reset'].includes(state.ui.panelView) || !text(state.notes)) throw new Error('ui');
    if (!Array.isArray(state.attempts) || state.attempts.length > 30 || !state.attempts.every(attempt => record(attempt) && Number.isInteger(attempt.id) && attempt.id > 0
      && ['guided', 'transfer'].includes(attempt.mode) && state.world.apps.some(app => app.id === attempt.appId) && text(attempt.caseName) && Number.isInteger(attempt.startSeq) && attempt.startSeq >= 0
      && Number.isInteger(attempt.assistance) && attempt.assistance >= 0 && attempt.assistance <= 3 && Number.isInteger(attempt.hintLevel) && attempt.hintLevel >= 0 && attempt.hintLevel <= 3 && [null, 'service', 'group', 'code'].includes(attempt.reason) && text(attempt.feedback) && typeof attempt.submitted === 'boolean')) throw new Error('attempts');
    if (state.currentAttemptId !== null && !state.attempts.some(attempt => attempt.id === state.currentAttemptId)) throw new Error('active attempt');
    if (new Set(state.attempts.map(attempt => attempt.id)).size !== state.attempts.length) throw new Error('duplicate attempts');
    const active = state.attempts.find(attempt => attempt.id === state.currentAttemptId);
    if (['guided', 'guided-reason', 'transfer', 'summary'].includes(state.lesson.phase)
      && (!active || active.mode !== (['guided', 'guided-reason'].includes(state.lesson.phase) ? 'guided' : 'transfer') || active.startSeq > state.world.sequence)) throw new Error('lesson attempt');
    if (!Array.isArray(state.evidence) || state.evidence.length > 30 || !state.evidence.every(evidence => record(evidence) && Number.isInteger(evidence.attemptId) && ['guided', 'transfer'].includes(evidence.mode)
      && text(evidence.caseName) && Number.isInteger(evidence.assistance) && evidence.assistance >= 0 && evidence.assistance <= 3
      && ['beforeSeq', 'inspectionSeq', 'startSeq', 'afterSeq'].every(key => Number.isInteger(evidence[key as keyof typeof evidence]) && (evidence[key as keyof typeof evidence] as number) > 0)
      && text(evidence.version) && finite(evidence.at))) throw new Error('evidence');
    if (state.lesson.phase === 'summary' && !state.evidence.some(evidence => evidence.attemptId === state.currentAttemptId)) throw new Error('summary evidence');
    if (state.response !== null && (!record(state.response) || !text(state.response.appId) || !text(state.response.address) || ![200, 403, 503, 404].includes(state.response.code)
      || !text(state.response.version) || !(state.response.status === null || status(state.response.status)) || !finite(state.response.at))) throw new Error('response');
    if (!state.world.apps.some(app => app.id === 'app-a') || !state.world.apps.some(app => app.id === 'app-b') || !state.demo.apps.some(app => app.id === 'demo-app')) throw new Error('fixtures');
    return { state, recovered: false };
  } catch { return { state: initialLearningState(), recovered: true }; }
}
export function loadLearning() {
  try {
    const raw = localStorage.getItem(LEARNING_KEY);
    const loaded = deserializeLearning(raw);
    if (loaded.recovered && raw) { try { localStorage.setItem(LEARNING_KEY + '.recovery', raw); } catch { /* Keep the new attempt usable when storage is full. */ } }
    return loaded;
  } catch { return { state: initialLearningState(), recovered: false }; }
}
