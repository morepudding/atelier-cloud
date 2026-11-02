import type { Action, Attempt, LearningState, Scope } from './types';
import { browse, inspect, operate, seedWorld, settle } from './world';
import { causalTrace, currentAttempt, makeEvidence, remediation } from './teaching';

export function initialLearningState(): LearningState {
  return { version: 2, world: seedWorld(), demo: seedWorld(true),
    lesson: { phase: 'welcome', demoStep: 0, prediction: null, feedback: '', round: 0 }, attempts: [], currentAttemptId: null, evidence: [],
    ui: { surface: 'azure', scope: 'lab', page: 'apps', selectedId: '', appTab: 'overview', collapsed: false, maximized: false, panelView: 'lesson' }, response: null, notes: '' };
}
function requestPage(state: LearningState, scope: Scope, appId: string, now: number): LearningState {
  const source = scope === 'lab' ? state.world : state.demo;
  const result = browse(source, appId, now);
  return { ...state, [scope === 'lab' ? 'world' : 'demo']: result.world, response: result.response, ui: { ...state.ui, surface: 'client', scope } };
}
function updateAttempt(state: LearningState, patch: Partial<Attempt>): LearningState {
  return { ...state, attempts: state.attempts.map(attempt => attempt.id === state.currentAttemptId ? { ...attempt, ...patch } : attempt) };
}
export function learningReducer(state: LearningState, action: Action): LearningState {
  const lesson = state.lesson;
  switch (action.type) {
    case 'SYNC': return action.state;
    case 'UI': return { ...state, ui: { ...state.ui, ...action.patch } };
    case 'NOTES': return { ...state, notes: action.text.slice(0, 15000) };
    case 'NEXT': {
      const phase = lesson.phase === 'welcome' ? 'explain' : lesson.phase === 'explain' ? 'demo' : lesson.phase === 'demo' && lesson.demoStep === 5 ? 'predict' : lesson.phase;
      return { ...state, response: phase === 'predict' ? null : state.response, lesson: { ...lesson, phase, feedback: '' }, ui: { ...state.ui, panelView: 'lesson', scope: phase === 'demo' ? 'demo' : 'lab', surface: 'azure', page: 'apps' } };
    }
    case 'DEMO_NEXT': {
      if (lesson.phase !== 'demo' || state.demo.apps.some(app => app.operation) || lesson.demoStep >= 5) return state;
      const step = lesson.demoStep;
      let next = state;
      if ([0, 2, 4].includes(step)) next = requestPage(state, 'demo', 'demo-app', action.now);
      else next = { ...state, demo: operate(state.demo, 'demo-app', step === 1 ? 'stop' : 'start', action.now), ui: { ...state.ui, scope: 'demo', surface: 'azure', page: 'app', selectedId: 'demo-app' } };
      return { ...next, lesson: { ...lesson, demoStep: step + 1 } };
    }
    case 'PREDICT': return lesson.phase === 'predict' ? { ...state, lesson: { ...lesson, prediction: action.value, feedback: '' } } : state;
    case 'CHECK_PREDICTION':
      if (lesson.phase !== 'predict' || !lesson.prediction) return state;
      return { ...state, lesson: { ...lesson, feedback: lesson.prediction === 'service' ? 'Oui. L’arrêt touche l’exécution du service. Le groupe et le déploiement restent présents. Vérifions-le maintenant dans ton environnement.' : remediation[lesson.prediction] } };
    case 'BEGIN_GUIDED': {
      if (lesson.phase !== 'predict' || lesson.demoStep !== 5 || lesson.prediction !== 'service' || !lesson.feedback) return state;
      const id = (state.attempts.at(-1)?.id ?? 0) + 1;
      const world = { ...state.world, apps: state.world.apps.map(app => app.id === 'app-a' ? { ...app, status: 'running' as const, operation: null } : app) };
      const attempt: Attempt = { id, mode: 'guided', appId: 'app-a', caseName: 'DemandesEtude', startSeq: world.sequence, assistance: 3, hintLevel: 0, reason: null, feedback: '', submitted: false };
      return { ...state, response: null, attempts: [...state.attempts, attempt].slice(-30), currentAttemptId: id,
        lesson: { ...lesson, phase: 'guided', feedback: '' }, ui: { ...state.ui, surface: 'azure', scope: 'lab', page: 'app', selectedId: 'app-a', appTab: 'overview' }, world: inspect(world, 'app-a', action.now) };
    }
    case 'BEGIN_TRANSFER': {
      if (!['welcome', 'explain', 'summary', 'guided-reason'].includes(lesson.phase)) return state;
      if (lesson.phase === 'guided-reason' && !state.evidence.some(evidence => evidence.attemptId === state.currentAttemptId)) return state;
      const id = (state.attempts.at(-1)?.id ?? 0) + 1;
      const round = lesson.round + 1;
      const variant = [{ title: 'SuiviInterventions', name: 'interventions' }, { title: 'Annuaire équipe', name: 'annuaire' }, { title: 'Planning atelier', name: 'planning' }][(round - 1) % 3];
      const name = 'app-' + variant.name + '-dev-' + round;
      const world = { ...state.world, apps: state.world.apps.map(app => app.id === 'app-b' ? { ...app, name, host: name + '.azurewebsites.net', application: variant.title, status: 'stopped' as const, operation: null } : app),
        groups: state.world.groups.map(group => group.id === 'group-b' ? { ...group, name: 'rg-' + variant.name + '-dev-frc-' + round } : group) };
      const attempt: Attempt = { id, mode: 'transfer', appId: 'app-b', caseName: variant.title, startSeq: world.sequence, assistance: 0, hintLevel: 0, reason: null, feedback: '', submitted: false };
      return requestPage({ ...state, world, attempts: [...state.attempts, attempt].slice(-30), currentAttemptId: id,
        lesson: { ...lesson, phase: 'transfer', round }, ui: { ...state.ui, scope: 'lab', page: 'apps', selectedId: '', panelView: 'lesson', collapsed: false } }, 'lab', 'app-b', action.now);
    }
    case 'INSPECT': {
      const key = action.scope === 'lab' ? 'world' : 'demo';
      return { ...state, [key]: inspect(state[key], action.appId, action.now), ui: { ...state.ui, scope: action.scope, surface: 'azure', page: 'app', selectedId: action.appId, appTab: 'overview' } };
    }
    case 'OBSERVE_APP': {
      const key = action.scope === 'lab' ? 'world' : 'demo';
      return { ...state, [key]: inspect(state[key], action.appId, action.now) };
    }
    case 'OPERATE': {
      const key = action.scope === 'lab' ? 'world' : 'demo';
      return { ...state, [key]: operate(state[key], action.appId, action.kind, action.now) };
    }
    case 'SETTLE': {
      const world = settle(state.world, action.now);
      const demo = settle(state.demo, action.now);
      return world === state.world && demo === state.demo ? state : { ...state, world, demo };
    }
    case 'BROWSE': return requestPage(state, action.scope, action.appId, action.now);
    case 'ADDRESS': {
      const world = state.ui.scope === 'lab' ? state.world : state.demo;
      const host = action.address.replace(/^https?:\/\//u, '').replace(/\/.*$/u, '').toLowerCase();
      const app = world.apps.find(value => value.host === host);
      return app ? requestPage(state, state.ui.scope, app.id, action.now) : { ...state, response: { appId: '', address: action.address, code: 404, version: '', status: null, at: action.now } };
    }
    case 'REASON': return updateAttempt(state, { reason: action.value, feedback: '', submitted: false });
    case 'CHECK': {
      const attempt = currentAttempt(state);
      if (!attempt || !['guided', 'guided-reason', 'transfer'].includes(lesson.phase)) return state;
      const trace = causalTrace(state.world, attempt);
      if (!trace.complete) {
        const feedback = !trace.before ? 'Il manque une observation du site indisponible pendant cet essai. Une remise en service seule ne montre pas encore le lien entre le symptôme et la ressource.'
          : !trace.inspection ? 'Pour confirmer le diagnostic, examine aussi l’état de la Web App dans le portail. Un HTTP 403 peut avoir plusieurs causes.'
          : !trace.start ? 'La remise en service de cette application n’est pas encore observée. Compare le symptôme du client et l’état de sa ressource.'
          : 'La vérification côté client manque : ouvre ou actualise l’adresse et contrôle la version après la remise en service.';
        return updateAttempt(state, { feedback, assistance: Math.max(attempt.assistance, 1) });
      }
      if (lesson.phase === 'guided') return { ...state, lesson: { ...lesson, phase: 'guided-reason' } };
      if (!attempt.reason) return updateAttempt(state, { feedback: 'Choisis l’explication qui relie l’action à ce que tu as observé.' });
      if (attempt.reason !== 'service') return updateAttempt(state, { feedback: remediation[attempt.reason], submitted: true, assistance: 3 });
      const evidence = makeEvidence(state, action.now)!;
      const next = updateAttempt(state, { feedback: 'Tes observations et ton explication concordent sur ce cas.', submitted: true });
      return { ...next, evidence: [...state.evidence.filter(value => value.attemptId !== attempt.id), evidence].slice(-30), lesson: { ...lesson, phase: attempt.mode === 'guided' ? 'guided-reason' : 'summary' } };
    }
    case 'HINT': {
      const attempt = currentAttempt(state);
      return attempt && lesson.phase === 'transfer' ? updateAttempt(state, { hintLevel: Math.min(3, attempt.hintLevel + 1), assistance: Math.max(attempt.assistance, Math.min(3, attempt.hintLevel + 1)), feedback: '' }) : state;
    }
    case 'REVIEW_EXPLANATION': {
      const next = lesson.phase === 'transfer' ? updateAttempt(state, { assistance: 3 }) : state;
      return { ...next, ui: { ...state.ui, panelView: 'reference', collapsed: false } };
    }
    case 'OPEN_PORTAL_HELP': {
      const attempt = currentAttempt(state);
      const next = lesson.phase === 'transfer' && attempt ? updateAttempt(state, { assistance: Math.max(1, attempt.assistance) }) : state;
      return { ...next, ui: { ...state.ui, scope: lesson.phase === 'demo' ? 'demo' : 'lab', surface: 'azure', page: 'apps' } };
    }
    case 'REPLAY': {
      const fresh = initialLearningState();
      return { ...fresh, attempts: state.attempts, evidence: state.evidence, notes: state.notes, lesson: { ...fresh.lesson, round: lesson.round } };
    }
  }
}
